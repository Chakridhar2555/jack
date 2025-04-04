"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Users, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle, MapPin } from "lucide-react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Dynamically import heavy components
const MonthView = dynamic(
  () => import("@/components/calendar/month-view").then(mod => mod.default),
  {
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        Loading calendar...
      </div>
    ),
    ssr: false
  }
);

interface Task {
  id: string
  title: string
  date: string | Date
  description?: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
}

interface Lead {
  _id: string
  name: string
  tasks?: Task[]
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call'
  description: string
  location?: string
}

interface ScheduledTask {
  id: string
  title: string
  date: Date
  time: string
  type: string
  source: 'task' | 'calendar'
  description?: string
  location?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'completed' | 'cancelled'
}

// Add type for motion table row
const MotionTableRow = motion(TableRow)

// Separate metrics cards into a component
function MetricsCards({ metrics }: { metrics: any }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mr-4">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <h2 className="text-2xl font-bold">{metrics.totalTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mr-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <h2 className="text-2xl font-bold">{metrics.totalLeads}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mr-4">
              <CalendarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
              <h2 className="text-2xl font-bold">{metrics.todaysTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mr-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
              <h2 className="text-2xl font-bold">{metrics.upcomingTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// Separate tasks table into a component
function TasksTable({ allTasks, getStatusIcon, getPriorityColor }: {
  allTasks: Task[],
  getStatusIcon: (status: string) => JSX.Element | null,
  getPriorityColor: (priority: string) => string
}) {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTasks.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No tasks found
                  </TableCell>
                </MotionTableRow>
              ) : (
                allTasks.map((task, index) => (
                  <MotionTableRow
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {format(new Date(task.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {task.description || '-'}
                    </TableCell>
                  </MotionTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Event component to display events for selected date
function DailyEvents({ events, getTypeColor }: {
  events: any[],
  getTypeColor: (type: string) => string
}) {
  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No events scheduled for this date
        </div>
      ) : (
        events.map((event, index) => (
          <motion.div
            key={event.id || event._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="border rounded-lg p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="font-medium">{event.time}</div>
              <Badge className={getTypeColor(event.type)}>
                {event.type}
              </Badge>
            </div>
            <div className="font-semibold text-lg">{event.title}</div>
            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {event.location}
              </div>
            )}
            {event.description && (
              <div className="text-sm text-muted-foreground mt-2">{event.description}</div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    totalLeads: 0,
    todaysTasks: 0,
    upcomingTasks: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async () => {
      try {
        const leadsResponse = await fetch('/api/leads')
        const leadsData = await leadsResponse.json()

        if (!isMounted) return

        // Calculate metrics
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)

        // Get all tasks from leads
        const allTasks: Task[] = leadsData.reduce((acc: Task[], lead: Lead) => {
          return lead.tasks ? [...acc, ...lead.tasks] : acc
        }, [])

        const pendingTasks = allTasks.filter(task => task.status === 'pending')
        const todaysTasks = pendingTasks.filter(task => {
          const taskDate = new Date(task.date)
          taskDate.setHours(0, 0, 0, 0)
          return taskDate.getTime() === today.getTime()
        })

        if (isMounted) {
          setMetrics({
            totalTasks: pendingTasks.length,
            totalLeads: leadsData.length,
            todaysTasks: todaysTasks.length,
            upcomingTasks: pendingTasks.filter(task => {
              const taskDate = new Date(task.date)
              return taskDate >= today && taskDate <= nextWeek
            }).length
          })
          setAllTasks(allTasks)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
        if (isMounted) setIsLoading(false)
      }
    }

    fetchMetrics()
    fetchEvents()

    return () => { isMounted = false }
  }, [])

  // Fetch calendar events
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data)
      filterEventsForSelectedDate(selectedDate, data)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  // Filter events for the selected date
  const filterEventsForSelectedDate = (date: Date, eventsList = events) => {
    const filtered = eventsList.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    }).sort((a, b) => a.time.localeCompare(b.time))

    setEventsForSelectedDate(filtered)
  }

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    filterEventsForSelectedDate(date)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'viewing':
        return 'bg-blue-100 text-blue-800'
      case 'meeting':
        return 'bg-purple-100 text-purple-800'
      case 'open-house':
        return 'bg-green-100 text-green-800'
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800'
      case 'call':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <motion.div
          className="p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="text-2xl font-bold mb-6"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Dashboard
          </motion.h1>

          <MetricsCards metrics={metrics} />
          <TasksTable
            allTasks={allTasks}
            getStatusIcon={getStatusIcon}
            getPriorityColor={getPriorityColor}
          />

          <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Loading calendar...</div>}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Calendar</CardTitle>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => router.push('/calendar/add')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      + Add New Event
                    </Button>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <MonthView
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <h3 className="text-lg font-semibold mb-3">
                        Events for {format(selectedDate, 'MMMM d, yyyy')}
                      </h3>
                      <DailyEvents
                        events={eventsForSelectedDate}
                        getTypeColor={getTypeColor}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Suspense>
        </motion.div>
      </Suspense>
    </DashboardLayout>
  )
}


"use client"

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Showing {
  id?: string
  date: Date
  time: string
  property: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  type?: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call'
  title?: string
  description?: string
  location?: string
}

interface ShowingCalendarProps {
  showings: Showing[]
  onAddShowing: (showing: Showing) => void
  onUpdateShowing: (id: string, showing: Partial<Showing>) => void
}

export function ShowingCalendar({ showings: initialShowings, onAddShowing, onUpdateShowing }: ShowingCalendarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showings, setShowings] = useState<Showing[]>(initialShowings)
  const [newShowing, setNewShowing] = useState<Partial<Showing>>({
    status: 'scheduled',
    type: 'viewing'
  })
  const { toast } = useToast()

  // Update local showings state when initialShowings prop changes
  useEffect(() => {
    setShowings(initialShowings)
  }, [initialShowings])

  // Load showings from localStorage on component mount and merge with initialShowings
  useEffect(() => {
    const savedShowings = localStorage.getItem('calendar_events')
    if (savedShowings) {
      try {
        const parsedShowings = JSON.parse(savedShowings).map((showing: any) => ({
          ...showing,
          date: new Date(showing.date),
          // Convert dashboard events to showing format
          property: showing.location || showing.property || '',
          status: showing.status || 'scheduled',
          type: showing.type || 'viewing'
        }))
        
        // Merge with initialShowings, avoiding duplicates by ID
        const mergedShowings = [...initialShowings]
        parsedShowings.forEach((showing: Showing) => {
          if (!mergedShowings.find(s => s.id === showing.id)) {
            mergedShowings.push(showing)
          }
        })
        setShowings(mergedShowings)
      } catch (error) {
        console.error('Error parsing showings:', error)
      }
    }
  }, [initialShowings])

  const handleAddShowing = () => {
    if (!selectedDate || !newShowing.time || !newShowing.property) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    const showing: Showing = {
      id: Date.now().toString(),
      date: selectedDate,
      time: newShowing.time,
      property: newShowing.property,
      notes: newShowing.notes,
      status: 'scheduled',
      type: newShowing.type || 'viewing',
      title: `Showing: ${newShowing.property}`,
      description: newShowing.notes || '',
      location: newShowing.property
    }

    // Update local state
    setShowings(prevShowings => {
      const updatedShowings = [...prevShowings, showing]
      // Save to localStorage with dashboard event format
      const dashboardEvent = {
        ...showing,
        title: showing.title,
        location: showing.property,
        type: showing.type || 'viewing'
      }
      const existingEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]')
      localStorage.setItem('calendar_events', JSON.stringify([...existingEvents, dashboardEvent]))
      return updatedShowings
    })
    
    // Call the parent's onAddShowing
    onAddShowing(showing)
    
    // Reset form and close dialog
    setIsDialogOpen(false)
    setNewShowing({ status: 'scheduled', type: 'viewing' })
    setSelectedDate(undefined)

    toast({
      title: "Success",
      description: "Showing scheduled successfully",
    })
  }

  // Function to get showings for a specific date
  const getShowingsForDate = (date: Date) => {
    return showings.filter(showing => {
      const showingDate = new Date(showing.date)
      return showingDate.toDateString() === date.toDateString()
    })
  }

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <div className="grid md:grid-cols-[300px,1fr] gap-6">
        <div className="border rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Calendar</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[#ef4444] hover:bg-[#dc2626] text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule a Showing</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Date</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border mt-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={newShowing.time || ''}
                          onChange={(e) => setNewShowing({ ...newShowing, time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={newShowing.status}
                          onValueChange={(value) => setNewShowing({ ...newShowing, status: value as Showing['status'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Property</Label>
                      <Input
                        value={newShowing.property || ''}
                        onChange={(e) => setNewShowing({ ...newShowing, property: e.target.value })}
                        placeholder="Enter property address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={newShowing.notes || ''}
                        onChange={(e) => setNewShowing({ ...newShowing, notes: e.target.value })}
                        placeholder="Add any additional notes"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddShowing} className="bg-[#ef4444] hover:bg-[#dc2626] text-white">
                      Schedule Showing
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
            modifiers={{
              hasShowing: (date) => getShowingsForDate(date).length > 0
            }}
            modifiersStyles={{
              hasShowing: { 
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                fontWeight: 'bold'
              }
            }}
          />
        </div>

        {/* Showings List Section */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Showings for {selectedDate.toLocaleDateString()}
                <Badge variant="secondary" className="ml-2">
                  {getShowingsForDate(selectedDate).length} showing(s)
                </Badge>
              </h3>
              <div className="grid gap-4">
                {getShowingsForDate(selectedDate).map((showing) => (
                  <div
                    key={showing.id}
                    className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-medium text-lg">{showing.time}</div>
                        <div className="text-gray-600">{showing.property}</div>
                        {showing.notes && (
                          <div className="text-sm text-gray-500 mt-2">
                            Notes: {showing.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            showing.status === 'completed' ? 'bg-green-100 text-green-800' :
                            showing.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {showing.status}
                        </Badge>
                        <Select
                          value={showing.status}
                          onValueChange={(value) => {
                            if (showing.id) {
                              onUpdateShowing(showing.id, { status: value as Showing['status'] })
                            }
                          }}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a date to view showings
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
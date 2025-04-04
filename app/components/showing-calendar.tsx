import type { Showing } from "@/lib/types"
import { Calendar } from "@/components/calendar"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export interface ShowingCalendarProps {
  showings: Showing[];
  onAddShowing: (showing: Showing) => Promise<void>;
  onUpdateShowing: (showingId: string, updates: Partial<Showing>) => Promise<void>;
}

export function ShowingCalendar({ 
  showings, 
  onAddShowing,
  onUpdateShowing 
}: ShowingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Calendar</h3>
        <h3 className="text-lg font-medium">
          Showings for {selectedDate.toLocaleDateString()}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            showings={showings}
            onAddShowing={onAddShowing}
            onUpdateShowing={onUpdateShowing}
          />
        </div>

        {/* Showings List Section */}
        <div className="w-full">
          <div className="space-y-4">
            {showings
              ?.filter(showing => {
                const showingDate = new Date(showing.date);
                return (
                  showingDate.getDate() === selectedDate.getDate() &&
                  showingDate.getMonth() === selectedDate.getMonth() &&
                  showingDate.getFullYear() === selectedDate.getFullYear()
                );
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((showing) => (
                <div key={showing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{showing.property}</p>
                    <p className="text-sm text-gray-500">
                      {showing.time}
                    </p>
                    {showing.notes && (
                      <p className="text-sm text-gray-600 mt-1">{showing.notes}</p>
                    )}
                  </div>
                  <Badge variant={showing.status === 'scheduled' ? 'default' : 'secondary'}>
                    {showing.status}
                  </Badge>
                </div>
              ))}
            {!showings?.filter(showing => {
              const showingDate = new Date(showing.date);
              return (
                showingDate.getDate() === selectedDate.getDate() &&
                showingDate.getMonth() === selectedDate.getMonth() &&
                showingDate.getFullYear() === selectedDate.getFullYear()
              );
            }).length && (
              <p className="text-gray-500 text-center">No showings scheduled for this date</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
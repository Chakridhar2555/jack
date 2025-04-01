import type { Showing } from "@/lib/types"

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
  return (
    <div className="space-y-4">
      {/* Calendar view */}
      <div className="calendar-grid">
        {/* Calendar content */}
      </div>
      
      {/* Showings list */}
      <div className="showings-list">
        {showings.map((showing) => (
          <div key={showing.id} className="showing-item">
            {/* Showing details */}
          </div>
        ))}
      </div>
    </div>
  );
} 
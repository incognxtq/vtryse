import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface Reminder {
  id: string
  title: string
  event_date: string
  event_time: string | null
  type: string
  description: string | null
  attachment_url: string | null
}

const TYPE_COLORS: Record<string, string> = {
  event: '#8DBD71',
  task: '#E6D591',
  holiday: '#4D4B45',
  note: '#E8899A',
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Notifications() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [notifiedIds, setNotifiedIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const checkUpcoming = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date()
    const todayStr = getLocalDateString(today)

    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    const tomorrowStr = getLocalDateString(tomorrow)

    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, event_date, event_time, type, description, attachment_url')
      .in('event_date', [todayStr, tomorrowStr])
      .eq('status', 'ongoing')

    if (!error && data) {
      data.forEach((reminder) => {
        if (!notifiedIds.includes(reminder.id) && Notification.permission === 'granted') {
          new Notification(`[${reminder.type}] ${reminder.title}`, {
            body: `Due: ${reminder.event_date}${reminder.event_time ? ' at ' + reminder.event_time : ''}`,
            icon: '/VTryse_logo.png',
          })
          setNotifiedIds((prev) => [...prev, reminder.id])
        }
      })
      setReminders(data)
    }
  }

  useEffect(() => {
    checkUpcoming()

    const channel = supabase
      .channel('calendar_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => {
          checkUpcoming()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDismiss = (id: string) => {
    setDismissed([...dismissed, id])
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const visibleReminders = reminders.filter((r) => !dismissed.includes(r.id))

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <p className="text-xs font-medium text-text-muted px-4 mb-2 uppercase tracking-wide">
        Reminders
      </p>

      {visibleReminders.length === 0 ? (
        <p className="text-xs text-text-muted px-4">Nothing due soon</p>
      ) : (
        <div className="flex flex-col gap-2 px-2">
          {visibleReminders.map((reminder) => {
            const isExpanded = expandedId === reminder.id
            const titleColor = TYPE_COLORS[reminder.type] || '#8b7cf6'
            return (
              <div
                key={reminder.id}
                onMouseEnter={() => setExpandedId(reminder.id)}
                onMouseLeave={() => setExpandedId(null)}
                onClick={() => toggleExpand(reminder.id)}
                className="border border-border-subtle rounded-lg px-3 py-2 cursor-pointer transition-all duration-300 ease-in-out"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium transition-all duration-300 ${
                        isExpanded ? 'whitespace-normal break-words' : 'truncate'
                      }`}
                      style={{ color: titleColor }}
                    >
                      [{reminder.type}] {reminder.title}
                    </p>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-[10px] text-text-muted">
                        {reminder.event_date}
                        {reminder.event_time && ` at ${reminder.event_time}`}
                      </p>
                      {reminder.description && (
                        <p className="text-[10px] text-text-primary mt-1 whitespace-normal break-words">
                          {reminder.description}
                        </p>
                      )}
                      {reminder.attachment_url && (
                        <img
                          src={reminder.attachment_url}
                          alt="attachment"
                          className="max-w-full max-h-32 rounded border border-border-subtle object-contain mt-2"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                    </div>

                    {!isExpanded && (
                      <p className="text-[10px] text-text-muted truncate">
                        {reminder.event_date}
                        {reminder.event_time && ` at ${reminder.event_time}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss(reminder.id)
                    }}
                    className="text-text-muted text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Notifications
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface Reminder {
  id: string
  title: string
  event_date: string
  event_time: string | null
  type: string
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
      .select('id, title, event_date, event_time, type')
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
          {visibleReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="bg-surface-hover border border-border-subtle rounded-lg px-3 py-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    [{reminder.type}] {reminder.title}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {reminder.event_date}
                    {reminder.event_time && ` at ${reminder.event_time}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(reminder.id)}
                  className="text-text-muted text-xs flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
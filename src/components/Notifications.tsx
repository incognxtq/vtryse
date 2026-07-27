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
      setReminders(data)
    }
  }

  useEffect(() => {
    checkUpcoming()
    const interval = setInterval(checkUpcoming, 15000) // recheck every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = (id: string) => {
    setDismissed([...dismissed, id])
  }

  const visibleReminders = reminders.filter((r) => !dismissed.includes(r.id))

  if (visibleReminders.length === 0) return null

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {visibleReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg max-w-xs"
        >
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-semibold text-sm">
                [{reminder.type}] {reminder.title}
              </p>
              <p className="text-xs">
                Due: {reminder.event_date}
                {reminder.event_time && ` at ${reminder.event_time}`}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(reminder.id)}
              className="text-yellow-800 font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Notifications
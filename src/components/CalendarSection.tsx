import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface CalendarEvent {
  id: string
  type: string
  title: string
  description: string | null
  event_date: string
  status: string
}

function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [title, setTitle] = useState('')
  const [type, setType] = useState('event')
  const [eventDate, setEventDate] = useState('')
  const [description, setDescription] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setEvents(data || [])
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleAddEvent = async () => {
    if (!title || !eventDate) {
      setErrorMsg('Title and date are required')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('You must be logged in')
      return
    }

    const { error } = await supabase.from('calendar_events').insert({
      user_id: user.id,
      type,
      title,
      description,
      event_date: eventDate,
      status: 'ongoing',
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setTitle('')
      setDescription('')
      setEventDate('')
      setErrorMsg('')
      fetchEvents()
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Calendar</h2>

      <div className="flex flex-col gap-2 mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="event">Event</option>
          <option value="task">Task</option>
          <option value="holiday">Holiday</option>
          <option value="note">Note</option>
        </select>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleAddEvent}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      </div>

      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="border p-2 rounded">
            <span className="font-semibold">[{event.type}]</span> {event.title} —{' '}
            {event.event_date} <span className="text-gray-500">({event.status})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CalendarSection
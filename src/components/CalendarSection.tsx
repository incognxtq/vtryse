import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface CalendarEvent {
  id: string
  type: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  status: string
  attachment_url: string | null
}

function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [title, setTitle] = useState('')
  const [type, setType] = useState('event')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploading, setUploading] = useState(false)

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

    let attachmentUrl: string | null = null

    if (file) {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file)

      if (uploadError) {
        setErrorMsg('Upload failed: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)

      attachmentUrl = urlData.publicUrl
      setUploading(false)
    }

    const { error } = await supabase.from('calendar_events').insert({
      user_id: user.id,
      type,
      title,
      description,
      event_date: eventDate,
      event_time: eventTime || null,
      status: 'ongoing',
      attachment_url: attachmentUrl,
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setTitle('')
      setDescription('')
      setEventDate('')
      setEventTime('')
      setFile(null)
      setErrorMsg('')
      fetchEvents()
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Calendar</h2>

      <div className="flex flex-col gap-2 mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-void border border-border-subtle p-2 rounded text-text-primary text-sm"
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
          className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted text-sm"
        />

        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="bg-void border border-border-subtle p-2 rounded text-text-primary text-sm"
        />

        <input
          type="time"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          className="bg-void border border-border-subtle p-2 rounded text-text-primary text-sm"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted text-sm"
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-text-muted text-sm"
        />

        <button
          onClick={handleAddEvent}
          disabled={uploading}
          className="bg-trace text-white px-4 py-2 rounded-lg hover:bg-trace-dim transition-colors disabled:opacity-50 text-sm"
        >
          {uploading ? 'Uploading...' : 'Add'}
        </button>

        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
      </div>

      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="bg-void border border-border-subtle p-3 rounded-lg text-sm">
            <span className="font-medium text-trace">[{event.type}]</span>{' '}
            <span className="text-text-primary">{event.title}</span> —{' '}
            <span className="text-text-muted">{event.event_date}</span>
            {event.event_time && <span className="text-text-muted"> at {event.event_time}</span>}{' '}
            <span className="text-text-muted">({event.status})</span>
            {event.attachment_url && (
              <div className="mt-1">
                <a>
                  href={event.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-trace underline text-xs"
                  View attachment
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CalendarSection
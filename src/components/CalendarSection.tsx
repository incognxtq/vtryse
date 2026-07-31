import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface CalendarEvent {
  id: string
  user_id: string
  type: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  status: string
  attachment_url: string | null
  color: string
}

function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [type, setType] = useState('event')
  const [eventTime, setEventTime] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#8b7cf6')
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  const notifyDataChanged = () => {
    window.dispatchEvent(new Event('calendar-data-changed'))
  }

  const fetchEvents = async () => {
    const { data } = await supabase.from('calendar_events').select('*')
    setEvents(data || [])
  }

  const fetchProfileNames = async () => {
    const { data } = await supabase.from('profiles').select('id, name')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((p) => {
        map[p.id] = p.name || 'Someone'
      })
      setProfileNames(map)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      fetchEvents()
      fetchProfileNames()
    }
    init()
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  const eventsForDate = (date: string) => events.filter((e) => e.event_date === date)

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .update({ status: newStatus })
      .eq('id', eventId)

    if (error) {
      setErrorMsg(error.message)
    } else {
      fetchEvents()
      notifyDataChanged()
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setEventTime('')
    setColor('#8b7cf6')
    setFile(null)
    setEditingId(null)
    setErrorMsg('')
  }

  const startEditing = (e: CalendarEvent) => {
    setEditingId(e.id)
    setTitle(e.title)
    setType(e.type)
    setEventTime(e.event_time || '')
    setDescription(e.description || '')
    setColor(e.color)
    setFile(null)
  }

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)
    if (error) {
      setErrorMsg(error.message)
    } else {
      fetchEvents()
      notifyDataChanged()
    }
  }

  const handleSaveEvent = async () => {
    if (!title || !selectedDate) {
      setErrorMsg('Title and date are required')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let attachmentUrl: string | null = null
    if (file) {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file)
      if (uploadError) {
        setErrorMsg(uploadError.message)
        setUploading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(fileName)
      attachmentUrl = urlData.publicUrl
      setUploading(false)
    }

    if (editingId) {
      const updatePayload: any = {
        type,
        title,
        description,
        event_time: eventTime || null,
        color,
      }
      if (attachmentUrl) updatePayload.attachment_url = attachmentUrl

      const { error } = await supabase
        .from('calendar_events')
        .update(updatePayload)
        .eq('id', editingId)

      if (error) {
        setErrorMsg(error.message)
      } else {
        resetForm()
        fetchEvents()
        notifyDataChanged()
      }
    } else {
      const { error } = await supabase.from('calendar_events').insert({
        user_id: user.id,
        type,
        title,
        description,
        event_date: selectedDate,
        event_time: eventTime || null,
        status: 'ongoing',
        attachment_url: attachmentUrl,
        color,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        resetForm()
        fetchEvents()
        notifyDataChanged()
      }
    }
  }

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-header">Calendar</h2>

      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="text-text-muted text-sm px-2">‹</button>
        <p className="text-sm font-medium text-text-primary">{monthLabel}</p>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="text-text-muted text-sm px-2">›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] text-text-muted mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {cells.map((date, i) => {
          const dayEvents = date ? eventsForDate(date) : []
          return (
            <div
              key={i}
              onClick={() => {
                if (date) {
                  setSelectedDate(date)
                  resetForm()
                }
              }}
              className={`h-14 rounded border text-[10px] p-1 cursor-pointer overflow-hidden
                ${date ? 'border-border-subtle bg-void hover:bg-surface-hover' : 'border-transparent'}
                ${selectedDate === date ? 'ring-1 ring-trace' : ''}`}
            >
              {date && <span className="text-text-muted">{parseInt(date.split('-')[2])}</span>}
              <div className="flex flex-col gap-0.5 mt-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <div key={e.id} className="truncate rounded px-1" style={{ backgroundColor: e.color, color: '#fff' }}>
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && <span className="text-text-muted">+{dayEvents.length - 2}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div className="bg-void border border-border-subtle rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-text-primary">{selectedDate}</p>
            <button onClick={() => { setSelectedDate(null); resetForm() }} className="text-text-muted text-xs">✕</button>
          </div>

          <ul className="space-y-2 mb-3">
            {eventsForDate(selectedDate).map((e) => {
              const isOwner = e.user_id === currentUserId
              return (
                <li key={e.id} className="text-xs flex flex-col gap-1 border-b border-border-subtle pb-2 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="text-text-primary truncate">[{e.type}] {e.title}</span>
                      {e.attachment_url && (
                        <a href={e.attachment_url} target="_blank" rel="noopener noreferrer" className="text-trace underline flex-shrink-0">
                          file
                        </a>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => startEditing(e)} className="text-trace text-[10px]">Edit</button>
                        <button onClick={() => handleDeleteEvent(e.id)} className="text-red-400 text-[10px]">Delete</button>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-text-muted ml-4">
                    Added by {profileNames[e.user_id] || 'Someone'}
                  </p>

                  {e.type !== 'note' && e.type !== 'holiday' && (
                    <div className="flex gap-1 ml-4">
                      {['ongoing', 'completed', 'cancelled'].map((s) => (
                        <button
                          key={s}
                          onClick={() => isOwner && handleStatusChange(e.id, s)}
                          disabled={!isOwner}
                          className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                            e.status === s
                              ? s === 'ongoing'
                                ? 'bg-purple-500 text-white'
                                : s === 'completed'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-surface-hover text-text-muted hover:bg-border-subtle'
                          } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col gap-2">
            {editingId && (
              <p className="text-[10px] text-trace">Editing — Save to update, or Cancel below</p>
            )}
            <div className="flex gap-2">
              <select value={type} onChange={(e) => setType(e.target.value)} className="bg-surface border border-border-subtle p-1 rounded text-text-primary text-xs flex-1">
                <option value="event">Event</option>
                <option value="task">Task</option>
                <option value="holiday">Holiday</option>
                <option value="note">Note</option>
              </select>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded border border-border-subtle" />
            </div>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-surface border border-border-subtle p-1 rounded text-text-primary text-xs" />
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="bg-surface border border-border-subtle p-1 rounded text-text-primary text-xs" />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-surface border border-border-subtle p-1 rounded text-text-primary text-xs" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-text-muted text-xs" />
            <div className="flex gap-2">
              <button onClick={handleSaveEvent} disabled={uploading} className="bg-trace text-white px-3 py-1 rounded text-xs hover:bg-trace-dim flex-1">
                {uploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Add'}
              </button>
              {editingId && (
                <button onClick={resetForm} className="bg-surface-hover text-text-muted px-3 py-1 rounded text-xs">
                  Cancel
                </button>
              )}
            </div>
            {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarSection
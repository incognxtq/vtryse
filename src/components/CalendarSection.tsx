import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ConfirmDialog from './ConfirmDialog'
import { type RepeatConfig, summarizeRepeat, generateOccurrenceDates } from './RepeatPopover'
import RepeatModal from './RepeatModal'
import { ALL_TIMEZONES, getBrowserTimezone, convertEventTimeForViewer } from '../utils/timezone'

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
  location: string | null
  timezone: string | null
}

const TYPE_COLORS: Record<string, string> = {
  event: '#84AB61',
  task: '#BDA859',
  holiday: '#B0A5A5',
  note: '#E8899A',
}

const TYPE_OPTIONS = ['event', 'task', 'holiday', 'note']

const DEFAULT_REPEAT: RepeatConfig = {
  type: 'none',
  interval: 1,
  unit: 'week',
  days: [],
  ends: 'never',
  endDate: '',
  occurrences: 5,
}

function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [viewerTimezone, setViewerTimezone] = useState(getBrowserTimezone())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [type, setType] = useState('event')
  const [eventTime, setEventTime] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventTimezone, setEventTimezone] = useState(getBrowserTimezone())
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  const [repeatOpen, setRepeatOpen] = useState(false)
  const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(DEFAULT_REPEAT)

  const notifyDataChanged = () => {
    window.dispatchEvent(new Event('calendar-data-changed'))
  }

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('calendar_events')
      .select('id, user_id, type, title, description, event_date, event_time, status, attachment_url, color, location, timezone')
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

  const fetchViewerTimezone = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle()
    if (data?.timezone) setViewerTimezone(data.timezone)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      fetchEvents()
      fetchProfileNames()
      fetchViewerTimezone()
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
    setType('event')
    setLocation('')
    setEventTimezone(getBrowserTimezone())
    setFile(null)
    setEditingId(null)
    setErrorMsg('')
    setRepeatConfig(DEFAULT_REPEAT)
  }

  const startEditing = (e: CalendarEvent) => {
    setEditingId(e.id)
    setTitle(e.title)
    setType(e.type)
    setEventTime(e.event_time || '')
    setDescription(e.description || '')
    setLocation(e.location || '')
    setEventTimezone(e.timezone || getBrowserTimezone())
    setFile(null)
    setShowForm(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      setErrorMsg(error.message)
    } else {
      fetchEvents()
      notifyDataChanged()
    }
    setConfirmDeleteId(null)
  }

  const handleSaveEvent = async () => {
    if (!title || !selectedDate) {
      setErrorMsg('Title and date are required')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const color = TYPE_COLORS[type] || '#8b7cf6'

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
        location: location || null,
        timezone: eventTimezone,
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
      const dates = generateOccurrenceDates(selectedDate, repeatConfig)
      const repeatGroupId = dates.length > 1 ? crypto.randomUUID() : null

      const rows = dates.map((d) => ({
        user_id: user.id,
        type,
        title,
        description,
        event_date: d,
        event_time: eventTime || null,
        status: 'ongoing',
        attachment_url: attachmentUrl,
        color,
        location: location || null,
        timezone: eventTimezone,
        repeat_group_id: repeatGroupId,
      }))

      const { error } = await supabase.from('calendar_events').insert(rows)

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
      <h2 className="text-trace-dim text-xl font-semibold mb-3 text-header">Calendar</h2>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="text-text-muted text-sm px-2">‹</button>
        <p className="text-l font-medium text-text-primary">{monthLabel}</p>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="text-text-muted text-sm px-2">›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] text-text-muted mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-7">
        {cells.map((date, i) => {
          const dayEvents = date ? eventsForDate(date) : []
          return (
            <div
              key={i}
              onClick={() => {
                if (date) {
                  setSelectedDate(date)
                  resetForm()
                  setShowForm(false)
                }
              }}
              className={`h-15 rounded border text-[10px] p-1 cursor-pointer overflow-hidden
                ${date ? 'border-border-subtle bg-void hover:bg-surface' : 'border-transparent'}
                ${selectedDate === date ? 'ring-2 ring-trace' : ''}`}
            >
              {date && <span className="text-text-muted">{parseInt(date.split('-')[2])}</span>}
              <div className="flex flex-col gap-0.5 mt-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <div key={e.id} className="truncate rounded px-1" style={{ backgroundColor: TYPE_COLORS[e.type] || e.color, color: '#000000' }}>
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
        <div className="bg-surface border border-border-subtle rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[15px] font-medium text-text-primary">{selectedDate}</p>
            <button onClick={() => { setSelectedDate(null); resetForm(); setShowForm(false) }} className="text-text-muted hover:text-[#E02626] text-xs">✕</button>
          </div>

          <ul className="space-y-2 mb-4">
            {eventsForDate(selectedDate).map((e) => {
              const isOwner = e.user_id === currentUserId
              const converted = convertEventTimeForViewer(
                e.event_date,
                e.event_time,
                e.timezone || 'UTC',
                viewerTimezone
              )
              return (
                <li key={e.id} className="text-[13px] flex flex-col gap-1 border-b border-border-subtle pb-1 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w- h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[e.type] || e.color }} />
                      <span className="text-trace truncate">[{e.type}] {e.title}</span>
                      {e.attachment_url && (
                        <a href={e.attachment_url} target="_blank" rel="noopener noreferrer" className="text-text-primary flex-shrink-0">
                          file
                        </a>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => startEditing(e)} className="hover:text-text-muted text-[#DBD7D7] text-[12px]">Edit</button>
                        <button onClick={() => setConfirmDeleteId(e.id)} className="hover:text-[#e0262665] text-[#E02626] text-[12px]">Delete</button>
                      </div>
                    )}
                  </div>

                  {converted && (
                    <p className="text-[11px] text-text-muted ml-4">
                      {converted.time} ({viewerTimezone})
                    </p>
                  )}
                  {e.location && (
                    <p className="text-[11px] text-text-muted ml-4">📍 {e.location}</p>
                  )}

                  <p className="text-[13px] text-text-muted mb-1 ml-4">
                    Added by {profileNames[e.user_id] || 'Someone'}
                  </p>

                  {e.type !== 'note' && e.type !== 'holiday' && (
                    <div className="flex gap-1 ml-4">
                      {['ongoing', 'completed', 'cancelled'].map((s) => (
                        <button
                          key={s}
                          onClick={() => isOwner && handleStatusChange(e.id, s)}
                          disabled={!isOwner}
                          className={`px-4 py-1.5 rounded text-[10px] capitalize transition-colors ${
                            e.status === s
                              ? s === 'ongoing'
                                ? 'bg-[#DBD7D7] text-void'
                                : s === 'completed'
                                ? 'bg-[#193B20] text-white'
                                : 'bg-[#690000] text-white'
                              : 'text-text-muted hover:bg-border-subtle'
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

          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full text-left font-medium text-[12px] text-text-muted hover:text-text-primary flex items-center mb-2"
          >
            {showForm ? '▾ HIDE' : '▸ ADD NEW'}
          </button>

          {showForm && (
            <div className="flex flex-col gap-2">
              {editingId && (
                <p className="p-mb-0 text-[13px] text-text-muted">EDITING</p>
              )}
              <div className="flex gap-1">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex-1 px-2 py-0.5 rounded font-semibold text-[12px]"
                    style={{
                      backgroundColor: type === t ? TYPE_COLORS[t] : 'transparent',
                      borderColor: TYPE_COLORS[t],
                      color: type === t ? '#000000' : TYPE_COLORS[t],
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-surface border-1 font-medium p-2 rounded text-[13px] transition-colors"
                style={{ borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }}
              />

              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="bg-surface border border-border-subtle p-1 rounded text-text-primary text-[12px]"
              />

              <select
                value={eventTimezone}
                onChange={(e) => setEventTimezone(e.target.value)}
                className="bg-surface border border-border-subtle p-2 rounded text-text-primary text-[12px]"
              >
                {ALL_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-surface border border-border-subtle p-2 rounded text-text-primary text-[12px]"
              />

              <button
                type="button"
                onClick={() => setRepeatOpen(true)}
                className="w-full text-left bg-surface border border-border-subtle p-2 rounded text-text-primary text-[12px] hover:bg-surface-hover transition-colors"
              >
                🔁 {summarizeRepeat(repeatConfig)}
              </button>

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-surface border border-border-subtle p-2 rounded text-text-primary text-[13px] w-full resize-y min-h-[110px] leading-relaxed"
              />
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-text-muted hover:text-text-primary text-xs" />
              <div className="flex gap-2">
                <button onClick={handleSaveEvent} disabled={uploading} className="bg-hover text-white px-3 py-1 rounded text-xs hover:bg-trace-dim">
                  {uploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Add'}
                </button>
                {editingId && (
                  <button onClick={() => { resetForm(); setShowForm(false) }} className="bg-surface-hover hover:bg-trace-dim text-text- px-3 py-1 rounded text-xs">
                    Cancel
                  </button>
                )}
              </div>
              {errorMsg && <p className="text-[#690000] text-xs">{errorMsg}</p>}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this event?"
        message="This action cannot be undone."
        onConfirm={() => confirmDeleteId && handleDeleteEvent(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <RepeatModal
        open={repeatOpen}
        config={repeatConfig}
        onChange={setRepeatConfig}
        onClose={() => setRepeatOpen(false)}
      />
    </div>
  )
}

export default CalendarSection
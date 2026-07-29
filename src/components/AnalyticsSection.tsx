import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface EventRow {
  id: string
  title: string
  status: string
  event_date: string
  type: string
  attachment_url: string | null
  description: string | null
}

interface Goal {
  id: string
  title: string
  target_date: string
}

const STATUS_COLORS: Record<string, string> = {
  ongoing: '#8b7cf6',
  completed: '#4ade80',
  cancelled: '#f87171',
}

function AnalyticsSection() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<EventRow[] | null>(null)

  const fetchData = async () => {
    const { data: eventData } = await supabase
      .from('calendar_events')
      .select('id, title, status, event_date, type, attachment_url, description')
    setEvents(eventData || [])

    const { data: goalData } = await supabase
      .from('goals')
      .select('id, title, target_date')
      .order('target_date', { ascending: true })
    setGoals(goalData || [])
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('analytics_calendar_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals' },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const statusCounts = ['ongoing', 'completed', 'cancelled'].map((status) => ({
    status,
    count: events.filter((e) => e.status === status).length,
  }))

  const notePoints = events
    .filter((e) => e.type === 'note')
    .map((e) => ({
      date: e.event_date,
      x: new Date(e.event_date).getTime(),
      y: 1,
      title: e.title,
      raw: e,
    }))

  const revealedTitles = selectedStatus
    ? events.filter((e) => e.status === selectedStatus).map((e) => e.title)
    : []

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diff = Math.ceil((target.getTime() - today.setHours(0, 0, 0, 0)) / 86400000)
    return diff
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3" style={{ color: '#5a6141' }}>
        Analytics
      </h2>

      <div className="flex justify-end gap-2 mb-3">
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1 rounded text-xs ${chartType === 'bar' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          Bar
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-3 py-1 rounded text-xs ${chartType === 'pie' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          Pie
        </button>
      </div>

      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={statusCounts}>
              <XAxis dataKey="status" stroke="#8b8a99" fontSize={12} />
              <YAxis stroke="#8b8a99" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                cursor="pointer"
                onClick={(data: any) => setSelectedStatus(data.status)}
              >
                {statusCounts.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={statusCounts}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
                onClick={(data: any) => setSelectedStatus(data.status)}
                cursor="pointer"
              >
                {statusCounts.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {selectedStatus && (
        <div className="mb-4 bg-void border border-border-subtle rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-text-primary capitalize">
              {selectedStatus} items
            </p>
            <button onClick={() => setSelectedStatus(null)} className="text-text-muted text-xs">
              ✕
            </button>
          </div>
          {revealedTitles.length === 0 ? (
            <p className="text-xs text-text-muted">No items</p>
          ) : (
            <ul className="text-xs text-text-muted list-disc list-inside">
              {revealedTitles.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-sm font-medium text-text-primary mb-2">Journal Activity</p>
      <div className="h-40 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#26262f" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(val) =>
                new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              }
              stroke="#8b8a99"
              fontSize={11}
            />
            <YAxis dataKey="y" hide />
            <Tooltip
              formatter={(_, __, props) => [props.payload.title, props.payload.date]}
            />
            <Scatter
              data={notePoints}
              fill="#8b7cf6"
              cursor="pointer"
              onClick={(data: any) => {
                const sameDay = events.filter(
                  (e) => e.type === 'note' && e.event_date === data.raw.event_date
                )
                setSelectedNotes(sameDay)
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {selectedNotes && selectedNotes.length > 0 && (
        <div className="mb-4 bg-void border border-border-subtle rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-text-primary">{selectedNotes[0].event_date}</p>
            <button onClick={() => setSelectedNotes(null)} className="text-text-muted text-xs">
              ✕
            </button>
          </div>
          {selectedNotes.map((note) => (
            <div key={note.id} className="border-t border-border-subtle pt-2 first:border-0 first:pt-0">
              <p className="text-sm font-medium text-text-primary">{note.title}</p>
              {note.description && (
                <p className="text-xs text-text-primary mt-1">{note.description}</p>
              )}
              {note.attachment_url && (
                <img
                  src={note.attachment_url}
                  alt="attachment"
                  className="max-w-full max-h-48 rounded border border-border-subtle object-contain mt-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-text-primary mb-2">Goal Deadlines</p>
      <div className="space-y-1">
        {goals.length === 0 && <p className="text-xs text-text-muted">No goals yet</p>}
        {goals.map((goal) => {
          const days = getDaysRemaining(goal.target_date)
          return (
            <p key={goal.id} className="text-xs text-text-muted">
              <span className="text-text-primary">{goal.title}</span> —{' '}
              {days >= 0 ? `${days} days remaining` : 'Overdue'}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default AnalyticsSection
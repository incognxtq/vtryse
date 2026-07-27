import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function AnalyticsSection() {
  const [ongoing, setOngoing] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [cancelled, setCancelled] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [goalCount, setGoalCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchStats = async () => {
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('status, event_date')

    if (eventsError) {
      setErrorMsg(eventsError.message)
      return
    }

    if (events) {
      setOngoing(events.filter((e) => e.status === 'ongoing').length)
      setCompleted(events.filter((e) => e.status === 'completed').length)
      setCancelled(events.filter((e) => e.status === 'cancelled').length)

      const today = new Date().toISOString().split('T')[0]
      setTodayCount(events.filter((e) => e.event_date === today).length)
    }

    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id')

    if (goalsError) {
      setErrorMsg(goalsError.message)
      return
    }

    setGoalCount(goals?.length || 0)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Analytics</h2>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <div className="space-y-2 text-sm">
        <p>
          <span className="font-semibold">Progress:</span> {ongoing} ongoing,{' '}
          {completed} completed, {cancelled} cancelled
        </p>
        <p>
          <span className="font-semibold">Today's activity:</span> {todayCount} item(s)
        </p>
        <p>
          <span className="font-semibold">Active goals:</span> {goalCount}
        </p>
      </div>
    </div>
  )
}

export default AnalyticsSection
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import AnalyticsSection from '../components/AnalyticsSection'
import CalendarSection from '../components/CalendarSection'
import GoalPlannerSection from '../components/GoalPlannerSection'

function Dashboard() {
  const [name, setName] = useState('')

  useEffect(() => {
    const fetchName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()

      if (data?.name) setName(data.name)
    }

    fetchName()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-8 text-text-primary">
        {name ? `Welcome back, ${name}!` : 'Dashboard'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border-subtle rounded-xl p-5">
          <AnalyticsSection />
        </div>
        <div className="bg-surface border border-border-subtle rounded-xl p-5">
          <CalendarSection />
        </div>
        <div className="bg-surface border border-border-subtle rounded-xl p-5">
          <GoalPlannerSection />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
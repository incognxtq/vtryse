import AnalyticsSection from '../components/AnalyticsSection'
import CalendarSection from '../components/CalendarSection'
import GoalPlannerSection from '../components/GoalPlannerSection'

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-8 text-text-primary">Dashboard</h1>

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
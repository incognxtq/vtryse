import AnalyticsSection from '../components/AnalyticsSection'
import CalendarSection from '../components/CalendarSection'
import GoalPlannerSection from '../components/GoalPlannerSection'

function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 shadow">
          <AnalyticsSection />
        </div>

        <div className="border rounded-lg p-4 shadow">
          <CalendarSection />
        </div>

        <div className="border rounded-lg p-4 shadow">
          <GoalPlannerSection />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
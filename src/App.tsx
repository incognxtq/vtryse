import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import Notifications from './components/Notifications'
import Sidebar from './components/Sidebar'
import { useTheme } from './hooks/useTheme'

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const showSidebar = !['/', '/login', '/signup'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-void text-text-primary">
      {showSidebar && <Sidebar />}
      {showSidebar && <Notifications />}
      <main className={showSidebar ? 'md:ml-56 pt-14 md:pt-0' : ''}>{children}</main>
    </div>
  )
}

function App() {
  useTheme()

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
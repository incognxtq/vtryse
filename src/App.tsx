import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import Notifications from './components/Notifications'
import { supabase } from './supabaseClient'

function NavBar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="p-4 flex gap-4 bg-gray-100 items-center">
      <Link to="/">Login</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/settings">Settings</Link>
      <button onClick={handleLogout} className="ml-auto bg-red-600 text-white px-3 py-1 rounded">
        Log Out
      </button>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="dark:bg-gray-900 dark:text-white min-h-screen">
        <NavBar />
        <Notifications />
        <Routes>
          <Route path="/" element={<Login />} />
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
      </div>
    </BrowserRouter>
  )
}

export default App
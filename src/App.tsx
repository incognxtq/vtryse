import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import Notifications from "./components/Notifications";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./hooks/useTheme";
import { useLocation } from "react-router-dom";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showSidebar = location.pathname !== "/";

  return (
    <div className="min-h-screen bg-void text-text-primary">
      {showSidebar && <Sidebar />}
      <Notifications />
      <main className={showSidebar ? "md:ml-56 pt-14 md:pt-0" : ""}>
        {children}
      </main>
    </div>
  );
}

function App() {
  useTheme();

  return (
    <BrowserRouter>
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
}

export default App;

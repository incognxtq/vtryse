import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Notifications from "./Notifications";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setName(data.name || "");
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-lg text-sm transition-colors ${
      location.pathname === path
        ? "bg-white/90 text-trace font-bold"
        : "text-white hover:bg-surface hover:text-text-primary"
    }`;

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-trace border-b border-border-subtle flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-semibold text-white tracking-wide">
          vtryse
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white text-2xl leading-none"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Overlay when mobile menu is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-56 h-screen bg-trace border-sidebar-border flex flex-col p-4 fixed left-0 top-0 z-50 transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="mb-6 px-2 hidden md:block">
          <h1 className="text-2xl font-bold text-primary tracking-wide text-black">
            vtryse
          </h1>
          <p className="text-xs text-primary mb-4">Trace Your Progress</p>
        </div>
        <div className="mb-4 md:hidden h-10" />

        {/* Profile picture + name + username */}
        <div className="flex items-center gap-2 px-2 mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover border border-border-subtle shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-text-primary text-xs shrink-0">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-text-primary truncate">
              {name || "User"}
            </span>
            {username && (
              <span className="text-xs text-black truncate">
                {username}
              </span>
            )}
          </div>
        </div>

        <nav className="flex flex-col gap-1 mb-6">
          <Link
            to="/dashboard"
            className={linkClass("/dashboard")}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/settings"
            className={linkClass("/settings")}
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
        </nav>

        <Notifications />

        <button
          onClick={handleLogout}
          className="text-sm text-center px-4 py-2 rounded-lg text-white hover:bg-black hover:text-white transition-colors"
        >
          Log Out
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
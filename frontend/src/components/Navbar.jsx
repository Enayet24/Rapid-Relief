import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "badge-error text-white font-bold";
      case "volunteer":
        return "badge-warning text-black font-semibold";
      default:
        return "badge-info text-white";
    }
  };

  return (
    <header className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-50 border-b border-base-300">
      <div className="flex-1 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-primary hover:opacity-90 transition-opacity">
          <span className="text-2xl">🚨</span>
          <span>Rapid Relief</span>
        </Link>
        {user && (
          <span className="hidden sm:inline-block text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-base-200 text-base-content/70 font-medium">
            Disaster System
          </span>
        )}
      </div>

      {/* Desktop Navigation Links */}
      <div className="hidden lg:flex items-center gap-1">
        {user ? (
          <>
            {/* Admin Navigation */}
            {user.role === "admin" && (
              <>
                <Link
                  to="/admin"
                  className={`btn btn-sm btn-ghost ${isActive("/admin") ? "btn-active font-bold text-primary" : ""}`}
                >
                  📊 Command Center
                </Link>
                <Link
                  to="/requests"
                  className={`btn btn-sm btn-ghost ${isActive("/requests") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🚨 Emergency Requests
                </Link>
                <Link
                  to="/shelters"
                  className={`btn btn-sm btn-ghost ${isActive("/shelters") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🏠 Shelters
                </Link>
                <Link
                  to="/resources"
                  className={`btn btn-sm btn-ghost ${isActive("/resources") ? "btn-active font-bold text-primary" : ""}`}
                >
                  📦 Inventory
                </Link>
                <Link
                  to="/donations"
                  className={`btn btn-sm btn-ghost ${isActive("/donations") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🤝 Donations
                </Link>
              </>
            )}

            {/* Volunteer Navigation */}
            {user.role === "volunteer" && (
              <>
                <Link
                  to="/volunteer"
                  className={`btn btn-sm btn-ghost ${isActive("/volunteer") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🦺 Missions Dashboard
                </Link>
                <Link
                  to="/requests"
                  className={`btn btn-sm btn-ghost ${isActive("/requests") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🚨 All Requests
                </Link>
                <Link
                  to="/shelters"
                  className={`btn btn-sm btn-ghost ${isActive("/shelters") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🏠 Shelters
                </Link>
              </>
            )}

            {/* Citizen Navigation */}
            {user.role === "citizen" && (
              <>
                <Link
                  to="/citizen"
                  className={`btn btn-sm btn-ghost ${isActive("/citizen") ? "btn-active font-bold text-primary" : ""}`}
                >
                  👤 My Hub
                </Link>
                <Link
                  to="/requests"
                  className={`btn btn-sm btn-ghost ${isActive("/requests") ? "btn-active font-bold text-primary" : ""}`}
                >
                  📋 My Requests
                </Link>
                <Link
                  to="/requests/new"
                  className="btn btn-sm btn-error text-white font-semibold shadow-sm"
                >
                  🆘 Request Help
                </Link>
                <Link
                  to="/shelters"
                  className={`btn btn-sm btn-ghost ${isActive("/shelters") ? "btn-active font-bold text-primary" : ""}`}
                >
                  🏠 Nearby Shelters
                </Link>
              </>
            )}

            {/* User Profile & Logout */}
            <div className="dropdown dropdown-end ml-3">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm flex items-center gap-2 border border-base-300">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="max-w-[120px] truncate font-medium text-xs">{user.name}</span>
                <span className={`badge badge-xs uppercase ${getRoleBadgeClass(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2 border border-base-200 z-50">
                <li className="menu-title px-4 py-1 text-xs">
                  Signed in as <span className="font-bold text-base-content">{user.name}</span> ({user.email})
                </li>
                {user.phone && (
                  <li className="px-4 py-1 text-xs text-base-content/70">
                    📱 SMS: {user.phone}
                  </li>
                )}
                <div className="divider my-1"></div>
                {user.role === "admin" && (
                  <li><Link to="/admin">Admin Dashboard</Link></li>
                )}
                {user.role === "volunteer" && (
                  <li><Link to="/volunteer">Volunteer Dashboard</Link></li>
                )}
                {user.role === "citizen" && (
                  <li><Link to="/citizen">Citizen Dashboard</Link></li>
                )}
                <li>
                  <button onClick={handleLogout} className="text-error font-semibold">
                    🚪 Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-sm btn-ghost">Log in</Link>
            <Link to="/signup" className="btn btn-sm btn-primary">Sign up</Link>
          </div>
        )}
      </div>

      {/* Mobile Hamburger Button */}
      <div className="flex lg:hidden ml-auto">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-ghost btn-sm"
          aria-label="Toggle Navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-base-100 border-b border-base-300 shadow-xl p-4 flex flex-col gap-2 z-50 animate-fadeIn">
          {user ? (
            <>
              <div className="flex items-center justify-between p-2 bg-base-200 rounded-lg mb-2">
                <div>
                  <p className="font-bold text-sm">{user.name}</p>
                  <p className="text-xs text-base-content/70">{user.email}</p>
                </div>
                <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
              </div>

              {user.role === "admin" && (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">📊 Command Center</Link>
                  <Link to="/requests" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🚨 Emergency Requests</Link>
                  <Link to="/shelters" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🏠 Shelters</Link>
                  <Link to="/resources" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">📦 Inventory</Link>
                  <Link to="/donations" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🤝 Donations</Link>
                </>
              )}

              {user.role === "volunteer" && (
                <>
                  <Link to="/volunteer" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🦺 Missions Dashboard</Link>
                  <Link to="/requests" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🚨 Requests List</Link>
                  <Link to="/shelters" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🏠 Shelters</Link>
                </>
              )}

              {user.role === "citizen" && (
                <>
                  <Link to="/citizen" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">👤 My Dashboard</Link>
                  <Link to="/requests/new" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-error text-white justify-start">🆘 Report Emergency</Link>
                  <Link to="/requests" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">📋 My Requests</Link>
                  <Link to="/shelters" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost justify-start">🏠 Nearby Shelters</Link>
                </>
              )}

              <div className="divider my-1"></div>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="btn btn-sm btn-outline btn-error w-full"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-ghost">Log in</Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-sm btn-primary">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

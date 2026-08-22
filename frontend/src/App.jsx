import { Routes, Route, Link, Navigate } from "react-router-dom";
import RequestForm from "./pages/RequestForm.jsx";
import RequestList from "./pages/RequestList.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ShelterList from "./pages/ShelterList.jsx";
import ShelterForm from "./pages/ShelterForm.jsx";
import ResourceInventory from "./pages/ResourceInventory.jsx";
import DonationList from "./pages/DonationList.jsx";
import ShelterResourceMonitoring from "./pages/ShelterResourceMonitoring.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import CitizenDashboard from "./pages/CitizenDashboard.jsx";
import VolunteerDashboard from "./pages/VolunteerDashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import NotificationCenter from "./pages/NotificationCenter.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Home() {
  const { user } = useAuth();

  // If already logged in, redirect to role-specific dashboard
  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "volunteer") return <Navigate to="/volunteer" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return (
    <div className="hero min-h-[75vh] flex items-center justify-center">
      <div className="hero-content text-center max-w-2xl px-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            <span>🚨</span>
            <span>MERN Stack Disaster Relief Coordination Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-base-content leading-tight">
            Rapid Relief & Disaster Response System
          </h1>

          <p className="py-5 text-sm sm:text-base text-base-content/70 max-w-xl mx-auto">
            A centralized emergency coordination network connecting citizens in crisis, volunteer rescue squads, and disaster management authorities with real-time SMS alerts and live mapping.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link to="/signup" className="btn btn-primary font-bold px-6 shadow-md">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-outline font-semibold px-6">
              Sign In
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
            <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
              <div className="text-2xl mb-1">🆘</div>
              <h3 className="font-bold text-sm">Citizen Emergency Reporting</h3>
              <p className="text-xs text-base-content/70 mt-1">
                Instant emergency reporting with automatic priority scoring and SMS confirmations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
              <div className="text-2xl mb-1">🦺</div>
              <h3 className="font-bold text-sm">Volunteer Mission Board</h3>
              <p className="text-xs text-base-content/70 mt-1">
                Rescue task assignment, field status updates, and dispatch communications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
              <div className="text-2xl mb-1">📊</div>
              <h3 className="font-bold text-sm">Administrative Command</h3>
              <p className="text-xs text-base-content/70 mt-1">
                Centralized dashboard analytics, shelter tracking, resource inventory, and Twilio SMS broadcast.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Role-Based Dashboards */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen"
            element={
              <ProtectedRoute roles={["citizen"]}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute roles={["volunteer"]}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />

          {/* Emergency Requests */}
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/new"
            element={
              <ProtectedRoute>
                <RequestForm />
              </ProtectedRoute>
            }
          />

          {/* Shelters */}
          <Route
            path="/shelters"
            element={
              <ProtectedRoute>
                <ShelterList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shelters/new"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ShelterForm />
              </ProtectedRoute>
            }
          />

          {/* Admin Managed Modules */}
          <Route
            path="/resources"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ResourceInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <DonationList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ShelterResourceMonitoring />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer footer-center p-4 bg-base-100 text-base-content/60 border-t border-base-200 text-xs">
        <div>
          <p>Rapid Relief • Disaster Coordination System (CSE471 Group 03)</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
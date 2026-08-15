import { Routes, Route, Link, useNavigate } from "react-router-dom";
import RequestForm from "./pages/RequestForm.jsx";
import RequestList from "./pages/RequestList.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ShelterList from "./pages/ShelterList.jsx";
import ShelterForm from "./pages/ShelterForm.jsx";
import ResourceInventory from "./pages/ResourceInventory.jsx";
import DonationList from "./pages/DonationList.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Home() {
  return (
    <div className="hero min-h-[60vh]">
      <div className="hero-content text-center">
        <div>
          <h1 className="text-4xl font-bold">Disaster Relief Coordination Platform</h1>
          <p className="py-4">Report emergencies, track assistance, coordinate response.</p>
          <Link to="/requests/new" className="btn btn-primary">Report an Emergency</Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-md px-4">
        <Link to="/" className="btn btn-ghost text-xl">🚨 Relief Platform</Link>
        <div className="ml-auto flex gap-2">
          {user ? (
            <>
              <Link to="/requests" className="btn btn-ghost">My Requests</Link>
              <Link to="/requests/new" className="btn btn-ghost">New Request</Link>
              <Link to="/shelters" className="btn btn-ghost">Shelters</Link>
              {user.role === "admin" && (
                <>
                  <Link to="/shelters/new" className="btn btn-ghost">Add Shelter</Link>
                  <Link to="/resources" className="btn btn-ghost">Inventory</Link>
                  <Link to="/donations" className="btn btn-ghost">Donations</Link>
                </>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => { logout(); navigate("/login"); }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/requests" element={<ProtectedRoute><RequestList /></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute><RequestForm /></ProtectedRoute>} />
          <Route path="/shelters" element={<ProtectedRoute><ShelterList /></ProtectedRoute>} />
          <Route path="/shelters/new" element={<ProtectedRoute roles={["admin"]}><ShelterForm /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute roles={["admin"]}><ResourceInventory /></ProtectedRoute>} />
          <Route path="/donations" element={<ProtectedRoute roles={["admin"]}><DonationList /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
import { Routes, Route, Link } from "react-router-dom";
import RequestForm from "./pages/RequestForm.jsx";
import RequestList from "./pages/RequestList.jsx";

function Home() {
  return (
    <div className="hero min-h-[60vh]">
      <div className="hero-content text-center">
        <div>
          <h1 className="text-4xl font-bold">Disaster Relief Coordination Platform</h1>
          <p className="py-4">Report emergencies, track assistance, coordinate response.</p>
          <Link to="/requests/new" className="btn btn-primary">
            Report an Emergency
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-md px-4">
        <Link to="/" className="btn btn-ghost text-xl">
          🚨 Relief Platform
        </Link>
        <div className="ml-auto flex gap-2">
          <Link to="/requests" className="btn btn-ghost">
            My Requests
          </Link>
          <Link to="/requests/new" className="btn btn-ghost">
            New Request
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/requests" element={<RequestList />} />
          <Route path="/requests/new" element={<RequestForm />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

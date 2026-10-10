import { Link, Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Invoices from "./pages/Invoices";

function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <nav className="mb-8 flex flex-wrap gap-4">
        <Link to="/login" className="text-blue-600">Login</Link>
        <Link to="/signup" className="text-blue-600">Signup</Link>
        <Link to="/dashboard" className="text-blue-600">Dashboard</Link>
        <Link to="/items" className="text-blue-600">Items</Link>
        <Link to="/invoices" className="text-blue-600">Invoices</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/items" element={<Items />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </div>
  );
}

export default App;
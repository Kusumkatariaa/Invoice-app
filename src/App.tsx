import { Link, Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
// import { useState } from "react";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Invoices from "./pages/Invoices";
import InvoiceEditor from "./pages/InvoiceEditor";
import InvoicePrint from "./pages/InvoicePrint";

import { useAuth } from "./context/AuthContext";

function App() {
const { isLoggedIn } = useAuth();
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <nav className="mb-8 flex flex-wrap gap-4">
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="text-blue-600">Login</Link>
            <Link to="/signup" className="text-blue-600">Signup</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="text-blue-600">Dashboard</Link>
            <Link to="/items" className="text-blue-600">Items</Link>
            <Link to="/invoices" className="text-blue-600">Invoices</Link>
          </>
        )}
      </nav>
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isLoggedIn ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      <Route
        path="/signup"
        element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <Signup />
        }
      />

      <Route
        path="/dashboard"
        element={
          isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/items"
        element={
          isLoggedIn ? <Items /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/invoices"
        element={
          isLoggedIn ? <Invoices /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/invoice/editor"
        element={
          isLoggedIn ? <InvoiceEditor /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/invoice/editor/:id"
        element={
          isLoggedIn ? <InvoiceEditor /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/invoice/print"
        element={
          isLoggedIn ? <InvoicePrint /> : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
    </div>
  );
}

export default App;
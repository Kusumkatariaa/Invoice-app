import { useEffect, useState } from "react";
import api from "../services/api";

type MetricItem = {
invoiceCount?: number;
totalAmount?: number;
};

type Metrics = MetricItem | MetricItem[] | null;

function Dashboard() {
const [metrics, setMetrics] = useState<Metrics>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
const fetchMetrics = async () => {
try {
const response = await api.get("/Invoice/GetMetrices");
setMetrics(response.data);
} catch (err) {
console.error("Dashboard metrics error:", err);
setError("Unable to load dashboard data. Please try again.");
} finally {
setLoading(false);
}
};

fetchMetrics();

}, []);

const metric = Array.isArray(metrics) ? metrics[0] : metrics;

const invoiceCount = Number(metric?.invoiceCount ?? 0);
const totalAmount = Number(metric?.totalAmount ?? 0);
const currencySymbol =
JSON.parse(localStorage.getItem("company") || sessionStorage.getItem("company") || "{}")
.currencySymbol || "$";

return (
<div className="min-h-screen bg-slate-100 p-6 md:p-8">
<h1 className="mb-2 text-3xl font-bold text-slate-800">
Dashboard
</h1>

  <p className="mb-8 text-slate-600">
    Welcome to your invoice dashboard.
  </p>

  {loading && (
    <p className="text-slate-600">Loading dashboard data...</p>
  )}

  {error && (
    <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
      {error}
      <button
        onClick={() => window.location.reload()}
        className="ml-3 font-semibold underline"
      >
        Retry
      </button>
    </div>
  )}

  {!loading && !error && (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-500">
          Total Invoices
        </p>
        <p className="text-3xl font-bold text-slate-800">
          {invoiceCount}
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-500">
          Total Invoice Amount
        </p>
        <p className="text-3xl font-bold text-slate-800">
          {currencySymbol}
          {totalAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  )}
</div>

);
}

export default Dashboard;
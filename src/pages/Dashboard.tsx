
import { useEffect, useState } from "react";
import api from "../services/api";

type MetricItem = {
  invoiceCount?: number;
  totalAmount?: number;
};

type TrendItem = {
  monthStart: string;
  invoiceCount: number;
  amountSum: number;
};

type TopItem = {
  itemID: number | null;
  itemName: string;
  amountSum: number;
};

type Metrics = MetricItem | MetricItem[] | null;

const formatMoney = (value: number, symbol: string) =>
  `${symbol}${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const company = JSON.parse(
    localStorage.getItem("company") ||
      sessionStorage.getItem("company") ||
      "{}"
  );
  const currencySymbol = company.currencySymbol || "₹";

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        const to = today.toISOString().slice(0, 10);

        const [metricsResponse, trendResponse, itemsResponse] =
          await Promise.all([
            api.get("/Invoice/GetMetrices"),
            api.get("/Invoice/GetTrend12m"),
            api.get("/Invoice/TopItems", {
              params: { from, to, topN: 5 },
            }),
          ]);

        if (!active) return;

        const metricsData = metricsResponse.data;
        setMetrics(
          Array.isArray(metricsData) ? metricsData[0] ?? null : metricsData
        );

        setTrend(
          Array.isArray(trendResponse.data) ? trendResponse.data : []
        );
        setTopItems(
          Array.isArray(itemsResponse.data) ? itemsResponse.data : []
        );
      } catch (err) {
        console.error("Dashboard data error:", err);
        if (active) {
          setError("Unable to load dashboard data. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const metric = Array.isArray(metrics) ? metrics[0] : metrics;
  const invoiceCount = Number(metric?.invoiceCount ?? 0);
  const totalAmount = Number(metric?.totalAmount ?? 0);

  const chartItems = topItems
    .filter((item) => Number(item.amountSum) > 0)
    .sort((a, b) => Number(b.amountSum) - Number(a.amountSum));

  const chartTotal = chartItems.reduce(
    (sum, item) => sum + Number(item.amountSum),
    0
  );

  const colors = [
    "#2563eb",
    "#0d9488",
    "#d97706",
    "#9333ea",
    "#e11d48",
    "#64748b",
  ];

  let accumulated = 0;
  const pieSegments = chartItems.map((item, index) => {
    const percentage = chartTotal
      ? (Number(item.amountSum) / chartTotal) * 100
      : 0;
    const start = accumulated;
    accumulated += percentage;

    return {
      ...item,
      percentage,
      color: colors[index % colors.length],
      start,
      end: accumulated,
    };
  });

  const trendValues = trend.map((item) => Number(item.amountSum) || 0);
  const maxTrend = Math.max(...trendValues, 1);
  const points = trend.map((item, index) => {
    const x = trend.length <= 1 ? 300 : 20 + (index * 560) / (trend.length - 1);
    const y = 175 - ((Number(item.amountSum) || 0) / maxTrend) * 145;

    return { ...item, x, y };
  });

  const trendLine = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <h1 className="mb-2 text-3xl font-bold text-slate-800">Dashboard</h1>
      <p className="mb-8 text-slate-600">
        Welcome to your invoice dashboard.
      </p>

      {loading && (
        <p className="mb-5 text-slate-600">Loading dashboard data...</p>
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
        <>
          <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-medium text-slate-500">
                Total Invoices
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {invoiceCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-medium text-slate-500">
                Total Invoice Amount
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {formatMoney(totalAmount, currencySymbol)}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article className="min-w-0 rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">
                Last 12 Months
              </h2>
              <p className="mb-4 text-sm text-slate-500">
                Invoice amount by month
              </p>

              {trend.length === 0 ? (
                <p className="py-16 text-center text-slate-500">
                  No trend data available.
                </p>
              ) : (
                <>
                  <svg
                    viewBox="0 0 600 220"
                    role="img"
                    aria-label="Line chart showing monthly invoice amounts for the last 12 months"
                    className="w-full"
                  >
                    {[30, 75, 120, 175].map((y) => (
                      <line
                        key={y}
                        x1="20"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {points.length > 1 && (
                      <polyline
                        points={trendLine}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}

                    {points.map((point) => (
                      <g key={point.monthStart}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill="#2563eb"
                        >
                          <title>
                            {new Date(point.monthStart).toLocaleDateString(
                              "en-IN",
                              { month: "long", year: "numeric" }
                            )}
                            {" — "}
                            {formatMoney(Number(point.amountSum), currencySymbol)}
                            {" — "}
                            {point.invoiceCount} invoices
                          </title>
                        </circle>
                        <text
                          x={point.x}
                          y="202"
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                        >
                          {new Date(point.monthStart).toLocaleDateString(
                            "en-US",
                            { month: "short" }
                          )}
                        </text>
                      </g>
                    ))}
                  </svg>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    {trend.slice(-3).map((item) => (
                      <p key={item.monthStart}>
                        {new Date(item.monthStart).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" }
                        )}
                        : {formatMoney(Number(item.amountSum), currencySymbol)}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </article>

            <article className="min-w-0 rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">
                Top Items
              </h2>
              <p className="mb-4 text-sm text-slate-500">
                Sales amount for this month
              </p>

              {chartItems.length === 0 ? (
                <p className="py-16 text-center text-slate-500">
                  No item sales available for this period.
                </p>
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <svg
                    viewBox="0 0 200 200"
                    role="img"
                    aria-label="Pie chart showing top item sales amounts"
                    className="w-full max-w-[220px] shrink-0"
                  >
                    {chartTotal > 0 &&
                      pieSegments.map((segment) => {
                        const startAngle = (segment.start / 100) * 2 * Math.PI - Math.PI / 2;
                        const endAngle = (segment.end / 100) * 2 * Math.PI - Math.PI / 2;
                        const largeArc = segment.percentage > 50 ? 1 : 0;
                        const x1 = 100 + 85 * Math.cos(startAngle);
                        const y1 = 100 + 85 * Math.sin(startAngle);
                        const x2 = 100 + 85 * Math.cos(endAngle);
                        const y2 = 100 + 85 * Math.sin(endAngle);

                        const path =
                          segment.percentage >= 99.99
                            ? "M 100 15 A 85 85 0 1 1 99.99 15 Z"
                            : `M 100 100 L ${x1} ${y1} A 85 85 0 ${largeArc} 1 ${x2} ${y2} Z`;

                        return (
                          <path
                            key={`${segment.itemID}-${segment.itemName}`}
                            d={path}
                            fill={segment.color}
                          >
                            <title>
                              {segment.itemName}: {formatMoney(Number(segment.amountSum), currencySymbol)} ({segment.percentage.toFixed(1)}%)
                            </title>
                          </path>
                        );
                      })}
                  </svg>

                  <ul className="w-full space-y-3">
                    {pieSegments.map((item) => (
                      <li
                        key={`${item.itemID}-${item.itemName}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span
                          className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="min-w-0 flex-1 break-words text-slate-700">
                          {item.itemName}
                        </span>
                        <span className="text-right font-medium text-slate-800">
                          {formatMoney(Number(item.amountSum), currencySymbol)}
                          <span className="block text-xs font-normal text-slate-500">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;

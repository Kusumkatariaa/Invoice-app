
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

type Invoice = {
  primaryKeyID?: number;
  invoiceID?: number;
  invoiceId?: number;
  id?: number;
  invoiceNo?: string | number;
  invoiceNumber?: string | number;
  invoiceDate?: string;
  customerName?: string;
  totalItems?: number;
  subTotal?: number;
  subtotal?: number;
  taxPercentage?: number;
  taxAmount?: number;
  invoiceAmount?: number;
};

const columns = [
  { key: "invoiceNo", label: "Invoice No." },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "subtotal", label: "Sub Total" },
  { key: "tax", label: "Tax %" },
  { key: "taxAmount", label: "Tax Amount" },
  { key: "total", label: "Total" },
] as const;

function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showColumns, setShowColumns] = useState(false);
  const [visible, setVisible] = useState<string[]>(
    columns.map((column) => column.key)
  );

  async function loadInvoices() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/Invoice/GetList");
      const data = response.data;
      console.log("Invoice API response:", response.data);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : [];
      setInvoices(list);
    } catch (err) {
      console.error("Unable to load invoices:", err);
      setError("Unable to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
  }, []);

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const number = String(invoice.invoiceNo ?? invoice.invoiceNumber ?? "");
    const customer = invoice.customerName ?? "";
    const date = (invoice.invoiceDate ?? "").slice(0, 10);

    return `${number} ${customer}`.toLowerCase().includes(search.toLowerCase())
      && (!fromDate || date >= fromDate)
      && (!toDate || date <= toDate);
  }), [invoices, search, fromDate, toDate]);

  const money = (value?: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

  const dateText = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
  };

  const total = filtered.reduce(
    (sum, invoice) => sum + Number(invoice.invoiceAmount ?? 0), 0
  );

  const exportCsv = () => {
    const headers = columns
      .filter((column) => visible.includes(column.key))
      .map((column) => column.label);

    const rows = filtered.map((invoice) => {
      const values: Record<string, string | number> = {
        invoiceNo: invoice.invoiceNo ?? invoice.invoiceNumber ?? "",
        date: dateText(invoice.invoiceDate),
        customer: invoice.customerName ?? "",
        items: invoice.totalItems ?? 0,
        subtotal: Number(invoice.subTotal ?? invoice.subtotal ?? 0).toFixed(2),
        tax: Number(invoice.taxPercentage ?? 0).toFixed(2),
        taxAmount: Number(invoice.taxAmount ?? 0).toFixed(2),
        total: Number(invoice.invoiceAmount ?? 0).toFixed(2),
      };
      return columns
        .filter((column) => visible.includes(column.key))
        .map((column) => `"${String(values[column.key]).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoices.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const cell = (invoice: Invoice, key: string) => {
    switch (key) {
      case "invoiceNo":
        return invoice.invoiceNo ?? invoice.invoiceNumber ?? "—";
      case "date":
        return dateText(invoice.invoiceDate);
      case "customer":
        return invoice.customerName ?? "—";
      case "items":
        return invoice.totalItems ?? 0;
      case "subtotal":
        return money(invoice.subTotal ?? invoice.subtotal);
      case "tax":
        return `${Number(invoice.taxPercentage ?? 0).toFixed(2)}%`;
      case "taxAmount":
        return money(invoice.taxAmount);
      case "total":
        return money(invoice.invoiceAmount);
      default:
        return "—";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
            <p className="mt-1 text-slate-500">
              Manage and track your invoices
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/invoice/editor")}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + New Invoice
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Invoices</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {filtered.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Matching current filters</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Amount</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(total)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Matching current filters</p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="invoice-search" className="mb-1 block text-sm font-medium">
                Search invoices
              </label>
              <input
                id="invoice-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Invoice number or customer"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="from-date" className="mb-1 block text-sm font-medium">
                From date
              </label>
              <input
                id="from-date"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="to-date" className="mb-1 block text-sm font-medium">
                To date
              </label>
              <input
                id="to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {filtered.length} of {invoices.length} invoices
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowColumns((current) => !current)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                Columns
              </button>
              <button
                onClick={exportCsv}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
                }}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          </div>

          {showColumns && (
            <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-slate-50 p-4">
              {columns.map((column) => (
                <label key={column.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={visible.includes(column.key)}
                    onChange={(event) => setVisible((current) =>
                      event.target.checked
                        ? [...current, column.key]
                        : current.filter((key) => key !== column.key)
                    )}
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold text-slate-900">Invoice List</h2>
            <button
              onClick={() => void loadInvoices()}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-10 text-center text-slate-500">Loading invoices...</p>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => void loadInvoices()}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700">No invoices found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing the search or date filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {columns.filter((column) => visible.includes(column.key)).map((column) => (
                      <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                        {column.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((invoice, index) => {
                    const id = invoice.invoiceID ?? invoice.invoiceId ??
                      invoice.primaryKeyID ?? invoice.id;
                    return (
                      <tr key={id ?? index} className="hover:bg-slate-50">
                        {columns.filter((column) => visible.includes(column.key)).map((column) => (
                          <td key={column.key} className="whitespace-nowrap px-4 py-4">
                            {column.key === "total" ? (
                              <span className="font-semibold text-slate-900">
                                {cell(invoice, column.key)}
                              </span>
                            ) : cell(invoice, column.key)}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex gap-3">
                            <button
                              disabled={!id}
                              onClick={() => (window.location.href = `/invoice/editor?invoiceID=${id}`)}
                              className="font-medium text-blue-600 hover:underline disabled:opacity-40"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="font-medium text-slate-600 hover:underline"
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t bg-slate-50">
                  <tr>
                    <td
                      colSpan={Math.max(1, visible.length)}
                      className="px-4 py-3 text-right font-semibold"
                    >
                      Filtered total: {money(total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Invoices;

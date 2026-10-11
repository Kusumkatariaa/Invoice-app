import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import api from "../services/api";

type InvoiceLine = {
  rowNo: number;
  itemID: number;
  description: string;
  quantity: number;
  rate: number;
  discountPct: number;
};

type InvoiceData = {
  invoiceID: number;
  invoiceNo: string | number;
  invoiceDate: string;
  customerName: string;
  address?: string | null;
  city?: string | null;
  taxPercentage: number;
  notes?: string | null;
  lines: InvoiceLine[];
  subTotal?: number;
  taxAmount?: number;
  invoiceAmount?: number;
};

export default function InvoicePrint() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceID = searchParams.get("invoiceID");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceID) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/Invoice/${invoiceID}`);
        setInvoice(response.data);
      } catch (err) {
        console.error("Failed to load invoice:", err);
        setError("Unable to load invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchInvoice();
  }, [invoiceID]);

  const currencySymbol =
    sessionStorage.getItem("currencySymbol") ||
    localStorage.getItem("currencySymbol") ||
    "₹";

  const money = (value: number) =>
    `${currencySymbol}${(Number(value) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const lineTotal = (line: InvoiceLine) => {
    const amount = (Number(line.quantity) || 0) * (Number(line.rate) || 0);
    const discount = Math.min(
      100,
      Math.max(0, Number(line.discountPct) || 0)
    );

    return amount * (1 - discount / 100);
  };

  const subtotal =
    invoice?.subTotal ??
    invoice?.lines?.reduce((sum, line) => sum + lineTotal(line), 0) ??
    0;

  const taxAmount =
    invoice?.taxAmount ??
    subtotal * ((Number(invoice?.taxPercentage) || 0) / 100);

  const total = invoice?.invoiceAmount ?? subtotal + taxAmount;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600">
        Loading invoice...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="mb-4 text-red-600">
          {error || "Invoice not found."}
        </p>
        <button
          onClick={() => navigate("/invoices")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="no-print mx-auto mb-5 flex max-w-4xl justify-between gap-3">
        <button
          onClick={() => navigate("/invoices")}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700"
        >
          Back to Invoices
        </button>

        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
        >
          Print / Save as PDF
        </button>
      </div>

      <article className="invoice-paper mx-auto max-w-4xl bg-white p-6 shadow-md sm:p-10">
        <header className="flex flex-col justify-between gap-6 border-b-2 border-slate-800 pb-6 sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-slate-900">
              INVOICE
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Invoice #{invoice.invoiceNo}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Invoice Date
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {invoice.invoiceDate
                ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN")
                : "—"}
            </p>
          </div>
        </header>

        <section className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Bill To
            </h2>
            <p className="font-semibold text-slate-900">
              {invoice.customerName}
            </p>
            {invoice.address && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                {invoice.address}
              </p>
            )}
            {invoice.city && (
              <p className="text-sm text-slate-600">{invoice.city}</p>
            )}
          </div>

          <div className="sm:text-right">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Invoice Summary
            </h2>
            <p className="text-sm text-slate-600">
              Items: {invoice.lines?.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Tax Rate: {Number(invoice.taxPercentage) || 0}%
            </p>
          </div>
        </section>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <th className="border-y border-slate-200 px-3 py-3">#</th>
                <th className="border-y border-slate-200 px-3 py-3">
                  Description
                </th>
                <th className="border-y border-slate-200 px-3 py-3 text-right">
                  Qty
                </th>
                <th className="border-y border-slate-200 px-3 py-3 text-right">
                  Rate
                </th>
                <th className="border-y border-slate-200 px-3 py-3 text-right">
                  Discount
                </th>
                <th className="border-y border-slate-200 px-3 py-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {invoice.lines?.map((line, index) => (
                <tr key={`${line.rowNo}-${line.itemID}-${index}`}>
                  <td className="border-b border-slate-200 px-3 py-4">
                    {line.rowNo || index + 1}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-4">
                    {line.description || "Item"}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-4 text-right">
                    {line.quantity}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-4 text-right">
                    {money(line.rate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-4 text-right">
                    {Number(line.discountPct) || 0}%
                  </td>
                  <td className="border-b border-slate-200 px-3 py-4 text-right font-medium">
                    {money(lineTotal(line))}
                  </td>
                </tr>
              ))}

              {(!invoice.lines || invoice.lines.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    No invoice items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className="ml-auto mt-8 w-full max-w-sm">
          <div className="flex justify-between border-b border-slate-200 py-3 text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">{money(subtotal)}</span>
          </div>

          <div className="flex justify-between border-b border-slate-200 py-3 text-sm">
            <span className="text-slate-600">
              Tax ({Number(invoice.taxPercentage) || 0}%)
            </span>
            <span className="font-medium">{money(taxAmount)}</span>
          </div>

          <div className="flex justify-between bg-slate-900 px-4 py-4 text-base font-bold text-white">
            <span>Grand Total</span>
            <span>{money(total)}</span>
          </div>
        </section>

        {invoice.notes && (
          <section className="mt-8 border-t border-slate-200 pt-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Notes
            </h2>
            <p className="whitespace-pre-line text-sm text-slate-700">
              {invoice.notes}
            </p>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
          Thank you for your business
        </footer>
      </article>

    </div>
  );
}
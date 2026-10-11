import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../services/api";

type Item = {
  itemID?: number;
  itemId?: number;
  id?: number;
  itemName?: string;
  name?: string;
  description?: string;
  salesRate?: number;
  rate?: number;
  discountPct?: number;
};

type InvoiceLine = {
  itemID: number;
  description: string;
  quantity: number;
  rate: number;
  discountPct: number;
};

function InvoiceEditor() {
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const invoiceID = searchParams.get("invoiceID");
  const [updatedOn, setUpdatedOn] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      itemID: 0,
      description: "",
      quantity: 1,
      rate: 0,
      discountPct: 0,
    },
  ]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        const response = await api.get("/Item/GetList");
        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : [];

        setItems(list);
      } catch (err) {
        console.error("Unable to load items:", err);
        setError("Unable to load items. Please check the Items API.");
      } finally {
        setLoadingItems(false);
      }
    }

    void loadItems();
  }, []);
useEffect(() => {
  if (!invoiceID) return;

  async function loadInvoice() {
    setLoadingInvoice(true);
    setError("");

    try {
      const response = await api.get(`/Invoice/${invoiceID}`);
      const data = response.data?.data ?? response.data;

      setInvoiceNo(String(data.invoiceNo ?? ""));
      setInvoiceDate(
        data.invoiceDate
          ? String(data.invoiceDate).slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setCustomerName(data.customerName ?? "");
      setAddress(data.address ?? "");
      setCity(data.city ?? "");
      setTaxPercentage(Number(data.taxPercentage ?? 0));
      setNotes(data.notes ?? "");
      setUpdatedOn(data.updatedOn ?? null);

      setLines(
        Array.isArray(data.lines) && data.lines.length
          ? data.lines.map((line: any) => ({
              itemID: Number(line.itemID ?? 0),
              description: line.description ?? "",
              quantity: Number(line.quantity ?? 1),
              rate: Number(line.rate ?? 0),
              discountPct: Number(line.discountPct ?? 0),
            }))
          : [{
              itemID: 0,
              description: "",
              quantity: 1,
              rate: 0,
              discountPct: 0,
            }]
      );
    } catch (err) {
      console.error("Unable to load invoice:", err);
      setError("Unable to load invoice. Please try again.");
    } finally {
      setLoadingInvoice(false);
    }
  }

  void loadInvoice();
}, [invoiceID]);
  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const amount =
          line.quantity * line.rate * (1 - line.discountPct / 100);
        return sum + Math.max(0, amount);
      }, 0),
    [lines]
  );

  const taxAmount = subtotal * (Math.max(0, taxPercentage) / 100);
  const invoiceAmount = subtotal + taxAmount;

  function updateLine(
    index: number,
    field: keyof InvoiceLine,
    value: string | number
  ) {
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  }

  function selectItem(index: number, value: string) {
    const itemID = Number(value);
    const item = items.find(
      (entry) => Number(entry.itemID ?? entry.itemId ?? entry.id) === itemID
    );

    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? {
              ...line,
              itemID,
              description: item?.description ?? item?.itemName ?? item?.name ?? "",
              rate: Number(item?.salesRate ?? item?.rate ?? 0),
              discountPct: Number(item?.discountPct ?? 0),
            }
          : line
      )
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        itemID: 0,
        description: "",
        quantity: 1,
        rate: 0,
        discountPct: 0,
      },
    ]);
  }

  function removeLine(index: number) {
    setLines((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  }

  async function saveInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!customerName.trim()) {
      setError("Please enter the customer name.");
      return;
    }

    if (
      lines.some(
        (line) =>
          !line.itemID ||
          line.quantity <= 0 ||
          line.rate < 0 ||
          line.discountPct < 0 ||
          line.discountPct > 100
      )
    ) {
      setError("Please select an item and check quantity, rate and discount.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        invoiceNo: invoiceNo.trim() || 0,
        invoiceDate,
        customerName: customerName.trim(),
        address: address.trim(),
        city: city.trim() || null,
        taxPercentage: Math.max(0, taxPercentage),
        notes: notes.trim(),
        lines: lines.map((line, index) => ({
          rowNo: index + 1,
          itemID: line.itemID,
          description: line.description,
          quantity: line.quantity,
          rate: line.rate,
          discountPct: line.discountPct,
        })),
      };

      if (invoiceID) {
        await api.put("/Invoice", {
            ...payload,
            invoiceID: Number(invoiceID),
            updatedOn,
        });
        } else {
        await api.post("/Invoice/", payload);
        }

        navigate("/invoices");
    } catch (err) {
      console.error("Unable to save invoice:", err);
      setError("Unable to save invoice. Please check the entered details and try again.");
    } finally {
      setSaving(false);
    }
  }

  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {invoiceID ? "Edit Invoice" : "New Invoice"}
          </h1>
          <p className="mt-1 text-slate-500">
            Enter customer details and add invoice items.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/invoices")}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={saveInvoice} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Invoice Details</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Invoice Number">
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Leave blank if assigned automatically"
                className={inputClass}
              />
            </Field>

            <Field label="Invoice Date">
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Customer Name">
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
                placeholder="Enter customer name"
              />
            </Field>

            <Field label="Address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="Enter address"
              />
            </Field>

            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                placeholder="Enter city"
              />
            </Field>

            <Field label="Tax Percentage (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
            <h2 className="text-lg font-semibold">Invoice Items</h2>
            <button
              type="button"
              onClick={addLine}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Add Item
            </button>
          </div>

          {loadingItems ? (
            <p className="p-6 text-slate-500">Loading items...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Discount %</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="min-w-48 p-3">
                        <select
                          required
                          value={line.itemID || ""}
                          onChange={(e) => selectItem(index, e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select item</option>
                          {items.map((item, itemIndex) => {
                            const id = Number(
                              item.itemID ?? item.itemId ?? item.id
                            );
                            return (
                              <option key={id || itemIndex} value={id}>
                                {item.itemName ?? item.name ?? `Item ${id}`}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="min-w-48 p-3">
                        <input
                          value={line.description}
                          onChange={(e) =>
                            updateLine(index, "description", e.target.value)
                          }
                          className={inputClass}
                          placeholder="Description"
                        />
                      </td>
                      <td className="min-w-24 p-3">
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(index, "quantity", Number(e.target.value))
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="min-w-28 p-3">
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.rate}
                          onChange={(e) =>
                            updateLine(index, "rate", Number(e.target.value))
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="min-w-28 p-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={line.discountPct}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "discountPct",
                              Number(e.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="whitespace-nowrap p-3 text-right font-medium">
                        {money(
                          line.quantity *
                            line.rate *
                            (1 - line.discountPct / 100)
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                          className="text-red-600 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loadingItems && items.length === 0 && (
                <p className="p-4 text-sm text-amber-700">
                  No items were returned by the Items API. Check the endpoint before saving.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Field label="Notes">
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                placeholder="Additional notes"
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
            <Summary label="Subtotal" value={money(subtotal)} />
            <Summary
              label={`Tax (${taxPercentage || 0}%)`}
              value={money(taxAmount)}
            />
            <div className="border-t border-slate-200 pt-4">
              <Summary label="Invoice Total" value={money(invoiceAmount)} strong />
            </div>
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || loadingItems || loadingInvoice || items.length === 0}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : invoiceID ? "Update Invoice" :"Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Summary({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span className={strong ? "text-xl font-bold text-slate-900" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

export default InvoiceEditor;
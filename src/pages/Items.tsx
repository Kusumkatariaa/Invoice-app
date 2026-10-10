import { useEffect, useState } from "react";
import api from "../services/api";

type Item = {
itemID?: number;
itemId?: number;
id?: number;
itemName?: string;
name?: string;
description?: string;
salesRate?: number;
discountPct?: number;
pictureThumbnail?: string;
};

const emptyForm = {
itemName: "",
description: "",
salesRate: "",
discountPct: "0",
};

function Items() {
const [items, setItems] = useState<Item[]>([]);
const [form, setForm] = useState(emptyForm);
const [editingId, setEditingId] = useState<number | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [uploadingId, setUploadingId] = useState<number | null>(null);

const loadItems = async () => {
setLoading(true);
setError("");

try {
  const response = await api.get("/Item/GetList");
  const data = response.data;
  const list = Array.isArray(data)
    ? data
    : data?.items ?? data?.data ?? [];

  setItems(Array.isArray(list) ? list : []);
} catch (err) {
  console.error("Load items failed:", err);
  setError("Unable to load items. Please check the API response.");
} finally {
  setLoading(false);
}

};

useEffect(() => {
void loadItems();
}, []);

const updateField = (
field: keyof typeof emptyForm,
value: string
) => {
setForm((previous) => ({ ...previous, [field]: value }));
};

const resetForm = () => {
setForm(emptyForm);
setEditingId(null);
setMessage("");
};

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();
setError("");
setMessage("");

const salesRate = Number(form.salesRate);
const discountPct = Number(form.discountPct);

if (!form.itemName.trim()) {
  setError("Item name is required");
  return;
}

if (!Number.isFinite(salesRate) || salesRate < 0) {
  setError("Sales rate must be zero or greater");
  return;
}

if (
  !Number.isFinite(discountPct) ||
  discountPct < 0 ||
  discountPct > 100
) {
  setError("Discount must be between 0 and 100.");
  return;
}

const payload = {
  itemName: form.itemName.trim(),
  description: form.description.trim(),
  salesRate,
  discountPct,
};

setSaving(true);

try {
  if (editingId !== null) {
    await api.put("/Item", { ...payload, itemID: editingId });
    setMessage("Item updated successfully.");
  } else {
    await api.post("/Item", payload);
    setMessage("Item added successfully.");
  }

  resetForm();
  await loadItems();
} catch (err) {
  console.error("Save item failed:", err);
  setError(
    "Unable to save item. Please check the required fields and try again"
  );
} finally {
  setSaving(false);
}

};

const handleEdit = async (item: Item) => {
const id = item.itemID ?? item.itemId ?? item.id;

if (id === undefined) {
  setError("Item ID was not found");
  return;
}

setError("");
setMessage("");

try {
  const response = await api.get(`/Item/${id}`);
  const detail = response.data;

  setForm({
    itemName: detail.itemName ?? detail.name ?? item.itemName ?? item.name ?? "",
    description: detail.description ?? item.description ?? "",
    salesRate: String(detail.salesRate ?? item.salesRate ?? ""),
    discountPct: String(detail.discountPct ?? item.discountPct ?? 0),
  });
  setEditingId(id);
  window.scrollTo({ top: 0, behavior: "smooth" });
} catch (err) {
  console.error("Load item detail failed:", err);
  setError("Unable to load item details");
}

};

const handleDelete = async (item: Item) => {
const id = item.itemID ?? item.itemId ?? item.id;

if (id === undefined) {
  setError("Item ID was not found in the API response");
  return;
}

if (!window.confirm("Are you sure you want to delete this item?")) {
  return;
}

setError("");
setMessage("");

try {
  await api.delete(`/Item/${id}`);
  setMessage("Item deleted successfully");
  await loadItems();
} catch (err) {
  console.error("Delete item failed:", err);
  setError("Unable to delete item. Please try again.");
}

};
const handleImageUpload = async (
  item: Item,
  file: File | undefined
) => {
  if (!file) return;

  const id = item.itemID ?? item.itemId ?? item.id;

  if (id === undefined) {
    setError("Item ID was not found.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    setError("Please select an image file.");
    return;
  }

  setError("");
  setMessage("");
  setUploadingId(id);

  try {
    const data = new FormData();
    data.append("ItemID", String(id));
    data.append("File", file);

    await api.post("/Item/UpdateItemPicture", data);

    setMessage("Item image uploaded successfully.");
  } catch (err) {
    console.error("Image upload failed:", err);
    setError("Unable to upload item image. Please try again.");
  } finally {
    setUploadingId(null);
  }
};

const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

useEffect(() => {
  let cancelled = false;

  const loadImages = async () => {
    const entries = await Promise.all(
      items.map(async (item) => {
        const id = item.itemID ?? item.itemId ?? item.id;
        if (id === undefined) return null;

        try {
          const response = await api.get(
            `/Item/PictureThumbnail/${id}`
          );

          const imageUrl =
            typeof response.data === "string"
              ? response.data
              : response.data?.url;

          if (!imageUrl) return null;

          return [id, imageUrl] as const;
        } catch (error) {
          console.error(`Thumbnail load failed for item ${id}:`, error);
          return null;
        }
      })
    );

    if (!cancelled) {
      setImageUrls(
        Object.fromEntries(
          entries.filter(Boolean) as [number, string][]
        )
      );
    }
  };

  void loadImages();

  return () => {
    cancelled = true;
  };
}, [items]);

return (
<div className="min-h-screen bg-slate-100 p-6 md:p-8">
<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
<div>
<h1 className="text-3xl font-bold text-slate-800">Items</h1>
<p className="mt-2 text-slate-600">
Manage your products and services
</p>
</div>
<button
type="button"
onClick={() => {
resetForm();
window.scrollTo({ top: 0, behavior: "smooth" });
}}
className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover"
>
+ Add New Item
</button>
</div>

  {error && (
    <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
      {error}
    </div>
  )}

  {message && (
    <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
      {message}
    </div>
  )}

  <form
    onSubmit={handleSubmit}
    className="mb-8 rounded-xl bg-white p-6 shadow-sm"
  >
    <h2 className="mb-5 text-xl font-semibold text-slate-800">
      {editingId !== null ? "Edit Item" : "Add New Item"}
    </h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">
        Item Name *
        <input
          value={form.itemName}
          onChange={(e) => updateField("itemName", e.target.value)}
          maxLength={50}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          placeholder="e.g. Website Design"
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Sales Rate *
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.salesRate}
          onChange={(e) => updateField("salesRate", e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          placeholder="0.00"
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Discount (%)
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.discountPct}
          onChange={(e) => updateField("discountPct", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Description
        <input
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          placeholder="Optional description"
        />
      </label>
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : editingId !== null ? "Update Item" : "Save Item"}
      </button>

      {editingId !== null && (
        <button
          type="button"
          onClick={resetForm}
          className="rounded-lg border border-slate-300 px-5 py-2.5"
        >
          Cancel
        </button>
      )}
    </div>
  </form>

  <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
    <div className="border-b border-slate-200 p-5">
      <h2 className="text-xl font-semibold text-slate-800">Item List</h2>
    </div>

    {loading ? (
      <p className="p-6 text-slate-600">Loading items...</p>
    ) : items.length === 0 ? (
      <p className="p-6 text-slate-600">
        No items yet. Add your first item using the form above.
      </p>
    ) : (
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="p-4">Image</th>
            <th className="p-4">Item Name</th>
            <th className="p-4">Description</th>
            <th className="p-4">Rate</th>
            <th className="p-4">Discount</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const id = item.itemID ?? item.itemId ?? item.id ?? index;

            return (
              <tr key={id} className="border-t border-slate-100">
            
              <td className="p-4">
                {imageUrls[item.itemID ?? item.itemId ?? item.id ?? -1] ? (
                  <img
                    src={imageUrls[item.itemID ?? item.itemId ?? item.id ?? -1]}
                    alt={item.itemName ?? item.name ?? "Item"}
                    className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="text-slate-400">No image</span>
                )}
              </td>

                <td className="p-4 font-medium text-slate-800">
                  {item.itemName ?? item.name ?? "—"}
                </td>
                <td className="p-4 text-slate-600">
                  {item.description || "—"}
                </td>
                <td className="p-4">
                  {Number(item.salesRate ?? 0).toFixed(2)}
                </td>
                <td className="p-4">
                  {Number(item.discountPct ?? 0)}%
                </td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => void handleEdit(item)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                    <label className="cursor-pointer font-medium text-indigo-600 hover:underline">
                    {uploadingId === (item.itemID ?? item.itemId ?? item.id)
                      ? "Uploading..."
                      : "Upload Image"}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void handleImageUpload(item, file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
</div>

);
}

export default Items;
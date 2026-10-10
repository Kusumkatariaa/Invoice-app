import { useState } from "react";
import api from "../services/api";

function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    address: "",
    city: "",
    zipCode: "",
    industry: "",
    currencySymbol: "$",
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        const apiFieldNames: Record<string, string> = {
          firstName: "FirstName",
          lastName: "LastName",
          email: "Email",
          password: "Password",
          companyName: "CompanyName",
          address: "Address",
          city: "City",
          zipCode: "ZipCode",
          industry: "Industry",
          currencySymbol: "CurrencySymbol",
        };

        data.append(apiFieldNames[key], value);
      });

      if (logo) data.append("logo", logo);

      await api.post("/Auth/Signup", data);

      setMessage("Signup successful! You can now log in");
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const apiError = error as {
          response?: { data?: { message?: string } | string; status?: number };
        };

        const responseData = apiError.response?.data;
        const detail =
          typeof responseData === "string"
            ? responseData
            : responseData?.message;

        setMessage(
          detail ||
            `Signup failed (${apiError.response?.status ?? "network error"}). Please try again.`
        );
      } else {
        setMessage("Unable to connect to the server. Please try again");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2";

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Create Your Account</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter your company details
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            First Name *
            <input
              className={inputClass}
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            Last Name *
            <input
              className={inputClass}
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            Email *
            <input
              className={inputClass}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            Password *
            <input
              className={inputClass}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            Company Name *
            <input
              className={inputClass}
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm">
            Industry
            <input
              className={inputClass}
              name="industry"
              value={form.industry}
              onChange={handleChange}
            />
          </label>

          <label className="block text-sm">
            Address
            <input
              className={inputClass}
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </label>

          <label className="block text-sm">
            City
            <input
              className={inputClass}
              name="city"
              value={form.city}
              onChange={handleChange}
            />
          </label>

          <label className="block text-sm">
            ZIP Code
            <input
              className={inputClass}
              name="zipCode"
              value={form.zipCode}
              onChange={handleChange}
            />
          </label>

          <label className="block text-sm">
            Currency
            <select
              className={inputClass}
              name="currencySymbol"
              value={form.currencySymbol}
              onChange={handleChange}
            >
              <option value="$">USD ($)</option>
              <option value="₹">INR (₹)</option>
              <option value="£">GBP (£)</option>
              <option value="€">EUR (€)</option>
            </select>
          </label>
        </div>

        <label className="block text-sm">
          Company Logo
          <input
            className="mt-1 block w-full text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          />
        </label>

        {message && (
          <p className="rounded-md bg-gray-100 p-3 text-sm" role="status">
            {message}
          </p>
        )}

        <button
          className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}

export default Signup;
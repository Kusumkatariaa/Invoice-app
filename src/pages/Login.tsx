
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/Auth/Login", {
        email: email.trim(),
        password,
        rememberMe,
      });

      const { token, user, company } = response.data;

      if (!token) {
        setError("Login response did not contain a token.");
        return;
      }

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("token", token);

    if (user) {
    storage.setItem("user", JSON.stringify(user));
    }

    if (company) {
    storage.setItem("company", JSON.stringify(company));
    }
login();
      navigate("/dashboard");
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const response = (err as {
          response?: { data?: unknown; status?: number };
        }).response;

        const data = response?.data;

        setError(
        typeof data === "string"
            ? data
            : typeof data === "object" && data !== null && "message" in data
            ? String(data.message)
            : `Login failed (${response?.status ?? "network error"}). Please try again.`
        );
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Login</h1>

      <form onSubmit={handleLogin} className="max-w-sm space-y-3">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // Store token (for demo, use localStorage)
        localStorage.setItem("token", data.token);
        router.push("/");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-8 w-full max-w-sm flex flex-col gap-6 border border-gray-200 dark:border-neutral-800"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Sign in</h2>
        {/* Register link */}
        <p className="text-center text-sm mb-2 text-gray-600 dark:text-gray-300">
          Don&apos;t have an account?{' '}
          <a href="/login/register" className="text-blue-600 hover:underline">Register</a>
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// src/dean/DeanDashboard.tsx
import React, { useEffect, useState } from "react";
import { Users, Building2Icon, BookOpen, CalendarDays } from "lucide-react";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

interface Metrics {
  departments: number;
  students: number;
  lecturers: number;
  upcomingDefenses: number;
}

const defaultMetrics: Metrics = {
  departments: 0,
  students: 0,
  lecturers: 0,
  upcomingDefenses: 0,
};

function parseCountResponse(body: any): number {
  // Accept a few common shapes returned by APIs: {count: n}, {total: n}, plain number
  if (typeof body === "number") return body;
  if (!body) return 0;
  if (typeof body.count === "number") return body.count;
  if (typeof body.total === "number") return body.total;
  // fallback: try first numeric field
  for (const k of Object.keys(body)) {
    const val = (body as any)[k];
    if (typeof val === "number") return val;
  }
  return 0;
}

import { useAuthStore } from "@/store/authStore";

export default function DeanDashboard() {
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuthStore();
  const faculty = (user as any)?.faculty ?? ""; // will append as query if available

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const qs = faculty ? `?faculty=${encodeURIComponent(faculty)}` : "";

    const endpoints = {
      departments: `${baseUrl}/dashboard/count/departments-faculty`,
      students: `${baseUrl}/dashboard/count/students-faculty`,
      lecturers: `${baseUrl}/dashboard/count/lecturers-faculty`,
      upcomingDefenses: `${baseUrl}/dashboard/upcoming-defences`,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    async function fetchAll() {
      try {
        const requests = Object.entries(endpoints).map(async ([key, url]) => {
          const res = await fetch(url, { headers, signal: ac.signal });
          if (!res.ok) {
            // try to read text for helpful message
            const text = await res.text().catch(() => "");
            throw new Error(`${key} fetch failed: ${res.status} ${res.statusText} ${text}`);
          }
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const body = await res.json();
            return [key, parseCountResponse(body)] as const;
          }
          // if not json, try to parse number from text
          const text = await res.text();
          const n = Number(text.trim());
          return [key, Number.isNaN(n) ? 0 : n] as const;
        });
        console.log("Fetching dashboard metrics...", endpoints);

        const results = await Promise.all(requests);
        const newMetrics = { ...defaultMetrics } as any;
        for (const [k, v] of results) newMetrics[k] = v;
        setMetrics(newMetrics);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();

    return () => ac.abort();
  }, [baseUrl, faculty, token]);

  if (loading) {
    return <p className="text-center py-10 text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{faculty || "—"} Overview</h1>
        <p className="text-gray-600 mt-1">Here’s a quick snapshot of your faculty’s key metrics.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded">
          <p className="text-sm">{error}</p>
          <div className="mt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-100 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Departments */}
        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border border-gray-100 hover:shadow-md transition">
          <div className="bg-amber-50 p-3 rounded-full">
            <Building2Icon className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Departments</p>
            <p className="text-2xl font-semibold text-gray-800">{metrics.departments}</p>
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border border-gray-100 hover:shadow-md transition">
          <div className="bg-amber-50 p-3 rounded-full">
            <Users className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-semibold text-gray-800">{metrics.students}</p>
          </div>
        </div>

        {/* Lecturers */}
        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border border-gray-100 hover:shadow-md transition">
          <div className="bg-amber-50 p-3 rounded-full">
            <BookOpen className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lecturers</p>
            <p className="text-2xl font-semibold text-gray-800">{metrics.lecturers}</p>
          </div>
        </div>

        {/* Upcoming Defenses */}
        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border border-gray-100 hover:shadow-md transition">
          <div className="bg-amber-50 p-3 rounded-full">
            <CalendarDays className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Defenses</p>
            <p className="text-2xl font-semibold text-gray-800">{metrics.upcomingDefenses}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

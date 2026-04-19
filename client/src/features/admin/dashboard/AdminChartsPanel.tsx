"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";

export function AdminChartsPanel() {
  const appointmentTrend = useMemo(
    () =>
      [3, 5, 8, 12, 10, 14, 18, 16, 20, 22, 19, 24, 28, 26, 30, 27, 32, 35, 31, 29, 33, 36, 34, 38, 40, 37, 42, 45, 43, 48].map(
        (v, i) => ({ day: String(i + 1), appointments: v })
      ),
    []
  );

  const revenueBars = useMemo(
    () =>
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({
        month: m,
        value: [4.2, 5.1, 4.8, 6.2, 5.9, 6.8][i],
      })),
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2" padding="md">
        <CardHeader
          title="Appointment trends"
          description="Last 30 days — illustrative trend"
          action={
            <span className="text-sm font-semibold text-blue-600">
              890 <span className="font-normal text-muted">+15.2%</span>
            </span>
          }
        />
        <div className="h-64 w-full min-h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={appointmentTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillAppt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#fillAppt)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader
          title="Commission revenue"
          description="This month"
          action={
            <span className="text-right text-sm">
              <span className="block font-semibold text-foreground">$12,450</span>
              <span className="text-teal-600">+8.1%</span>
            </span>
          }
        />
        <div className="h-64 w-full min-h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={revenueBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

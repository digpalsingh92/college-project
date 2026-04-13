"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";

interface StatusCounts {
  booked: number;
  completed: number;
  cancelled: number;
}

interface WeeklyEntry {
  day: string;
  booked: number;
  completed: number;
  cancelled: number;
}

interface TrendEntry {
  date: string;
  count: number;
}

interface Props {
  statusCounts: StatusCounts;
  weeklyData: WeeklyEntry[];
  trendData: TrendEntry[];
  total: number;
}

const STATUS_COLORS = {
  booked: "#f59e0b",
  completed: "#10b981",
  cancelled: "#94a3b8",
};

const STATUS_LABELS = {
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.07)",
  fontSize: "12px",
};

export function DoctorChartsPanelInner({ statusCounts, weeklyData, trendData, total }: Props) {
  const pieData = useMemo(
    () => [
      { name: "Booked", value: statusCounts.booked, color: STATUS_COLORS.booked },
      { name: "Completed", value: statusCounts.completed, color: STATUS_COLORS.completed },
      { name: "Cancelled", value: statusCounts.cancelled, color: STATUS_COLORS.cancelled },
    ],
    [statusCounts]
  );

  const hasData = total > 0;

  return (
    <div className="space-y-6">
      {/* Row 1: Donut + Weekly bar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donut / Pie — appointment status breakdown */}
        <Card padding="md">
          <CardHeader
            title="Appointment breakdown"
            description="All-time by status"
            action={
              <span className="text-sm font-semibold text-foreground">
                {total} <span className="font-normal text-muted">total</span>
              </span>
            }
          />
          {hasData ? (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-3 flex flex-col gap-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: entry.color }}
                      />
                      <span className="text-slate-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChartState message="No appointment data yet" />
          )}
        </Card>

        {/* Weekly grouped bar */}
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title="This week's appointments"
            description="Booked · Completed · Cancelled per day"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                <Bar dataKey="booked" name="Booked" fill={STATUS_COLORS.booked} radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill={STATUS_COLORS.completed} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill={STATUS_COLORS.cancelled} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2: 14-day trend area */}
      <Card padding="md">
        <CardHeader
          title="Appointments over time"
          description="Last 14 days — total per day"
          action={
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {trendData.length} days
            </span>
          }
        />
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData.length > 0 ? trendData : [{ date: "—", count: 0 }]}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillDoc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="count"
                name="Appointments"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#fillDoc)"
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-52 items-center justify-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

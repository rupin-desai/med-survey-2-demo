"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart2, PieChartIcon, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell as RechartsCell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#0d9488",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

export interface QuestionDef {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: { value: string; label: string }[];
}

export interface AnalyticsData {
  question: QuestionDef;
  totalAnswered: number;
  optionStats: {
    value: string;
    label: string;
    count: number;
    percent: number;
  }[];
  topOption: { value: string; label: string; count: number; percent: number };
}

type ViewMode = "bars" | "chart" | "pie";

export default function QuestionAnalyticsCard({
  index,
  data,
  totalSubmissions,
}: {
  index: number;
  data: AnalyticsData;
  totalSubmissions: number;
}) {
  const [view, setView] = useState<ViewMode>("bars");
  const { question, totalAnswered, optionStats, topOption } = data;
  const isMultiple = question.type === "multiple";

  const chartData = optionStats.map((o) => ({
    name: o.value,
    fullLabel: `${o.value}. ${o.label}`,
    count: o.count,
    percent: o.percent,
  }));

  const pieData = optionStats
    .filter((o) => o.count > 0)
    .map((o) => ({
      name: `${o.value}. ${o.label}`,
      value: o.count,
    }));

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-snug">
                {question.text}
              </CardTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium",
                    isMultiple
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : "border-primary/25 bg-primary/5 text-primary",
                  )}
                >
                  {isMultiple ? "Multiple Choice" : "Single Choice"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {totalAnswered} of {totalSubmissions} answered
                </span>
              </div>
            </div>
          </div>

          {/* View toggle pills */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5 flex-shrink-0">
            <button
              onClick={() => setView("bars")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                view === "bars"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <AlignLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Bars</span>
            </button>
            <button
              onClick={() => setView("chart")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                view === "chart"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BarChart2 className="h-3 w-3" />
              <span className="hidden sm:inline">Chart</span>
            </button>
            <button
              onClick={() => setView("pie")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                view === "pie"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <PieChartIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Pie</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-5 space-y-4">
        {/* ── View: Horizontal Bars ──────────────────────────── */}
        {view === "bars" && (
          <div className="space-y-2.5">
            {optionStats.map((o, oi) => {
              const isTop = o.value === topOption.value && o.count > 0;
              return (
                <div key={o.value} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs leading-tight max-w-[75%]",
                        isTop
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold mr-1.5"
                        style={{
                          backgroundColor: `${CHART_COLORS[oi % CHART_COLORS.length]}15`,
                          color: CHART_COLORS[oi % CHART_COLORS.length],
                        }}
                      >
                        {o.value}
                      </span>
                      {o.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs tabular-nums flex-shrink-0 ml-2",
                        isTop
                          ? "font-bold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {o.count}{" "}
                      <span className="text-[10px] text-muted-foreground">
                        ({o.percent}%)
                      </span>
                    </span>
                  </div>
                  <div className="relative h-6 w-full overflow-hidden rounded-md bg-muted/50">
                    <div
                      className="h-full rounded-md transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(o.percent, 0)}%`,
                        backgroundColor:
                          CHART_COLORS[oi % CHART_COLORS.length] +
                          (isTop ? "" : "99"),
                        minWidth: o.count > 0 ? "4px" : "0px",
                      }}
                    />
                    {o.percent > 12 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-white">
                        {o.percent}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── View: Bar Chart ────────────────────────────────── */}
        {view === "chart" && totalAnswered > 0 && (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(13,148,136,0.06)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(
                    value: number,
                    _name: string,
                    props: { payload?: { fullLabel?: string } },
                  ) => [
                    `${value} response${value !== 1 ? "s" : ""}`,
                    props.payload?.fullLabel ?? _name,
                  ]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((_, i) => (
                    <RechartsCell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── View: Pie / Donut Chart ────────────────────────── */}
        {view === "pie" && totalAnswered > 0 && (
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  label={({
                    name,
                    percent,
                  }: {
                    name: string;
                    percent: number;
                  }) =>
                    `${name.split(".")[0]} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                >
                  {pieData.map((_, i) => (
                    <RechartsCell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number) => [
                    `${value} response${value !== 1 ? "s" : ""}`,
                    "Count",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {view !== "bars" && totalAnswered === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            No responses yet for this question.
          </p>
        )}

        {/* Top answer pill */}
        {topOption.count > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground">
              <span className="font-semibold">Most popular:</span>{" "}
              <span className="text-primary font-medium">
                {topOption.value}. {topOption.label}
              </span>{" "}
              <span className="text-muted-foreground">
                — {topOption.count} response
                {topOption.count !== 1 ? "s" : ""} ({topOption.percent}%)
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

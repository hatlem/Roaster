"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";

// Design system colors
const COLORS = {
  ocean: "#3a6b7c",
  terracotta: "#c65d3b",
  forest: "#2d5a4a",
  gold: "#b8860b",
  ink: "#1a1a1a",
  stone: "#e8e4dd",
  cream: "#faf9f6",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#ffffff",
    border: `1px solid ${COLORS.stone}`,
    borderRadius: "12px",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  itemStyle: { color: COLORS.ink },
  cursor: { fill: "rgba(0,0,0,0.04)" },
};

// ─── 1. HoursBarChart ────────────────────────────────────────────

interface HoursBarChartProps {
  data: Array<{ name: string; hours: number; overtime: number }>;
  hoursLabel: string;
  overtimeLabel: string;
}

export function HoursBarChart({ data, hoursLabel, overtimeLabel }: HoursBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(250, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 13, fill: COLORS.ink }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="hours" name={hoursLabel} stackId="a" fill={COLORS.ocean} radius={[0, 0, 0, 0]} barSize={24} />
        <Bar dataKey="overtime" name={overtimeLabel} stackId="a" fill={COLORS.terracotta} radius={[0, 4, 4, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── 2. OvertimeProgressChart ────────────────────────────────────

interface OvertimeProgressChartProps {
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  weeklyLimit: number;
  monthlyLimit: number;
  yearlyLimit: number;
  weeklyLabel?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
}

function getGaugeColor(pct: number): string {
  if (pct >= 95) return COLORS.terracotta;
  if (pct >= 80) return COLORS.gold;
  return COLORS.forest;
}

function OvertimeGauge({ value, limit, label }: { value: number; limit: number; label: string }) {
  const pct = Math.min((value / limit) * 100, 100);
  const color = getGaugeColor(pct);
  const chartData = [
    { name: label, value: pct, fill: color },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="w-[120px] h-[120px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={210}
            endAngle={-30}
            data={chartData}
            barSize={10}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: COLORS.stone }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-display" style={{ color }}>{value}h</span>
          <span className="text-[10px] text-ink/40">/ {limit}h</span>
        </div>
      </div>
      <p className="text-xs text-ink/60 mt-1 text-center">{label}</p>
    </div>
  );
}

export function OvertimeProgressChart({
  weeklyHours,
  monthlyHours,
  yearlyHours,
  weeklyLimit,
  monthlyLimit,
  yearlyLimit,
  weeklyLabel = "Weekly",
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
}: OvertimeProgressChartProps) {
  return (
    <div className="flex items-center justify-around gap-4 py-2">
      <OvertimeGauge value={weeklyHours} limit={weeklyLimit} label={weeklyLabel} />
      <OvertimeGauge value={monthlyHours} limit={monthlyLimit} label={monthlyLabel} />
      <OvertimeGauge value={yearlyHours} limit={yearlyLimit} label={yearlyLabel} />
    </div>
  );
}

// ─── 3. CostBreakdownChart ──────────────────────────────────────

interface CostBreakdownChartProps {
  data: Array<{ name: string; value: number }>;
  currency?: string;
}

const PIE_COLORS = [COLORS.ocean, COLORS.terracotta, COLORS.forest, COLORS.gold];

export function CostBreakdownChart({ data, currency = "" }: CostBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="w-[180px] h-[180px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) =>
                `${currency}${Number(value).toLocaleString()}`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 min-w-0">
        {data.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
              />
              <span className="truncate text-ink/70">{item.name}</span>
              <span className="ml-auto font-medium whitespace-nowrap">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 4. AttendanceTrendChart ────────────────────────────────────

interface AttendanceTrendChartProps {
  data: Array<{ period: string; rate: number }>;
  label: string;
}

export function AttendanceTrendChart({ data, label }: AttendanceTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="forestGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.forest} stopOpacity={0.3} />
            <stop offset="100%" stopColor={COLORS.forest} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: COLORS.ink }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          {...tooltipStyle}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value}%`, label]}
        />
        <Area
          type="monotone"
          dataKey="rate"
          name={label}
          stroke={COLORS.forest}
          strokeWidth={2}
          fill="url(#forestGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── 5. AuditActivityChart ──────────────────────────────────────

interface AuditActivityChartProps {
  data: Array<{ type: string; count: number }>;
}

const AUDIT_COLORS = [COLORS.forest, COLORS.ocean, COLORS.gold, COLORS.terracotta];

export function AuditActivityChart({ data }: AuditActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <XAxis
          dataKey="type"
          tick={{ fontSize: 11, fill: COLORS.ink }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={AUDIT_COLORS[idx % AUDIT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

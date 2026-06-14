import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ApplicationsTimelineChartProps {
  data: Array<{ month: string; count: number }>;
}

function formatMonth(month: string): string {
  const [year, monthPart] = month.split('-');
  const monthIndex = Number(monthPart) - 1;
  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return month;
  }

  return new Date(Number(year), monthIndex, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

export function ApplicationsTimelineChart({ data }: ApplicationsTimelineChartProps) {
  return (
    <div className="chart-shell" role="img" aria-label="Applications over time chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tickFormatter={formatMonth} />
          <YAxis allowDecimals={false} />
          <Tooltip labelFormatter={(value) => formatMonth(String(value))} />
          <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

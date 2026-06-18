import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface JobSourceChartProps {
  data: Array<{ source: string; count: number }>;
  total: number;
}

export function JobSourceChart({ data, total }: JobSourceChartProps) {
  if (total === 0) {
    return <p className="chart-empty">No applications yet.</p>;
  }

  return (
    <div className="chart-shell" role="img" aria-label="Applications by job source chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

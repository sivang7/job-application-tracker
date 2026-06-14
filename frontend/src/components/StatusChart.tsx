import { APPLICATION_STATUS_ORDER, type ApplicationStatus } from '@jat/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatusCounts } from '../stats';

interface StatusChartProps {
  byStatus: StatusCounts;
  total: number;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
};

export function StatusChart({ byStatus, total }: StatusChartProps) {
  if (total === 0) {
    return <p className="chart-empty">No applications yet.</p>;
  }

  const data = APPLICATION_STATUS_ORDER.map((status) => ({
    status: STATUS_LABELS[status],
    count: byStatus[status],
  }));

  return (
    <div className="chart-shell" role="img" aria-label="Applications by status chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

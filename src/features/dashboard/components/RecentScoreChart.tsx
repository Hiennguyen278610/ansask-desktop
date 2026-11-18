import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RecentAttemptItem } from '@/domain/types';

export function RecentScoreChart({ data }: { data: RecentAttemptItem[] }) {
  const chartData = [...data].reverse().map((item, idx) => ({
    name: `#${idx + 1}`,
    title: item.examTitle,
    score: item.score,
  }));

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text)]">Điểm 10 lượt làm gần nhất</h3>
      <div className="mt-4 h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis domain={[0, 10]} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text)',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Điểm"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--primary)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

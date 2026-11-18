import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AvgBySubjectItem } from '@/domain/types';

export function AvgBySubjectChart({ data }: { data: AvgBySubjectItem[] }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text)]">Điểm trung bình theo môn</h3>
      <div className="mt-4 h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="subjectName" stroke="var(--text-muted)" fontSize={12} />
            <YAxis domain={[0, 10]} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text)',
              }}
            />
            <Bar
              dataKey="avgScore"
              name="Điểm TB"
              fill="var(--accent)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

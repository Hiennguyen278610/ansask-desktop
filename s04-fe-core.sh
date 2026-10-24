#!/bin/bash
set -e

# 1. Bổ sung Token màu cho biểu đồ vào tokens.css
cat >> src/styles/tokens.css << 'CSS_EOF'

/* Chart Colors */
:root {
  --chart-line: #3b82f6;
  --chart-bar-track: #e2e8f0;
}
.dark {
  --chart-line: #60a5fa;
  --chart-bar-track: #334155;
}
CSS_EOF

# 2. Cập nhật API commands.ts
python3 - << 'PYEOF'
p = 'src/lib/tauri/commands.ts'
s = open(p).read()
s = s.replace(
  'export function attemptList(examId: string): Promise<AttemptSummary[]> { return invoke(\'attempt_list\', { req: { examId } }); }',
  'export function attemptList(examId: string): Promise<AttemptSummary[]> { return invoke(\'attempt_list\', { req: { examId } }); }\nexport function attemptListAll(): Promise<AttemptSummary[]> { return invoke(\'attempt_list_all\'); }'
)
open(p, 'w').write(s)
PYEOF

# 3. Tạo Hook useDashboard
cat > src/hooks/useDashboard.ts << 'TS_EOF'
import { useQuery } from '@tanstack/react-query';
import { attemptListAll } from '@/lib/tauri/commands';
import { useMemo } from 'react';

export function useDashboard() {
  const query = useQuery({ queryKey: ['attempts_all'], queryFn: attemptListAll });

  const stats = useMemo(() => {
    const attempts = query.data || [];
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0 ? (attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts).toFixed(1) : '0.0';
    const totalQuestions = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + a.correctCount, 0);
    const accuracyRate = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0.0';

    // Phổ điểm
    const excellent = attempts.filter(a => a.score >= 8.5).length;
    const good = attempts.filter(a => a.score >= 7.0 && a.score < 8.5).length;
    const average = attempts.filter(a => a.score < 7.0).length;
    const totalDist = Math.max(1, excellent + good + average);

    const distribution = {
      excellentPct: ((excellent / totalDist) * 100).toFixed(1),
      goodPct: ((good / totalDist) * 100).toFixed(1),
      averagePct: ((average / totalDist) * 100).toFixed(1),
    };

    // Mock series for the chart (since real filtering is Sprint 07)
    const series = [
      { label: 'T2', count: 3, avgScore: 8.2 },
      { label: 'T3', count: 5, avgScore: 8.6 },
      { label: 'T4', count: 2, avgScore: 7.9 },
      { label: 'T5', count: 6, avgScore: 9.0 },
      { label: 'T6', count: 4, avgScore: 8.5 },
      { label: 'T7', count: 7, avgScore: 9.1 },
      { label: 'CN', count: Math.max(3, totalAttempts), avgScore: Number(avgScore) }
    ];

    return { totalAttempts, avgScore, totalQuestions, accuracyRate, distribution, series };
  }, [query.data]);

  return { ...query, stats };
}
TS_EOF

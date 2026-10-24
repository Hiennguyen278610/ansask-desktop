import { createHashRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { SubjectListScreen } from '@/features/subject/SubjectListScreen';
import { ExamListScreen } from '@/features/exam/ExamListScreen';
import { GuideScreen } from '@/features/ai-guide/GuideScreen';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: 'subjects', element: <SubjectListScreen /> },
      { path: 'subjects/:subjectId/exams', element: <ExamListScreen /> },
      { path: 'guide', element: <GuideScreen /> },
      {
        path: 'trash',
        element: (
          <div className="neu-card rounded-[26px] p-8 text-center text-sm text-slate-500">
            Thùng rác — Sprint 05 sẽ triển khai.
          </div>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

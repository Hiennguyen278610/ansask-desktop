import { createHashRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { SubjectListScreen } from '@/features/subject/SubjectListScreen';
import { ExamListScreen } from '@/features/exam/ExamListScreen';
import { ExamEditorScreen } from '@/features/exam/ExamEditorScreen';
import { GuideScreen } from '@/features/ai-guide/GuideScreen';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: 'subjects', element: <SubjectListScreen /> },
      { path: 'subjects/:subjectId/exams', element: <ExamListScreen /> },
      { path: 'subjects/:subjectId/exams/new', element: <ExamEditorScreen /> },
      { path: 'subjects/:subjectId/exams/:examId/edit', element: <ExamEditorScreen /> },
      { path: 'guide', element: <GuideScreen /> },
      { path: 'trash', element: <div className="p-8 text-center text-slate-500">Thùng rác (Sprint 05)</div> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

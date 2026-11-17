import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import type { InfiniteData } from '@tanstack/react-query';
import type { ExamSummary, Subject, TimeCursor } from '@/domain/types';
import { useSessionStore } from '@/features/exam-taking/store/session.store';
import { AppLayout } from '@/layouts/AppLayout';
import { FullscreenLayout } from '@/layouts/FullscreenLayout';
import { AiGuidePage } from '@/pages/AiGuidePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExamDetailPage } from '@/pages/ExamDetailPage';
import { ExamEditorPage } from '@/pages/ExamEditorPage';
import { ExamListPage } from '@/pages/ExamListPage';
import { ExamResultPage } from '@/pages/ExamResultPage';
import { ExamTakingPage } from '@/pages/ExamTakingPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SubjectListPage } from '@/pages/SubjectListPage';
import { examKeys } from '@/services/exam/keys';
import { examService } from '@/services/exam/service';
import { subjectKeys } from '@/services/subject/keys';
import { subjectService } from '@/services/subject/service';
import type { Page } from '@/shared/api/types';
import { queryClient } from './query-client';

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crumb?: (match: { loaderData: any }) => string;
    headerMode?: 'default' | 'custom';
  }
}

const rootRoute = createRootRoute();

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  component: AppLayout,
});

const fullscreenLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_fullscreen',
  component: FullscreenLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: DashboardPage,
  staticData: { crumb: () => 'Tổng quan' },
});

const examsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/exams',
  staticData: { crumb: () => 'Đề bài' },
});

const examsIndexRoute = createRoute({
  getParentRoute: () => examsRoute,
  path: '/',
  component: SubjectListPage,
});

const subjectRoute = createRoute({
  getParentRoute: () => examsRoute,
  path: '$subjectId',
  loader: async ({ params }) => {
    const cached = queryClient.getQueryData<InfiniteData<Page<Subject, TimeCursor>>>(
      subjectKeys.list(),
    );
    const found = cached?.pages.flatMap((p) => p.items).find((s) => s.id === params.subjectId);
    if (found) return { subjectName: found.name };

    try {
      const firstPage = await subjectService.list({ cursor: null, limit: 100 });
      const match = firstPage.items.find((s) => s.id === params.subjectId);
      return { subjectName: match?.name ?? 'Môn học' };
    } catch {
      return { subjectName: 'Môn học' };
    }
  },
  staticData: {
    crumb: ({ loaderData }) => (loaderData as { subjectName?: string } | undefined)?.subjectName ?? 'Môn học',
  },
});

const subjectIndexRoute = createRoute({
  getParentRoute: () => subjectRoute,
  path: '/',
  component: ExamListPage,
});

const examNewRoute = createRoute({
  getParentRoute: () => subjectRoute,
  path: 'new',
  component: () => <ExamEditorPage mode="create" />,
  staticData: { crumb: () => 'Tạo đề', headerMode: 'custom' },
});

const examDetailRoute = createRoute({
  getParentRoute: () => subjectRoute,
  path: '$examId',
  loader: ({ params }) =>
    queryClient.query({
      queryKey: examKeys.detail(params.examId),
      queryFn: () => examService.get(params.examId),
    }),
  staticData: {
    crumb: ({ loaderData }) => (loaderData as ExamSummary | undefined)?.title ?? 'Chi tiết đề',
  },
});

const examDetailIndexRoute = createRoute({
  getParentRoute: () => examDetailRoute,
  path: '/',
  component: ExamDetailPage,
});

const examEditRoute = createRoute({
  getParentRoute: () => examDetailRoute,
  path: 'edit',
  component: () => <ExamEditorPage mode="edit" />,
  staticData: { crumb: () => 'Sửa đề', headerMode: 'custom' },
});

const examResultRoute = createRoute({
  getParentRoute: () => examDetailRoute,
  path: 'result/$attemptId',
  component: ExamResultPage,
  staticData: { crumb: () => 'Kết quả' },
});

const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/history',
  component: HistoryPage,
  staticData: { crumb: () => 'Lịch sử làm bài' },
});

const guideRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/guide',
  component: AiGuidePage,
  staticData: { crumb: () => 'Hướng dẫn AI' },
});

const takeRoute = createRoute({
  getParentRoute: () => fullscreenLayoutRoute,
  path: '/take',
  beforeLoad: () => {
    if (!useSessionStore.getState().session) {
      throw redirect({ to: '/exams' });
    }
  },
  component: ExamTakingPage,
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    dashboardRoute,
    examsRoute.addChildren([
      examsIndexRoute,
      subjectRoute.addChildren([
        subjectIndexRoute,
        examNewRoute,
        examDetailRoute.addChildren([examDetailIndexRoute, examEditRoute, examResultRoute]),
      ]),
    ]),
    historyRoute,
    guideRoute,
  ]),
  fullscreenLayoutRoute.addChildren([takeRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useApplySettings } from '@/features/settings/store/settings.store';
import { queryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  useApplySettings();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

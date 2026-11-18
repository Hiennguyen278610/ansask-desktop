import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useApplySettings } from '@/features/settings/store/settings.store';
import { useIsMobile } from '@/shared/hooks/useMobile';
import { queryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  useApplySettings();
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position={isMobile ? 'top-center' : 'bottom-right'}
        offset={isMobile ? 36 : undefined}
        richColors
        toastOptions={{ style: { fontSize: isMobile ? '14px' : '20px' } }}
      />
    </QueryClientProvider>
  );
}

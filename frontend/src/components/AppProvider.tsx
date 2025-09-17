

import { StackProvider } from '@stackframe/react';
import { stackClientApp } from 'app/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from 'utils/queryClient';
import { VeyraButton } from './VeyraButton';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StackProvider app={stackClientApp}>
        {children}
        <VeyraButton />
      </StackProvider>
    </QueryClientProvider>
  );
}

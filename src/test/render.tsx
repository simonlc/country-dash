import { render, type RenderOptions } from '@testing-library/react';
import NiceModal from '@ebay/nice-modal-react';
import type { PropsWithChildren, ReactElement } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';

function TestProviders({ children }: PropsWithChildren) {
  return (
    <AppProviders>
      <NiceModal.Provider>{children}</NiceModal.Provider>
    </AppProviders>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}

export function renderRouter() {
  return render(
    <TestProviders>
      <RouterProvider router={router} />
    </TestProviders>,
  );
}

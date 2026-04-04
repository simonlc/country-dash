import { render, type RenderOptions } from '@testing-library/react';
import NiceModal from '@ebay/nice-modal-react';
import type { PropsWithChildren, ReactElement } from 'react';
import { AppProviders } from '@/app/providers';

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

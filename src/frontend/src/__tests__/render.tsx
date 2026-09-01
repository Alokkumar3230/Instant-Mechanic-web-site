import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { ThemeProvider } from "@/components/theme-provider";

/**
 * Renders a page under a fresh QueryClient (the real `useQueries` hooks need
 * one) and optionally under the app's next-themes provider for theme tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: { theme?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const content = (
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
  if (options.theme) {
    return render(
      <ThemeProvider defaultTheme="dark" storageKey="instant-mechanic-theme">
        {content}
      </ThemeProvider>,
    );
  }
  return render(content);
}

import { RouterProvider } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/routes";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="instant-mechanic-theme">
      <RouterProvider router={router} />
      <Toaster position="bottom-right" closeButton />
    </ThemeProvider>
  );
}

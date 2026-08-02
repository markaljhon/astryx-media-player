import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AppThemeProvider } from "@/features/theme/AppThemeProvider";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppThemeProvider>
      <RouterProvider router={router} />
    </AppThemeProvider>
  </StrictMode>,
);

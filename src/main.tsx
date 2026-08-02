import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Theme } from "@astryxdesign/core";
import { router } from "./router";
import { astryxTheme } from "./themes/astryx/astryxTheme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme mode="dark" theme={astryxTheme}>
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);

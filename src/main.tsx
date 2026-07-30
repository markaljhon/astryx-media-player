import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
// import "@astryxdesign/theme-y2k/theme.css";
import "@astryxdesign/theme-neutral/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Theme } from "@astryxdesign/core";
// import { y2kTheme } from "./themes/y2k/y2kTheme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <Theme theme={y2kTheme}> */}
    <Theme theme={neutralTheme}>
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);

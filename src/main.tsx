import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-y2k/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@astryxdesign/core";
import { y2kTheme } from "./themes/y2k/y2kTheme";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme theme={y2kTheme}>
      <App />
    </Theme>
  </StrictMode>,
);

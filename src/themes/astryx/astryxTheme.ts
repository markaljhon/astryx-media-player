import { defineTheme, defineSyntaxTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const astryxDark = "#141414";
const astryxLight = "#CFCFCF";
const astryxAccent = "#7E49B3";

const astryxSyntax = defineSyntaxTheme({
  name: "xds-astryx",
  tokens: {
    keyword: [astryxAccent, "#B98AE7"],
    string: ["#4B6F44", "#A8D39D"],
    comment: ["#6F6F6F", "#8F8F8F"],
    number: ["#6A4F88", "#C39AF0"],
    function: [astryxAccent, "#B98AE7"],
    type: ["#5B3B7A", "#D1AAFA"],
    variable: [astryxDark, astryxLight],
    operator: [astryxDark, astryxLight],
    constant: [astryxAccent, "#B98AE7"],
    tag: [astryxAccent, "#B98AE7"],
    attribute: ["#5B3B7A", "#D1AAFA"],
    property: ["#5B3B7A", "#D1AAFA"],
    punctuation: [astryxDark, astryxLight],
    background: [astryxLight, astryxDark],
  },
});

export const astryxTheme = defineTheme({
  name: "astryx",
  extends: neutralTheme,
  color: { accent: astryxAccent, neutralStyle: "neutral" },
  radius: { base: 4, multiplier: 0 },
  syntax: astryxSyntax,
  tokens: {
    "--color-accent": [astryxAccent, astryxAccent],
    "--color-accent-muted": [`${astryxAccent}24`, `${astryxAccent}3F`],
    "--color-neutral": [`${astryxDark}14`, `${astryxLight}1F`],
    "--color-background-body": [astryxLight, astryxDark],
    "--color-background-surface": ["#E7E7E7", "#1D1D1D"],
    "--color-background-card": ["#E7E7E7", "#1D1D1D"],
    "--color-background-popover": ["#F2F2F2", "#242424"],
    "--color-background-muted": [`${astryxDark}0D`, `${astryxLight}14`],
    "--color-background-inverted": [astryxDark, astryxLight],
    "--color-overlay": [`${astryxDark}66`, "#00000099"],
    "--color-overlay-hover": [`${astryxDark}0D`, `${astryxLight}0F`],
    "--color-overlay-pressed": [`${astryxDark}1A`, `${astryxLight}1F`],
    "--color-text-primary": [astryxDark, astryxLight],
    "--color-text-secondary": ["#4A4A4A", "#A8A8A8"],
    "--color-text-disabled": ["#7A7A7A", "#6F6F6F"],
    "--color-text-accent": [astryxAccent, "#B98AE7"],
    "--color-on-dark": astryxLight,
    "--color-on-light": astryxDark,
    "--color-on-accent": ["#FFFFFF", "#FFFFFF"],
    "--color-icon-accent": [astryxAccent, "#B98AE7"],
    "--color-icon-primary": [astryxDark, astryxLight],
    "--color-icon-secondary": ["#4A4A4A", "#A8A8A8"],
    "--color-icon-disabled": ["#7A7A7A", "#6F6F6F"],
    "--color-border": [`${astryxDark}24`, `${astryxLight}24`],
    "--color-border-emphasized": ["#6F6F6F", "#7A7A7A"],
    "--color-skeleton": ["#B8B8B8", "#3A3A3A"],
    "--color-track": ["#B8B8B8", "#3A3A3A"],
    "--color-shadow": [`${astryxDark}1F`, "#00000066"],
    "--color-tint-hover": [astryxDark, astryxLight],
    "--radius-none": "0px",
    "--radius-inner": "0px",
    "--radius-element": "0px",
    "--radius-container": "0px",
    "--radius-page": "0px",
    "--radius-chat": "0px",
    "--radius-full": "0px",
    "--shadow-inset-selected": `inset 0px 0px 0px 2px ${astryxAccent}80`,
  },
  components: {
    button: {
      base: {
        borderRadius: "0px",
      },
    },
    badge: {
      base: {
        borderRadius: "9999px",
      },
    },
    banner: {
      base: {
        borderRadius: "0px",
      },
    },
    field: {
      base: {
        borderRadius: "0px",
      },
    },
    card: {
      base: {
        borderRadius: "0px",
      },
    },
  },
});

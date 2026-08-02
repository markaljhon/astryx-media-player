import { defineTheme, defineSyntaxTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const astryxLightText = "#141414";
const astryxLightSurface = "#CFCFCF";
const astryxLightAccent = "#7E49B3";

const astryxDarkBody = "#000000";
const astryxDarkSurface = "#080808";
const astryxDarkCard = "#101010";
const astryxDarkPopover = "#181818";
const astryxDarkText = "#F7F7F7";
const astryxDarkTextSecondary = "#D4D4D4";
const astryxDarkTextDisabled = "#8A8A8A";
const astryxDarkAccent = "#C084FC";

const astryxSyntax = defineSyntaxTheme({
  name: "xds-astryx",
  tokens: {
    keyword: [astryxLightAccent, astryxDarkAccent],
    string: ["#4B6F44", "#A8D39D"],
    comment: ["#6F6F6F", "#A3A3A3"],
    number: ["#6A4F88", "#C39AF0"],
    function: [astryxLightAccent, astryxDarkAccent],
    type: ["#5B3B7A", "#D1AAFA"],
    variable: [astryxLightText, astryxDarkText],
    operator: [astryxLightText, astryxDarkText],
    constant: [astryxLightAccent, astryxDarkAccent],
    tag: [astryxLightAccent, astryxDarkAccent],
    attribute: ["#5B3B7A", "#D1AAFA"],
    property: ["#5B3B7A", "#D1AAFA"],
    punctuation: [astryxLightText, astryxDarkText],
    background: [astryxLightSurface, astryxDarkBody],
  },
});

export const astryxTheme = defineTheme({
  name: "astryx",
  extends: neutralTheme,
  color: { accent: astryxLightAccent, neutralStyle: "neutral" },
  radius: { base: 4, multiplier: 0 },
  syntax: astryxSyntax,
  tokens: {
    "--color-accent": [astryxLightAccent, astryxDarkAccent],
    "--color-accent-muted": [`${astryxLightAccent}24`, `${astryxDarkAccent}45`],
    "--color-neutral": [`${astryxLightText}14`, `${astryxDarkText}24`],
    "--color-background-body": [astryxLightSurface, astryxDarkBody],
    "--color-background-surface": ["#E7E7E7", astryxDarkSurface],
    "--color-background-card": ["#E7E7E7", astryxDarkCard],
    "--color-background-popover": ["#F2F2F2", astryxDarkPopover],
    "--color-background-muted": [`${astryxLightText}0D`, `${astryxDarkText}1A`],
    "--color-background-inverted": [astryxLightText, astryxDarkText],
    "--color-overlay": [`${astryxLightText}66`, "#000000CC"],
    "--color-overlay-hover": [`${astryxLightText}0D`, `${astryxDarkText}14`],
    "--color-overlay-pressed": [`${astryxLightText}1A`, `${astryxDarkText}29`],
    "--color-text-primary": [astryxLightText, astryxDarkText],
    "--color-text-secondary": ["#4A4A4A", astryxDarkTextSecondary],
    "--color-text-disabled": ["#7A7A7A", astryxDarkTextDisabled],
    "--color-text-accent": [astryxLightAccent, "#D8B4FE"],
    "--color-on-dark": "#FFFFFF",
    "--color-on-light": "#000000",
    "--color-on-accent": ["#FFFFFF", "#FFFFFF"],
    "--color-icon-accent": [astryxLightAccent, astryxDarkAccent],
    "--color-icon-primary": [astryxLightText, astryxDarkText],
    "--color-icon-secondary": ["#4A4A4A", astryxDarkTextSecondary],
    "--color-icon-disabled": ["#7A7A7A", astryxDarkTextDisabled],
    "--color-border": [`${astryxLightText}24`, `${astryxDarkText}3D`],
    "--color-border-emphasized": ["#6F6F6F", "#B8B8B8"],
    "--color-skeleton": ["#B8B8B8", "#4A4A4A"],
    "--color-track": ["#B8B8B8", "#4A4A4A"],
    "--color-shadow": [`${astryxLightText}1F`, "#000000D9"],
    "--color-tint-hover": [astryxLightText, astryxDarkText],
    "--radius-none": "0px",
    "--radius-inner": "0px",
    "--radius-element": "0px",
    "--radius-container": "0px",
    "--radius-page": "0px",
    "--radius-chat": "0px",
    "--radius-full": "0px",
    "--shadow-inset-selected": [
      `inset 0px 0px 0px 2px ${astryxLightAccent}80`,
      `inset 0px 0px 0px 2px ${astryxDarkAccent}99`,
    ],
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

export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#1F4D2E", dark: "#163A22", light: "#E4EEE6" },
        ember: { DEFAULT: "#F26B1D", dark: "#D9580E", light: "#FDEBDD" },
        sun: { DEFAULT: "#FFC21A", light: "#FFF3CC" },
        chili: { DEFAULT: "#E63329", light: "#FCE3E1" },
        cream: { DEFAULT: "#FAF7F0", dark: "#EFE9DC", line: "#E7E0D0" },
        ink: { DEFAULT: "#1A1A1A", muted: "#5C5A55", subtle: "#7A766D" },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,26,0.04), 0 10px 28px -14px rgba(31,77,46,0.22)",
        float: "0 12px 32px -10px rgba(22,58,34,0.55)",
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    },
  },
};

import type { Preview } from "@storybook/react";
import "../app/globals.css";

/**
 * Global Storybook config. Loads the design-token stylesheet so every story renders
 * with semantic tokens. The a11y addon runs axe against each story.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Surface violations prominently during development.
      element: "#storybook-root",
    },
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "#ffffff" },
        { name: "background", value: "#fbf9f8" },
      ],
    },
  },
};

export default preview;

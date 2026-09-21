import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Storybook is the single documentation + isolated-testing system for the design
 * system (FR-12). Stories live next to primitives under src/ui.
 */
const config: StorybookConfig = {
  stories: ["../src/ui/**/*.stories.@(ts|tsx)", "../src/ui/**/*.mdx"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  staticDirs: ["../public"],
  docs: {
    autodocs: "tag",
  },
};

export default config;

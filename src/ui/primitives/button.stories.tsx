import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

/**
 * # Button
 *
 * **Purpose:** Primary action trigger across the app.
 *
 * **Intended usage:** Use for actions (submit, confirm, open). For navigation, use
 * `Link` instead so it renders a real anchor.
 *
 * **Accessibility expectations:** Native `<button>` semantics; keyboard operable
 * (Enter/Space); visible focus ring via the `focus` token; `aria-busy` is set while
 * loading; disabled and loading states block interaction.
 *
 * **Variants:** `primary` (accent), `secondary` (outlined), `ghost` (text).
 *
 * **Sizes:** `sm`, `md`, `lg`.
 *
 * **States:** default, hover, focus-visible, disabled, loading.
 *
 * **Responsive behaviour:** Sizing is fixed per `size`; width is controlled by the
 * parent layout. Add `w-full` via `className` for full-width on mobile.
 *
 * **Prohibited usage:** Do not use Button for navigation (use `Link`). Do not place
 * long paragraphs inside a Button. Do not remove the visible focus ring.
 */
const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Make time for you" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Loading: Story = { args: { loading: true, children: "Saving" } };
export const Disabled: Story = { args: { disabled: true, children: "Unavailable" } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

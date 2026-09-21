import type { Meta, StoryObj } from "@storybook/react";
import { Loading, Empty, ErrorState } from "./state";
import { Button } from "./button";

/**
 * # State Patterns (Loading, Empty, Error)
 *
 * **Purpose:** Consistent, accessible representations of asynchronous and empty UI
 * states.
 *
 * **Intended usage:** `Loading` while data is in flight; `Empty` when a collection
 * has no items; `ErrorState` for recoverable failures with an optional retry.
 *
 * **Accessibility expectations:** `Loading` exposes `role="status"` with a polite
 * live region and a text label (spinner is decorative/aria-hidden and respects
 * reduced motion). `ErrorState` exposes `role="alert"`.
 *
 * **Variants:** optional description and action for Empty/Error.
 *
 * **States:** N/A (these represent states themselves).
 *
 * **Responsive behaviour:** Content is centred and wraps on small screens.
 *
 * **Prohibited usage:** Do not use a bare spinner without an accessible label. Do not
 * convey an error using colour alone.
 */
const meta: Meta = {
  title: "Primitives/State",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const LoadingState: Story = { render: () => <Loading label="Loading rituals" /> };

export const EmptyState: Story = {
  render: () => (
    <Empty
      title="No favourites yet"
      description="Save products you love to find them here."
      action={<Button variant="secondary">Browse shop</Button>}
    />
  ),
};

export const Errored: Story = {
  render: () => (
    <ErrorState
      description="We couldn't load this right now."
      action={<Button>Try again</Button>}
    />
  ),
};

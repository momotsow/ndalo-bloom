import type { Meta, StoryObj } from "@storybook/react";
import { FormField, Input, Textarea } from "./form";
import { Checkbox } from "./checkbox";
import { RadioGroup, Radio } from "./radio";
import { Select, SelectTrigger, SelectContent, SelectItem } from "./select";
import { Stack } from "./layout";

/**
 * # Form Primitives
 *
 * **Purpose:** Accessible form controls with consistent styling and validation
 * affordances.
 *
 * **Intended usage:** Wrap controls in `FormField` to get an associated label,
 * optional description, error message, and the correct `aria-describedby` /
 * `aria-invalid` wiring. Use Radix-backed `Select`, `Checkbox`, and `Radio` for
 * complex controls.
 *
 * **Accessibility expectations:** Labels are programmatically associated; errors use
 * `role="alert"` and are referenced via `aria-describedby`; invalid controls set
 * `aria-invalid`; all controls are keyboard operable with a visible focus ring.
 *
 * **Variants:** Input, Textarea, Select, Checkbox, Radio group.
 *
 * **States:** default, focus-visible, disabled, invalid/error.
 *
 * **Responsive behaviour:** Controls are full-width by default and adapt to their
 * container.
 *
 * **Prohibited usage:** Do not render a bare control without an associated label. Do
 * not convey errors with colour alone — always provide error text.
 */
const meta: Meta = {
  title: "Primitives/Form",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const TextInputs: Story = {
  render: () => (
    <Stack gap={4} className="max-w-sm">
      <FormField label="Email" description="We'll never share it.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="email"
            aria-describedby={describedBy}
            placeholder="you@example.com"
          />
        )}
      </FormField>
      <FormField label="Gift message" error="Message is required">
        {({ id, describedBy, invalid }) => (
          <Textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </FormField>
    </Stack>
  ),
};

export const Choice: Story = {
  render: () => (
    <Stack gap={5} className="max-w-sm">
      <label className="flex items-center gap-2">
        <Checkbox /> <span>Subscribe to Bloom letters</span>
      </label>
      <RadioGroup defaultValue="unwind" aria-label="Choose a ritual">
        <label className="flex items-center gap-2">
          <Radio value="unwind" /> <span>Unwind</span>
        </label>
        <label className="flex items-center gap-2">
          <Radio value="restore" /> <span>Restore</span>
        </label>
      </RadioGroup>
      <Select>
        <SelectTrigger placeholder="Select a scent" aria-label="Scent" />
        <SelectContent>
          <SelectItem value="rose">Rose</SelectItem>
          <SelectItem value="lavender">Lavender</SelectItem>
          <SelectItem value="neroli">Neroli</SelectItem>
        </SelectContent>
      </Select>
    </Stack>
  ),
};

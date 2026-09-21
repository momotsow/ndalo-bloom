import type { Meta, StoryObj } from "@storybook/react";
import { Container, Stack, Grid, Heading, Text, Card, Badge } from "./layout";

/**
 * # Layout & Content Primitives
 *
 * **Purpose:** Compose page structure and typographic content using semantic tokens.
 *
 * **Intended usage:** `Container` centres and constrains width; `Stack` lays out
 * vertical/horizontal flow; `Grid` builds responsive grids; `Heading`/`Text` render
 * typography; `Card` groups related content; `Badge` labels status.
 *
 * **Accessibility expectations:** `Heading` renders real `h1`–`h4` — choose `level`
 * for correct document outline, not for visual size alone. `Text` defaults to `<p>`.
 * Colour tokens meet contrast on the intended surfaces.
 *
 * **Variants:** Heading levels 1–4; Text tones primary/secondary/muted; Badge tones
 * neutral/accent/success/warning/error.
 *
 * **States:** These are presentational; no interactive states.
 *
 * **Responsive behaviour:** `Container` size caps width; `Grid` collapses columns at
 * small breakpoints.
 *
 * **Prohibited usage:** Do not pick a Heading level for its font size — keep the
 * heading hierarchy meaningful. Do not hard-code palette colours; use tokens.
 */
const meta: Meta = {
  title: "Primitives/Layout",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Typography: Story = {
  render: () => (
    <Stack gap={3}>
      <Heading level={1}>Heading level 1</Heading>
      <Heading level={2}>Heading level 2</Heading>
      <Text>Primary body text.</Text>
      <Text tone="secondary">Secondary body text.</Text>
      <Text tone="muted">Muted supporting text.</Text>
    </Stack>
  ),
};

export const Cards: Story = {
  render: () => (
    <Container>
      <Grid columns={3} gap={4}>
        <Card>
          <Heading level={3}>Unwind</Heading>
          <Text tone="secondary">A calming evening ritual.</Text>
        </Card>
        <Card>
          <Heading level={3}>Restore</Heading>
          <Text tone="secondary">Reset and recharge.</Text>
        </Card>
        <Card>
          <Heading level={3}>Gift</Heading>
          <Text tone="secondary">Something meaningful.</Text>
        </Card>
      </Grid>
    </Container>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Neutral</Badge>
      <Badge tone="accent">New</Badge>
      <Badge tone="success">In stock</Badge>
      <Badge tone="warning">Low stock</Badge>
      <Badge tone="error">Sold out</Badge>
    </div>
  ),
};

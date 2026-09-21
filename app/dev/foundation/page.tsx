import { notFound } from "next/navigation";
import {
  Container,
  Stack,
  Grid,
  Heading,
  Text,
  Card,
  Badge,
} from "@/ui/primitives/layout";
import { Button } from "@/ui/primitives/button";
import { Loading, Empty, ErrorState } from "@/ui/primitives/state";

/**
 * DEVELOPMENT-ONLY Foundation showcase.
 *
 * Verifies the token system and foundational primitives render correctly. This route
 * is NOT part of the product and MUST NOT be exposed in production: it returns 404
 * when NODE_ENV is "production" (runtime guard), so even if built it is unreachable
 * in a production deployment.
 *
 * The real storefront homepage is delivered in a later Spec.
 */
export default function FoundationShowcasePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container>
      <Stack gap={6} className="py-12">
        <div>
          <Badge tone="accent">Development only</Badge>
          <Heading level={1} className="mt-3">
            Foundation showcase
          </Heading>
          <Text tone="secondary" className="mt-2">
            Design tokens and foundational primitives. Not a product page.
          </Text>
        </div>

        <Stack gap={3}>
          <Heading level={2}>Typography</Heading>
          <Heading level={3}>Heading level 3</Heading>
          <Text>Primary body text.</Text>
          <Text tone="secondary">Secondary body text.</Text>
          <Text tone="muted">Muted supporting text.</Text>
        </Stack>

        <Stack gap={3}>
          <Heading level={2}>Buttons</Heading>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Stack>

        <Stack gap={3}>
          <Heading level={2}>Cards</Heading>
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
        </Stack>

        <Stack gap={3}>
          <Heading level={2}>State patterns</Heading>
          <Loading label="Loading rituals" />
          <Empty
            title="No favourites yet"
            description="Save products to find them here."
          />
          <ErrorState description="We couldn't load this right now." />
        </Stack>
      </Stack>
    </Container>
  );
}

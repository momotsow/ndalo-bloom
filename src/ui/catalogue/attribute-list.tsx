import { Badge, Heading, Stack, Text } from "@/ui/primitives/layout";

/**
 * Attribute list (catalogue-scoped, presentational). Renders reference collections
 * such as ingredients, benefits, scents, moods, and occasions as accessible chips.
 * No data access.
 */
export interface AttributeItem {
  readonly id: string;
  readonly name: string;
}

export function AttributeList({
  title,
  items,
  tone = "neutral",
}: {
  readonly title: string;
  readonly items: readonly AttributeItem[];
  readonly tone?: "neutral" | "accent";
}) {
  if (items.length === 0) return null;
  return (
    <Stack gap={2}>
      <Heading level={3} className="text-base">
        {title}
      </Heading>
      <ul className="flex flex-wrap gap-2" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <Badge tone={tone}>{item.name}</Badge>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

export function TextBlock({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string | null;
}) {
  if (!body) return null;
  return (
    <Stack gap={2}>
      <Heading level={3} className="text-base">
        {title}
      </Heading>
      <Text tone="secondary">{body}</Text>
    </Stack>
  );
}

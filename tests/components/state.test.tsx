import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Loading, Empty, ErrorState } from "@/ui/primitives/state";

/**
 * State patterns accessibility (FR-10): correct roles/live regions and no axe
 * violations. These are non-interactive, so only applicable criteria are checked.
 */
describe("state patterns", () => {
  it("Loading exposes a polite status region with a label", () => {
    render(<Loading label="Loading products" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading products");
  });

  it("ErrorState exposes an alert region", () => {
    render(<ErrorState description="Please retry" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("Empty renders a title and optional description", () => {
    render(<Empty title="Nothing here yet" description="Check back soon" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <div>
        <Loading />
        <Empty title="Empty" />
        <ErrorState />
      </div>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

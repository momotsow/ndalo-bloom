import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Button } from "@/ui/primitives/button";

/**
 * Button accessibility matrix (FR-10), applied to the semantics Button supports:
 * accessible name, role, keyboard operation, disabled state, loading state,
 * focus visibility (class-based), and no axe violations.
 */
describe("Button", () => {
  it("has an accessible name and button role", () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
  });

  it("is operable via keyboard (Enter/Space activate onClick)", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(<Button onClick={() => (clicks += 1)}>Go</Button>);
    await user.tab();
    expect(screen.getByRole("button", { name: "Go" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(clicks).toBe(2);
  });

  it("reflects the disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("reflects the loading state (aria-busy) and prevents interaction", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(
      <Button loading onClick={() => (clicks += 1)}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(clicks).toBe(0);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Button>Accessible</Button>);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

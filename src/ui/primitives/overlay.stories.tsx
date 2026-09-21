import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerClose } from "./drawer";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from "./toast";
import { Button } from "./button";

/**
 * # Overlay Primitives (Dialog, Drawer, Toast)
 *
 * **Purpose:** Modal and transient overlays.
 *
 * **Intended usage:** `Dialog` for focused modal tasks; `Drawer`/`Sheet` for side
 * panels (cart, filters — built later); `Toast` for transient confirmations.
 *
 * **Accessibility expectations:** Dialog and Drawer (both built on Radix Dialog)
 * trap focus, set `aria-modal`, dismiss on ESC/overlay, and require a title for an
 * accessible name. Toast uses an ARIA live region. Motion respects
 * `prefers-reduced-motion`.
 *
 * **Variants:** Drawer sides (right/left/bottom); Toast tones (neutral/success/error).
 *
 * **States:** open/closed; Toast auto-dismiss.
 *
 * **Responsive behaviour:** Dialog is centred and width-capped; Drawer is full-height
 * (side) or bottom sheet, capped on small screens.
 *
 * **Prohibited usage:** Never render a Dialog/Drawer without a title. Do not use a
 * Dialog for non-blocking messages (use Toast). Avoid stacking multiple modals.
 */
const meta: Meta = {
  title: "Primitives/Overlays",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const DialogExample: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-heading text-lg">Confirm</DialogTitle>
        <DialogDescription className="mt-2 text-text-secondary">
          This is a focused modal task.
        </DialogDescription>
        <div className="mt-4 flex justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

export const DrawerExample: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerTitle className="font-heading text-lg">Panel</DrawerTitle>
        <p className="mt-2 text-text-secondary">A side sheet built on Radix Dialog.</p>
        <div className="mt-4">
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};

export const ToastExample: Story = {
  render: function ToastStory() {
    const [open, setOpen] = useState(false);
    return (
      <ToastProvider>
        <Button onClick={() => setOpen(true)}>Show toast</Button>
        <Toast open={open} onOpenChange={setOpen} tone="success">
          <ToastTitle className="font-medium">Added</ToastTitle>
          <ToastDescription className="text-text-secondary">
            Your ritual was saved.
          </ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  },
};

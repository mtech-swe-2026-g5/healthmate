import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Model from "@/components/ui/Model";
import userEvent from "@testing-library/user-event";

describe("AppCalendar", () => {
  const title = "Title";
  const content = "Content";
  const jsxContent = () => <span data-testid="jsx-content">JSX Content</span>;
  const onClose = vi.fn();
  const onConfirm = vi.fn(() => console.log("Confirmed"));
  const onCancel = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("should open model with default values", async () => {
    const { container } = render(
      <Model title={title} content={content} isOpen onClose={onClose} />,
    );
    const user = userEvent.setup();
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).contains("flex");
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).not.contains("hidden");
    expect(container.querySelector("#modalContainer")?.textContent).contains(
      title,
    );
    expect(container.querySelector("#modalContainer")?.textContent).contains(
      content,
    );
    await user.click(container.querySelector("#closeIconBtn")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("should open model with JSX content", async () => {
    const { container } = render(
      <Model title={title} content={jsxContent()} isOpen onClose={onClose} />,
    );
    const user = userEvent.setup();
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).contains("flex");
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).not.contains("hidden");
    expect(container.querySelector("#modalContainer")?.textContent).contains(
      title,
    );
    const jsxContentElement = await screen.findByTestId("jsx-content");
    expect(jsxContentElement.textContent).toBe("JSX Content");
    await user.click(container.querySelector("#closeIconBtn")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("should close model with confirm click", async () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        onClose={onClose}
        onConfirm={() => Promise.resolve(onConfirm())}
      />,
    );
    const user = userEvent.setup();
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).contains("flex");
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).not.contains("hidden");
    expect(container.querySelector("#confirmModalBtn")?.textContent).toBe(
      "Confirm",
    );
    await user.click(container.querySelector("#confirmModalBtn")!);
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("should close model with cancel click", async () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        onClose={onClose}
        onCancel={() => Promise.resolve(onCancel())}
      />,
    );
    const user = userEvent.setup();
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).contains("flex");
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).not.contains("hidden");
    expect(container.querySelector("#cancelModalBtn")?.textContent).toBe(
      "Cancel",
    );
    await user.click(container.querySelector("#cancelModalBtn")!);
    expect(onCancel).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("should close model with default close", async () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen={false}
        onClose={onClose}
      />,
    );
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).not.contains("flex");
    expect(
      container.querySelector("#modalContainer")?.classList.values().toArray(),
    ).contains("hidden");
  });
});

describe("Model busy and variant props", () => {
  const title = "Cancel this appointment?";
  const content = "This cannot be undone.";
  const onClose = vi.fn();
  const noop = () => Promise.resolve();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a spinner and the busy label while busy", () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        busy
        busyLabel="Cancelling…"
        confirmLabel="Yes, cancel it"
        onClose={onClose}
        onConfirm={noop}
      />,
    );

    const confirm = container.querySelector("#confirmModalBtn");
    expect(confirm?.textContent).toContain("Cancelling…");
    expect(confirm?.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByLabelText("Working")).toBeDefined();
  });

  it("falls back to the confirm label when no busy label is given", () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        busy
        confirmLabel="Yes, cancel it"
        onClose={onClose}
        onConfirm={noop}
      />,
    );

    expect(container.querySelector("#confirmModalBtn")?.textContent).toContain(
      "Yes, cancel it",
    );
  });

  it("disables both actions while busy so the request cannot be double-fired", async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    const onCancel = vi.fn(() => Promise.resolve());
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        busy
        onClose={onClose}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const confirm = container.querySelector(
      "#confirmModalBtn",
    ) as HTMLButtonElement;
    const cancel = container.querySelector(
      "#cancelModalBtn",
    ) as HTMLButtonElement;
    const close = container.querySelector("#closeIconBtn") as HTMLButtonElement;

    expect(confirm.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(close.disabled).toBe(true);

    await userEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders no spinner and stays enabled when not busy", () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        onClose={onClose}
        onConfirm={noop}
      />,
    );

    const confirm = container.querySelector(
      "#confirmModalBtn",
    ) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    expect(confirm.getAttribute("aria-busy")).toBeNull();
    expect(screen.queryByLabelText("Working")).toBeNull();
  });

  it("applies the danger style for destructive confirmations", () => {
    const { container } = render(
      <Model
        title={title}
        content={content}
        isOpen
        confirmVariant="danger"
        onClose={onClose}
        onConfirm={noop}
      />,
    );

    expect(container.querySelector("#confirmModalBtn")?.className).toContain(
      "var(--color-error)",
    );
  });
});

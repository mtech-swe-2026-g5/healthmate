import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "@/hooks/use-debounce";

describe("useDebouncedValue", () => {
  it("returns the value after the delay", async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delayMs }) => useDebouncedValue(value, delayMs),
      { initialProps: { value: "a", delayMs: 300 } },
    );

    expect(result.current).toBe("a");

    rerender({ value: "ab", delayMs: 300 });
    expect(result.current).toBe("a");

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("ab");

    vi.useRealTimers();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Cover } from "./Cover";

describe("Cover", () => {
  it("shows the content warning and enters the report", async () => {
    const enter = vi.fn();
    render(<Cover onEnter={enter} />);
    expect(screen.getByRole("heading", { name: "The Rape Gang Inquiry Report" })).toBeVisible();
    expect(screen.getByText(/graphic testimony/i)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    expect(enter).toHaveBeenCalledOnce();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";

describe("interactive report", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("moves from the content warning into the overview", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    expect(screen.getByRole("heading", { name: "Read the report your way" })).toBeVisible();
  });

  it("filters testimony and opens full source text", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    await userEvent.click(screen.getByRole("button", { name: "Testimony" }));
    await userEvent.click(screen.getByRole("button", { name: "Whistleblowers" }));
    const directory = screen.getByLabelText("Testimony directory");
    expect(within(directory).getByText(/Caven Vines/)).toBeVisible();
    await userEvent.click(within(directory).getByRole("button", { name: /Caven Vines/ }));
    await userEvent.click(screen.getByRole("button", { name: "Full text" }));
    expect(screen.getByLabelText("Full report text")).toBeVisible();
    expect(screen.getByRole("link", { name: /Open original PDF/ })).toHaveAttribute("href", expect.stringContaining("#page="));
  });

  it("searches across the complete report", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    await userEvent.type(screen.getByRole("searchbox", { name: "Search the complete report" }), "Caven Vines");
    expect(screen.getByRole("heading", { name: "Search results" })).toBeVisible();
    expect(screen.getByText(/Caven Vines \(Rotherham campaigner\)/)).toBeVisible();
  });

  it("opens a search result and writes a shareable section hash", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    await userEvent.type(screen.getByRole("searchbox", { name: "Search the complete report" }), "Caven Vines");
    await userEvent.click(screen.getByRole("button", { name: /Caven Vines/ }));
    expect(screen.getByLabelText("Selected section preview")).toHaveTextContent("Caven Vines");
    expect(window.location.hash).toContain("caven-vines-rotherham-campaigner");
  });

  it("restores a shared section after the warning screen", async () => {
    window.location.hash = "#testimony/caven-vines-rotherham-campaigner-31";
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    expect(screen.getByLabelText("Selected section preview")).toHaveTextContent("Caven Vines");
  });

  it("lists every navigable section in the full report view", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Enter the report" }));
    const navigation = screen.getByRole("navigation", { name: "Primary navigation" });
    await userEvent.click(within(navigation).getByRole("button", { name: "Full report" }));
    expect(screen.getByText("127 sections")).toBeVisible();
  });
});

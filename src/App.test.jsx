import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App, ProgressCard } from "./main";
import { getProgress } from "./rmd";

afterEach(() => vi.useRealTimers());

describe("progress card state transitions", () => {
  it("renders pending, in-flight, and satisfied progress accessibly", () => {
    const { rerender } = render(
      <ProgressCard progress={getProgress([])} onRequest={() => {}} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    rerender(
      <ProgressCard
        progress={getProgress([{ amount: 24000, status: "processing" }])}
        onRequest={() => {}}
      />,
    );
    expect(screen.getByText("In flight")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request a distribution/ }),
    ).toBeDisabled();
    rerender(
      <ProgressCard
        progress={getProgress([{ amount: 24000, status: "completed" }])}
        onRequest={() => {}}
      />,
    );
    expect(screen.getByText("Fully satisfied")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(
      screen.getByRole("button", { name: /Annual RMD complete/ }),
    ).toBeDisabled();
  });
});

describe("client and advisor dashboard", () => {
  it("submits immediately, syncs advisor state, and settles within 60 seconds", () => {
    vi.useFakeTimers();
    render(<App />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "75",
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Request a distribution/ }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Submit demo request/ }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText("$6,000 is processing · included after settlement"),
    ).toBeInTheDocument();
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(within(rows[1]).getByText("In flight")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Advisor view" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Margaret’s retirement, in view.",
    );
    expect(
      screen.getByText("$6,000 is processing · included after settlement"),
    ).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("Fully satisfied")).toBeInTheDocument();
    expect(screen.getByText("Annual requirement met")).toBeInTheDocument();
    expect(screen.queryByText("In flight")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Client view" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
  it("returns to pending after a partial distribution settles", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /Request a distribution/ }),
    );
    fireEvent.change(screen.getByLabelText("Distribution amount"), {
      target: { value: "1000" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Submit demo request/ }),
    );
    expect(
      screen.getByText("$1,000 is processing · included after settlement"),
    ).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "79",
    );
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request a distribution/ }),
    ).toBeEnabled();
    expect(screen.getByText("$5,000 left to distribute")).toBeInTheDocument();
  });
  it("closes a cancelled request without changing progress", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /Request a distribution/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close request" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "75",
    );
  });
  it("opens working account and document views", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Accounts" }));
    expect(screen.getByText("Traditional IRA ••4829")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(screen.getByText("You’re all caught up.")).toBeInTheDocument();
  });
});

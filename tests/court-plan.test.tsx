import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { courts } from "@/content/courts";
import { CourtPlan, type PlanCourt } from "@/features/booking/court-plan";
import messages from "../messages/en.json";

const planCourts: PlanCourt[] = courts.map((court, i) => ({
  id: court.id,
  kind: court.kind,
  name: court.name.en,
  freeCount: i + 3,
}));

function Harness({ initial }: { initial?: string }) {
  const [selected, setSelected] = useState(initial);
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Berlin">
      <CourtPlan courts={planCourts} selectedId={selected} onSelect={setSelected} />
    </NextIntlClientProvider>
  );
}

const radio = (name: RegExp) => screen.getByRole("radio", { name });

describe("CourtPlan", () => {
  it("exposes the courts as a labelled radio group with free-slot counts", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "Choose a court" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(radio(/^Singles Court 1, 6 free slots$/)).toBeInTheDocument();
  });

  it("puts the only tab stop on the first court when none is chosen", () => {
    render(<Harness />);
    const tabbable = screen
      .getAllByRole("radio")
      .filter((el) => el.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/^Doubles Court 1/);
    expect(
      screen.getAllByRole("radio").every((el) => el.getAttribute("aria-checked") === "false"),
    ).toBe(true);
  });

  it("moves and checks with the arrow keys, wrapping at the ends", () => {
    render(<Harness initial="doubles-1" />);
    fireEvent.keyDown(radio(/^Doubles Court 1/), { key: "ArrowRight" });
    expect(radio(/^Doubles Court 2/)).toHaveAttribute("aria-checked", "true");
    expect(radio(/^Doubles Court 2/)).toHaveFocus();
    expect(radio(/^Doubles Court 2/)).toHaveAttribute("tabindex", "0");
    expect(radio(/^Doubles Court 1/)).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(radio(/^Doubles Court 2/), { key: "ArrowLeft" });
    fireEvent.keyDown(radio(/^Doubles Court 1/), { key: "ArrowUp" });
    expect(radio(/^Singles Court 2/)).toHaveAttribute("aria-checked", "true");
    expect(radio(/^Singles Court 2/)).toHaveFocus();

    fireEvent.keyDown(radio(/^Singles Court 2/), { key: "ArrowDown" });
    expect(radio(/^Doubles Court 1/)).toHaveAttribute("aria-checked", "true");
  });

  it("jumps to the first and last court with Home and End", () => {
    render(<Harness initial="doubles-2" />);
    fireEvent.keyDown(radio(/^Doubles Court 2/), { key: "End" });
    expect(radio(/^Singles Court 2/)).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(radio(/^Singles Court 2/), { key: "Home" });
    expect(radio(/^Doubles Court 1/)).toHaveAttribute("aria-checked", "true");
    expect(radio(/^Doubles Court 1/)).toHaveFocus();
  });

  it("checks the focused court with Space or Enter", () => {
    render(<Harness />);
    fireEvent.keyDown(radio(/^Doubles Court 1/), { key: " " });
    expect(radio(/^Doubles Court 1/)).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(radio(/^Doubles Court 3/), { key: "Enter" });
    expect(radio(/^Doubles Court 3/)).toHaveAttribute("aria-checked", "true");
    expect(radio(/^Doubles Court 1/)).toHaveAttribute("aria-checked", "false");
  });

  it("checks a court on click", () => {
    render(<Harness />);
    fireEvent.click(radio(/^Singles Court 1/));
    expect(radio(/^Singles Court 1/)).toHaveAttribute("aria-checked", "true");
  });

  it("labels courts by name alone while availability loads", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Berlin">
        <CourtPlan
          courts={planCourts.map((c) => ({ ...c, freeCount: undefined }))}
          onSelect={() => {}}
        />
      </NextIntlClientProvider>,
    );
    expect(radio(/^Doubles Court 1$/)).toBeInTheDocument();
  });
});

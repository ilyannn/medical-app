import { LocaleProvider } from "@/web/lib/i18n";
import { HomePage } from "@/web/pages/home-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const overviewFixture = {
  filters: {
    people: [
      {
        id: "me",
        label: "Me",
        displayName: "Me",
        accent: "#0f766e",
        folderName: "Me",
      },
      {
        id: "wife",
        label: "Wife",
        displayName: "Wife",
        accent: "#a21caf",
        folderName: "Wife",
      },
    ],
    personScope: "all",
  },
  stats: {
    activePrescriptions: 2,
    pendingBills: 2,
    pendingReimbursements: 1,
    draftCount: 1,
    documentCount: 2,
    upcomingAppointments: 2,
  },
  recentNotes: [
    {
      id: "note-1",
      personId: "me",
      title: "March flare follow-up",
      body: "Improving",
      visitDate: "2026-03-19",
      nextStep: "Send update",
    },
  ],
  recentDrafts: [],
  upcomingAppointments: [
    {
      id: "event-1",
      title: "Dermatology review",
      start: "2026-04-18T09:00:00.000Z",
      end: "2026-04-18T09:30:00.000Z",
      notes: "Bring photos",
      personId: "me",
    },
  ],
};

describe("HomePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the shared household overview", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(overviewFixture), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <MemoryRouter initialEntries={["/?personScope=all"]}>
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </LocaleProvider>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("March flare follow-up")).toBeInTheDocument(),
    );
    expect(screen.getByText("Upcoming appointments")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(1);
  });
});

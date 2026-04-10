import { AppShell } from "@/web/components/app-shell";
import { LocaleProvider } from "@/web/lib/i18n";
import { AdminPage } from "@/web/pages/admin-page";
import { AppointmentsPage } from "@/web/pages/appointments-page";
import { AreasPage } from "@/web/pages/areas-page";
import { DoctorsPage } from "@/web/pages/doctors-page";
import { DocumentsPage } from "@/web/pages/documents-page";
import { DraftsPage } from "@/web/pages/drafts-page";
import { HomePage } from "@/web/pages/home-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

const queryClient = new QueryClient();

function RootLayout() {
  return (
    <LocaleProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </LocaleProvider>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "areas", element: <AreasPage /> },
      { path: "doctors", element: <DoctorsPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "drafts", element: <DraftsPage /> },
      { path: "appointments", element: <AppointmentsPage /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

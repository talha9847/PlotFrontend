import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Building2 } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageMeta = {
  "/admin": ["Overview", "A quick look at your land project and collections."],
  "/admin/plots": [
    "Plot inventory",
    "Manage all plots and see availability at a glance.",
  ],
  "/admin/layout": [
    "Layout editor",
    "Shape your land layout, roads and plot positions.",
  ],
  "/admin/customers": [
    "Customers",
    "Buyer profiles and plot ownership details.",
  ],
  "/admin/installments": [
    "Installments",
    "Track upcoming dues, overdue amounts and payments.",
  ],
  "/admin/payments": [
    "Payments & receipts",
    "Review collections and payment records.",
  ],
  "/admin/reminders": [
    "WhatsApp reminders",
    "Keep buyers informed about upcoming installments.",
  ],
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Match nested routes such as /admin/plots/123.
  const currentPath =
    location.pathname === "/admin"
      ? "/admin"
      : Object.keys(pageMeta)
          .filter((path) => path !== "/admin")
          .sort((a, b) => b.length - a.length)
          .find(
            (path) =>
              location.pathname.startsWith(`${path}/`) ||
              location.pathname === path,
          );

  const [title, subtitle] = pageMeta[currentPath] || pageMeta["/admin"];

  return (
    <div className="min-h-screen bg-[#f6faf6] text-slate-900">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main application area */}
      <div className="min-h-screen min-w-0 lg:pl-[272px]">
        {/* Mobile navigation header */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-emerald-100 bg-white/95 px-4 backdrop-blur-xl lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
            >
              <Menu size={19} />
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-800 text-white">
                <Building2 size={16} />
              </span>

              <span className="truncate text-sm font-extrabold tracking-tight text-emerald-950">
                plotwise<span className="text-emerald-500">.</span>
              </span>
            </div>
          </div>

          <span className="ml-3 shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800">
            Admin
          </span>
        </header>

        {/* Page title and actions */}
        <Topbar title={title} subtitle={subtitle} />

        {/* Route content */}
        <main
          id="admin-main"
          className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 xl:px-8"
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>

        {/* Application footer */}
        <footer className="mx-4 border-t border-emerald-100/80 px-2 py-5 text-center sm:mx-6 xl:mx-8">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Plotwise <span className="mx-1 text-emerald-400">·</span>
            Demo environment
          </p>
          <p className="mt-1.5 text-[10px] leading-5 text-slate-400">
            Static UI only — no real payments or messages are sent.
          </p>
        </footer>
      </div>
    </div>
  );
}

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Grid2X2,
  Map,
  Users,
  CalendarClock,
  Receipt,
  MessageCircle,
  Settings,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  ArrowUpRight,
  Command,
  ClipboardCheck,
} from "lucide-react";
import Brand from "../components/common/Brand";

const GOLD = "#e4c48a";

const groups = [
  {
    label: "Workspace",
    items: [
      {
        to: "/admin/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        end: true,
      },
      { to: "/admin/projects", label: "Projects", icon: Grid2X2 },
      { to: "/admin/brokers", label: "Brokers", icon: Users },
      { to: "/admin/leads", label: "Leads", icon: Users },
      { to: "/admin/plots", label: "Plot inventory", icon: Grid2X2 },
      { to: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
      { to: "/admin/customers", label: "Customers.", icon: Users },
      { to: "/admin/layout", label: "Layout editor", icon: Map },
      {
        to: "/admin/installments",
        label: "Installments",
        icon: CalendarClock,
        badge: "3",
      },
      { to: "/admin/payments", label: "Payments & receipts", icon: Receipt },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        to: "/admin/reminders",
        label: "WhatsApp reminders",
        icon: MessageCircle,
      },
    ],
  },
];

function NavItem({ item, collapsed, onClose }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-[12px] font-semibold",
          "transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c48a]/70",
          collapsed ? "justify-center px-0" : "",
          isActive
            ? "bg-gradient-to-r from-white/[0.14] to-white/[0.04] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "text-white/60 hover:bg-white/[0.06] hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute -left-3 top-2.5 h-6 w-[3px] rounded-r-full"
              style={{ background: GOLD }}
            />
          )}
          <span
            className={[
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200",
              isActive
                ? "text-[#062a20] shadow-md shadow-black/20"
                : "text-white/55 group-hover:bg-white/10 group-hover:text-[#e4c48a]",
            ].join(" ")}
            style={isActive ? { background: GOLD } : undefined}
          >
            <Icon size={17} strokeWidth={isActive ? 2.3 : 1.8} />
          </span>

          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={[
                    "grid h-[22px] min-w-[22px] place-items-center rounded-lg px-1.5 text-[10px] font-bold tabular-nums",
                    isActive
                      ? "text-[#062a20]"
                      : "border border-[#e4c48a]/30 bg-[#e4c48a]/10 text-[#e4c48a]",
                  ].join(" ")}
                  style={isActive ? { background: GOLD } : undefined}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );
}

function FooterButton({ icon: Icon, label, onClick, collapsed }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={[
        "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-[11px] font-semibold text-white/55 transition",
        "hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c48a]/70",
        collapsed ? "justify-center px-0" : "",
      ].join(" ")}
    >
      <Icon size={16} strokeWidth={1.9} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
  onSettings,
  onHelp,
}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#041f18]/60 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Admin sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/10 bg-[#062a20] text-white",
          "transition-[width,transform] duration-300 ease-in-out shadow-[8px_0_40px_rgba(4,31,24,0.25)] lg:shadow-none",
          collapsed ? "w-[82px]" : "w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Soft glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#1b7a5a]/30 blur-3xl"
        />

        {/* Brand header */}
        <div
          className={[
            "relative flex h-[82px] shrink-0 items-center border-b border-white/10",
            collapsed ? "justify-center px-2" : "justify-between px-5",
          ].join(" ")}
        >
          <div className="min-w-0">
            <Brand light compact={collapsed} />
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="custom-scrollbar relative mt-5 min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 pb-4"
        >
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <div className="mb-2 flex items-center justify-between px-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.19em] text-white/35">
                    {group.label}
                  </span>
                  {group.label === "Workspace" && (
                    <Command size={12} className="text-white/25" />
                  )}
                </div>
              ) : (
                <div
                  className="mx-auto mb-3 h-px w-8 bg-white/10"
                  aria-hidden="true"
                />
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* WhatsApp reminders card */}
        {!collapsed ? (
          <NavLink
            to="/admin/reminders"
            onClick={onClose}
            className="group relative mx-3 mb-4 block overflow-hidden rounded-2xl border border-[#e4c48a]/25 bg-gradient-to-br from-[#e4c48a]/15 to-white/[0.03] p-3.5 transition hover:border-[#e4c48a]/50"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-[#062a20]"
                style={{ background: GOLD }}
              >
                <MessageCircle size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-white">
                  Payment reminders
                </p>
                <p className="mt-0.5 text-[9px] text-white/50">
                  Keep buyers on track
                </p>
              </div>
              <ArrowUpRight
                size={14}
                className="text-[#e4c48a] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">
                Integration
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4c48a]/15 px-2 py-1 text-[9px] font-bold text-[#e4c48a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e4c48a]" /> Demo
              </span>
            </div>
          </NavLink>
        ) : (
          <div className="mx-3 mb-4 flex justify-center">
            <NavLink
              to="/admin/reminders"
              onClick={onClose}
              title="Payment reminders"
              aria-label="Payment reminders"
              className="grid h-11 w-11 place-items-center rounded-xl border border-[#e4c48a]/30 bg-[#e4c48a]/10 text-[#e4c48a] transition hover:bg-[#e4c48a]/20"
            >
              <MessageCircle size={18} />
            </NavLink>
          </div>
        )}

        {/* Footer */}
        <div className="relative shrink-0 border-t border-white/10 bg-black/15 px-3 pb-3 pt-2">
          <FooterButton
            icon={Settings}
            label="Settings"
            onClick={onSettings}
            collapsed={collapsed}
          />
          <FooterButton
            icon={LifeBuoy}
            label="Help & support"
            onClick={onHelp}
            collapsed={collapsed}
          />

          <div
            className={[
              "mt-2 flex items-center gap-2.5 border-t border-white/10 pt-3",
              collapsed ? "justify-center" : "px-1",
            ].join(" ")}
          >
            <div
              title="Talha Owner"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold text-[#062a20] ring-2 ring-[#e4c48a]/30"
              style={{ background: GOLD }}
            >
              TO
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-white">
                    Talha Owner
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[9px] text-white/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
                    Administrator
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  title="Back to website"
                  aria-label="Back to website"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-[#e4c48a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c48a]/70"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-[10px] font-semibold text-white/55 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c48a]/70"
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

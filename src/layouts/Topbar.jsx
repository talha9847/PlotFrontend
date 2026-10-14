import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Globe,
  LogOut,
  Plus,
  Receipt,
  Search,
  UserPlus,
} from "lucide-react";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const HIDE_NEW_BOOKING = ["Overview", "Installments", "Payments & receipts"];

// Replace with real notifications from your API
const NOTIFICATIONS = [
  {
    icon: CalendarClock,
    text: "3 installments are due this week",
    time: "Today",
    to: "/admin/installments",
  },
  {
    icon: Receipt,
    text: "Receipt generated for Plot A-12",
    time: "2h ago",
    to: "/admin/payments",
  },
  {
    icon: UserPlus,
    text: "New customer enquiry received",
    time: "Yesterday",
    to: "/admin/customers",
  },
];

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    const esc = (e) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [ref, onOutside]);
}

export default function Topbar({
  title = "Overview",
  subtitle = "A quick look at your land project and collections.",
}) {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const userRef = useRef(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useClickOutside(bellRef, () => setBellOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));

  // Cmd/Ctrl + K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showNewBooking = !HIDE_NEW_BOOKING.includes(title);
  const pop =
    "absolute right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-2xl shadow-[#062a20]/15";

  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-[#e3e9e0] bg-[#fafaf6]/90 px-5 backdrop-blur-xl sm:px-8">
      <div className="min-w-0">
        <h1
          className="truncate text-[22px] font-semibold leading-none tracking-[-0.02em] text-[#14231d]"
          style={DISPLAY}
        >
          {title}
          <span className="text-[#e4c48a]">.</span>
        </h1>
        <p className="mt-1.5 hidden truncate text-[11px] text-[#5b6b63] sm:block">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <label className="group hidden h-10 w-[240px] items-center gap-2.5 rounded-xl border border-[#dfe5dc] bg-white px-3 transition focus-within:w-[300px] focus-within:border-[#1b7a5a] focus-within:ring-4 focus-within:ring-[#1b7a5a]/15 xl:flex">
          <Search
            size={15}
            className="text-slate-400 transition group-focus-within:text-[#1b7a5a]"
          />
          <input
            ref={searchRef}
            placeholder="Search plots, customers…"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#14231d] outline-none placeholder:font-normal placeholder:text-slate-400"
          />
          <kbd className="whitespace-nowrap rounded-md border border-[#dfe5dc] bg-[#fafaf6] px-1.5 py-1 text-[9px] font-semibold text-slate-400">
            ⌘ K
          </kbd>
        </label>

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={bellOpen}
            onClick={() => {
              setBellOpen((o) => !o);
              setUserOpen(false);
            }}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dfe5dc] bg-white text-slate-500 transition hover:border-[#1b7a5a] hover:text-[#0b3d2e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/15"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e4c48a] ring-2 ring-white" />
          </button>
          {bellOpen && (
            <div className={`${pop} w-[320px]`}>
              <div className="flex items-center justify-between border-b border-[#eef2ec] px-4 py-3">
                <p className="text-sm font-bold text-[#14231d]">
                  Notifications
                </p>
                <span className="rounded-full bg-[#e4c48a]/25 px-2 py-0.5 text-[10px] font-bold text-[#7a5d1c]">
                  {NOTIFICATIONS.length} new
                </span>
              </div>
              <ul>
                {NOTIFICATIONS.map(({ icon: Icon, text, time, to }) => (
                  <li key={text}>
                    <button
                      type="button"
                      onClick={() => {
                        setBellOpen(false);
                        navigate(to);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f3f7f1]"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#1b7a5a]">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold leading-5 text-[#14231d]">
                          {text}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {time}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* New booking */}
        {showNewBooking && (
          <button
            type="button"
            onClick={() => navigate("/admin/plots")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b3d2e] px-3.5 text-xs font-extrabold text-white shadow-lg shadow-[#0b3d2e]/25 transition hover:bg-[#0f5340] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/30 sm:px-4"
          >
            <Plus size={15} style={{ color: "#e4c48a" }} />
            <span className="hidden sm:inline">New booking</span>
          </button>
        )}

        {/* User menu */}
        <div
          ref={userRef}
          className="relative hidden border-l border-[#dfe5dc] pl-3 sm:block"
        >
          <button
            type="button"
            aria-expanded={userOpen}
            aria-label="Account menu"
            onClick={() => {
              setUserOpen((o) => !o);
              setBellOpen(false);
            }}
            className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/15"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b3d2e] text-[10px] font-extrabold text-[#e4c48a] ring-2 ring-[#e4c48a]/40">
              TO
            </span>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition ${userOpen ? "rotate-180" : ""}`}
            />
          </button>
          {userOpen && (
            <div className={`${pop} w-[220px]`}>
              <div className="border-b border-[#eef2ec] px-4 py-3">
                <p className="text-sm font-bold text-[#14231d]">Talha Owner</p>
                <p className="text-[11px] text-[#5b6b63]">Administrator</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-[#3f4f48] transition hover:bg-[#f3f7f1]"
              >
                <Globe size={15} /> View website
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex w-full items-center gap-3 border-t border-[#eef2ec] px-4 py-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

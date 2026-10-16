import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  LockKeyhole,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import Brand from "../components/common/Brand";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#062a20] text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: .4; transform: scale(.95); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes ring {
          0% { transform: scale(.8); opacity: .5; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @keyframes shield {
          from { opacity: 0; transform: scale(.8) rotate(-8deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 10%,rgba(27,122,90,.35),transparent),linear-gradient(135deg,#041f18,#0b3d2e 60%,#041f18)",
        }}
      />

      {/* Animated rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/4 h-52 w-52 rounded-full border border-white/10 sm:h-64 sm:w-64 lg:h-80 lg:w-80"
        style={{ animation: "ring 6s ease-out infinite" }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/4 h-52 w-52 rounded-full border border-white/10 sm:h-64 sm:w-64 lg:h-80 lg:w-80"
        style={{ animation: "ring 6s ease-out 3s infinite" }}
      />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <Brand light />
      </header>

      {/* Main content */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-4 pb-10 pt-4 sm:gap-12 sm:px-6 sm:pb-14 sm:pt-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-12">
        {/* Error content */}
        <div className="min-w-0" style={{ animation: "up .7s ease-out both" }}>
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur sm:px-4 sm:text-[10px] sm:tracking-[0.18em]">
            <ShieldAlert
              size={14}
              className="shrink-0"
              style={{ color: GOLD }}
            />
            Error 403 · Forbidden
          </p>

          <h1
            className="mt-5 font-semibold leading-[0.9] tracking-[-0.05em] sm:mt-6"
            style={{
              ...DISPLAY,
              fontSize: "clamp(4.5rem, 18vw, 11rem)",
            }}
          >
            4
            <span className="italic" style={{ color: GOLD }}>
              0
            </span>
            3
          </h1>

          <h2
            className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl"
            style={DISPLAY}
          >
            This area is{" "}
            <span className="italic" style={{ color: GOLD }}>
              restricted.
            </span>
          </h2>

          <p className="mt-4 max-w-md text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
            You don&apos;t have permission to access this page. Your current
            account may not have the required role or access privileges.
          </p>

          {/* Responsive actions */}
          <div className="mt-7 flex flex-col items-stretch gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center sm:mt-9">
            <Link
              to="/"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold text-[#062a20] shadow-lg shadow-black/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e4c48a]/50 sm:px-7 sm:py-4"
              style={{ background: GOLD }}
            >
              Back to home
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:py-4"
            >
              <ArrowLeft size={16} />
              Go back
            </button>

            <Link
              to="/admin"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 min-[420px]:px-3 sm:py-4"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
          </div>

          <p className="mt-5 max-w-md text-xs leading-5 text-white/40 sm:mt-6">
            Think this is a mistake? Contact your administrator to request
            access.
          </p>
        </div>

        {/* Security illustration */}
        <div
          className="mx-auto w-full min-w-0 max-w-sm"
          style={{ animation: "up .9s ease-out .15s both" }}
          aria-hidden="true"
        >
          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 sm:text-[10px] sm:tracking-[0.18em]">
                Security checkpoint
              </span>

              <span
                className="rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]"
                style={{
                  borderColor: "rgba(228,196,138,.35)",
                  color: GOLD,
                  background: "rgba(228,196,138,.08)",
                }}
              >
                Restricted
              </span>
            </div>

            {/* Shield animation */}
            <div className="relative mx-auto mb-6 grid aspect-square w-full max-w-48 place-items-center sm:mb-8">
              <div
                className="absolute inset-0 rounded-full border border-white/10"
                style={{ animation: "pulse 3s ease-in-out infinite" }}
              />

              <div
                className="absolute inset-4 rounded-full border border-white/10"
                style={{ animation: "pulse 3s ease-in-out .5s infinite" }}
              />

              <div
                className="relative grid h-[min(8rem,65%)] w-[min(8rem,65%)] place-items-center rounded-[1.5rem] border border-[#e4c48a]/30 bg-[#e4c48a]/10 shadow-2xl sm:rounded-[2rem]"
                style={{ animation: "shield .8s ease-out both" }}
              >
                <ShieldCheck
                  className="h-12 w-12 sm:h-16 sm:w-16"
                  strokeWidth={1.2}
                  style={{ color: GOLD }}
                />

                <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full border border-[#062a20] bg-[#b96c55] text-white shadow-lg sm:h-10 sm:w-10">
                  <LockKeyhole size={16} />
                </span>
              </div>
            </div>

            {/* Security status */}
            <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <LockKeyhole size={16} style={{ color: GOLD }} />
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90">
                    Access restricted
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Required permissions not met
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-white/45">Security status</span>

                <span className="flex items-center gap-2 font-semibold text-[#e4c48a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e4c48a]" />
                  Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

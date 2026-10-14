import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  MapPinOff,
} from "lucide-react";
import Brand from "../components/common/Brand";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

// 5 x 4 mini layout. "x" marks the missing plot.
const GRID = "aabsaabxbaassabaasbb".split("");
const CELL = {
  a: "rgba(111,207,159,.85)",
  b: GOLD,
  s: "rgba(255,255,255,.22)",
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cells = useMemo(() => GRID.map((t, i) => ({ t, i })), []);

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#062a20] text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap');
      @keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
      @keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
      @keyframes blink{0%,100%{opacity:.35}50%{opacity:1}}
      @keyframes ring{0%{transform:scale(.8);opacity:.5}100%{transform:scale(1.6);opacity:0}}`}</style>

      {/* Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 10%,rgba(27,122,90,.35),transparent),linear-gradient(135deg,#041f18,#0b3d2e 60%,#041f18)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-1/4 h-80 w-80 rounded-full border border-white/10"
        style={{ animation: "ring 6s ease-out infinite" }}
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-1/4 h-80 w-80 rounded-full border border-white/10"
        style={{ animation: "ring 6s ease-out 3s infinite" }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Brand light />
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 pb-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr]">
        <div style={{ animation: "up .7s ease-out both" }}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            <MapPinOff size={13} style={{ color: GOLD }} /> Error 404
          </p>

          <h1
            className="mt-6 font-semibold leading-[0.9] tracking-[-0.05em]"
            style={{ ...DISPLAY, fontSize: "clamp(5rem,16vw,11rem)" }}
          >
            4
            <span className="italic" style={{ color: GOLD }}>
              0
            </span>
            4
          </h1>

          <h2
            className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
            This plot doesn&apos;t{" "}
            <span className="italic" style={{ color: GOLD }}>
              exist.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-white/65">
            We couldn&apos;t find the page you were looking for. It may have
            moved, or the link may be incorrect.
          </p>
          <p
            className="mt-3 max-w-md truncate rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 font-mono text-xs text-white/50"
            title={pathname}
          >
            {pathname}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-extrabold text-[#062a20] shadow-lg shadow-black/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e4c48a]/50"
              style={{ background: GOLD }}
            >
              Back to home{" "}
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-4 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              <ArrowLeft size={16} /> Go back
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-3 py-4 text-sm font-bold text-white/60 transition hover:text-white"
            >
              <LayoutDashboard size={15} /> Dashboard
            </Link>
          </div>
        </div>

        {/* Plot grid illustration with one missing plot */}
        <div
          className="mx-auto w-full max-w-sm"
          style={{ animation: "up .9s ease-out .15s both" }}
          aria-hidden="true"
        >
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
              <span>Site layout</span>
              <span style={{ color: GOLD }}>1 plot missing</span>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {cells.map(({ t, i }) =>
                t === "x" ? (
                  <span
                    key={i}
                    className="grid aspect-square place-items-center rounded-lg border-2 border-dashed text-sm font-extrabold"
                    style={{
                      borderColor: GOLD,
                      color: GOLD,
                      animation: "blink 1.6s ease-in-out infinite",
                    }}
                  >
                    ?
                  </span>
                ) : (
                  <span
                    key={i}
                    className="aspect-square rounded-lg"
                    style={{
                      background: CELL[t],
                      opacity: 0,
                      animation: `pop .5s ease-out ${0.3 + i * 0.05}s forwards`,
                    }}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

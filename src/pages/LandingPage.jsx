import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Check,
  ChevronDown,
  Compass,
  FileCheck2,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Trees,
  Droplets,
  Zap,
  Route,
  Fence,
  Sun,
  X,
} from "lucide-react";

/* ====== EDIT THESE ====== */
const PROJECT = {
  name: "Plotwise",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  location: "Near Kamrej, Surat, Gujarat 394185",
};
const G = "#0b3d2e",
  GD = "#062a20",
  GOLD = "#e4c48a",
  CREAM = "#fafaf6",
  SAGE = "#e9eee5";
const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

const collections = [
  {
    n: "01",
    name: "The Garden Collection",
    size: "1,200–1,500 sq.ft.",
    price: "₹18L onwards",
    tag: "MOST LOVED",
    text: "Green-facing plots with room to imagine a slower, more considered life.",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    n: "02",
    name: "The Corner Collection",
    size: "1,500–1,800 sq.ft.",
    price: "₹22.5L onwards",
    tag: "LIMITED RELEASE",
    text: "Distinctive corner positions with the flexibility to shape your future plans.",
    img: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    n: "03",
    name: "The Essentials Collection",
    size: "900–1,200 sq.ft.",
    price: "₹15L onwards",
    tag: "A SMART START",
    text: "A thoughtful first step towards owning a place of your own.",
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
];
const amenities = [
  [
    Route,
    "40 ft internal roads",
    "Wide, black-top roads with proper drainage.",
  ],
  [Trees, "Landscaped garden", "A central green park for evening walks."],
  [Droplets, "Water connection", "Underground pipeline to every plot."],
  [Zap, "Electricity ready", "Street lighting and power lines in place."],
  [Fence, "Gated boundary", "Compound wall with a secure entrance."],
  [FileCheck2, "Clear titles", "Verified documents, shared before you book."],
];
const steps = [
  ["Enquire", "Share your requirement. We call back the same day."],
  ["Visit the site", "Walk the land with our team. No pressure."],
  ["Verify documents", "Title and layout plan shared upfront."],
  ["Book your plot", "Token, agreement and a clear payment schedule."],
  ["Registration", "Sale deed registered, possession handed over."],
];
const faqs = [
  [
    "Are the plots legally clear?",
    "Yes. Title documents and the approved layout plan are shared before any booking so you can verify them with your own advisor.",
  ],
  [
    "Can I get a home loan for a plot?",
    "Most banks offer plot loans. Use the calculator above to estimate your EMI, and our team can guide you on documentation.",
  ],
  [
    "Can I visit the site before deciding?",
    "Absolutely. Book a visit and we will walk you through the layout, roads and your shortlisted plots.",
  ],
  [
    "Are prices fixed?",
    "Prices shown are starting prices. Final pricing depends on plot size, facing and position, and is confirmed by the project team.",
  ],
];
const nav = [
  ["The collection", "plots"],
  ["Amenities", "amenities"],
  ["Plan", "plan"],
  ["Contact", "contact"],
];

/* ====== helpers ====== */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return setOn(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out ${on ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

function CountUp({ to, suffix = "" }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {v}
      {suffix}
    </span>
  );
}

function Eyebrow({ children, light }) {
  return (
    <p
      className="text-[11px] font-extrabold uppercase tracking-[0.22em]"
      style={{ color: light ? GOLD : "#1b7a5a" }}
    >
      {children}
    </p>
  );
}

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

function Slider({ label, value, set, min, max, step, fmt }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs font-semibold text-[#14231d]">
        {label}
        <span className="text-base font-bold" style={{ ...DISPLAY, color: G }}>
          {fmt(value)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer"
        style={{ accentColor: G }}
      />
    </label>
  );
}

/* ====== page ====== */
export default function LandingPage() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    interest: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [price, setPrice] = useState(2000000);
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(9);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const emi = useMemo(() => {
    const loan = price * (1 - down / 100),
      r = rate / 1200,
      n = years * 12;
    const e = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { e, loan, interest: e * n - loan };
  }, [price, down, years, rate]);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  };
  const enquire = (interest = "") => {
    setForm((f) => ({ ...f, interest }));
    go("contact");
  };
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const wa = (text) =>
    `https://wa.me/${PROJECT.whatsapp}?text=${encodeURIComponent(text)}`;

  const submit = (e) => {
    e.preventDefault();
    const text = `New enquiry\nName: ${form.name}\nPhone: ${form.phone}\nInterested in: ${form.interest || "Not specified"}\nNote: ${form.message || "-"}`;
    window.open(wa(text), "_blank", "noopener");
    setSent(true);
  };

  const inputCls =
    "mt-2 w-full rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm font-medium text-[#14231d] outline-none transition focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15";

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 text-[#14231d] lg:pb-0"
      style={{
        background: CREAM,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap');
      html{scroll-behavior:smooth}
      @keyframes kb{from{transform:scale(1)}to{transform:scale(1.08)}}
      @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>

      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition duration-300 ${scrolled ? "shadow-lg backdrop-blur-md" : ""}`}
        style={{ background: scrolled ? "rgba(6,42,32,.94)" : "transparent" }}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 text-white"
            aria-label="Home"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ background: GOLD, color: GD }}
            >
              <Leaf size={18} />
            </span>
            <span
              className="text-xl font-semibold tracking-tight"
              style={DISPLAY}
            >
              {PROJECT.name}
            </span>
          </button>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {nav.map(([l, id]) => (
              <button
                key={id}
                onClick={() => go(id)}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 transition hover:text-white"
              >
                {l}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <button
              onClick={() => navigate("/login")}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 hover:text-white"
            >
              Owner login
            </button>
            <button
              onClick={() => go("contact")}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition hover:brightness-110"
              style={{ background: GOLD, color: GD }}
            >
              Arrange a visit <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white lg:hidden"
            onClick={() => setMenu(!menu)}
            aria-label="Menu"
            aria-expanded={menu}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menu && (
          <div
            className="px-6 pb-6 pt-2 text-white lg:hidden"
            style={{ background: GD }}
          >
            {nav.map(([l, id]) => (
              <button
                key={id}
                onClick={() => go(id)}
                className="flex w-full items-center justify-between border-b border-white/10 py-4 text-xs font-bold uppercase tracking-[0.14em]"
              >
                {l}
                <ArrowUpRight size={14} />
              </button>
            ))}
            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: GOLD }}
            >
              Owner login
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section
          className="relative flex min-h-[760px] items-end overflow-hidden pb-24 pt-36 text-white sm:min-h-[860px]"
          style={{ background: GD }}
        >
          <img
            src="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=2200&q=85"
            alt="Green open landscape"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ animation: "kb 22s ease-out forwards" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg,rgba(4,31,24,.95) 0%,rgba(4,31,24,.72) 45%,rgba(4,31,24,.15) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041f18]/80 via-transparent to-transparent" />
          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_280px]">
            <div className="max-w-[860px]">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.17em] text-white/85 backdrop-blur">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: GOLD }}
                />{" "}
                Premium residential plots · Surat
              </div>
              <h1
                className="font-semibold leading-[0.95] tracking-[-0.04em]"
                style={{ ...DISPLAY, fontSize: "clamp(3.3rem,8.5vw,7rem)" }}
              >
                Make room
                <br />
                for{" "}
                <span className="italic" style={{ color: GOLD }}>
                  what matters.
                </span>
              </h1>
              <p className="mt-7 max-w-[500px] text-base leading-8 text-white/75">
                A considered collection of residential plots, created for the
                lives you are building and the possibilities still ahead.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => go("plots")}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-extrabold transition hover:brightness-110"
                  style={{ background: GOLD, color: GD }}
                >
                  Explore the collection <ArrowRight size={17} />
                </button>
                <button
                  onClick={() => go("plan")}
                  className="inline-flex items-center gap-3 text-sm font-bold text-white/85 hover:text-white"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35">
                    <Calculator size={15} />
                  </span>{" "}
                  Plan your purchase
                </button>
              </div>
            </div>
            <aside
              className="hidden border-l border-white/25 pb-2 pl-7 lg:block"
              style={{ animation: "fl 6s ease-in-out infinite" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: GOLD }}
              >
                A place to begin
              </p>
              <p
                className="mt-4 text-3xl font-semibold leading-tight"
                style={DISPLAY}
              >
                Not just land.
                <br />
                <span className="italic text-white/65">Your next chapter.</span>
              </p>
              <p className="mt-6 flex items-center gap-2 text-xs text-white/65">
                <MapPin size={15} style={{ color: GOLD }} /> Surat, Gujarat
              </p>
            </aside>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="grid grid-cols-2 gap-y-8 border-b border-[#dfe5dc] pb-12 sm:grid-cols-4">
            {[
              [120, "+", "Premium plots"],
              [8, " acres", "Of planned layout"],
              [40, " ft", "Internal roads"],
              [100, "%", "Clear titles"],
            ].map(([n, s, l]) => (
              <div
                key={l}
                className="sm:border-l sm:border-[#dfe5dc] sm:px-8 sm:first:border-0 sm:first:pl-0"
              >
                <p
                  className="text-4xl font-semibold tracking-tight sm:text-5xl"
                  style={{ ...DISPLAY, color: G }}
                >
                  <CountUp to={n} suffix={s} />
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section id="plots" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="grid gap-5 md:grid-cols-[1.1fr_.7fr] md:items-end">
              <div>
                <Eyebrow>The collection · 01—03</Eyebrow>
                <h2
                  className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
                  style={DISPLAY}
                >
                  Find a little space{" "}
                  <span className="italic" style={{ color: "#1b7a5a" }}>
                    for a lot of possibility.
                  </span>
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-7 text-[#5b6b63] md:justify-self-end">
                Prices are starting prices and should be confirmed with the
                project team.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {collections.map((c, i) => (
                <Reveal
                  key={c.n}
                  delay={i * 110}
                  className={i === 1 ? "md:mt-10" : ""}
                >
                  <article className="group">
                    <div
                      className="relative h-[340px] overflow-hidden rounded-3xl sm:h-[400px]"
                      style={{ background: SAGE }}
                    >
                      <img
                        src={c.img}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#041f18]/75 via-transparent to-[#041f18]/15" />
                      <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/20 px-3 py-2 text-[9px] font-extrabold tracking-[0.15em] text-white backdrop-blur-md">
                        {c.tag}
                      </span>
                      <span
                        className="absolute bottom-4 left-5 text-6xl font-semibold text-white/70"
                        style={DISPLAY}
                      >
                        {c.n}
                      </span>
                      <button
                        onClick={() => enquire(c.name)}
                        aria-label={`Enquire about ${c.name}`}
                        className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full transition duration-300 hover:rotate-45 hover:bg-white"
                        style={{ background: GOLD, color: GD }}
                      >
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                    <div className="border-b border-[#dfe5dc] pb-6 pt-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3
                          className="text-xl font-bold tracking-tight"
                          style={DISPLAY}
                        >
                          {c.name}
                        </h3>
                        <span className="pt-1 text-[11px] font-bold text-[#1b7a5a]">
                          {c.size}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#5b6b63]">
                        {c.text}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <p className="text-base font-extrabold">{c.price}</p>
                        <button
                          onClick={() => enquire(c.name)}
                          className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1b7a5a] transition hover:gap-3"
                        >
                          Enquire <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section
          id="amenities"
          className="scroll-mt-16 py-16 sm:py-24"
          style={{ background: SAGE }}
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <Eyebrow>Life around the land</Eyebrow>
              <h2
                className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
                style={DISPLAY}
              >
                Everything a good plot{" "}
                <span className="italic" style={{ color: "#1b7a5a" }}>
                  should come with.
                </span>
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {amenities.map(([Icon, t, d], i) => (
                <Reveal key={t} delay={i * 70}>
                  <div className="group h-full rounded-2xl border border-[#d4ddd1] bg-white/70 p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-black/5">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-xl bg-[#e9f3ee] text-[#1b7a5a] transition group-hover:text-white"
                      style={{}}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-5 text-base font-bold">{t}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5b6b63]">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
            <Reveal className="relative">
              <img
                src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80"
                alt="Trees and open space"
                loading="lazy"
                className="h-[420px] w-full rounded-3xl object-cover sm:h-[560px]"
              />
              <div
                className="absolute -bottom-5 right-4 rounded-2xl px-6 py-5 text-white shadow-xl"
                style={{ background: G }}
              >
                <p className="text-2xl font-semibold italic" style={DISPLAY}>
                  Room to become.
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  A more thoughtful way to own land
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Eyebrow>A more thoughtful way</Eyebrow>
              <h2
                className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
                style={DISPLAY}
              >
                Good land is a beginning.{" "}
                <span className="italic" style={{ color: "#1b7a5a" }}>
                  Good guidance changes everything.
                </span>
              </h2>
              <div className="mt-9 space-y-6">
                {[
                  [
                    Compass,
                    "A layout with intention",
                    "Understand the layout, plot dimensions and options before you decide.",
                  ],
                  [
                    ShieldCheck,
                    "Clarity before commitment",
                    "A straightforward conversation about pricing, documents and process.",
                  ],
                  [
                    Sun,
                    "A future of your own",
                    "Choose a space for a home, an investment or a new chapter.",
                  ],
                ].map(([I, t, d], i) => (
                  <div
                    key={t}
                    className="flex gap-4 border-t border-[#dfe5dc] pt-6"
                  >
                    <span
                      className="pt-0.5 text-sm font-bold text-[#1b7a5a]"
                      style={DISPLAY}
                    >
                      0{i + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-extrabold">{t}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-[#5b6b63]">
                        {d}
                      </p>
                    </div>
                    <I size={20} className="mt-1 shrink-0 text-[#1b7a5a]" />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* EMI calculator */}
        <section
          id="plan"
          className="scroll-mt-16 py-16 sm:py-24"
          style={{ background: SAGE }}
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <Reveal>
              <Eyebrow>Plan your purchase</Eyebrow>
              <h2
                className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
                style={DISPLAY}
              >
                Know your numbers{" "}
                <span className="italic" style={{ color: "#1b7a5a" }}>
                  before you visit.
                </span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[#5b6b63]">
                Estimate your monthly instalment in seconds. Final figures
                depend on your lender and the project team's confirmed pricing.
              </p>
              <ol className="mt-10 space-y-5">
                {steps.map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ background: G }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-6 text-[#5b6b63]">
                      <b className="text-[#14231d]">{t}.</b> {d}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-3xl border border-[#d4ddd1] bg-white p-6 shadow-2xl shadow-black/5 sm:p-8">
                <div className="space-y-6">
                  <Slider
                    label="Plot price"
                    value={price}
                    set={setPrice}
                    min={1000000}
                    max={5000000}
                    step={50000}
                    fmt={inr}
                  />
                  <Slider
                    label="Down payment"
                    value={down}
                    set={setDown}
                    min={10}
                    max={60}
                    step={5}
                    fmt={(v) => v + "%"}
                  />
                  <Slider
                    label="Tenure"
                    value={years}
                    set={setYears}
                    min={3}
                    max={20}
                    step={1}
                    fmt={(v) => v + " yrs"}
                  />
                  <Slider
                    label="Interest rate"
                    value={rate}
                    set={setRate}
                    min={7}
                    max={14}
                    step={0.25}
                    fmt={(v) => v + "%"}
                  />
                </div>
                <div
                  className="mt-8 rounded-2xl p-6 text-white"
                  style={{ background: G }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: GOLD }}
                  >
                    Estimated monthly EMI
                  </p>
                  <p
                    className="mt-2 text-5xl font-semibold tracking-tight"
                    style={DISPLAY}
                  >
                    {inr(emi.e)}
                  </p>
                  <div className="mt-4 flex justify-between border-t border-white/15 pt-4 text-xs text-white/70">
                    <span>Loan {inr(emi.loan)}</span>
                    <span>Interest {inr(emi.interest)}</span>
                  </div>
                </div>
                <button
                  onClick={() => enquire("")}
                  className="mt-5 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1b7a5a] transition hover:gap-3"
                >
                  Discuss payment plans <ArrowUpRight size={15} />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Location */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <Reveal>
              <Eyebrow>The neighbourhood · Surat</Eyebrow>
              <h2
                className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
                style={DISPLAY}
              >
                Rooted here.
                <br />
                <span className="italic" style={{ color: "#1b7a5a" }}>
                  Connected to more.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#5b6b63]">
                Ask our team about the exact site, approach roads and nearby
                amenities.
              </p>
              <div className="mt-7 flex items-start gap-3 border-t border-[#dfe5dc] pt-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e9f3ee] text-[#1b7a5a]">
                  <MapPin size={17} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Visit the project</p>
                  <p className="mt-1 text-sm text-[#5b6b63]">
                    {PROJECT.location}
                  </p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(PROJECT.location)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#1b7a5a] px-6 py-3 text-xs font-extrabold text-[#1b7a5a] transition hover:bg-[#1b7a5a] hover:text-white"
              >
                Get directions <ArrowRight size={14} />
              </a>
            </Reveal>
            <Reveal delay={120}>
              <div
                className="relative min-h-[400px] overflow-hidden rounded-3xl sm:min-h-[500px]"
                style={{ background: GD }}
              >
                <img
                  src="https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1400&q=80"
                  alt="Open green landscape"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041f18]/85 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-3xl font-semibold" style={DISPLAY}>
                      A place with potential.
                    </p>
                    <p className="mt-2 text-xs text-white/70">
                      Exact directions shared on enquiry.
                    </p>
                  </div>
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                    style={{ background: GOLD, color: GD }}
                  >
                    <MapPin size={19} />
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24" style={{ background: SAGE }}>
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr]">
            <Reveal>
              <Eyebrow>Questions</Eyebrow>
              <h2
                className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
                style={DISPLAY}
              >
                Asked often.{" "}
                <span className="italic" style={{ color: "#1b7a5a" }}>
                  Answered plainly.
                </span>
              </h2>
            </Reveal>
            <div className="divide-y divide-[#cfd9cb] border-y border-[#cfd9cb]">
              {faqs.map(([q, a], i) => {
                const o = openFaq === i;
                return (
                  <div key={q}>
                    <button
                      onClick={() => setOpenFaq(o ? -1 : i)}
                      aria-expanded={o}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-extrabold"
                    >
                      {q}
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#1b7a5a] transition duration-300 ${o ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ${o ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}
                    >
                      <p className="overflow-hidden text-sm leading-6 text-[#5b6b63]">
                        {a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="scroll-mt-4 py-16 text-white sm:py-24"
          style={{ background: GD }}
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
            <Reveal>
              <Eyebrow light>Your next chapter starts here</Eyebrow>
              <h2
                className="mt-4 text-4xl font-semibold leading-[1.03] tracking-tight sm:text-6xl"
                style={DISPLAY}
              >
                Let's find the
                <br />
                <span className="italic" style={{ color: GOLD }}>
                  right ground.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/70">
                Tell us what you have in mind. We will help you understand the
                options and arrange a conversation or site visit.
              </p>
              <div className="mt-9 space-y-4 border-t border-white/15 pt-6 text-sm text-white/80">
                <a
                  href={`tel:${PROJECT.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 hover:text-white"
                >
                  <Phone size={16} style={{ color: GOLD }} />
                  {PROJECT.phone}
                </a>
                <a
                  href={wa("Hi, I'd like to know more about the plots.")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-white"
                >
                  <MessageCircle size={16} style={{ color: GOLD }} />
                  Chat on WhatsApp
                </a>
                <p className="flex items-center gap-3">
                  <MapPin size={16} style={{ color: GOLD }} />
                  {PROJECT.location}
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-3xl bg-[#fffefa] p-6 text-[#14231d] shadow-2xl sm:p-9">
                <Eyebrow>A personal conversation</Eyebrow>
                <h3
                  className="mb-7 mt-2 text-3xl font-semibold tracking-tight"
                  style={DISPLAY}
                >
                  Request a call back
                </h3>
                {sent ? (
                  <div className="py-10 text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9f3ee] text-[#1b7a5a]">
                      <Check size={26} />
                    </span>
                    <h4 className="mt-5 text-xl font-extrabold">
                      Thank you, {form.name}.
                    </h4>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#5b6b63]">
                      Your enquiry opened in WhatsApp. Press send there and our
                      team will reach out shortly.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-6 rounded-full border border-[#1b7a5a] px-6 py-3 text-xs font-extrabold text-[#1b7a5a]"
                    >
                      Send another enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-xs font-semibold">
                        Your name
                        <input
                          required
                          autoComplete="name"
                          value={form.name}
                          onChange={(e) => upd("name", e.target.value)}
                          placeholder="Full name"
                          className={inputCls}
                        />
                      </label>
                      <label className="block text-xs font-semibold">
                        Mobile number
                        <input
                          required
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          pattern="[+0-9 ]{10,15}"
                          value={form.phone}
                          onChange={(e) => upd("phone", e.target.value)}
                          placeholder="+91 00000 00000"
                          className={inputCls}
                        />
                      </label>
                    </div>
                    <label className="block text-xs font-semibold">
                      What are you looking for?
                      <select
                        value={form.interest}
                        onChange={(e) => upd("interest", e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Choose a collection</option>
                        {collections.map((c) => (
                          <option key={c.n} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-semibold">
                      Anything else?{" "}
                      <span className="font-normal text-[#5b6b63]">
                        (optional)
                      </span>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => upd("message", e.target.value)}
                        placeholder="Preferred plot size or visit time"
                        className={inputCls + " resize-y"}
                      />
                    </label>
                    <button
                      type="submit"
                      className="mt-2 flex w-full items-center justify-between rounded-full px-7 py-4 text-sm font-extrabold text-white transition hover:brightness-125"
                      style={{ background: G }}
                    >
                      Request a conversation
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="text-white" style={{ background: "#041f18" }}>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
          <div>
            <span className="text-xl font-semibold" style={DISPLAY}>
              {PROJECT.name}
            </span>
            <p className="mt-2 text-xs text-white/50">
              Thoughtfully planned plots for the lives you are building.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
            {nav.map(([l, id]) => (
              <button
                key={id}
                onClick={() => go(id)}
                className="hover:text-white"
              >
                {l}
              </button>
            ))}
            <button
              onClick={() => navigate("/login")}
              className="hover:text-white"
            >
              Owner login
            </button>
          </nav>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} {PROJECT.name}. All rights reserved.
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-white/10 p-3 backdrop-blur-md lg:hidden"
        style={{ background: "rgba(6,42,32,.95)" }}
      >
        <a
          href={`tel:${PROJECT.phone.replace(/\s/g, "")}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 py-3 text-xs font-bold text-white"
        >
          <Phone size={15} /> Call
        </a>
        <a
          href={wa("Hi, I'd like to know more about the plots.")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full py-3 text-xs font-extrabold"
          style={{ background: GOLD, color: GD }}
        >
          <MessageCircle size={15} /> WhatsApp
        </a>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Leaf,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import Brand from "../components/common/Brand";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import {
  Amenities,
  CountUp,
  EmiCalculator,
  Faq,
  Process,
  Reveal,
  StickyCta,
  sendLead,
  useScrolled,
} from "../components/landing/premium";
import { plots, project } from "../data/mockData";

const collections = [
  {
    number: "01",
    name: "The Garden Collection",
    description:
      "Green-facing plots with room to imagine a slower, more considered life.",
    size: "1,200–1,500 sq.ft.",
    price: "₹18L onwards",
    tag: "MOST LOVED",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Open green land beneath a wide sky",
  },
  {
    number: "02",
    name: "The Corner Collection",
    description:
      "Distinctive corner positions offering flexibility for your future plans.",
    size: "1,500–1,800 sq.ft.",
    price: "₹22.5L onwards",
    tag: "LIMITED RELEASE",
    image:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Contemporary architecture with clean geometric lines",
  },
  {
    number: "03",
    name: "The Essentials Collection",
    description: "A thoughtful first step towards owning a place of your own.",
    size: "900–1,200 sq.ft.",
    price: "₹15L onwards",
    tag: "A SMART START",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Quiet natural landscape with open space",
  },
];

const principles = [
  {
    number: "01",
    icon: Compass,
    title: "A layout with intention",
    description:
      "Understand the layout, plot dimensions and available options before you decide.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Clarity before commitment",
    description:
      "Have a straightforward conversation about pricing, documentation and the buying process.",
  },
  {
    number: "03",
    icon: Leaf,
    title: "A future of your own",
    description:
      "Choose a space that fits your plans, whether that means a home, an investment or a new chapter.",
  },
];

const navItems = [
  { label: "The collection", id: "plots" },
  { label: "Our approach", id: "philosophy" },
  { label: "Location", id: "location" },
  { label: "Contact", id: "contact" },
];

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  light = false,
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_.7fr] md:items-end">
      <div>
        <p
          className={`text-[10px] font-extrabold uppercase tracking-[0.22em] ${
            light ? "text-[#e4c48a]" : "text-brand-700"
          }`}
        >
          {eyebrow}
        </p>
        <h2
          className={`mt-4 max-w-[760px] font-display text-4xl font-semibold leading-[1.04] tracking-[-0.065em] sm:text-5xl lg:text-6xl ${
            light ? "text-white" : "text-ink"
          }`}
        >
          {title}{" "}
          <span
            className={`font-medium italic ${
              light ? "text-[#e4c48a]" : "text-brand-600"
            }`}
          >
            {accent}
          </span>
        </h2>
      </div>
      {description && (
        <p
          className={`max-w-lg text-sm leading-7 md:justify-self-end ${
            light ? "text-white/65" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function CollectionCard({ item, onEnquire, featured = false }) {
  return (
    <article className={`group min-w-0 ${featured ? "md:mt-10" : ""}`}>
      <div className="relative h-[300px] overflow-hidden rounded-2xl bg-brand-100 sm:h-[360px]">
        <img
          src={item.image}
          alt={item.imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/5 to-brand-900/15" />
        <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-brand-900/35 px-3 py-2 text-[9px] font-extrabold tracking-[0.15em] text-white backdrop-blur-md">
          {item.tag}
        </span>
        <span className="absolute bottom-4 left-5 font-display text-5xl font-semibold tracking-[-0.07em] text-white/75">
          {item.number}
        </span>
        <button
          type="button"
          onClick={() => onEnquire(item.name)}
          aria-label={`Enquire about ${item.name}`}
          className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-[#e4c48a] text-brand-900 transition duration-300 hover:rotate-45 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        >
          <ArrowUpRight size={19} />
        </button>
      </div>

      <div className="border-b border-line pb-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold tracking-[-0.04em] text-ink">
            {item.name}
          </h3>
          <span className="pt-1 text-[10px] font-bold text-brand-700">
            {item.size}
          </span>
        </div>
        <p className="mt-3 max-w-sm text-xs leading-6 text-muted">
          {item.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-ink">{item.price}</p>
          <button
            type="button"
            onClick={() => onEnquire(item.name)}
            className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700 transition hover:text-brand-900"
          >
            Enquire <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function PrincipleRow({ item }) {
  const Icon = item.icon;

  return (
    <div className="flex gap-4 border-t border-[#d4ddd1] pt-5">
      <span className="pt-1 font-display text-xs font-bold text-brand-600">
        {item.number}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold text-ink">{item.title}</h3>
        <p className="mt-1.5 text-xs leading-6 text-muted">
          {item.description}
        </p>
      </div>
      <Icon size={19} className="mt-1 shrink-0 text-brand-700" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const scrolled = useScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    interest: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const plotStats = useMemo(() => {
    const result = { total: plots.length, Available: 0, Booked: 0, Sold: 0 };
    plots.forEach((plot) => {
      const status = String(plot.status ?? "").toLowerCase();
      if (status === "available") result.Available += 1;
      if (status === "booked") result.Booked += 1;
      if (status === "sold") result.Sold += 1;
    });
    return result;
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const enquireAbout = (interest = "") => {
    setForm((current) => ({ ...current, interest }));
    scrollTo("contact");
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitForm = (event) => {
    event.preventDefault();
    sendLead(form, project.whatsapp || project.phone || "");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#fafaf6] text-ink">
      {/* Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition duration-300 ${scrolled ? "bg-brand-900/95 shadow-lg backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="container-wide flex h-[78px] items-center justify-between border-b border-white/15 sm:h-[86px]">
          <Brand light to="/" />

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 lg:flex"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75 transition hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75 transition hover:text-white"
            >
              Owner login
            </button>
            <Button
              variant="accent"
              size="md"
              onClick={() => scrollTo("contact")}
              className="!rounded-full"
            >
              Arrange a visit <ArrowUpRight size={15} />
            </Button>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-b border-white/10 bg-brand-900 px-6 py-6 text-white shadow-xl lg:hidden">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className="flex items-center justify-between rounded-lg px-2 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-white/80 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                  <ArrowUpRight size={14} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="mt-2 border-t border-white/15 px-2 pt-5 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#e4c48a]"
              >
                Owner login
              </button>
              <Button
                variant="accent"
                onClick={() => scrollTo("contact")}
                className="mt-3 !rounded-full"
              >
                Arrange a visit <ArrowUpRight size={15} />
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[720px] items-end bg-brand-900 pb-20 pt-32 text-white sm:min-h-[800px] sm:pb-28">
          <img
            src="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=2200&q=90"
            alt="Green landscape and open land"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,31,24,.96)_0%,rgba(4,31,24,.78)_43%,rgba(4,31,24,.18)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-transparent to-brand-900/35" />
          <div className="hero-noise pointer-events-none absolute inset-0 opacity-20" />

          <div className="container-wide relative z-10 grid items-end gap-12 lg:grid-cols-[1fr_270px]">
            <div className="max-w-[850px]">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.07] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.17em] text-white/80 backdrop-blur sm:text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e4c48a]" />A new
                perspective on land ownership · Surat
              </div>

              <h1 className="font-display text-[clamp(3.5rem,8.7vw,7.25rem)] font-semibold leading-[0.91] tracking-[-0.085em]">
                Make room
                <br />
                for{" "}
                <span className="font-medium italic text-[#e4c48a]">
                  what matters.
                </span>
              </h1>

              <p className="mt-7 max-w-[490px] text-sm leading-7 text-white/70 sm:mt-8 sm:text-base sm:leading-8">
                A considered collection of residential plots, created for the
                lives you&apos;re building and the possibilities still ahead.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => scrollTo("plots")}
                  className="!rounded-full"
                >
                  Explore the collection <ArrowRight size={17} />
                </Button>
                <button
                  type="button"
                  onClick={() => scrollTo("philosophy")}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white/80 transition hover:text-white"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/30">
                    <Sparkles size={13} />
                  </span>
                  Discover our approach
                </button>
              </div>
            </div>

            <aside className="hidden border-l border-white/25 pb-2 pl-7 lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4c48a]">
                A place to begin
              </p>
              <p className="mt-4 font-display text-3xl font-semibold leading-tight">
                Not just land.
                <br />
                <span className="font-medium italic text-white/65">
                  Your next chapter.
                </span>
              </p>
              <div className="mt-7 flex items-center gap-3 text-[10px] text-white/65">
                <MapPin size={15} className="text-[#e4c48a]" />
                Surat, Gujarat, India
              </div>
            </aside>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
          <button
            type="button"
            onClick={() => scrollTo("plots")}
            className="absolute bottom-7 right-7 hidden items-center gap-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/60 transition hover:text-white lg:flex"
          >
            Scroll to discover <ArrowDownRight size={16} />
          </button>
        </section>

        {/* Project snapshot */}
        <section className="bg-[#fafaf6] py-8 sm:py-11">
          <div className="container-wide grid grid-cols-2 gap-y-7 border-b border-line pb-9 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-line sm:pb-11">
            {[
              { numeric: plotStats.total, label: "Plots in this preview" },
              { numeric: plotStats.Available, label: "Currently available" },
              { numeric: plotStats.Booked, label: "Currently booked" },
              { value: "Surat", label: "Rooted in Gujarat" },
            ].map((stat) => (
              <Reveal key={stat.label} className="sm:px-7 first:sm:pl-0">
                <p className="font-display text-3xl font-bold tracking-[-0.06em] text-brand-800 sm:text-4xl">
                  {typeof stat.numeric === "number" ? (
                    <CountUp to={stat.numeric} />
                  ) : (
                    stat.value
                  )}
                  <span className="text-[#c7a365]">.</span>
                </p>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted sm:text-[10px]">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section id="plots" className="scroll-mt-8 py-20 sm:py-28">
          <div className="container-wide">
            <SectionHeading
              eyebrow="The collection · 01—03"
              title="Find a little space"
              accent="for a lot of possibility."
              description="Explore a selection of plot options designed to give your ideas room to take shape. Availability and prices shown here are illustrative and should be confirmed with the project team."
            />

            <div className="mt-11 grid gap-6 md:grid-cols-3 md:gap-5">
              {collections.map((item, index) => (
                <CollectionCard
                  key={item.number}
                  item={item}
                  featured={index === 1}
                  onEnquire={enquireAbout}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">
                    Looking for a specific plot?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Ask the team about dimensions, current availability and a
                    site visit.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => enquireAbout("")}
                className="!rounded-full"
              >
                Talk to our team <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </section>

        <Amenities />

        {/* Philosophy */}
        <section
          id="philosophy"
          className="scroll-mt-8 bg-[#e9eee5] py-20 sm:py-28"
        >
          <div className="container-wide grid items-center gap-12 lg:grid-cols-2">
            <div className="relative lg:pr-5">
              <div className="absolute -left-3 -top-3 h-20 w-20 border-l border-t border-brand-600/40 sm:-left-5 sm:-top-5 sm:h-24 sm:w-24" />
              <img
                src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=85"
                alt="Natural landscape with trees and open space"
                loading="lazy"
                className="h-[380px] w-full object-cover sm:h-[520px]"
              />
              <div className="absolute -bottom-5 right-0 bg-brand-800 px-6 py-5 text-white sm:right-[-18px]">
                <p className="font-display text-2xl font-semibold italic">
                  Room to become.
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/55">
                  A more thoughtful way to own land
                </p>
              </div>
            </div>

            <div className="lg:pl-8">
              <SectionHeading
                eyebrow="A more thoughtful way"
                title="Good land is a beginning."
                accent="Good guidance changes everything."
                description="Buying a plot is more than a transaction. It is a decision about the future. Start with clear information, a personal conversation and the confidence to choose at your own pace."
              />
              <div className="mt-8 space-y-5">
                {principles.map((item) => (
                  <PrincipleRow key={item.number} item={item} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollTo("contact")}
                className="mt-8 inline-flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-brand-800 transition hover:gap-4"
              >
                Start a conversation <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <EmiCalculator onEnquire={enquireAbout} />
        <Process />

        {/* Location */}
        <section id="location" className="scroll-mt-8 py-20 sm:py-28">
          <div className="container-wide">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
                  The neighbourhood · Surat
                </p>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] sm:text-6xl">
                  Rooted here.
                  <br />
                  <span className="font-medium italic text-brand-600">
                    Connected to more.
                  </span>
                </h2>
                <p className="mt-6 max-w-md text-sm leading-7 text-muted">
                  A location should work for the life you live today and the
                  life you plan for tomorrow. Ask our team about the exact site,
                  approach roads and nearby amenities.
                </p>

                <div className="mt-7 flex items-start gap-3 border-t border-line pt-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <MapPin size={17} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold">Visit the project</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {project.location}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => scrollTo("contact")}
                  className="mt-7 !rounded-full"
                >
                  Plan a site visit <ArrowRight size={14} />
                </Button>
              </div>

              <div className="group relative min-h-[380px] overflow-hidden rounded-2xl bg-brand-900 sm:min-h-[480px]">
                <img
                  src="https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1400&q=85"
                  alt="Open green landscape"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.025]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-brand-900/15" />
                <div className="absolute left-5 top-5 rounded-xl border border-white/25 bg-brand-900/40 px-4 py-3 backdrop-blur-md">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#e4c48a]">
                    Find your way here
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-white">
                    Surat, Gujarat
                  </p>
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7">
                  <div>
                    <p className="font-display text-2xl font-semibold sm:text-3xl">
                      A place with potential.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/65">
                      Exact directions and site details available on enquiry.
                    </p>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e4c48a] text-brand-900">
                    <MapPin size={19} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Faq />

        {/* Contact */}
        <section
          id="contact"
          className="scroll-mt-8 bg-brand-900 py-20 text-white sm:py-28"
        >
          <div className="container-wide grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="pt-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e4c48a]">
                Your next chapter starts here
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.03] tracking-[-0.07em] sm:text-6xl">
                Let&apos;s find the
                <br />
                <span className="font-medium italic text-[#e4c48a]">
                  right ground.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
                Tell us what you have in mind. We can help you understand the
                available options and arrange a conversation or site visit.
              </p>

              <div className="mt-9 space-y-4 border-t border-white/15 pt-6">
                <p className="flex items-center gap-3 text-xs text-white/75">
                  <Phone size={15} className="text-[#e4c48a]" />
                  {project.phone}
                </p>
                <p className="flex items-center gap-3 text-xs text-white/75">
                  <MapPin size={15} className="text-[#e4c48a]" />
                  {project.location}
                </p>
              </div>
            </div>

            <Card className="border-0 bg-[#fffefa] p-5 text-ink shadow-2xl shadow-black/10 sm:p-8 lg:p-9">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-700">
                    A personal conversation
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.05em] sm:text-3xl">
                    Request a call back
                  </h3>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <ArrowUpRight size={20} />
                </span>
              </div>

              {submitted ? (
                <div className="py-10 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700">
                    <Check size={25} />
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold">
                    Thanks, {form.name}.
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted">
                    This form is currently a frontend demo. Your enquiry has not
                    been sent or stored.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setSubmitted(false)}
                    className="mt-5 !rounded-full"
                  >
                    Send another enquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={submitForm} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Your name"
                      name="name"
                      autoComplete="name"
                      required
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      placeholder="Full name"
                    />
                    <Input
                      label="Mobile number"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={form.phone}
                      onChange={(event) =>
                        updateForm("phone", event.target.value)
                      }
                      placeholder="+91 00000 00000"
                    />
                  </div>

                  <Select
                    label="What are you looking for?"
                    name="interest"
                    value={form.interest}
                    onChange={(event) =>
                      updateForm("interest", event.target.value)
                    }
                    placeholder="Choose a collection"
                    options={collections.map((item) => ({
                      value: item.name,
                      label: item.name,
                    }))}
                  />

                  <label className="block text-xs font-semibold text-ink">
                    Anything else?{" "}
                    <span className="font-normal text-muted">(optional)</span>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={(event) =>
                        updateForm("message", event.target.value)
                      }
                      placeholder="Preferred plot size or visit time"
                      className="mt-2 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm font-medium outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                  </label>

                  <Button
                    type="submit"
                    variant="primary"
                    className="!mt-6 w-full !justify-between"
                  >
                    Request a conversation
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                      <ArrowRight size={16} />
                    </span>
                  </Button>
                  <p className="text-[10px] leading-5 text-muted">
                    Demo form only. Connect this form to your backend or CRM
                    before accepting real enquiries.
                  </p>
                </form>
              )}
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#062f25] pb-20 text-white lg:pb-0">
        <div className="container-wide flex flex-col justify-between gap-7 py-8 sm:flex-row sm:items-center">
          <div>
            <Brand light to="/" />
            <p className="mt-3 max-w-xs text-[10px] leading-5 text-white/45">
              Thoughtfully planned plots for the lives you&apos;re building.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="transition hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="transition hover:text-white"
            >
              Owner login
            </button>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="container-wide flex flex-col justify-between gap-2 py-4 text-[9px] text-white/35 sm:flex-row">
            <span>
              © {new Date().getFullYear()} Plotwise. All rights reserved.
            </span>
            <span>
              Illustrative concept. Verify project details, prices and contact
              information before publishing.
            </span>
          </div>
        </div>
      </footer>

      <StickyCta
        phone={project.phone || ""}
        whatsapp={project.whatsapp || project.phone || ""}
      />
    </div>
  );
}

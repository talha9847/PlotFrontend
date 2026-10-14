import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  MapPinned,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlotMap from "../components/common/PlotMap";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import { useToast } from "../components/common/Toast";
import { customers, inr, payments, plots } from "../data/mockData";
export default function DashboardPage() {
  const nav = useNavigate(),
    toast = useToast(),
    [plot, setPlot] = useState(null),
    [open, setOpen] = useState(false),
    [buyer, setBuyer] = useState({ name: "", phone: "", deposit: "" });
  const stats = [
    ["Total plots", "300", MapPinned],
    [
      "Available plots",
      String(plots.filter((p) => p.status === "Available").length),
      MapPinned,
    ],
    ["Active customers", "86", Users],
    ["Collections this month", "₹8.4L", CircleDollarSign],
  ];
  function book(e) {
    e.preventDefault();
    setOpen(false);
    toast(`Demo booking prepared for ${plot.plotNo}; nothing was saved.`);
    setBuyer({ name: "", phone: "", deposit: "" });
  }
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Wednesday, 14 October 2026</p>
          <h1 className="mt-2 text-3xl font-extrabold">Good morning, Admin</h1>
          <p className="mt-2 text-sm text-slate-500">
            Here's what's happening with your project.
          </p>
        </div>
        <Button onClick={() => nav("/admin/plots")}>
          <Plus size={16} />
          Manage plots
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, I]) => (
          <Card key={label} className="p-5">
            <div className="flex justify-between text-sm text-slate-500">
              {label}
              <I size={19} className="text-brand-700" />
            </div>
            <p className="mt-5 text-3xl font-extrabold">{value}</p>
            <p className="mt-2 text-xs text-slate-500">Sample project data</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card className="p-5">
          <div className="mb-5 flex justify-between">
            <div>
              <h2 className="font-extrabold">Plot overview</h2>
              <p className="mt-1 text-xs text-slate-500">
                Select an available plot to preview booking.
              </p>
            </div>
            <button
              onClick={() => nav("/admin/plots")}
              className="text-xs font-bold text-brand-700"
            >
              View all <ArrowRight size={14} className="inline" />
            </button>
          </div>
          <PlotMap
            compact
            onSelect={(p) => {
              setPlot(p);
              if (p.status === "Available") setOpen(true);
              else toast(`${p.plotNo} is ${p.status.toLowerCase()}.`, "info");
            }}
          />
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-extrabold">Upcoming collections</h2>
            <p className="mt-1 text-xs text-slate-500">
              Next 7 days · Sample data
            </p>
            <div className="mt-5 space-y-4">
              {customers.slice(0, 3).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-800">
                    {c.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="text-sm">{c.name}</b>
                    <p className="text-xs text-slate-500">
                      {c.plot} · Due {16 + i} Oct
                    </p>
                  </div>
                  <b className="text-sm">{inr(25000 + i * 5000)}</b>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="mt-5 w-full"
              onClick={() => nav("/admin/payments")}
            >
              View payment schedule <ArrowRight size={15} />
            </Button>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Recent payments</h2>
            <div className="mt-4 space-y-4">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between gap-3">
                  <div>
                    <b className="text-sm">{p.customer}</b>
                    <p className="text-xs text-slate-500">
                      {p.plot} · {p.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <b className="text-sm">{inr(p.amount)}</b>
                    <div className="mt-1">
                      <Badge>{p.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Book ${plot?.plotNo || "plot"}`}
        description={`${plot?.area || ""} · ${plot ? inr(plot.price) : ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                document.getElementById("bookform")?.requestSubmit()
              }
            >
              Preview booking
            </Button>
          </>
        }
      >
        <form id="bookform" onSubmit={book} className="space-y-4">
          <Input
            label="Customer name"
            required
            value={buyer.name}
            onChange={(e) => setBuyer((v) => ({ ...v, name: e.target.value }))}
          />
          <Input
            label="Mobile number"
            required
            type="tel"
            value={buyer.phone}
            onChange={(e) => setBuyer((v) => ({ ...v, phone: e.target.value }))}
          />
          <Input
            label="Booking deposit (₹)"
            required
            type="number"
            min="0"
            value={buyer.deposit}
            onChange={(e) =>
              setBuyer((v) => ({ ...v, deposit: e.target.value }))
            }
          />
        </form>
      </Modal>
    </div>
  );
}

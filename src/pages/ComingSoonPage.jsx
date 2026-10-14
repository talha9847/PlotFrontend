import { ArrowLeft, Construction } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
const labels = {
  "/admin/layout": "Layout editor",
  "/admin/installments": "Installments",
  "/admin/reminders": "WhatsApp reminders",
};
export default function ComingSoonPage() {
  const { pathname } = useLocation();
  return (
    <div className="surface-card flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Construction size={27} />
      </span>
      <p className="eyebrow mt-6">Workspace module</p>
      <h1 className="mt-2 text-3xl font-extrabold">
        {labels[pathname] || "Coming soon"}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
        This section is included in the navigation concept. Connect the workflow
        and data model when you're ready to implement it.
      </p>
      <Link
        to="/admin"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-xs font-extrabold text-white"
      >
        <ArrowLeft size={15} /> Back to overview
      </Link>
    </div>
  );
}

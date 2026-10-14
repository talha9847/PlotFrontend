// src/data/mockData.js
// Sample data only. Replace with API data later.

export const inr = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

/* Studio / sales-office contact (used by landing page and footer) */
export const company = {
  name: "Plotwise",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
};

/* ───────── Projects ───────── */
export const project = [
  {
    id: 1,
    name: "Green Valley Residency",
    slug: "green-valley-residency",
    location: "Dumas Road, Surat, Gujarat",
    description: "Thoughtfully planned residential plots for your future.",
    totalPlots: 300,
    status: "Active",
    totalBookingValue: 8000000,
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    name: "Palm Avenue",
    slug: "palm-avenue",
    location: "Vesu, Surat, Gujarat",
    description: "Premium plots in a planned residential development.",
    totalPlots: 150,
    status: "Active",
    totalBookingValue: 4500000,
    createdAt: "2026-03-10",
  },
  {
    id: 3,
    name: "Sunrise Enclave",
    slug: "sunrise-enclave",
    location: "Adajan, Surat, Gujarat",
    description: "Residential plots with flexible size options.",
    totalPlots: 200,
    status: "Planning",
    totalBookingValue: 0,
    createdAt: "2026-06-20",
  },
];

/* ───────── Plots: 300 total (150 / 75 / 75 per project) ───────── */
export const plots = Array.from({ length: 300 }, (_, i) => {
  const n = i + 1;

  // Assign plots to projects.
  const projectId = n <= 150 ? 1 : n <= 225 ? 2 : 3;
  const projectPlotNo =
    projectId === 1 ? n : projectId === 2 ? n - 150 : n - 225;

  const status = [2, 5, 8, 11, 14, 18, 21].includes(projectPlotNo % 30 || 30)
    ? "Booked"
    : [4, 9, 16, 23].includes(projectPlotNo % 30 || 30)
      ? "Sold"
      : "Available";

  const area =
    projectPlotNo % 3 === 0 ? 1500 : projectPlotNo % 2 === 0 ? 1200 : 1000;

  return {
    id: n,
    projectId,
    plotNo: `P-${String(projectPlotNo).padStart(3, "0")}`,
    area,
    price: area === 1500 ? 2250000 : area === 1200 ? 1800000 : 1500000,
    status,
  };
});

/* ───────── Customers (every plot below is Booked/Sold and its total matches the plot price) ───────── */
export const customers = [
  {
    id: 1,
    projectId: 1,
    name: "Aarav Patel",
    phone: "+91 98765 10001",
    plotId: 2,
    plot: "P-002",
    paid: 450000,
    total: 1800000,
    status: "On track",
  },
  {
    id: 2,
    projectId: 1,
    name: "Mira Shah",
    phone: "+91 98765 10002",
    plotId: 5,
    plot: "P-005",
    paid: 600000,
    total: 1500000,
    status: "Due soon",
  },
  {
    id: 3,
    projectId: 1,
    name: "Dev Mehta",
    phone: "+91 98765 10003",
    plotId: 8,
    plot: "P-008",
    paid: 900000,
    total: 1800000,
    status: "Overdue",
  },
  {
    id: 4,
    projectId: 2,
    name: "Kiara Desai",
    phone: "+91 98765 10004",
    plotId: 161,
    plot: "P-011",
    paid: 350000,
    total: 1500000,
    status: "On track",
  },
  {
    id: 5,
    projectId: 1,
    name: "Rohan Trivedi",
    phone: "+91 98765 10005",
    plotId: 4,
    plot: "P-004",
    paid: 1800000,
    total: 1800000,
    status: "On track",
  },
  {
    id: 6,
    projectId: 1,
    name: "Ananya Joshi",
    phone: "+91 98765 10006",
    plotId: 9,
    plot: "P-009",
    paid: 1350000,
    total: 2250000,
    status: "On track",
  },
  {
    id: 7,
    projectId: 1,
    name: "Imran Malek",
    phone: "+91 98765 10007",
    plotId: 11,
    plot: "P-011",
    paid: 300000,
    total: 1500000,
    status: "Due soon",
  },
  {
    id: 8,
    projectId: 1,
    name: "Pooja Solanki",
    phone: "+91 98765 10008",
    plotId: 14,
    plot: "P-014",
    paid: 540000,
    total: 1800000,
    status: "Overdue",
  },
  {
    id: 9,
    projectId: 1,
    name: "Vikram Gajera",
    phone: "+91 98765 10009",
    plotId: 16,
    plot: "P-016",
    paid: 1800000,
    total: 1800000,
    status: "On track",
  },
  {
    id: 10,
    projectId: 2,
    name: "Sana Bhatia",
    phone: "+91 98765 10010",
    plotId: 164,
    plot: "P-014",
    paid: 720000,
    total: 1800000,
    status: "On track",
  },
];

/* ───────── Payments ───────── */
export const payments = [
  {
    id: "PAY-1042",
    projectId: 1,
    customerId: 1,
    customer: "Aarav Patel",
    plotId: 2,
    plot: "P-002",
    date: "2026-10-14",
    amount: 25000,
    method: "UPI",
    status: "Paid",
  },
  {
    id: "PAY-1041",
    projectId: 1,
    customerId: 2,
    customer: "Mira Shah",
    plotId: 5,
    plot: "P-005",
    date: "2026-10-12",
    amount: 30000,
    method: "Bank transfer",
    status: "Paid",
  },
  {
    id: "PAY-1040",
    projectId: 1,
    customerId: 3,
    customer: "Dev Mehta",
    plotId: 8,
    plot: "P-008",
    date: "2026-10-10",
    amount: 25000,
    method: "Cash",
    status: "Pending",
  },
  {
    id: "PAY-1039",
    projectId: 1,
    customerId: 6,
    customer: "Ananya Joshi",
    plotId: 9,
    plot: "P-009",
    date: "2026-10-08",
    amount: 50000,
    method: "UPI",
    status: "Paid",
  },
  {
    id: "PAY-1038",
    projectId: 2,
    customerId: 4,
    customer: "Kiara Desai",
    plotId: 161,
    plot: "P-011",
    date: "2026-10-05",
    amount: 35000,
    method: "Bank transfer",
    status: "Paid",
  },
  {
    id: "PAY-1037",
    projectId: 1,
    customerId: 8,
    customer: "Pooja Solanki",
    plotId: 14,
    plot: "P-014",
    date: "2026-10-02",
    amount: 30000,
    method: "Cash",
    status: "Pending",
  },
];

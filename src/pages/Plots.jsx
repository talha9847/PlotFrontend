import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Download,
  FileText,
  Grid2X2,
  IndianRupee,
  Pencil,
  Ruler,
  Search,
} from "lucide-react";
import axios from "axios";

import PlotMap from "../components/common/PlotMap";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import SearchableLeadSelect from "../components/common/SearchableLeadSelect";
import PaymentAccountFields from "../components/common/PaymentAccountFields";
import Loader from "../components/common/Loader";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const STATUSES = ["Available", "Booked", "Sold"];

const PAGE_SIZES = [10, 20, 50, 100];

const PLOT_TYPE_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "other", label: "Other" },
];

const PLOT_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "booked", label: "Booked" },
  { value: "sold", label: "Sold" },
  { value: "blocked", label: "Blocked" },
  { value: "under_development", label: "Under development" },
];

const FACING_OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north_east", label: "North-East" },
  { value: "north_west", label: "North-West" },
  { value: "south_east", label: "South-East" },
  { value: "south_west", label: "South-West" },
];

const DIMENSION_OPTIONS = [
  { value: "ft", label: "Feet (ft)" },
  { value: "mt", label: "Metres (m)" },
];

const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value || "—";

const EMPTY_EDIT_FORM = {
  plot_type: "residential",
  price: "",
  length: "",
  breadth: "",
  dimension: "ft",
  status: "available",
  facing: "",
  is_corner: false,
  boundary_wall: false,
  road_width: "",
  notes: "",
};

const EMPTY_STATS = {
  total: 0,
  available: 0,
  booked: 0,
  sold: 0,
};

const norm = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const fmtArea = (area, dimension) => {
  if (area == null || area === "") return "—";

  const number = Number(area);

  return Number.isFinite(number)
    ? `${number.toLocaleString("en-IN")} ${dimension === "mt" ? "m²" : "ft²"}`
    : "—";
};

const projectOptionsFrom = (projects) =>
  projects.map((project) => ({
    value: project.uuid,
    label: project.name,
  }));

const normalizePlot = (plot) => {
  const rawStatus = norm(plot.status);

  return {
    ...plot,
    price: Number(plot.price ?? 0),
    area: plot.area ?? null,
    length: plot.length ?? null,
    breadth: plot.breadth ?? null,
    dimension: plot.dimension || "ft",
    facing: plot.facing ?? null,
    isCorner: Boolean(plot.isCorner ?? plot.is_corner),
    boundaryWall: Boolean(plot.boundaryWall ?? plot.boundary_wall),
    roadWidth: plot.roadWidth ?? plot.road_width ?? null,
    rawStatus,
    status:
      rawStatus === "reserved"
        ? "Booked"
        : String(plot.status ?? "").replace(/^./, (char) => char.toUpperCase()),
  };
};

function Stat({ icon: Icon, label, value, dark }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25"
          : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
            dark ? "text-white/60" : "text-[#5b6b63]"
          }`}
        >
          {label}
        </p>

        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"
          }`}
          style={dark ? { background: GOLD } : undefined}
        >
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight" style={DISPLAY}>
        {value}
      </p>
    </div>
  );
}

export default function Plots() {
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("plot");

  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState("details");

  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [map, setMap] = useState({});
  const [plotId, setPlotId] = useState(0);
  const [plots, setPlots] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [error, setError] = useState("");

  const [booking, setBooking] = useState({
    lead_id: "",
    booking_date: new Date().toISOString().slice(0, 10),
    agreed_price: "",
    discount_amount: "0",
    tax_percent: "0",
    booking_amount: "0",
    payment_method: "cash",
    account_id: "",
    notes: "",
  });

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const formatIndianInput = (value) => {
    if (value === "" || value === null || value === undefined) return "";

    const raw = String(value).replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return String(value);

    const [integerPart = "", decimalPart] = raw.split(".");
    const formattedInteger = integerPart
      ? Number(integerPart).toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })
      : "";

    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  const parseAmount = (value) => {
    if (value === "" || value === null || value === undefined) return null;

    const number = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(number) ? number : null;
  };

  const calculateTax = (price, discount, taxPercent) => {
    const taxableAmount = Math.max(0, price - discount);
    return Math.round(taxableAmount * (taxPercent / 100) * 100) / 100;
  };

  const [fieldErrors, setFieldErrors] = useState({});
  const agreedPrice = parseAmount(booking.agreed_price);
  const discountAmount = parseAmount(booking.discount_amount);
  const taxPercent = parseAmount(booking.tax_percent);

  const taxAmount =
    agreedPrice !== null &&
    discountAmount !== null &&
    taxPercent !== null &&
    discountAmount <= agreedPrice
      ? calculateTax(agreedPrice, discountAmount, taxPercent)
      : 0;

  const totalAmount = (agreedPrice ?? 0) - (discountAmount ?? 0) + taxAmount;
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const editLength = parseAmount(editForm.length);
  const editBreadth = parseAmount(editForm.breadth);
  const editArea =
    editLength !== null &&
    editBreadth !== null &&
    editLength > 0 &&
    editBreadth > 0
      ? Math.round(editLength * editBreadth * 100) / 100
      : null;
  const editAreaUnit = editForm.dimension === "mt" ? "m²" : "ft²";

  const updateBooking = (event) => {
    const { name, value } = event.target;

    const amountFields = ["agreed_price", "discount_amount", "booking_amount"];

    let nextValue = value;

    if (amountFields.includes(name)) {
      const raw = value.replace(/,/g, "");

      if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;

      nextValue = raw;
    }

    if (name === "tax_percent") {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

      nextValue = value;
    }

    // Replace your existing state updates with this:
    const nextBooking = {
      ...booking,
      [name]: nextValue,
    };

    setBooking(nextBooking);
    setFieldErrors(validateBooking(nextBooking));

    setError("");
  };

  const openBookingForm = () => {
    setBooking({
      lead_id: "",
      booking_date: new Date().toLocaleDateString("en-CA"),
      agreed_price: String(selected?.price ?? selected?.basePrice ?? 0),
      discount_amount: "0",
      tax_percent: "0",
      booking_amount: "0",
      payment_method: "cash",
      account_id: "",
      notes: "",
    });

    setFieldErrors({});
    setError("");
    setModalMode("booking");
  };

  const openEditForm = (plot = selected) => {
    if (!plot) return;

    setEditForm({
      plot_type: norm(plot.plotType || plot.plot_type || "residential"),
      price: plot.price ?? "",
      length: plot.length ?? "",
      breadth: plot.breadth ?? "",
      dimension: plot.dimension || "ft",
      status: plot.rawStatus || norm(plot.status),
      facing: plot.facing || "",
      is_corner: Boolean(plot.isCorner),
      boundary_wall: Boolean(plot.boundaryWall),
      road_width: plot.roadWidth ?? "",
      notes: plot.notes || "",
    });

    setEditErrors({});
    setError("");
    setModalMode("edit");
  };

  const updateEditForm = (event) => {
    const { name, type, checked, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setEditErrors((current) => {
      if (!current[name]) return current;

      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const validateEdit = (values = editForm) => {
    const errors = {};

    const price = parseAmount(values.price);

    if (price === null) {
      errors.price = "Price is required.";
    } else if (price < 0) {
      errors.price = "Price cannot be negative.";
    }

    const hasLength = String(values.length ?? "").trim() !== "";
    const hasBreadth = String(values.breadth ?? "").trim() !== "";

    if (hasLength !== hasBreadth) {
      const message = "Enter both length and breadth, or leave both empty.";

      if (!hasLength) errors.length = message;
      if (!hasBreadth) errors.breadth = message;
    } else if (hasLength) {
      const length = parseAmount(values.length);
      const breadth = parseAmount(values.breadth);

      if (length === null || length <= 0) {
        errors.length = "Length must be greater than zero.";
      }

      if (breadth === null || breadth <= 0) {
        errors.breadth = "Breadth must be greater than zero.";
      }
    }

    if (String(values.road_width ?? "").trim() !== "") {
      const roadWidth = parseAmount(values.road_width);

      if (roadWidth === null || roadWidth < 0) {
        errors.road_width = "Road width cannot be negative.";
      }
    }

    if (values.notes.length > 5000) {
      errors.notes = "Notes cannot exceed 5000 characters.";
    }

    return errors;
  };

  const handleSavePlot = async () => {
    if (!selected || savingEdit) return;

    const errors = validateEdit();
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please correct the highlighted fields.");
      return;
    }

    const payload = {
      plot_type: editForm.plot_type,
      price: parseAmount(editForm.price),
      dimension: editForm.dimension,
      status: editForm.status,
      facing: editForm.facing || null,
      is_corner: editForm.is_corner,
      boundary_wall: editForm.boundary_wall,
      road_width: parseAmount(editForm.road_width),
      length: parseAmount(editForm.length),
      breadth: parseAmount(editForm.breadth),
      notes: editForm.notes.trim() || null,
    };

    setSavingEdit(true);
    setError("");

    try {
      const response = await axios.put(
        `/api/plots/${encodeURIComponent(selected.uuid)}`,
        payload,
        { withCredentials: true },
      );

      const updatedPlot = response.data?.data?.plot;

      if (!updatedPlot) {
        throw new Error("The server did not return the updated plot.");
      }

      setSelected(normalizePlot(updatedPlot));
      setModalMode("details");
      setEditErrors({});
      setRefreshKey((current) => current + 1);

      toast(response.data?.message || "Plot updated successfully.", "success");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update the plot.";

      setError(message);
      toast(message, "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // 1. Fetch projects for the dropdown
  useEffect(() => {
    let cancelled = false;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      setError("");

      try {
        const response = await axios.get("/api/plots/projects", {
          withCredentials: true,
        });

        const projectList = response.data?.data?.projects;

        if (!Array.isArray(projectList)) {
          throw new Error("Invalid projects response from server.");
        }

        if (cancelled) return;

        setProjects(projectList);

        const projectMap = Object.fromEntries(
          projectList.map((project) => [project.uuid, project.id]),
        );

        setMap(projectMap);
        // Select the first project by default.
        setProjectUuid((currentUuid) => {
          if (
            currentUuid &&
            projectList.some((project) => project.uuid === currentUuid)
          ) {
            return currentUuid;
          }

          return projectList[0]?.uuid ?? "";
        });
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to fetch projects:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load projects.",
        );
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  // Payment accounts are needed when a booking token is collected.
  useEffect(() => {
    let cancelled = false;

    const fetchAccounts = async () => {
      setLoadingAccounts(true);

      try {
        const response = await axios.get("/api/accounts", {
          withCredentials: true,
        });

        if (cancelled) return;

        setAccounts(response.data?.data?.accounts || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch accounts:", err);
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    };

    fetchAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce search so the API is not called on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch project-wide statistics separately; these should not change with pagination.
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      if (!projectUuid) {
        setStats(EMPTY_STATS);
        return;
      }

      try {
        const response = await axios.get(
          `/api/plots/projects/${projectUuid}/stats`,
          { withCredentials: true },
        );
        if (cancelled) return;

        const receivedStats = response.data?.data?.stats;
        if (!receivedStats)
          throw new Error("Invalid plot statistics received from server.");

        setStats({
          total: Number(receivedStats.total ?? 0),
          available: Number(receivedStats.available ?? 0),
          booked: Number(receivedStats.booked ?? 0),
          sold: Number(receivedStats.sold ?? 0),
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch plot statistics:", err);
        setStats(EMPTY_STATS);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [projectUuid, refreshKey]);

  // Fetch only the requested page. Search, status and sorting are handled by the API.
  useEffect(() => {
    let cancelled = false;

    const fetchProjectPlots = async () => {
      if (!projectUuid) {
        setPlots([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 0 });
        setSelected(null);
        setLoadingPlots(false);
        return;
      }

      setLoadingPlots(true);
      setError("");

      const sortBy =
        sort === "low" || sort === "high" ? "price" : "plot_number";
      const sortOrder = sort === "high" ? "desc" : "asc";

      try {
        const response = await axios.get(`/api/plots/projects/${projectUuid}`, {
          withCredentials: true,
          params: {
            page,
            limit,
            search: debouncedQuery,
            sortBy,
            sortOrder,
            status,
          },
        });

        if (cancelled) return;

        // Expected controller shape: { success, data: { plots, pagination } }.
        const payload = response.data?.data;
        const receivedPlots = payload?.plots;
        const receivedPagination = payload?.pagination ?? payload?.meta;

        if (!Array.isArray(receivedPlots)) {
          throw new Error(
            "Invalid plot data received from server. Expected data.plots.",
          );
        }

        setPlots(receivedPlots.map(normalizePlot));

        const total = Number(
          receivedPagination?.total ??
            receivedPagination?.totalItems ??
            receivedPagination?.totalCount ??
            receivedPlots.length,
        );
        const currentPage = Number(receivedPagination?.page ?? page);
        const pageLimit = Number(receivedPagination?.limit ?? limit);
        const totalPages = Number(
          receivedPagination?.totalPages ??
            Math.ceil(total / Math.max(pageLimit, 1)),
        );

        setPagination({
          page: currentPage,
          limit: pageLimit,
          total,
          totalPages,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch plot data:", err);
        setPlots([]);
        setPagination({ page, limit, total: 0, totalPages: 0 });
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load plot inventory.",
        );
      } finally {
        if (!cancelled) setLoadingPlots(false);
      }
    };

    fetchProjectPlots();
    return () => {
      cancelled = true;
    };
  }, [projectUuid, page, limit, debouncedQuery, status, sort, refreshKey]);

  const projectOptions = useMemo(
    () => projectOptionsFrom(projects),
    [projects],
  );

  // The server returns only the current page, already filtered and sorted.
  const scoped = plots;

  const matches = (plot) => {
    const plotNumberMatches = String(plot.plotNo ?? "")
      .toLowerCase()
      .includes(debouncedQuery.toLowerCase());
    const normalizedStatus =
      norm(plot.status) === "reserved" ? "booked" : norm(plot.status);
    const statusMatches = !status || normalizedStatus === norm(status);
    return plotNumberMatches && statusMatches;
  };

  const handleProjectChange = (event) => {
    setProjectUuid(event.target.value);
    setQuery("");
    setStatus("");
    setSort("plot");
    setPage(1);
    setSelected(null);
  };

  const validateBooking = (values = booking) => {
    const errors = {};

    const price = parseAmount(values.agreed_price);
    const discount = parseAmount(values.discount_amount);
    const tax = parseAmount(values.tax_percent);
    const initialPayment = parseAmount(values.booking_amount);

    if (!values.lead_id) {
      errors.lead_id = "Please select a lead.";
    }

    if (!values.booking_date) {
      errors.booking_date = "Booking date is required.";
    }

    if (price === null) {
      errors.agreed_price = "Agreed price is required.";
    }

    if (price !== null && price < 0) {
      errors.agreed_price = "Price cannot be negative.";
    }

    if (discount === null) {
      errors.discount_amount = "Discount amount is required.";
    } else if (discount < 0) {
      errors.discount_amount = "Discount cannot be negative.";
    } else if (price !== null && discount > price) {
      errors.discount_amount = "Discount cannot exceed agreed price.";
    }

    if (tax === null) {
      errors.tax_percent = "Tax percentage is required.";
    } else if (tax < 0 || tax > 100) {
      errors.tax_percent = "Tax must be between 0% and 100%.";
    }

    const computedTax =
      price !== null &&
      discount !== null &&
      tax !== null &&
      discount <= price &&
      price >= 0 &&
      tax >= 0 &&
      tax <= 100
        ? calculateTax(price, discount, tax)
        : 0;

    const total =
      price !== null && discount !== null && discount <= price
        ? price - discount + computedTax
        : 0;

    if (initialPayment === null) {
      errors.booking_amount = "Booking amount is required.";
    } else if (initialPayment < 0) {
      errors.booking_amount = "Booking amount cannot be negative.";
    } else if (initialPayment > total) {
      errors.booking_amount = "Booking amount cannot exceed total amount.";
    }

    if (!values.payment_method) {
      errors.payment_method = "Select a payment method.";
    }

    if (
      initialPayment !== null &&
      initialPayment > 0 &&
      values.payment_method &&
      values.payment_method !== "cash" &&
      !values.account_id
    ) {
      errors.account_id = "Select the bank account receiving this payment.";
    }

    return errors;
  };

  const handleCreateBooking = async () => {
    if (!selected || saving) return;

    const errors = validateBooking();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please correct the highlighted fields.");
      return;
    }

    const agreed_price = parseAmount(booking.agreed_price);
    const discount_amount = parseAmount(booking.discount_amount);
    const booking_amount = parseAmount(booking.booking_amount);
    const tax_amount = taxAmount;
    const total_amount = totalAmount;
    const project_id = map[projectUuid];

    if (
      !Number.isFinite(Number(plotId)) ||
      Number(plotId) <= 0 ||
      !booking.lead_id ||
      !Number.isFinite(Number(project_id)) ||
      Number(project_id) <= 0 ||
      !Number.isFinite(agreed_price) ||
      !Number.isFinite(discount_amount) ||
      !Number.isFinite(tax_amount) ||
      !Number.isFinite(booking_amount) ||
      !Number.isFinite(total_amount) ||
      agreed_price < 0 ||
      discount_amount < 0 ||
      tax_amount < 0 ||
      booking_amount < 0 ||
      total_amount < 0 ||
      discount_amount > agreed_price ||
      booking_amount > total_amount
    ) {
      setError(
        "Please check the booking amounts and selected lead, project, and plot.",
      );
      return;
    }

    const payload = {
      project_id: project_id,
      plot_id: plotId,
      lead_id: booking.lead_id,
      booking_date: booking.booking_date,
      agreed_price: Number(agreed_price),
      discount_amount: Number(discount_amount),
      tax_amount: tax_amount,
      booking_amount: Number(booking_amount),
      payment_method: booking.payment_method || "cash",
      account_id:
        booking.payment_method === "cash"
          ? null
          : Number(booking.account_id) || null,
      payment_date: booking.booking_date,
      notes: booking.notes.trim() || null,
    };

    setSaving(true);
    setError("");

    try {
      const res = await axios.post("/api/bookings/create", payload, {
        withCredentials: true,
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });

      if (res.status == 200 || res.status == 201) {
        toast(res.data?.message || "Booking created successfully.", "success");
        setSelected(null);
        setModalMode("details");
        setFieldErrors({});

        setBooking({
          lead_id: "",
          booking_date: new Date().toLocaleDateString("en-CA"),
          agreed_price: "",
          discount_amount: "0",
          tax_percent: "0",
          booking_amount: "0",
          payment_method: "cash",
          account_id: "",
          notes: "",
        });

        setRefreshKey((current) => current + 1);
      }
    } catch (err) {
      const responseData = err.response?.data;

      if (responseData?.errors) {
        setFieldErrors(responseData.errors);
      }

      const message =
        responseData?.message || err.message || "Failed to create booking.";

      setError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Inventory
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Plot inventory<span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 text-sm text-[#5b6b63]">
            Browse plot positions and availability.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => toast("Export is not implemented yet.", "info")}
        >
          <Download size={16} />
          Export inventory
        </Button>
      </div>

      {/* Project selector and filters */}
      <div className="rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] sm:p-6">
        <div className="grid gap-3 md:grid-cols-[230px_1fr_auto]">
          <Select
            aria-label="Project"
            value={projectUuid}
            onChange={handleProjectChange}
            placeholder="Select a project"
            options={projectOptions}
          />

          <Input
            leadingIcon={Search}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search plot number"
            aria-label="Search plot number"
          />

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {["", ...STATUSES].map((item) => (
              <button
                key={item || "all"}
                type="button"
                aria-pressed={status === item}
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  status === item
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {item || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Stats from API */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Grid2X2} label="Total plots" value={stats.total} dark />
        <Stat icon={CheckCircle2} label="Available" value={stats.available} />
        <Stat icon={Clock3} label="Booked" value={stats.booked} />
        <Stat icon={CircleDashed} label="Sold" value={stats.sold} />
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] sm:p-6">
        {loadingProjects ? (
          <p className="py-10 text-center text-sm text-[#5b6b63]">
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5b6b63]">
            No projects found. Create a project before adding plots.
          </p>
        ) : loadingPlots ? (
          <p className="py-10 text-center text-sm text-[#5b6b63]">
            Loading plot inventory...
          </p>
        ) : (
          <PlotMap
            plots={scoped}
            onSelect={(plot) => {
              setSelected(plot);
              setModalMode("details");
              setPlotId(plot.id);
            }}
            matches={matches}
            selectedId={selected?.id}
          />
        )}
      </div>

      {/* Map pagination controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#e3e9e0] bg-white px-5 py-4 shadow-sm shadow-[#062a20]/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[#5b6b63]">
          <span>Rows per page</span>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-[#dfe5dc] bg-white px-2.5 py-2 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a]"
            aria-label="Plots per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs text-[#5b6b63]">
            Showing {pagination.total === 0 ? 0 : (page - 1) * limit + 1}
            {"–"}
            {Math.min(page * limit, pagination.total)}
            {" of "}
            {pagination.total} plots
          </span>

          <span className="text-xs text-[#5b6b63]">
            Page {pagination.totalPages === 0 ? 0 : page} of{" "}
            {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={loadingPlots || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-[#dfe5dc] px-4 py-2 text-xs font-bold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={
              loadingPlots ||
              pagination.totalPages === 0 ||
              page >= pagination.totalPages
            }
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            className="rounded-lg border border-[#dfe5dc] px-4 py-2 text-xs font-bold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Plot list */}

      {/* Plot details modal */}

      <Modal
        open={!!selected}
        onClose={() => {
          if (saving || savingEdit) return;
          setSelected(null);
          setModalMode("details");
          setEditErrors({});
          setError("");
        }}
        title={
          modalMode === "booking"
            ? `Book ${selected?.plotNo || "Plot"}`
            : modalMode === "edit"
              ? `Edit ${selected?.plotNo || "Plot"}`
              : selected?.plotNo || "Plot details"
        }
        description={
          modalMode === "booking"
            ? "Enter the customer and booking details."
            : modalMode === "edit"
              ? "Update dimensions, pricing, status and plot attributes."
              : "Plot information"
        }
        footer={
          modalMode === "details" ? (
            <div className="flex w-full flex-wrap justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelected(null);
                  setModalMode("details");
                }}
              >
                Close
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  disabled={savingEdit}
                  onClick={() => openEditForm()}
                >
                  <Pencil size={16} />
                  Edit Plot
                </Button>

                {String(selected?.status).toLowerCase() === "available" && (
                  <Button onClick={openBookingForm}>Book Plot</Button>
                )}
              </div>
            </div>
          ) : modalMode === "booking" ? (
            <div className="flex w-full justify-between gap-3">
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => {
                  setError("");
                  setModalMode("details");
                }}
              >
                Back
              </Button>

              <Button
                type="submit"
                disabled={saving}
                onClick={() => {
                  document.getElementById("booking-form")?.requestSubmit();
                }}
              >
                {saving ? (
                  <Loader
                    size="xs"
                    variant="spinner"
                    color="#ffffff"
                    label="Creating..."
                  />
                ) : (
                  "Create Booking"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-between gap-3">
              <Button
                variant="secondary"
                disabled={savingEdit}
                onClick={() => {
                  setError("");
                  setModalMode("details");
                }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={savingEdit}
                onClick={() => {
                  document.getElementById("edit-plot-form")?.requestSubmit();
                }}
              >
                {savingEdit ? (
                  <Loader
                    size="xs"
                    variant="spinner"
                    color="#ffffff"
                    label="Saving..."
                  />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <div
            role="tablist"
            aria-label="Plot actions"
            className="mb-5 flex gap-1 rounded-xl border border-[#e3e9e0] bg-[#eef3ea] p-1"
          >
            {[
              { id: "details", label: "Overview" },
              {
                id: "booking",
                label: "Book Plot",
                disabled:
                  String(selected.rawStatus || selected.status).toLowerCase() !==
                  "available",
              },
              { id: "edit", label: "Edit Plot" },
            ].map((tab) => {
              const active = modalMode === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={tab.disabled || saving || savingEdit}
                  title={
                    tab.disabled
                      ? "Only available plots can be booked."
                      : undefined
                  }
                  onClick={() => {
                    if (tab.id === "booking") openBookingForm();
                    else if (tab.id === "edit") openEditForm();
                    else {
                      setError("");
                      setModalMode("details");
                    }
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "bg-white text-[#0b3d2e] shadow-sm"
                      : "text-[#5b6b63] hover:text-[#0b3d2e]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {selected && modalMode === "details" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#0b3d2e] p-5 text-white">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: GOLD }}
                >
                  Price
                </p>

                <p className="mt-1 text-3xl font-semibold" style={DISPLAY}>
                  {formatINR(selected.price ?? selected.basePrice ?? 0)}
                </p>
              </div>

              <Badge size="lg">{selected.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Area", fmtArea(selected.area, selected.dimension)],
                [
                  "Dimensions",
                  selected.length != null && selected.breadth != null
                    ? `${Number(selected.length).toLocaleString("en-IN")} × ${Number(
                        selected.breadth,
                      ).toLocaleString("en-IN")} ${
                        selected.dimension === "mt" ? "m" : "ft"
                      }`
                    : "—",
                ],
                ["Reference", selected.plotNo || selected.plot_number],
                [
                  "Plot type",
                  optionLabel(
                    PLOT_TYPE_OPTIONS,
                    selected.plotType || selected.plot_type,
                  ),
                ],
                [
                  "Facing",
                  selected.facing
                    ? optionLabel(FACING_OPTIONS, selected.facing)
                    : "Not specified",
                ],
                [
                  "Road width",
                  selected.roadWidth != null
                    ? `${Number(selected.roadWidth).toLocaleString("en-IN")} ${
                        selected.dimension === "mt" ? "m" : "ft"
                      }`
                    : "—",
                ],
                ["Corner plot", selected.isCorner ? "Yes" : "No"],
                ["Boundary wall", selected.boundaryWall ? "Yes" : "No"],
                ["Notes", selected.notes || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#e3e9e0] bg-[#f6f9f4] p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b6b63]">
                    {label}
                  </p>

                  <p className="mt-2 break-words font-bold text-[#14231d]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && modalMode === "booking" && (
          <form
            id="booking-form"
            onSubmit={(event) => {
              event.preventDefault();

              const errors = validateBooking();
              setFieldErrors(errors);

              if (Object.keys(errors).length > 0) {
                setError("Please correct the highlighted fields.");
                return;
              }

              setError("");
              handleCreateBooking();
            }}
            className="space-y-5"
          >
            {/* Booking summary */}
            <div className="rounded-xl bg-[#e9f6ef] p-4 text-[#0b3d2e]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    Selected plot
                  </p>
                  <p className="mt-1 font-bold">
                    {selected.plotNo || selected.plot_number}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    Total amount
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatINR(totalAmount)}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs text-[#426b56]">
                Total = agreed price − discount + calculated tax
              </p>
            </div>

            {/* Lead selection */}
            <SearchableLeadSelect
              label="Lead / Customer"
              name="lead_id"
              apiUrl="/api/leads/dropdown"
              value={booking.lead_id}
              onChange={updateBooking}
              placeholder="Select a lead"
              searchPlaceholder="Search by name or phone..."
              disabled={saving}
              error={fieldErrors.lead_id}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Booking date */}
              <Input
                label="Booking date"
                name="booking_date"
                type="date"
                value={booking.booking_date}
                onChange={updateBooking}
                leadingIcon={CalendarDays}
                required
                disabled={saving}
                error={fieldErrors.booking_date}
              />

              {/* Agreed price */}
              <Input
                label="Agreed price (₹)"
                name="agreed_price"
                type="text"
                inputMode="decimal"
                value={formatIndianInput(booking.agreed_price)}
                onChange={updateBooking}
                leadingIcon={IndianRupee}
                required
                disabled={saving}
                error={fieldErrors.agreed_price}
              />

              {/* Discount */}
              <Input
                label="Discount amount (₹)"
                name="discount_amount"
                type="text"
                inputMode="decimal"
                value={formatIndianInput(booking.discount_amount)}
                onChange={updateBooking}
                leadingIcon={IndianRupee}
                required
                disabled={saving}
                error={fieldErrors.discount_amount}
              />

              {/* Tax percentage */}
              <Input
                label="Tax percentage (%)"
                name="tax_percent"
                type="text"
                inputMode="decimal"
                value={booking.tax_percent}
                onChange={updateBooking}
                required
                disabled={saving}
                error={fieldErrors.tax_percent}
                hint="Enter a percentage between 0 and 100."
              />

              {/* Automatically calculated tax */}
              <Input
                label="Calculated tax amount"
                name="tax_amount_display"
                type="text"
                value={formatINR(taxAmount)}
                readOnly
                disabled={saving}
                leadingIcon={IndianRupee}
                hint="Calculated automatically after discount."
              />

              {/* Initial booking payment */}
              <Input
                wrapperClassName="sm:col-span-2"
                label="Booking amount (₹)"
                name="booking_amount"
                type="text"
                inputMode="decimal"
                value={formatIndianInput(booking.booking_amount)}
                onChange={updateBooking}
                leadingIcon={IndianRupee}
                required
                disabled={saving}
                error={fieldErrors.booking_amount}
                hint="Initial booking payment. Zero is allowed."
              />

              <PaymentAccountFields
                paymentMethod={booking.payment_method}
                accountId={booking.account_id}
                accounts={accounts}
                loadingAccounts={loadingAccounts}
                disabled={saving}
                paymentMethodError={fieldErrors.payment_method}
                accountError={fieldErrors.account_id}
                methodLabel="Token payment method"
                accountLabelText="Receiving bank account"
                cashHint="Cash tokens post to the Cash in Hand account automatically."
                onMethodChange={(value) => {
                  const next = {
                    ...booking,
                    payment_method: value,
                    account_id: "",
                  };
                  setBooking(next);
                  setFieldErrors(validateBooking(next));
                  setError("");
                }}
                onAccountChange={(value) => {
                  const next = { ...booking, account_id: value };
                  setBooking(next);
                  setFieldErrors(validateBooking(next));
                  setError("");
                }}
              />
            </div>

            {/* Total breakdown */}
            <div className="space-y-2 rounded-xl border border-[#e3e9e0] p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-600">Agreed price</span>
                <span className="font-medium">
                  {formatINR(parseAmount(booking.agreed_price) ?? 0)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-600">Discount</span>
                <span className="font-medium">
                  − {formatINR(parseAmount(booking.discount_amount) ?? 0)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-600">
                  Tax ({booking.tax_percent || 0}%)
                </span>
                <span className="font-medium">{formatINR(taxAmount)}</span>
              </div>

              <div className="border-t border-[#e3e9e0] pt-3">
                <div className="flex justify-between gap-3 font-bold text-[#0b3d2e]">
                  <span>Total amount</span>
                  <span>{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="booking-notes"
                className="mb-2 block text-sm font-semibold text-[#14231d]"
              >
                Notes
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="pointer-events-none absolute left-4 top-4 text-slate-400"
                />

                <textarea
                  id="booking-notes"
                  name="notes"
                  value={booking.notes}
                  onChange={updateBooking}
                  rows={3}
                  disabled={saving}
                  placeholder="Optional booking notes..."
                  className="w-full rounded-xl border border-[#dfe5dc] bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15 disabled:bg-slate-50"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600"
              >
                {error}
              </p>
            )}
          </form>
        )}

        {selected && modalMode === "edit" && (
          <form
            id="edit-plot-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSavePlot();
            }}
            className="space-y-5"
          >
            <div className="rounded-xl bg-[#e9f6ef] p-4 text-[#0b3d2e]">
              <p className="text-xs font-semibold uppercase tracking-wider">
                Auto-calculated size
              </p>
              <p className="mt-1 text-2xl font-bold" style={DISPLAY}>
                {editArea !== null
                  ? `${editArea.toLocaleString("en-IN")} ${editAreaUnit}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-[#426b56]">
                Size is calculated from length × breadth and cannot be edited
                directly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Length"
                name="length"
                type="text"
                inputMode="decimal"
                value={editForm.length}
                onChange={updateEditForm}
                leadingIcon={Ruler}
                disabled={savingEdit}
                error={editErrors.length}
                placeholder="e.g. 30"
              />

              <Input
                label="Breadth"
                name="breadth"
                type="text"
                inputMode="decimal"
                value={editForm.breadth}
                onChange={updateEditForm}
                leadingIcon={Ruler}
                disabled={savingEdit}
                error={editErrors.breadth}
                placeholder="e.g. 40"
              />

              <Select
                label="Dimension unit"
                name="dimension"
                options={DIMENSION_OPTIONS}
                value={editForm.dimension}
                onChange={updateEditForm}
                disabled={savingEdit}
              />

              <Input
                label={`Size (${editAreaUnit})`}
                name="area_display"
                type="text"
                value={
                  editArea !== null ? editArea.toLocaleString("en-IN") : ""
                }
                readOnly
                disabled
                hint="Calculated automatically from length and breadth."
              />

              <Input
                label="Price (₹)"
                name="price"
                type="text"
                inputMode="decimal"
                value={formatIndianInput(editForm.price)}
                onChange={updateEditForm}
                leadingIcon={IndianRupee}
                required
                disabled={savingEdit}
                error={editErrors.price}
              />

              <Select
                label="Plot type"
                name="plot_type"
                options={PLOT_TYPE_OPTIONS}
                value={editForm.plot_type}
                onChange={updateEditForm}
                disabled={savingEdit}
              />

              <Select
                label="Status"
                name="status"
                options={PLOT_STATUS_OPTIONS}
                value={editForm.status}
                onChange={updateEditForm}
                disabled={savingEdit}
                hint="A plot with an active booking cannot be marked available."
              />

              <Select
                label="Facing"
                name="facing"
                options={FACING_OPTIONS}
                value={editForm.facing}
                onChange={updateEditForm}
                placeholder="Not specified"
                disabled={savingEdit}
              />

              <Input
                label="Road width"
                name="road_width"
                type="text"
                inputMode="decimal"
                value={editForm.road_width}
                onChange={updateEditForm}
                disabled={savingEdit}
                error={editErrors.road_width}
                hint={`In ${
                  editForm.dimension === "mt" ? "metres" : "feet"
                }, matching the dimension unit.`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  editForm.is_corner
                    ? "border-[#1b7a5a] bg-[#e9f6ef]"
                    : "border-[#dfe5dc] bg-white hover:border-[#c3d0bf]"
                }`}
              >
                <input
                  type="checkbox"
                  name="is_corner"
                  checked={editForm.is_corner}
                  onChange={updateEditForm}
                  disabled={savingEdit}
                  className="mt-0.5 h-4 w-4 rounded border-[#c3d0bf] accent-[#1b7a5a]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#14231d]">
                    Corner plot
                  </span>
                  <span className="mt-0.5 block text-xs text-[#5b6b63]">
                    Open on two sides
                  </span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  editForm.boundary_wall
                    ? "border-[#1b7a5a] bg-[#e9f6ef]"
                    : "border-[#dfe5dc] bg-white hover:border-[#c3d0bf]"
                }`}
              >
                <input
                  type="checkbox"
                  name="boundary_wall"
                  checked={editForm.boundary_wall}
                  onChange={updateEditForm}
                  disabled={savingEdit}
                  className="mt-0.5 h-4 w-4 rounded border-[#c3d0bf] accent-[#1b7a5a]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#14231d]">
                    Boundary wall
                  </span>
                  <span className="mt-0.5 block text-xs text-[#5b6b63]">
                    Plot has a compound wall
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label
                htmlFor="plot-notes"
                className="mb-2 block text-sm font-semibold text-[#14231d]"
              >
                Notes
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="pointer-events-none absolute left-4 top-4 text-slate-400"
                />

                <textarea
                  id="plot-notes"
                  name="notes"
                  value={editForm.notes}
                  onChange={updateEditForm}
                  rows={3}
                  maxLength={5000}
                  disabled={savingEdit}
                  placeholder="Optional notes about this plot..."
                  className="w-full rounded-xl border border-[#dfe5dc] bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15 disabled:bg-slate-50"
                />
              </div>

              {editErrors.notes && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {editErrors.notes}
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600"
              >
                {error}
              </p>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Plus,
  Search,
  Users,
  UserRound,
  Pencil,
  Phone,
  LoaderCircle,
} from "lucide-react";
import axios from "axios";

import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const CUSTOMER_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust" },
  { value: "other", label: "Other" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All customer types" },
  ...CUSTOMER_TYPES,
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  alternate_phone: "",
  email: "",
  customer_type: "individual",
  company_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  district: "",
  state: "",
  postal_code: "",
  country_code: "IN",
  notes: "",
};

const PAGE_SIZE = 10;

const titleCase = (value = "") =>
  value.charAt(0).toUpperCase() + value.slice(1);

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

// Accepts 10-digit Indian mobile numbers, 91XXXXXXXXXX,
// or +91XXXXXXXXXX. Spaces, hyphens and parentheses are allowed.
const isValidIndianMobile = (value = "") => {
  const cleaned = String(value)
    .trim()
    .replace(/[\s()-]/g, "");

  return /^(?:\+91|91)?[6-9]\d{9}$/.test(cleaned);
};

const getPhoneError = (value, required = false) => {
  const phone = String(value ?? "").trim();

  if (!phone) {
    return required ? "Mobile number is required." : "";
  }

  if (!isValidIndianMobile(phone)) {
    return "Enter a valid Indian mobile number (10 digits, starting with 6–9).";
  }

  return "";
};

const getApiError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

const extractCustomers = (response) => {
  const data = response.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(response.data?.customers)) {
    return response.data.customers;
  }

  throw new Error(
    "Invalid customers response. Expected an array of customers.",
  );
};

function StatCard({ icon: Icon, label, value, note, dark = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/20"
          : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
              dark ? "text-white/60" : "text-[#5b6b63]"
            }`}
          >
            {label}
          </p>

          <p
            className="mt-4 text-3xl font-semibold tracking-tight"
            style={DISPLAY}
          >
            {value}
          </p>

          {note && (
            <p
              className={`mt-1 text-xs ${
                dark ? "text-white/55" : "text-[#5b6b63]"
              }`}
            >
              {note}
            </p>
          )}
        </div>

        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"
          }`}
          style={dark ? { background: GOLD } : undefined}
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, children }) {
  if (!children) return null;

  return (
    <p className="flex min-w-0 items-start gap-2 text-xs text-[#5b6b63]">
      <Icon size={14} className="mt-0.5 shrink-0 text-[#1b7a5a]" />
      <span className="break-words">{children}</span>
    </p>
  );
}

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {children}
    </p>
  );
}

export default function CustomersInfo() {
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [touched, setTouched] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Fetch customers from the backend.
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await axios.get("/api/customers", {
        withCredentials: true,
      });

      setCustomers(extractCustomers(response));
    } catch (error) {
      console.error("Failed to fetch customers:", error);

      setLoadError(getApiError(error, "Unable to load customers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const phoneError = touched.phone ? getPhoneError(form.phone, true) : "";

  const alternatePhoneError = touched.alternate_phone
    ? getPhoneError(form.alternate_phone, false)
    : "";

  const emailError =
    touched.email &&
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? "Enter a valid email address."
      : "";

  const filteredCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesType =
        typeFilter === "all" || customer.customer_type === typeFilter;

      const searchable = [
        customer.name,
        customer.phone,
        customer.alternate_phone,
        customer.email,
        customer.company_name,
        customer.city,
        customer.district,
        customer.state,
        customer.postal_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesType && searchable.includes(search);
    });
  }, [customers, query, typeFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);

  const visibleCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, page]);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter]);

  // Statistics are based on the complete customer collection.
  const companyCount = customers.filter((customer) =>
    ["company", "partnership", "trust"].includes(customer.customer_type),
  ).length;

  const individualCount = customers.filter(
    (customer) => customer.customer_type === "individual",
  ).length;

  const openAddModal = () => {
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched({});
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingUuid(customer.uuid);

    setForm({
      ...EMPTY_FORM,
      ...customer,
      phone: customer.phone ?? "",
      alternate_phone: customer.alternate_phone ?? "",
      email: customer.email ?? "",
    });

    setTouched({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched({});
  };

  const submitCustomer = async (event) => {
    event.preventDefault();

    // Validate all fields before sending the request.
    const nextTouched = {
      name: true,
      phone: true,
      alternate_phone: true,
      email: true,
    };

    setTouched((current) => ({
      ...current,
      ...nextTouched,
    }));

    const cleanName = form.name.trim();
    const cleanPhone = form.phone.trim();
    const cleanAlternatePhone = form.alternate_phone.trim();
    const cleanEmail = form.email.trim();

    if (!cleanName) {
      toast("Customer name is required.", "warning");
      return;
    }

    if (getPhoneError(cleanPhone, true)) {
      toast("Please enter a valid primary mobile number.", "warning");
      return;
    }

    if (getPhoneError(cleanAlternatePhone, false)) {
      toast("Please enter a valid alternate mobile number.", "warning");
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast("Please enter a valid email address.", "warning");
      return;
    }
    if (!form.company_name) form.company_name = "";

    const customerData = {
      name: cleanName,
      phone: cleanPhone,
      alternate_phone: cleanAlternatePhone || null,
      email: cleanEmail || null,
      customer_type: form.customer_type,
      company_name: form.company_name.trim() || null,
      address_line1: form.address_line1.trim() || null,
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim() || null,
      district: form.district.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
      country_code: form.country_code.trim().toUpperCase() || "IN",
      notes: form.notes.trim() || null,
    };

    setSaving(true);

    try {
      if (editingUuid) {
        await axios.put(`/api/customers/${editingUuid}`, customerData, {
          withCredentials: true,
        });

        toast("Customer updated successfully.", "success");
      } else {
        await axios.post("/api/customers/create", customerData, {
          withCredentials: true,
        });

        toast("Customer added successfully.", "success");
      }

      setModalOpen(false);
      setEditingUuid(null);
      setForm({ ...EMPTY_FORM });
      setTouched({});

      await loadCustomers();
    } catch (error) {
      console.error("Failed to save customer:", error);

      toast(
        getApiError(
          error,
          editingUuid
            ? "Unable to update customer."
            : "Unable to create customer.",
        ),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Relationships
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Customer directory
            <span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6b63]">
            Keep customer contact, identity type, and address details organized
            in one place.
          </p>
        </div>

        <Button size="lg" onClick={openAddModal}>
          <Plus size={17} style={{ color: GOLD }} />
          Add customer
        </Button>
      </header>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total customers"
          value={customers.length}
          note="All saved customer records"
          dark
        />

        <StatCard
          icon={UserRound}
          label="Individuals"
          value={individualCount}
          note="Personal customer profiles"
        />

        <StatCard
          icon={Building2}
          label="Organizations"
          value={companyCount}
          note="Companies, partnerships and trusts"
        />
      </section>

      {/* Customer table */}
      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-4 border-b border-[#eef2ec] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              All customers
            </h2>

            <p className="mt-1 text-xs text-[#5b6b63]">
              Search and manage saved customer records
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_200px]">
            <Input
              wrapperClassName="w-full"
              leadingIcon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, email or city"
              aria-label="Search customers"
            />

            <Select
              aria-label="Filter by customer type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value || "all")}
              options={TYPE_OPTIONS}
            />
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{loadError}</p>

            <button
              type="button"
              onClick={loadCustomers}
              className="mt-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Customer",
                  "Contact",
                  "Customer type",
                  "Location",
                  "Created",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3.5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <LoaderCircle
                      size={22}
                      className="mx-auto animate-spin text-[#1b7a5a]"
                    />
                    <p className="mt-3 text-sm text-[#5b6b63]">
                      Loading customers...
                    </p>
                  </td>
                </tr>
              ) : (
                visibleCustomers.map((customer) => {
                  const location = [customer.city, customer.state]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={customer.uuid}
                      className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[190px] items-center gap-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b3d2e] text-[11px] font-extrabold ring-2 ring-[#e4c48a]/40"
                            style={{ color: GOLD }}
                          >
                            {initials(customer.name)}
                          </span>

                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-bold text-[#14231d]">
                              {customer.name}
                            </p>

                            {customer.company_name &&
                              customer.company_name !== customer.name && (
                                <p className="mt-0.5 max-w-[220px] truncate text-xs text-[#5b6b63]">
                                  {customer.company_name}
                                </p>
                              )}

                            {customer.notes && (
                              <p className="mt-0.5 max-w-[220px] truncate text-xs text-[#8a958e]">
                                {customer.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <Detail icon={Phone}>{customer.phone}</Detail>

                          {customer.alternate_phone && (
                            <Detail icon={Phone}>
                              {customer.alternate_phone}
                            </Detail>
                          )}

                          {customer.email && (
                            <Detail icon={Mail}>{customer.email}</Detail>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            customer.customer_type === "individual"
                              ? "available"
                              : "info"
                          }
                        >
                          {titleCase(customer.customer_type || "other")}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[190px] space-y-1">
                          <Detail icon={MapPin}>
                            {location || "Location not added"}
                          </Detail>

                          <p className="pl-[22px] text-xs text-[#8a958e]">
                            {customer.postal_code || "No postal code"}
                          </p>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#5b6b63]">
                        {formatDate(customer.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(customer)}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && visibleCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      {loadError
                        ? "Could not load customers"
                        : "No customers found"}
                    </p>

                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try a different search or customer type.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setTypeFilter("all");
                        setPage(1);
                      }}
                      className="mt-3 text-xs font-extrabold text-[#1b7a5a] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[#5b6b63]">
            Showing{" "}
            <b className="text-[#14231d]">
              {filteredCustomers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(page * PAGE_SIZE, filteredCustomers.length)}
            </b>{" "}
            of <b className="text-[#14231d]">{filteredCustomers.length}</b>{" "}
            customers
          </span>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5b6b63]">
              Page {totalPages === 0 ? 0 : page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-[#dfe5dc] px-3 py-2 text-xs font-bold text-[#0b3d2e] hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={loading || totalPages === 0 || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="rounded-lg border border-[#dfe5dc] px-3 py-2 text-xs font-bold text-[#0b3d2e] hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingUuid ? "Edit customer" : "Add customer"}
        description="Fields marked with * are required."
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>

            <Button type="submit" form="customer-info-form" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              {saving
                ? "Saving..."
                : editingUuid
                  ? "Save changes"
                  : "Add customer"}
            </Button>
          </>
        }
      >
        <form
          id="customer-info-form"
          onSubmit={submitCustomer}
          noValidate
          className="space-y-6"
        >
          {/* Basic information */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e9f3ee] text-[#1b7a5a]">
                <UserRound size={16} />
              </span>

              <h3 className="text-sm font-bold text-[#14231d]">
                Basic information
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Full name"
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Customer full name"
                />

                {touched.name && !form.name.trim() && (
                  <FieldError>Name is required.</FieldError>
                )}
              </div>

              <Select
                label="Customer type"
                required
                value={form.customer_type}
                onChange={(event) =>
                  updateField("customer_type", event.target.value)
                }
                options={CUSTOMER_TYPES}
              />

              <div>
                <Input
                  label="Mobile number"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                  aria-invalid={Boolean(phoneError)}
                />

                <FieldError>{phoneError}</FieldError>

                {!phoneError && form.phone.trim() && touched.phone && (
                  <p className="mt-1.5 text-xs font-medium text-[#1b7a5a]">
                    Valid mobile number format
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Alternate mobile number"
                  type="tel"
                  value={form.alternate_phone}
                  onChange={(event) =>
                    updateField("alternate_phone", event.target.value)
                  }
                  placeholder="Optional alternate number"
                  aria-invalid={Boolean(alternatePhoneError)}
                />

                <FieldError>{alternatePhoneError}</FieldError>

                {!alternatePhoneError &&
                  form.alternate_phone.trim() &&
                  touched.alternate_phone && (
                    <p className="mt-1.5 text-xs font-medium text-[#1b7a5a]">
                      Valid mobile number format
                    </p>
                  )}
              </div>

              <div>
                <Input
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={Boolean(emailError)}
                />

                <FieldError>{emailError}</FieldError>
              </div>

              {form.customer_type !== "individual" && (
                <Input
                  label="Company / organization name"
                  value={form.company_name}
                  onChange={(event) =>
                    updateField("company_name", event.target.value)
                  }
                  placeholder="Registered organization name"
                />
              )}
            </div>
          </section>

          {/* Address */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e9f3ee] text-[#1b7a5a]">
                <MapPin size={16} />
              </span>

              <h3 className="text-sm font-bold text-[#14231d]">Address</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Address line 1"
                value={form.address_line1}
                onChange={(event) =>
                  updateField("address_line1", event.target.value)
                }
                placeholder="House, street or building"
              />

              <Input
                label="Address line 2"
                value={form.address_line2}
                onChange={(event) =>
                  updateField("address_line2", event.target.value)
                }
                placeholder="Area or landmark (optional)"
              />

              <Input
                label="City"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="City"
              />

              <Input
                label="District"
                value={form.district}
                onChange={(event) =>
                  updateField("district", event.target.value)
                }
                placeholder="District"
              />

              <Input
                label="State"
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
                placeholder="State"
              />

              <Input
                label="Postal code"
                value={form.postal_code}
                onChange={(event) =>
                  updateField("postal_code", event.target.value)
                }
                placeholder="PIN / postal code"
              />

              <Input
                label="Country code (ISO 3166-1 alpha-2)"
                maxLength={2}
                value={form.country_code}
                onChange={(event) =>
                  updateField("country_code", event.target.value.toUpperCase())
                }
                placeholder="IN"
              />
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="mb-3 text-sm font-bold text-[#14231d]">
              Additional information
            </h3>

            <label
              className="mb-2 block text-sm font-semibold text-[#14231d]"
              htmlFor="customer-notes"
            >
              Notes
            </label>

            <textarea
              id="customer-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Optional notes about this customer"
              className="block w-full rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15"
            />
          </section>
        </form>
      </Modal>
    </div>
  );
}

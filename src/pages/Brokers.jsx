import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mail,
  MapPin,
  Plus,
  Search,
  Users,
  UserRound,
  Pencil,
  Phone,
  LoaderCircle,
  Building2,
} from "lucide-react";
import axios from "axios";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  phone: "",
  alternate_phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  district: "",
  state: "",
  postal_code: "",
  country_code: "IN",
  notes: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (phone.length > 30 || !isValidIndianMobile(phone)) {
    return "Enter a valid Indian mobile number (10 digits, starting with 6–9).";
  }

  return "";
};

const getApiError = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

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

const extractBrokers = (response) => {
  const data = response.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.brokers)) return data.brokers;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(response.data?.brokers)) {
    return response.data.brokers;
  }

  throw new Error("Invalid brokers response. Expected an array of brokers.");
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

export default function Brokers() {
  const toast = useToast();

  const [brokers, setBrokers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [touched, setTouched] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Fetch brokers from the backend.
  const loadBrokers = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await axios.get("/api/brokers/getBrokers", {
        withCredentials: true,
      });

      setBrokers(extractBrokers(response));
    } catch (error) {
      console.error("Failed to fetch brokers:", error);

      setLoadError(getApiError(error, "Unable to load brokers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrokers();
  }, [loadBrokers]);

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
    (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim()))
      ? "A valid email address is required."
      : form.email.trim().length > 254
        ? "Email cannot exceed 254 characters."
        : "";

  const filteredBrokers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return brokers.filter((broker) => {
      const searchable = [
        broker.name,
        broker.phone,
        broker.alternate_phone,
        broker.email,
        broker.city,
        broker.district,
        broker.state,
        broker.postal_code,
        broker.address_line1,
        broker.address_line2,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [brokers, query]);

  const totalPages = Math.ceil(filteredBrokers.length / PAGE_SIZE);

  const visibleBrokers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredBrokers.slice(start, start + PAGE_SIZE);
  }, [filteredBrokers, page]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  // Statistics are based on the complete broker collection.
  const brokersWithPhone = brokers.filter((broker) =>
    Boolean(broker.phone),
  ).length;

  const brokersWithEmail = brokers.filter((broker) =>
    Boolean(broker.email),
  ).length;

  const openAddModal = () => {
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched({});
    setModalOpen(true);
  };

  const openEditModal = (broker) => {
    setEditingUuid(broker.uuid);

    setForm({
      ...EMPTY_FORM,
      ...broker,
      name: broker.name ?? "",
      phone: broker.phone ?? "",
      alternate_phone: broker.alternate_phone ?? "",
      email: broker.email ?? "",
      country_code: broker.country_code ?? "IN",
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

  const submitBroker = async (event) => {
    event.preventDefault();

    setTouched({
      name: true,
      phone: true,
      alternate_phone: true,
      email: true,
      country_code: true,
    });

    const cleanName = form.name.trim();
    const cleanPhone = form.phone.trim();
    const cleanAlternatePhone = form.alternate_phone.trim();
    const cleanEmail = form.email.trim();
    const cleanCountryCode = form.country_code.trim().toUpperCase();

    if (!cleanName || cleanName.length > 100) {
      toast(
        "Broker name is required and cannot exceed 100 characters.",
        "warning",
      );
      return;
    }

    if (getPhoneError(cleanPhone, true)) {
      toast("Please enter a valid primary mobile number.", "warning");
      return;
    }

    if (cleanAlternatePhone && getPhoneError(cleanAlternatePhone)) {
      toast("Please enter a valid alternate mobile number.", "warning");
      return;
    }

    if (
      !cleanEmail ||
      cleanEmail.length > 254 ||
      !EMAIL_REGEX.test(cleanEmail)
    ) {
      toast("Please enter a valid email address.", "warning");
      return;
    }

    if (!/^[A-Z]{2}$/.test(cleanCountryCode)) {
      toast("Country code must contain two letters.", "warning");
      return;
    }

    if (
      form.address_line1.length > 5000 ||
      form.address_line2.length > 5000 ||
      form.notes.length > 10000
    ) {
      toast("Address or notes exceed the allowed length.", "warning");
      return;
    }

    const brokerData = {
      name: cleanName,
      phone: cleanPhone,
      alternate_phone: cleanAlternatePhone || null,
      email: cleanEmail,
      address_line1: form.address_line1.trim() || null,
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim() || null,
      district: form.district.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
      country_code: cleanCountryCode,
      notes: form.notes.trim() || null,
    };

    setSaving(true);

    try {
      if (editingUuid) {
        await axios.put(`/api/brokers/${editingUuid}`, brokerData, {
          withCredentials: true,
        });

        toast("Broker updated successfully.", "success");
      } else {
        await axios.post("/api/brokers/create", brokerData, {
          withCredentials: true,
        });

        toast("Broker added successfully.", "success");
      }

      setModalOpen(false);
      setEditingUuid(null);
      setForm({ ...EMPTY_FORM });
      setTouched({});

      await loadBrokers();
    } catch (error) {
      console.error("Failed to save broker:", error);

      toast(
        getApiError(
          error,
          editingUuid ? "Unable to update broker." : "Unable to create broker.",
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
            Broker directory
            <span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6b63]">
            Manage broker contact information, locations, and business
            relationships in one place.
          </p>
        </div>

        <Button size="lg" onClick={openAddModal}>
          <Plus size={17} style={{ color: GOLD }} />
          Add broker
        </Button>
      </header>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total brokers"
          value={brokers.length}
          note="All saved broker records"
          dark
        />

        <StatCard
          icon={Phone}
          label="Mobile numbers"
          value={brokersWithPhone}
          note="Brokers with contact numbers"
        />

        <StatCard
          icon={Mail}
          label="Email addresses"
          value={brokersWithEmail}
          note="Brokers with email addresses"
        />
      </section>

      {/* Broker table */}
      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-4 border-b border-[#eef2ec] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              All brokers
            </h2>

            <p className="mt-1 text-xs text-[#5b6b63]">
              Search and manage saved broker records
            </p>
          </div>

          <Input
            wrapperClassName="w-full lg:max-w-md"
            leadingIcon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, email or city"
            aria-label="Search brokers"
          />
        </div>

        {loadError && (
          <div
            role="alert"
            className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{loadError}</p>

            <button
              type="button"
              onClick={loadBrokers}
              className="mt-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Broker",
                  "Contact",
                  "Location",
                  "Address",
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
                      Loading brokers...
                    </p>
                  </td>
                </tr>
              ) : (
                visibleBrokers.map((broker) => {
                  const location = [broker.city, broker.district, broker.state]
                    .filter(Boolean)
                    .join(", ");

                  const address = [broker.address_line1, broker.address_line2]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={broker.uuid || broker.id}
                      className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[180px] items-center gap-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b3d2e] text-[11px] font-extrabold ring-2 ring-[#e4c48a]/40"
                            style={{ color: GOLD }}
                          >
                            {initials(broker.name)}
                          </span>

                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate font-bold text-[#14231d]">
                              {broker.name}
                            </p>

                            <p className="text-xs text-[#5b6b63]">
                              {broker.country_code || "IN"}
                              {broker.postal_code
                                ? ` · ${broker.postal_code}`
                                : ""}
                            </p>

                            {broker.notes && (
                              <p className="mt-0.5 max-w-[200px] truncate text-xs text-[#8a958e]">
                                {broker.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-[190px] space-y-1.5">
                          <Detail icon={Phone}>{broker.phone}</Detail>

                          {broker.alternate_phone && (
                            <Detail icon={Phone}>
                              {broker.alternate_phone}
                            </Detail>
                          )}

                          <Detail icon={Mail}>{broker.email}</Detail>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[190px] space-y-1.5">
                          <Detail icon={MapPin}>
                            {location || "Location not added"}
                          </Detail>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[200px] break-words text-xs text-[#5b6b63]">
                          {address || "Address not added"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#5b6b63]">
                        {formatDate(broker.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(broker)}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && visibleBrokers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      {loadError
                        ? "Could not load brokers"
                        : "No brokers found"}
                    </p>

                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try another search or add a new broker.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setPage(1);
                      }}
                      className="mt-3 text-xs font-extrabold text-[#1b7a5a] hover:underline"
                    >
                      Clear search
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
              {filteredBrokers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(page * PAGE_SIZE, filteredBrokers.length)}
            </b>{" "}
            of <b className="text-[#14231d]">{filteredBrokers.length}</b>{" "}
            brokers
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

      {/* Add / Edit broker modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingUuid ? "Edit broker" : "Add broker"}
        description="Fields marked with * are required."
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>

            <Button type="submit" form="broker-info-form" disabled={saving}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}

              {saving
                ? "Saving..."
                : editingUuid
                  ? "Save changes"
                  : "Add broker"}
            </Button>
          </>
        }
      >
        <form
          id="broker-info-form"
          onSubmit={submitBroker}
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
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Broker full name"
                />

                {touched.name &&
                  (!form.name.trim() || form.name.trim().length > 100) && (
                    <FieldError>
                      Name is required and must not exceed 100 characters.
                    </FieldError>
                  )}
              </div>

              <div>
                <Input
                  label="Mobile number"
                  type="tel"
                  required
                  maxLength={30}
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                  aria-invalid={Boolean(phoneError)}
                />

                <FieldError>{phoneError}</FieldError>
              </div>

              <div>
                <Input
                  label="Alternate mobile number"
                  type="tel"
                  maxLength={30}
                  value={form.alternate_phone}
                  onChange={(event) =>
                    updateField("alternate_phone", event.target.value)
                  }
                  placeholder="Optional alternate number"
                  aria-invalid={Boolean(alternatePhoneError)}
                />

                <FieldError>{alternatePhoneError}</FieldError>
              </div>

              <div>
                <Input
                  label="Email address"
                  type="email"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="broker@example.com"
                  aria-invalid={Boolean(emailError)}
                />

                <FieldError>{emailError}</FieldError>
              </div>
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
                placeholder="Area or landmark"
              />

              <Input
                label="City"
                maxLength={100}
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="City"
              />

              <Input
                label="District"
                maxLength={100}
                value={form.district}
                onChange={(event) =>
                  updateField("district", event.target.value)
                }
                placeholder="District"
              />

              <Input
                label="State"
                maxLength={100}
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
                placeholder="State"
              />

              <Input
                label="Postal code"
                maxLength={20}
                value={form.postal_code}
                onChange={(event) =>
                  updateField("postal_code", event.target.value)
                }
                placeholder="PIN / postal code"
              />

              <div>
                <Input
                  label="Country code"
                  required
                  maxLength={2}
                  value={form.country_code}
                  onChange={(event) =>
                    updateField(
                      "country_code",
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="IN"
                />

                {touched.country_code &&
                  !/^[A-Z]{2}$/.test(form.country_code.trim()) && (
                    <FieldError>
                      Enter a two-letter country code, such as IN.
                    </FieldError>
                  )}
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="mb-3 text-sm font-bold text-[#14231d]">
              Additional information
            </h3>

            <label
              className="mb-2 block text-sm font-semibold text-[#14231d]"
              htmlFor="broker-notes"
            >
              Notes
            </label>

            <textarea
              id="broker-notes"
              rows={3}
              maxLength={10000}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Optional notes about this broker"
              className="block w-full rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15"
            />
          </section>
        </form>
      </Modal>
    </div>
  );
}

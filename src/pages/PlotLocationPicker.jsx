import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  MapPinned,
  Navigation,
  Search,
  Save,
  Printer,
  Building2,
  CheckCircle2,
  Copy,
  LocateFixed,
  LoaderCircle,
  AlertCircle,
  Satellite,
  Map as MapIcon,
  X,
  History,
  ExternalLink,
  Download,
  Trash2,
  Crosshair,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

/* ---------------------------------------------------------------- config */

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const PROJECTS = [
  { id: "PRJ-001", name: "Green Valley Residency" },
  { id: "PRJ-002", name: "Sunrise Industrial Park" },
  { id: "PRJ-003", name: "Lakeview Plots" },
];

const DEFAULT_POSITION = [21.1702, 72.8311]; // Surat, Gujarat
const MIN_CHARS = 3;
const DEBOUNCE_MS = 450;
const RECENT_KEY = "plot-picker:recent";

/**
 * Autocomplete provider.
 * Photon (by Komoot) is built for type-ahead on OpenStreetMap data.
 * Public Nominatim forbids autocomplete, so it is kept only for reverse lookup.
 * For production, swap this for Geoapify / LocationIQ / MapTiler with an API key.
 */
async function suggestPlaces(text, signal, [lat, lon]) {
  const params = new URLSearchParams({
    q: text,
    limit: "6",
    lang: "en",
    lat: String(lat), // rank places near the map first
    lon: String(lon),
    location_bias_scale: "0.4",
    bbox: "68.1,6.7,97.4,35.5", // India
  });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) throw new Error("Suggestions are unavailable right now.");
  const json = await res.json();
  return (json.features || []).map((f) => {
    const p = f.properties || {};
    const title = p.name || p.street || p.city || p.state || "Unnamed place";
    const subtitle = [p.street && p.name ? p.street : null, p.district, p.city, p.state, p.postcode]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i && v !== title)
      .join(", ");
    return {
      id: `${p.osm_type}${p.osm_id}-${f.geometry.coordinates.join(",")}`,
      title,
      subtitle,
      full: [title, subtitle].filter(Boolean).join(", "),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      type: p.osm_value || p.type || "",
    };
  });
}

/**
 * Second source: Nominatim. It has different coverage from Photon, so a place
 * missing from one is sometimes in the other. Its usage policy forbids
 * type-ahead, so this only runs when the user clicks "Search more results".
 */
async function searchNominatim(text, signal) {
  const params = new URLSearchParams({
    q: text,
    format: "jsonv2",
    limit: "6",
    countrycodes: "in",
    addressdetails: "1",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { signal, headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error("Search failed. Try again in a moment.");
  const data = await res.json();
  return data.map((r) => {
    const [title, ...rest] = r.display_name.split(", ");
    return {
      id: `nom-${r.place_id}`,
      title,
      subtitle: rest.join(", "),
      full: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type || "",
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strips Google Plus Codes ("4P7G+MX"), "India" and line breaks from a pasted address. */
function cleanAddress(raw) {
  return raw
    .replace(/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/gi, "")
    .replace(/\bIndia\b/gi, "")
    .replace(/\s*\n+\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/(,\s*)+/g, ", ")
    .replace(/^[,\s]+|[,\s]+$/g, "");
}

/** True for pasted text that looks like a full postal address (not coordinates or a link). */
function looksLikeAddress(text) {
  const t = text.trim();
  if (!t || parseCoordinates(t) || /^https?:\/\//i.test(t)) return false;
  return (t.includes(",") && t.length >= 20) || /\b\d{6}\b/.test(t);
}

/**
 * Searches a full address. Map data rarely knows shop or building names, so if
 * the full text finds nothing it retries without the leading parts, then with
 * only the area, city and PIN. Waits 1.1s between tries (Nominatim's limit).
 */
async function smartAddressSearch(raw, signal) {
  const cleaned = cleanAddress(raw);
  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  const attempts = [cleaned];
  for (let i = 1; i < parts.length - 2 && attempts.length < 3; i++) {
    attempts.push(parts.slice(i).join(", "));
  }
  if (parts.length > 3) attempts.push(parts.slice(-3).join(", "));
  const unique = [...new Set(attempts)];

  for (let i = 0; i < unique.length; i++) {
    if (i > 0) await sleep(1100);
    const items = await searchNominatim(unique[i], signal);
    if (items.length) return { items, matched: unique[i], exact: i === 0 };
  }
  return { items: [], matched: "", exact: false };
}

/**
 * Accepts "21.17, 72.83", "21.17 72.83" or a full Google Maps URL
 * (!3d..!4d.. place pin, @lat,lng, or ?q=lat,lng).
 * Short links (maps.app.goo.gl) cannot be read; open them and copy the full URL.
 */
function parseCoordinates(text) {
  const t = text.trim();
  const m =
    t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
    t.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
    t.match(/^(-?\d+\.?\d*)[\s,]+(-?\d+\.?\d*)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return [lat, lon];
}

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    /* storage unavailable: recent searches simply won't persist */
  }
}

function useDebounced(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* ------------------------------------------------------------ map helpers */

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.coords, Math.max(map.getZoom(), target.zoom || 16), {
      duration: 0.8,
    });
  }, [map, target]);
  return null;
}

/* -------------------------------------------------------------- component */

export default function PlotLocationPicker({ onSave }) {
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const [plotName, setPlotName] = useState("");
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [flyTarget, setFlyTarget] = useState(null);
  const [address, setAddress] = useState("");
  const [autoAddress, setAutoAddress] = useState(true);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recent, setRecent] = useState(loadRecent);

  const [addressLoading, setAddressLoading] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [savedPlots, setSavedPlots] = useState([]);
  const [errors, setErrors] = useState({});

  const searchBoxRef = useRef(null);
  const reverseAbort = useRef(null);
  const posRef = useRef(position);
  posRef.current = position; // lets the suggestion effect read the pin without re-running when it moves
  const [moreLoading, setMoreLoading] = useState(false);
  const skipAutoRef = useRef(""); // query already handled by the address search
  const debouncedQuery = useDebounced(query, DEBOUNCE_MS);

  const selectedProject = useMemo(
    () => PROJECTS.find((p) => p.id === projectId),
    [projectId],
  );
  const pastedCoords = useMemo(() => parseCoordinates(query), [query]);

  const notify = useCallback((text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  /* Fetch suggestions while typing (debounced, cancels stale requests) */
  useEffect(() => {
    const text = debouncedQuery.trim();
    if (text === skipAutoRef.current) return;
    if (text.length < MIN_CHARS || parseCoordinates(text)) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }
    const controller = new AbortController();
    setSearchLoading(true);
    suggestPlaces(text, controller.signal, posRef.current)
      .then((items) => {
        setSuggestions(items);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setSuggestions([]);
          notify(err.message, "warning");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearchLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, notify]);

  /* Close the dropdown when clicking outside it */
  useEffect(() => {
    function onDown(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* Reverse geocode (Nominatim, one request at a time, only on explicit pin moves) */
  const lookupAddress = useCallback(
    async (coords, { silent = false } = {}) => {
      reverseAbort.current?.abort();
      const controller = new AbortController();
      reverseAbort.current = controller;
      setAddressLoading(true);
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          lat: String(coords[0]),
          lon: String(coords[1]),
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${params}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error("Address lookup failed. Enter it manually.");
        const data = await res.json();
        setAddress(data.display_name || "");
        if (!silent) {
          notify(
            data.display_name
              ? "Address found. Check it before saving."
              : "No address found for this pin. Enter it manually.",
            data.display_name ? "success" : "warning",
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          notify(err.message || "Could not look up the address.", "warning");
        }
      } finally {
        if (reverseAbort.current === controller) setAddressLoading(false);
      }
    },
    [notify],
  );

  function movePin(coords, { fly = false, reverse = true } = {}) {
    setPosition(coords);
    if (fly) setFlyTarget({ coords, zoom: 17, at: Date.now() });
    if (reverse && autoAddress) lookupAddress(coords, { silent: true });
  }

  function chooseSuggestion(item) {
    const coords = [item.lat, item.lon];
    setPosition(coords);
    setFlyTarget({ coords, zoom: 17, at: Date.now() });
    setAddress(item.full);
    setQuery(item.full);
    setSuggestions([]);
    setOpen(false);
    const next = [item, ...recent.filter((r) => r.id !== item.id)];
    setRecent(next.slice(0, 5));
    saveRecent(next);
    notify("Location selected. Drag the pin onto the exact plot.", "success");
  }

  function usePastedCoordinates() {
    if (!pastedCoords) return;
    movePin(pastedCoords, { fly: true });
    setOpen(false);
    notify("Pin moved to the pasted coordinates.", "success");
  }

  async function runMoreSearch(override, replace = false) {
    const text = (typeof override === "string" ? override : query).trim();
    if (text.length < MIN_CHARS) return;
    skipAutoRef.current = text;
    setMoreLoading(true);
    try {
      const { items, matched, exact } = await smartAddressSearch(text);
      // Merge with the type-ahead results, dropping near-duplicates
      const base = replace ? [] : suggestions;
      const seen = new Set(base.map((s) => `${s.lat.toFixed(4)},${s.lon.toFixed(4)}`));
      const extra = items.filter((i) => !seen.has(`${i.lat.toFixed(4)},${i.lon.toFixed(4)}`));
      setSuggestions([...base, ...extra]);
      setActiveIndex(-1);
      setOpen(true);
      if (!items.length) {
        notify("No match for that address. Try the area name or PIN code.", "warning");
      } else if (!exact) {
        notify(`Exact address not found. Showing matches for "${matched}". Drag the pin onto the plot.`, "info");
      }
    } catch (err) {
      notify(err.message || "Search failed. Try again in a moment.", "warning");
    } finally {
      setMoreLoading(false);
    }
  }

  /** Pasting a full address (for example copied from Google Maps) searches it straight away. */
  function onSearchPaste(e) {
    const text = e.clipboardData?.getData("text") || "";
    if (!looksLikeAddress(text)) return;
    e.preventDefault();
    const cleaned = cleanAddress(text);
    setQuery(cleaned);
    setSuggestions([]);
    runMoreSearch(cleaned, true);
  }

  function onSearchKeyDown(e) {
    const list = suggestions;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % Math.max(list.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (pastedCoords) usePastedCoordinates();
      else if (activeIndex >= 0 && list[activeIndex]) chooseSuggestion(list[activeIndex]);
      else if (list[0]) chooseSuggestion(list[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      notify("Geolocation is not supported by this browser.", "warning");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => movePin([coords.latitude, coords.longitude], { fly: true }),
      () => notify("Could not access your location. Check browser permissions.", "warning"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validate() {
    const next = {};
    if (!plotName.trim()) next.plotName = "Enter a plot or unit number.";
    else if (
      savedPlots.some(
        (p) =>
          p.projectId === projectId &&
          p.plotName.toLowerCase() === plotName.trim().toLowerCase(),
      )
    )
      next.plotName = "This plot is already saved for this project.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;
    const record = {
      id: crypto.randomUUID?.() || String(Date.now()),
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      plotName: plotName.trim(),
      address: address.trim(),
      latitude: Number(position[0].toFixed(7)),
      longitude: Number(position[1].toFixed(7)),
      savedAt: new Date().toISOString(),
    };
    setSavedPlots((list) => [record, ...list]);
    onSave?.(record); // plug your API call in here
    setPlotName("");
    setAddress("");
    setQuery("");
    notify(`Saved ${record.plotName}. Add the next plot or export the list.`, "success");
  }

  function removePlot(id) {
    setSavedPlots((list) => list.filter((p) => p.id !== id));
  }

  function flyToPlot(plot) {
    const coords = [plot.latitude, plot.longitude];
    setPosition(coords);
    setFlyTarget({ coords, zoom: 17, at: Date.now() });
    setAddress(plot.address);
  }

  function exportCsv() {
    const header = ["Project ID", "Project", "Plot", "Address", "Latitude", "Longitude", "Saved at"];
    const rows = savedPlots.map((p) =>
      [p.projectId, p.projectName, p.plotName, p.address, p.latitude, p.longitude, p.savedAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plot-locations.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copyCoordinates() {
    const text = `${position[0].toFixed(7)}, ${position[1].toFixed(7)}`;
    try {
      await navigator.clipboard.writeText(text);
      notify("Coordinates copied to clipboard.", "success");
    } catch {
      notify(`Coordinates: ${text}`, "info");
    }
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${position[0]},${position[1]}`;
  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = satellite
    ? "Tiles &copy; Esri, Maxar, Earthstar Geographics"
    : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

  const queryReady = query.trim().length >= MIN_CHARS && !pastedCoords;
  const showDropdown =
    open &&
    (suggestions.length > 0 ||
      pastedCoords ||
      queryReady ||
      (query.trim().length < MIN_CHARS && recent.length > 0));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
            <MapPinned className="h-4 w-4" />
            CRM / Property management
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Plot location
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Search a place or paste coordinates, then drag the pin onto the exact plot.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]"
        >
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <StepHeader n="1" title="Plot details" hint="Choose the project and identify the plot." />

            <label htmlFor="project" className="mb-2 block text-xs font-semibold text-slate-700">
              Project <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                {PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">▼</span>
            </div>

            <label htmlFor="plotName" className="mb-2 mt-5 block text-xs font-semibold text-slate-700">
              Plot / unit number <span className="text-rose-600">*</span>
            </label>
            <input
              id="plotName"
              value={plotName}
              onChange={(e) => {
                setPlotName(e.target.value);
                if (errors.plotName) setErrors({});
              }}
              placeholder="e.g. Plot A-104"
              aria-invalid={Boolean(errors.plotName)}
              className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                errors.plotName
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10"
              }`}
            />
            {errors.plotName && <p className="mt-1.5 text-xs text-rose-600">{errors.plotName}</p>}

            <div className="mt-8">
              <StepHeader n="2" title="Find and pin the location" hint="Type a place, pick a suggestion, or paste coordinates or a Google Maps link." />
            </div>

            {/* ---- search with suggestions ---- */}
            <div className="relative" ref={searchBoxRef}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onSearchKeyDown}
                onPaste={onSearchPaste}
                placeholder="Search a place, paste an address, or paste lat, lng"
                aria-label="Search location"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls="place-suggestions"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searchLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSuggestions([]);
                    }}
                    aria-label="Clear search"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {showDropdown && (
                <ul
                  id="place-suggestions"
                  role="listbox"
                  className="absolute z-[1000] mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                >
                  {pastedCoords && (
                    <li>
                      <button
                        type="button"
                        onClick={usePastedCoordinates}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-emerald-50"
                      >
                        <Crosshair className="h-4 w-4 shrink-0 text-emerald-700" />
                        <span className="text-xs text-slate-700">
                          Go to {pastedCoords[0].toFixed(6)}, {pastedCoords[1].toFixed(6)}
                        </span>
                      </button>
                    </li>
                  )}

                  {!pastedCoords && query.trim().length < MIN_CHARS && recent.length > 0 && (
                    <>
                      <li className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400">
                        <History className="h-3.5 w-3.5" /> Recent searches
                      </li>
                      {recent.map((item) => (
                        <SuggestionRow key={item.id} item={item} onPick={chooseSuggestion} />
                      ))}
                    </>
                  )}

                  {suggestions.map((item, i) => (
                    <SuggestionRow
                      key={item.id}
                      item={item}
                      active={i === activeIndex}
                      query={query}
                      onPick={chooseSuggestion}
                    />
                  ))}

                  {queryReady && !searchLoading && suggestions.length === 0 && (
                    <li className="px-3 py-2 text-xs text-slate-500">
                      No quick matches. Try more results, or add a village, taluka or PIN code.
                    </li>
                  )}

                  {queryReady && (
                    <li className="border-t border-slate-100 p-1">
                      <button
                        type="button"
                        onClick={runMoreSearch}
                        disabled={moreLoading}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {moreLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Search more results
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
            {!searchLoading &&
              debouncedQuery.trim().length >= MIN_CHARS &&
              !pastedCoords &&
              suggestions.length === 0 &&
              !open && (
                <p className="mt-2 text-xs text-amber-700">
                  No matches. Try a nearby village, taluka or PIN code.
                </p>
              )}

            <div className="mb-3 mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Click the map or drag the marker to fine-tune the pin.
              </span>
              <div className="flex items-center gap-2">
                <LayerButton active={!satellite} onClick={() => setSatellite(false)} icon={MapIcon} label="Map" />
                <LayerButton active={satellite} onClick={() => setSatellite(true)} icon={Satellite} label="Satellite" />
                <button
                  type="button"
                  onClick={useMyLocation}
                  title="Use my location"
                  aria-label="Use my location"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
                >
                  <LocateFixed className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-[300px] overflow-hidden rounded-xl border border-slate-200 sm:h-[380px]">
              <MapContainer center={DEFAULT_POSITION} zoom={13} scrollWheelZoom className="h-full w-full">
                <TileLayer key={satellite ? "sat" : "street"} attribution={tileAttribution} url={tileUrl} maxZoom={19} />
                <MapClickHandler onPick={(c) => movePin(c)} />
                <MapFlyTo target={flyTarget} />
                <Marker
                  position={position}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend(e) {
                      const p = e.target.getLatLng();
                      movePin([p.lat, p.lng]);
                    },
                  }}
                />
              </MapContainer>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CoordinateCard label="Latitude" value={position[0].toFixed(7)} />
              <CoordinateCard label="Longitude" value={position[1].toFixed(7)} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <button type="button" onClick={copyCoordinates} className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950">
                <Copy className="h-3.5 w-3.5" /> Copy coordinates
              </button>
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950">
                <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
              </a>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <label htmlFor="address" className="block text-xs font-semibold text-slate-700">
                Address
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={autoAddress}
                  onChange={(e) => setAutoAddress(e.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-700"
                />
                Fill address when the pin moves
              </label>
            </div>
            <div className="relative mt-2">
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Move the pin to fill this automatically, or type it"
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
              {addressLoading && <LoaderCircle className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />}
            </div>
            <button
              type="button"
              onClick={() => lookupAddress(position)}
              disabled={addressLoading}
              className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 disabled:opacity-60"
            >
              <Navigation className="h-3.5 w-3.5" /> Get address for this pin
            </button>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Addresses come from map data and may describe a nearby locality, not the official plot boundary.
            </p>

            {message && (
              <div
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs leading-5 ${
                  messageType === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : messageType === "warning"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {messageType === "warning" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
              >
                <Save className="h-4 w-4" /> Save plot location
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </section>

          {/* ---- summary + saved list ---- */}
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <StepHeader n="3" title="Location summary" hint="Review before saving." />
              <p className="mb-1 text-xs font-bold text-emerald-800">{selectedProject.name}</p>
              <h3 className="break-words text-2xl font-bold tracking-tight text-slate-950">
                {plotName.trim() || "Untitled plot"}
              </h3>
              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                {address || "Address not added yet"}
              </p>
              <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
                <SummaryRow label="Project ID" value={selectedProject.id} />
                <SummaryRow label="Latitude" value={position[0].toFixed(7)} />
                <SummaryRow label="Longitude" value={position[1].toFixed(7)} />
                <SummaryRow label="Map layer" value={satellite ? "Satellite" : "Street map"} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Saved plots {savedPlots.length > 0 && <span className="text-slate-400">({savedPlots.length})</span>}
                </h2>
                {savedPlots.length > 0 && (
                  <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950">
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                )}
              </div>
              {savedPlots.length === 0 ? (
                <p className="text-xs leading-5 text-slate-500">
                  Plots you save appear here. Select one to jump back to its pin.
                </p>
              ) : (
                <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {savedPlots.map((p) => (
                    <li key={p.id} className="flex items-start gap-2 py-2.5">
                      <button type="button" onClick={() => flyToPlot(p)} className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-semibold text-slate-800">{p.plotName}</div>
                        <div className="truncate text-xs text-slate-500">
                          {p.projectName} · {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlot(p.id)}
                        aria-label={`Remove ${p.plotName}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Held in memory until you refresh. Connect the onSave prop to your API to keep them.
              </p>
            </div>
          </aside>
        </form>

        <footer className="pt-5 text-center text-[10px] text-slate-400">
          Street map © OpenStreetMap contributors · Satellite imagery © Esri and contributors · Suggestions by Photon, address lookup by Nominatim
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          main { min-height: auto !important; padding: 0 !important; }
          form { grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr) !important; gap: 12px !important; }
          section, aside > div { box-shadow: none !important; break-inside: avoid; padding: 12px !important; }
          button { display: none !important; }
          .leaflet-container { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}

/* ------------------------------------------------------------ small parts */

function StepHeader({ n, title, hint }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
        {n}
      </span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

function LayerButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/** Bolds the part of the title that matches what the user typed. */
function Highlight({ text, query }) {
  const q = (query || "").trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold text-slate-950">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

function SuggestionRow({ item, active, query, onPick }) {
  return (
    <li role="option" aria-selected={Boolean(active)}>
      <button
        type="button"
        onClick={() => onPick(item)}
        className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-emerald-50 ${
          active ? "bg-emerald-50" : ""
        }`}
      >
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <span className="min-w-0">
          <span className="block truncate text-sm text-slate-800">
            <Highlight text={item.title} query={query} />
          </span>
          {item.subtitle && <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>}
        </span>
      </button>
    </li>
  );
}

function CoordinateCard({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <strong className="break-all font-mono text-sm text-slate-800">{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <strong className="break-all text-right font-semibold tabular-nums text-slate-800">{value}</strong>
    </div>
  );
}
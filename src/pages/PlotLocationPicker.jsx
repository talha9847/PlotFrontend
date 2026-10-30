import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Building2,
  Copy,
  Crosshair,
  ExternalLink,
  LocateFixed,
  LoaderCircle,
  MapPin,
  MapPinned,
  Map as MapIcon,
  Navigation,
  Satellite,
  Save,
  Search,
  X,
} from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

import SearchableSelect from "../components/common/SearchableSelect";
import { useToast } from "../components/common/Toast";

const DEFAULT_POSITION = [21.1702, 72.8311];
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 450;
const RECENT_SEARCHES_KEY = "project-location:recent-searches";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function readRecentSearches() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function persistRecentSearches(items) {
  try {
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(items.slice(0, 5)),
    );
  } catch {
    // Recent searches are optional; the picker still works without storage.
  }
}

function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function parseCoordinates(value) {
  const text = value.trim();
  const match =
    text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ||
    text.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    text.match(/[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    text.match(/^(-?\d+\.?\d*)[\s,]+(-?\d+\.?\d*)$/);

  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
}

function cleanAddress(value) {
  return value
    .replace(
      /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/gi,
      "",
    )
    .replace(/\bIndia\b/gi, "")
    .replace(/\s*\n+\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/(,\s*)+/g, ", ")
    .replace(/^[,\s]+|[,\s]+$/g, "");
}

function looksLikeAddress(value) {
  const text = value.trim();
  if (!text || parseCoordinates(text) || /^https?:\/\//i.test(text)) {
    return false;
  }
  return (text.includes(",") && text.length >= 20) || /\b\d{6}\b/.test(text);
}

function formatReadableAddress(data) {
  const address = data?.address || {};
  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.city_district ||
    address.county ||
    address.state_district;

  const area =
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.residential ||
    address.hamlet;

  const parts = [
    data?.name,
    address.road,
    area,
    locality,
    address.state,
    address.postcode,
    address.country,
  ];

  const seen = new Set();

  return parts
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter((part) => {
      const normalized = part.toLowerCase();
      if (!part || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(", ");
}

async function suggestPlaces(searchText, signal, [latitude, longitude]) {
  const params = new URLSearchParams({
    q: searchText,
    limit: "6",
    lang: "en",
    lat: String(latitude),
    lon: String(longitude),
    location_bias_scale: "0.4",
    bbox: "68.1,6.7,97.4,35.5",
  });

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("Location suggestions are unavailable right now.");
  }

  const result = await response.json();

  return (result.features || []).map((feature) => {
    const properties = feature.properties || {};
    const title =
      properties.name ||
      properties.street ||
      properties.city ||
      properties.state ||
      "Unnamed place";

    const subtitle = [
      properties.street && properties.name ? properties.street : null,
      properties.district,
      properties.city,
      properties.state,
      properties.postcode,
    ]
      .filter(Boolean)
      .filter(
        (part, index, list) => list.indexOf(part) === index && part !== title,
      )
      .join(", ");

    return {
      id: `${properties.osm_type}${properties.osm_id}-${feature.geometry.coordinates.join(",")}`,
      title,
      subtitle,
      full: [title, subtitle].filter(Boolean).join(", "),
      latitude: Number(feature.geometry.coordinates[1]),
      longitude: Number(feature.geometry.coordinates[0]),
    };
  });
}

async function searchNominatim(searchText, signal) {
  const params = new URLSearchParams({
    q: searchText,
    format: "jsonv2",
    limit: "6",
    countrycodes: "in",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      signal,
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error("Address search failed. Please try again.");
  }

  const results = await response.json();

  return results.map((item) => {
    const [title, ...rest] = item.display_name.split(", ");
    return {
      id: `nominatim-${item.place_id}`,
      title,
      subtitle: rest.join(", "),
      full: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    };
  });
}

async function searchAddressWithFallback(rawAddress, signal) {
  const cleaned = cleanAddress(rawAddress);
  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const attempts = [cleaned];

  for (
    let index = 1;
    index < parts.length - 2 && attempts.length < 3;
    index += 1
  ) {
    attempts.push(parts.slice(index).join(", "));
  }

  if (parts.length > 3) {
    attempts.push(parts.slice(-3).join(", "));
  }

  const uniqueAttempts = [...new Set(attempts)];

  for (let index = 0; index < uniqueAttempts.length; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
    }

    const items = await searchNominatim(uniqueAttempts[index], signal);

    if (items.length) {
      return {
        items,
        matched: uniqueAttempts[index],
        exact: index === 0,
      };
    }
  }

  return { items: [], matched: "", exact: false };
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function MapFlyTo({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;

    map.flyTo(target, Math.max(map.getZoom(), 16), {
      duration: 0.8,
    });
  }, [map, target]);

  return null;
}

function StepHeading({ number, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
        {number}
      </span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function LayerButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function SuggestionItem({ item, query, active, onSelect }) {
  const search = query.trim();
  const matchIndex = search
    ? item.title.toLowerCase().indexOf(search.toLowerCase())
    : -1;

  return (
    <li role="option" aria-selected={Boolean(active)}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-emerald-50 ${
          active ? "bg-emerald-50" : ""
        }`}
      >
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <span className="min-w-0">
          <span className="block truncate text-sm text-slate-800">
            {matchIndex < 0 ? (
              item.title
            ) : (
              <>
                {item.title.slice(0, matchIndex)}
                <strong className="font-bold text-slate-950">
                  {item.title.slice(matchIndex, matchIndex + search.length)}
                </strong>
                {item.title.slice(matchIndex + search.length)}
              </>
            )}
          </span>
          {item.subtitle && (
            <span className="block truncate text-xs text-slate-500">
              {item.subtitle}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function CoordinateCard({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <strong className="break-all font-mono text-sm text-slate-800">
        {value}
      </strong>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <strong className="break-all text-right font-semibold tabular-nums text-slate-800">
        {value}
      </strong>
    </div>
  );
}

export default function ProjectLocationPicker({ onSave }) {
  const notify = useToast();

  const [projectId, setProjectId] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectLocationLoading, setProjectLocationLoading] = useState(false);

  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [flyTarget, setFlyTarget] = useState(null);
  const [address, setAddress] = useState("");
  const [autoAddress, setAutoAddress] = useState(true);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);

  const [addressLoading, setAddressLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [satellite, setSatellite] = useState(false);

  const searchBoxRef = useRef(null);
  const reverseLookupController = useRef(null);
  const projectLocationController = useRef(null);
  const positionRef = useRef(position);
  const skipAutocompleteFor = useRef("");

  positionRef.current = position;

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const pastedCoordinates = useMemo(() => parseCoordinates(query), [query]);

  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.value === projectId),
    [projectOptions, projectId],
  );

  const googleMapsUrl = useMemo(
    () =>
      `https://www.google.com/maps?q=${position[0].toFixed(7)},${position[1].toFixed(7)}`,
    [position],
  );

  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = satellite
    ? "Tiles &copy; Esri, Maxar, Earthstar Geographics"
    : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

  const queryReady =
    debouncedQuery.trim().length >= MIN_SEARCH_LENGTH && !pastedCoordinates;

  const showDropdown =
    dropdownOpen &&
    (suggestions.length > 0 ||
      Boolean(pastedCoordinates) ||
      queryReady ||
      (query.trim().length < MIN_SEARCH_LENGTH && recentSearches.length > 0));

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);

    try {
      const response = await axios.get("/api/plots/projects", {
        withCredentials: true,
      });

      const projects = response.data?.data?.projects;

      if (!Array.isArray(projects)) {
        throw new Error("The projects API returned an invalid response.");
      }

      const options = projects
        .filter((project) => project.uuid && project.name)
        .map((project) => ({
          value: String(project.uuid),
          label: project.name,
        }));

      setProjectOptions(options);
      setProjectId("");
    } catch (error) {
      setProjectOptions([]);
      setProjectId("");
      notify(
        error.response?.data?.message ||
          error.message ||
          "Unable to load projects.",
        "error",
      );
    } finally {
      setProjectsLoading(false);
    }
  }, [notify]);

  const handleProjectChange = useCallback(
    async (selected) => {
      const selectedUuid =
        typeof selected === "string"
          ? selected
          : (selected?.target?.value ?? selected?.value ?? "");

      const uuid = String(selectedUuid);

      projectLocationController.current?.abort();
      setProjectId(uuid);
      setAddress("");
      setQuery("");
      setSuggestions([]);
      setDropdownOpen(false);

      if (!uuid) {
        setPosition(DEFAULT_POSITION);
        setFlyTarget(DEFAULT_POSITION);
        setProjectLocationLoading(false);
        return;
      }

      const controller = new AbortController();
      projectLocationController.current = controller;
      setProjectLocationLoading(true);

      try {
        const response = await axios.get(
          `/api/projects/${encodeURIComponent(uuid)}/location`,
          {
            withCredentials: true,
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to fetch project location.",
          );
        }

        const project = response.data?.data;
        const latitude = Number(project?.latitude);
        const longitude = Number(project?.longitude);

        if (
          project?.latitude !== null &&
          project?.latitude !== undefined &&
          project?.longitude !== null &&
          project?.longitude !== undefined &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
        ) {
          const savedPosition = [latitude, longitude];
          setPosition(savedPosition);
          setFlyTarget(savedPosition);
          setAddress(project.address_line1 || "");
          notify("Existing project location loaded.", "success");
        } else {
          setPosition(DEFAULT_POSITION);
          setFlyTarget(DEFAULT_POSITION);
          setAddress("");
          notify(
            "No location saved for this project. Select a location on the map.",
            "info",
          );
        }
      } catch (error) {
        if (error.code !== "ERR_CANCELED" && error.name !== "CanceledError") {
          setPosition(DEFAULT_POSITION);
          setFlyTarget(DEFAULT_POSITION);
          setAddress("");
          notify(
            error.response?.data?.message ||
              error.message ||
              "Failed to fetch project location.",
            "error",
          );
        }
      } finally {
        if (projectLocationController.current === controller) {
          projectLocationController.current = null;
          setProjectLocationLoading(false);
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const searchText = debouncedQuery.trim();

    if (searchText === skipAutocompleteFor.current) {
      skipAutocompleteFor.current = "";
      return;
    }

    if (searchText.length < MIN_SEARCH_LENGTH || parseCoordinates(searchText)) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);

    suggestPlaces(searchText, controller.signal, positionRef.current)
      .then((items) => {
        setSuggestions(items);
        setActiveIndex(-1);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSuggestions([]);
          notify(error.message || "Location search failed.", "warning");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, notify]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(
    () => () => {
      reverseLookupController.current?.abort();
      projectLocationController.current?.abort();
    },
    [],
  );

  const lookupAddress = useCallback(
    async (coordinates, { silent = false } = {}) => {
      reverseLookupController.current?.abort();

      const controller = new AbortController();
      reverseLookupController.current = controller;
      setAddressLoading(true);

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          lat: String(coordinates[0]),
          lon: String(coordinates[1]),
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) {
          throw new Error("Address lookup failed. You can enter it manually.");
        }

        const result = await response.json();
        const readableAddress =
          formatReadableAddress(result) || result.display_name || "";

        setAddress(readableAddress);

        if (!silent) {
          notify(
            readableAddress
              ? "Address found. Please verify it before saving."
              : "No address found for this pin. Enter it manually.",
            readableAddress ? "success" : "warning",
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          notify(error.message || "Unable to look up this address.", "warning");
        }
      } finally {
        if (reverseLookupController.current === controller) {
          setAddressLoading(false);
        }
      }
    },
    [notify],
  );

  const movePin = useCallback(
    (coordinates, { fly = false, reverse = true } = {}) => {
      setPosition(coordinates);

      if (fly) {
        setFlyTarget(coordinates);
      }

      if (reverse && autoAddress) {
        lookupAddress(coordinates, { silent: true });
      }
    },
    [autoAddress, lookupAddress],
  );

  const selectSuggestion = useCallback(
    (item) => {
      const coordinates = [item.latitude, item.longitude];

      setPosition(coordinates);
      setFlyTarget(coordinates);
      setAddress(item.full);
      setQuery(item.full);
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveIndex(-1);

      const nextSearches = [
        item,
        ...recentSearches.filter((recent) => recent.id !== item.id),
      ].slice(0, 5);

      setRecentSearches(nextSearches);
      persistRecentSearches(nextSearches);

      notify(
        "Location selected. Adjust the pin to the exact project location.",
        "success",
      );
    },
    [notify, recentSearches],
  );

  const usePastedCoordinates = useCallback(() => {
    if (!pastedCoordinates) return;

    movePin(pastedCoordinates, { fly: true });
    setDropdownOpen(false);
    notify("Map pin moved to the entered coordinates.", "success");
  }, [movePin, notify, pastedCoordinates]);

  const searchMoreResults = useCallback(
    async (overrideText, replace = false) => {
      const searchText = (
        typeof overrideText === "string" ? overrideText : query
      ).trim();

      if (searchText.length < MIN_SEARCH_LENGTH) return;

      skipAutocompleteFor.current = searchText;
      setMoreLoading(true);

      const controller = new AbortController();

      try {
        const { items, matched, exact } = await searchAddressWithFallback(
          searchText,
          controller.signal,
        );

        const existing = replace ? [] : suggestions;
        const seenCoordinates = new Set(
          existing.map(
            (item) =>
              `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`,
          ),
        );

        const additionalItems = items.filter(
          (item) =>
            !seenCoordinates.has(
              `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`,
            ),
        );

        setSuggestions([...existing, ...additionalItems]);
        setActiveIndex(-1);
        setDropdownOpen(true);

        if (!items.length) {
          notify(
            "No matching address found. Try an area, city, or PIN code.",
            "warning",
          );
        } else if (!exact) {
          notify(
            `Showing matches for "${matched}". Please adjust the pin to the exact location.`,
            "info",
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          notify(error.message || "Address search failed.", "warning");
        }
      } finally {
        setMoreLoading(false);
      }
    },
    [notify, query, suggestions],
  );

  const handleSearchPaste = useCallback(
    (event) => {
      const pastedText = event.clipboardData?.getData("text") || "";

      if (!looksLikeAddress(pastedText)) return;

      event.preventDefault();

      const cleanedAddress = cleanAddress(pastedText);
      setQuery(cleanedAddress);
      setSuggestions([]);
      searchMoreResults(cleanedAddress, true);
    },
    [searchMoreResults],
  );

  const handleSearchKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setDropdownOpen(true);
        setActiveIndex(
          (current) => (current + 1) % Math.max(suggestions.length, 1),
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) =>
          current <= 0 ? suggestions.length - 1 : current - 1,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();

        if (pastedCoordinates) {
          usePastedCoordinates();
        } else if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectSuggestion(suggestions[activeIndex]);
        } else if (suggestions[0]) {
          selectSuggestion(suggestions[0]);
        }
      } else if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    },
    [
      activeIndex,
      pastedCoordinates,
      selectSuggestion,
      suggestions,
      usePastedCoordinates,
    ],
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      notify("Geolocation is not supported by this browser.", "warning");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        movePin([coords.latitude, coords.longitude], { fly: true }),
      () =>
        notify(
          "Unable to access your location. Check your browser permissions.",
          "warning",
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [movePin, notify]);

  const copyCoordinates = useCallback(async () => {
    const coordinates = `${position[0].toFixed(7)}, ${position[1].toFixed(7)}`;

    try {
      await navigator.clipboard.writeText(coordinates);
      notify("Coordinates copied.", "success");
    } catch {
      notify(`Coordinates: ${coordinates}`, "info");
    }
  }, [notify, position]);

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving || projectLocationLoading) return;

    if (!projectId) {
      notify("Please select a project.", "warning");
      return;
    }

    if (!address.trim()) {
      notify("Please enter or find the project address.", "warning");
      return;
    }

    const latitude = Number(position[0].toFixed(7));
    const longitude = Number(position[1].toFixed(7));

    const payload = {
      address: address.trim(),
      latitude,
      longitude,
    };

    setSaving(true);

    try {
      const response = await axios.patch(
        `/api/projects/${encodeURIComponent(projectId)}/location`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update project location.",
        );
      }

      const savedProject = response.data.data;

      // The API save has succeeded; a parent callback failure must not
      // incorrectly make the user think the database update failed.
      try {
        onSave?.(savedProject);
      } catch {
        notify(
          "Location saved, but the parent update callback failed.",
          "warning",
        );
      }

      setQuery("");
      setSuggestions([]);
      notify("Project location saved successfully.", "success");
    } catch (error) {
      notify(
        error.response?.data?.message ||
          error.message ||
          "Failed to save project location.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
            <MapPinned className="h-4 w-4" />
            CRM / Project management
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Project location
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Select a project, search for its location, and adjust the map pin to
            set its coordinates.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]"
        >
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <StepHeading
              number="1"
              title="Select project"
              description="Choose the project whose location you want to update."
            />

            <label
              htmlFor="project"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Project <span className="text-rose-600">*</span>
            </label>

            <div className="relative">
              <SearchableSelect
                label="Select Project"
                name="projectId"
                placeholder={
                  projectsLoading ? "Loading projects..." : "Select project"
                }
                searchPlaceholder="Search projects..."
                options={[
                  { value: "", label: "Select project" },
                  ...projectOptions,
                ]}
                value={projectId}
                disabled={
                  projectsLoading ||
                  projectLocationLoading ||
                  projectOptions.length === 0
                }
                onChange={handleProjectChange}
              />
              {projectLocationLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading saved project location...
                </div>
              )}
            </div>

            {!projectsLoading && projectOptions.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">
                No projects are available. Check your project permissions or try
                refreshing the page.
              </p>
            )}

            <div className="mt-8">
              <StepHeading
                number="2"
                title="Find project location"
                description="Search a place, paste an address or coordinates, or move the pin manually."
              />
            </div>

            <div className="relative" ref={searchBoxRef}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleSearchKeyDown}
                onPaste={handleSearchPaste}
                placeholder="Search a place, paste an address, or enter lat, lng"
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
                  {pastedCoordinates && (
                    <li>
                      <button
                        type="button"
                        onClick={usePastedCoordinates}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-emerald-50"
                      >
                        <Crosshair className="h-4 w-4 shrink-0 text-emerald-700" />
                        <span className="text-xs text-slate-700">
                          Move to {pastedCoordinates[0].toFixed(6)},{" "}
                          {pastedCoordinates[1].toFixed(6)}
                        </span>
                      </button>
                    </li>
                  )}

                  {!pastedCoordinates &&
                    query.trim().length < MIN_SEARCH_LENGTH &&
                    recentSearches.length > 0 && (
                      <>
                        <li className="px-3 py-2 text-xs font-semibold text-slate-400">
                          Recent searches
                        </li>
                        {recentSearches.map((item) => (
                          <SuggestionItem
                            key={item.id}
                            item={item}
                            query={query}
                            onSelect={selectSuggestion}
                          />
                        ))}
                      </>
                    )}

                  {suggestions.map((item, index) => (
                    <SuggestionItem
                      key={item.id}
                      item={item}
                      query={query}
                      active={index === activeIndex}
                      onSelect={selectSuggestion}
                    />
                  ))}

                  {queryReady && !searchLoading && suggestions.length === 0 && (
                    <li className="px-3 py-2 text-xs text-slate-500">
                      No quick matches. Try searching by area, city, or PIN
                      code.
                    </li>
                  )}

                  {queryReady && (
                    <li className="border-t border-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => searchMoreResults()}
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

            <div className="mb-3 mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Click the map or drag the marker to fine-tune the location.
              </span>

              <div className="flex items-center gap-2">
                <LayerButton
                  active={!satellite}
                  onClick={() => setSatellite(false)}
                  icon={MapIcon}
                >
                  Map
                </LayerButton>
                <LayerButton
                  active={satellite}
                  onClick={() => setSatellite(true)}
                  icon={Satellite}
                >
                  Satellite
                </LayerButton>
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

            <div className="relative h-[300px] overflow-hidden rounded-xl border border-slate-200 sm:h-[380px]">
              <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  key={satellite ? "satellite" : "street"}
                  attribution={tileAttribution}
                  url={tileUrl}
                  maxZoom={19}
                />

                <MapClickHandler
                  onPick={(coordinates) => movePin(coordinates)}
                />
                <MapFlyTo target={flyTarget} />

                <Marker
                  position={position}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend(event) {
                      const point = event.target.getLatLng();
                      movePin([point.lat, point.lng]);
                    },
                  }}
                />
              </MapContainer>
              {projectLocationLoading && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70">
                  <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">
                    <LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" />
                    Loading project location...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CoordinateCard label="Latitude" value={position[0].toFixed(7)} />
              <CoordinateCard
                label="Longitude"
                value={position[1].toFixed(7)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={copyCoordinates}
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy coordinates
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Google Maps
              </a>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <label
                htmlFor="project-address"
                className="block text-xs font-semibold text-slate-700"
              >
                Project address <span className="text-rose-600">*</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={autoAddress}
                  onChange={(event) => setAutoAddress(event.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-700"
                />
                Auto-fill when pin moves
              </label>
            </div>

            <div className="relative mt-2">
              <textarea
                id="project-address"
                rows={3}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Move the pin to find an address, or enter it manually"
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              {addressLoading && (
                <LoaderCircle className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            <button
              type="button"
              onClick={() => lookupAddress(position)}
              disabled={addressLoading}
              className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 disabled:opacity-60"
            >
              <Navigation className="h-3.5 w-3.5" />
              Get address for this pin
            </button>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Map addresses may identify a nearby locality rather than an
              official property boundary. Verify the address before saving.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={
                  saving ||
                  projectsLoading ||
                  projectLocationLoading ||
                  !projectId
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save project location
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Print
              </button>
            </div>
          </section>

          <aside className="min-w-0 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <StepHeading
                number="3"
                title="Location summary"
                description="Review the selected project and coordinates before saving."
              />

              <p className="mb-1 text-xs font-bold text-emerald-800">
                {selectedProject?.label || "No project selected"}
              </p>

              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                {address || "Address not added yet"}
              </p>

              <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
                <SummaryRow
                  label="Project UUID"
                  value={selectedProject?.value || "—"}
                />
                <SummaryRow label="Latitude" value={position[0].toFixed(7)} />
                <SummaryRow label="Longitude" value={position[1].toFixed(7)} />
                <SummaryRow
                  label="Map layer"
                  value={satellite ? "Satellite" : "Street map"}
                />
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View location in Google Maps
              </a>
            </div>
          </aside>
        </form>

        <footer className="pt-5 text-center text-[10px] text-slate-400">
          Street map © OpenStreetMap contributors · Satellite imagery © Esri and
          contributors · Suggestions by Photon · Address lookup by Nominatim
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

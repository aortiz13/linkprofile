"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Loader2,
  ExternalLink,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  MapPin,
  Globe,
  Smartphone,
  X,
} from "lucide-react";
import { format, subDays, subHours, startOfWeek, startOfMonth, getWeek, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

// ─── Geo URL ─────────────────────────────────────────────────────
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── ISO Alpha-2 to ISO numeric for map matching ─────────────────
const ISO_NUMERIC: Record<string, string> = {
  AR:"032",US:"840",MX:"484",CL:"152",CO:"170",BR:"076",ES:"724",PE:"604",
  EC:"218",UY:"858",PY:"600",VE:"862",BO:"068",CR:"188",PA:"591",
  DO:"214",GT:"320",HN:"340",SV:"222",NI:"558",CU:"192",GB:"826",
  FR:"250",DE:"276",IT:"380",PT:"620",NL:"528",BE:"056",CH:"756",
  AT:"040",SE:"752",NO:"578",DK:"208",FI:"246",IE:"372",PL:"616",
  CZ:"203",RO:"642",CA:"124",AU:"036",NZ:"554",JP:"392",KR:"410",
  CN:"156",IN:"356",IL:"376",AE:"784",SA:"682",ZA:"710",NG:"566",
  EG:"818",KE:"404",RU:"643",UA:"804",TR:"792",
};

// ─── Country Flag Emoji ──────────────────────────────────────────
function countryFlag(code: string) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

// ─── Date Range Presets ──────────────────────────────────────────
const PRESETS = [
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 90 días", days: 90 },
];

// ─── Link Type Config ────────────────────────────────────────────
const LINK_TYPE_TABS = [
  { key: "all", label: "Links" },
  { key: "social", label: "Redes Sociales" },
  { key: "custom", label: "Personalizados" },
];

const SOCIAL_TYPES = ["instagram", "whatsapp", "tiktok", "youtube", "twitter", "email"];

// ─── Link Type Colors & Icons ────────────────────────────────────
function getLinkColor(type: string): string {
  const map: Record<string, string> = {
    instagram: "#E1306C",
    whatsapp: "#25D366",
    tiktok: "#010101",
    youtube: "#FF0000",
    twitter: "#1DA1F2",
    email: "#EA4335",
    custom: "#4F46E5",
    ai_ref: "#8B5CF6",
  };
  return map[type] || "#4F46E5";
}

function getLinkBgColor(type: string): string {
  const map: Record<string, string> = {
    instagram: "#FDE8F0",
    whatsapp: "#DCFCE7",
    tiktok: "#F3F4F6",
    youtube: "#FEE2E2",
    twitter: "#DBEAFE",
    email: "#FEE2E2",
    custom: "#EEF2FF",
    ai_ref: "#EDE9FE",
  };
  return map[type] || "#EEF2FF";
}

function getLinkIcon(type: string): string {
  const map: Record<string, string> = {
    instagram: "📸",
    whatsapp: "💬",
    tiktok: "🎵",
    youtube: "▶️",
    twitter: "🐦",
    email: "📧",
    custom: "🔗",
    ai_ref: "✨",
  };
  return map[type] || "🔗";
}

// ─── Custom Tooltip ──────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="analytics-tooltip-value" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────
function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="analytics-section-header">
      <div className="analytics-section-title">
        <h2>{title}</h2>
        <Info className="w-4 h-4 text-[var(--text-muted)] opacity-40" />
      </div>
      {children}
    </div>
  );
}

// ─── Main Analytics Page ─────────────────────────────────────────
// ─── View Mode Config ────────────────────────────────────────────
const VIEW_MODES = [
  { key: "hourly" as const, label: "Hourly" },
  { key: "daily" as const, label: "Daily" },
  { key: "weekly" as const, label: "Weekly" },
  { key: "monthly" as const, label: "Monthly" },
];

const FILTER_OPTIONS = [
  { key: "location" as const, label: "Location", icon: MapPin },
  { key: "source" as const, label: "Source", icon: Globe },
  { key: "device" as const, label: "Device", icon: Smartphone },
];

type ViewMode = "hourly" | "daily" | "weekly" | "monthly";
type FilterType = "location" | "source" | "device";

export default function AnalyticsPage() {
  const [activeDays, setActiveDays] = useState(7);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chartTab, setChartTab] = useState<"views" | "ctr">("views");
  const [linkTab, setLinkTab] = useState("all");
  const [mapZoom, setMapZoom] = useState(1);
  const [countriesPage, setCountriesPage] = useState(1);
  const countriesPerPage = 5;
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [showFilterSubMenu, setShowFilterSubMenu] = useState<FilterType | null>(null);
  const [filterValues, setFilterValues] = useState<Record<FilterType, string | null>>({
    location: null,
    source: null,
    device: null,
  });

  const buildParams = (opts?: { forTimeseries?: boolean }) => {
    const isHourlyTs = opts?.forTimeseries && viewMode === "hourly";
    const from = isHourlyTs
      ? subHours(new Date(), 24).toISOString()
      : subDays(new Date(), activeDays).toISOString();
    const to = new Date().toISOString();
    const params = new URLSearchParams({ from, to });
    if (isHourlyTs) params.append("granularity", "hourly");
    if (activeFilters.includes("location") && filterValues.location) {
      params.append("location", filterValues.location);
    }
    if (activeFilters.includes("source") && filterValues.source) {
      params.append("source", filterValues.source);
    }
    if (activeFilters.includes("device") && filterValues.device) {
      params.append("device", filterValues.device);
    }
    return `?${params.toString()}`;
  };

  const queryDeps = [activeDays, activeFilters, filterValues, viewMode];

  const queryOpts = {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary", ...queryDeps],
    queryFn: () =>
      fetch(`/api/analytics/summary${buildParams()}`).then((r) => r.json()),
    ...queryOpts,
  });

  const { data: timeseries } = useQuery({
    queryKey: ["analytics-timeseries", ...queryDeps],
    queryFn: () =>
      fetch(`/api/analytics/timeseries${buildParams({ forTimeseries: true })}`).then((r) => r.json()),
    ...queryOpts,
  });

  const { data: countries } = useQuery({
    queryKey: ["analytics-countries", ...queryDeps],
    queryFn: () =>
      fetch(`/api/analytics/countries${buildParams()}`).then((r) => r.json()),
    ...queryOpts,
  });

  const { data: linkStats } = useQuery({
    queryKey: ["analytics-links", ...queryDeps],
    queryFn: () =>
      fetch(`/api/analytics/links${buildParams()}`).then((r) => r.json()),
    ...queryOpts,
  });

  const { data: deviceData } = useQuery({
    queryKey: ["analytics-devices", ...queryDeps],
    queryFn: () =>
      fetch(`/api/analytics/devices${buildParams()}`).then((r) => r.json()),
    ...queryOpts,
  });

  const { data: sources } = useQuery({
    queryKey: ["analytics-sources", ...queryDeps],
    queryFn: () =>
      fetch(`/api/analytics/sources${buildParams()}`).then((r) => r.json()),
    ...queryOpts,
  });

  // Aggregate timeseries by view mode
  const aggregatedTimeseries = useMemo(() => {
    if (!timeseries || viewMode === "daily" || viewMode === "hourly") return timeseries || [];

    const grouped = new Map<string, { visits: number; clicks: number }>();

    for (const point of timeseries) {
      const d = new Date(point.date);
      let key: string;
      if (viewMode === "weekly") {
        const ws = startOfWeek(d, { weekStartsOn: 1 });
        key = format(ws, "yyyy-MM-dd");
      } else {
        const ms = startOfMonth(d);
        key = format(ms, "yyyy-MM-dd");
      }
      const existing = grouped.get(key) || { visits: 0, clicks: 0 };
      existing.visits += point.visits;
      existing.clicks += point.clicks;
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }, [timeseries, viewMode]);

  // Build country visit map for the world map
  const countryVisitMap = useMemo(() => {
    const map = new Map<string, number>();
    if (countries) {
      for (const c of countries) {
        const numericCode = ISO_NUMERIC[c.country];
        if (numericCode) map.set(numericCode, c.visits);
      }
    }
    return map;
  }, [countries]);

  const maxVisits = useMemo(() => {
    if (!countries || countries.length === 0) return 1;
    return Math.max(...countries.map((c: { visits: number }) => c.visits), 1);
  }, [countries]);

  // Filter links by tab
  const filteredLinks = useMemo(() => {
    if (!linkStats) return [];
    if (linkTab === "all") return linkStats;
    if (linkTab === "social")
      return linkStats.filter((l: { type: string }) =>
        SOCIAL_TYPES.includes(l.type)
      );
    return linkStats.filter(
      (l: { type: string }) => !SOCIAL_TYPES.includes(l.type)
    );
  }, [linkStats, linkTab]);

  const maxClicks = useMemo(() => {
    if (!filteredLinks || filteredLinks.length === 0) return 1;
    return Math.max(
      ...filteredLinks.map((l: { clicks: number }) => l.clicks),
      1
    );
  }, [filteredLinks]);

  // Paginated countries
  const paginatedCountries = useMemo(() => {
    if (!countries) return [];
    const start = (countriesPage - 1) * countriesPerPage;
    return countries.slice(start, start + countriesPerPage);
  }, [countries, countriesPage]);

  const totalCountryPages = useMemo(() => {
    if (!countries) return 1;
    return Math.ceil(countries.length / countriesPerPage);
  }, [countries]);

  // Device totals
  const deviceTotal = useMemo(() => {
    if (!deviceData?.devices) return 0;
    return deviceData.devices.reduce(
      (s: number, d: { count: number }) => s + d.count,
      0
    );
  }, [deviceData]);

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const activePreset = PRESETS.find((p) => p.days === activeDays);

  return (
    <div className="analytics-page">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="analytics-header"
      >
        <h1 className="analytics-main-title">Link in Bio Analytics</h1>
        <div className="analytics-header-actions">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="analytics-date-btn"
            >
              <Calendar className="w-4 h-4" />
              {activePreset?.label || `Últimos ${activeDays} días`}
            </button>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="analytics-date-dropdown"
              >
                {PRESETS.map((p) => (
                  <button
                    key={p.days}
                    onClick={() => {
                      setActiveDays(p.days);
                      setShowDatePicker(false);
                    }}
                    className={`analytics-date-option ${
                      activeDays === p.days ? "active" : ""
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── Traffic Overview ───────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="analytics-section"
      >
        <SectionHeader title="Resumen de tráfico" />

        {/* KPIs */}
        <div className="analytics-kpi-row">
          <div className="analytics-kpi">
            <span className="analytics-kpi-label">Visitas</span>
            <span className="analytics-kpi-value">
              {(summary?.totalVisits || 0).toLocaleString()}
            </span>
            {summary?.deltaVisits !== undefined && summary.deltaVisits !== 0 && (
              <span
                className={`analytics-kpi-delta ${
                  summary.deltaVisits > 0 ? "positive" : "negative"
                }`}
              >
                {summary.deltaVisits > 0 ? "↑" : "↓"}{" "}
                {Math.abs(summary.deltaVisits).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="analytics-kpi-divider" />
          <div className="analytics-kpi">
            <span className="analytics-kpi-label">Clicks</span>
            <span className="analytics-kpi-value">
              {(summary?.totalClicks || 0).toLocaleString()}
            </span>
            {summary?.deltaClicks !== undefined && summary.deltaClicks !== 0 && (
              <span
                className={`analytics-kpi-delta ${
                  summary.deltaClicks > 0 ? "positive" : "negative"
                }`}
              >
                {summary.deltaClicks > 0 ? "↑" : "↓"}{" "}
                {Math.abs(summary.deltaClicks).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="analytics-kpi-divider" />
          <div className="analytics-kpi">
            <span className="analytics-kpi-label">Click rate</span>
            <span className="analytics-kpi-value">{summary?.ctr || 0}%</span>
          </div>
        </div>

        {/* Chart Tabs + Filters */}
        <div className="analytics-chart-controls">
          <div className="analytics-chart-tabs">
            <button
              onClick={() => setChartTab("views")}
              className={`analytics-chip ${chartTab === "views" ? "active" : ""}`}
            >
              Visitas y clicks
            </button>
            <button
              onClick={() => setChartTab("ctr")}
              className={`analytics-chip ${chartTab === "ctr" ? "active" : ""}`}
            >
              Click rate
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Active Filter Tags */}
            {activeFilters.map((f) => {
              const opt = FILTER_OPTIONS.find((o) => o.key === f);
              return (
                <span
                  key={f}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.25rem 0.625rem",
                    background: "var(--accent)",
                    color: "white",
                    borderRadius: "9999px",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt?.label}: {
                    f === "location" && countries?.find((c: any) => c.country === filterValues[f])?.countryName 
                      ? countries.find((c: any) => c.country === filterValues[f]).countryName 
                      : filterValues[f] || "Todos"
                  }
                  <button
                    onClick={() => {
                      setActiveFilters((prev) => prev.filter((x) => x !== f));
                      setFilterValues((prev) => ({ ...prev, [f]: null }));
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.25)",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </span>
              );
            })}

            {/* + ADD FILTER */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowFilterDropdown(!showFilterDropdown);
                  setShowViewDropdown(false);
                  setShowFilterSubMenu(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.4375rem 0.875rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                ADD FILTER
              </button>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    minWidth: 200,
                    overflow: "hidden",
                  }}
                >
                  {/* Step 1: Pick filter type */}
                  {!showFilterSubMenu && (
                    <>
                      {FILTER_OPTIONS.filter((o) => !activeFilters.includes(o.key)).map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setShowFilterSubMenu(opt.key)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            width: "100%",
                            textAlign: "left" as const,
                            padding: "0.625rem 1rem",
                            fontSize: "0.8125rem",
                            color: "var(--text-primary)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <opt.icon style={{ width: 16, height: 16 }} />
                          {opt.label}
                          <ChevronRight style={{ width: 14, height: 14, marginLeft: "auto", opacity: 0.4 }} />
                        </button>
                      ))}
                      {FILTER_OPTIONS.filter((o) => !activeFilters.includes(o.key)).length === 0 && (
                        <span style={{ display: "block", padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                          Todos los filtros activos
                        </span>
                      )}
                    </>
                  )}

                  {/* Step 2: Pick value for selected filter type */}
                  {showFilterSubMenu === "location" && (
                    <>
                      <button
                        onClick={() => setShowFilterSubMenu(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          width: "100%",
                          textAlign: "left" as const,
                          padding: "0.5rem 1rem",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          background: "var(--bg-elevated)",
                          border: "none",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.04em",
                        }}
                      >
                        <ChevronLeft style={{ width: 12, height: 12 }} /> Location
                      </button>
                      {countries && countries.length > 0 ? countries.slice(0, 10).map(
                        (c: { country: string; countryName: string }) => (
                          <button
                            key={c.country}
                            onClick={() => {
                              setActiveFilters((prev) => [...prev, "location"]);
                              setFilterValues((prev) => ({ ...prev, location: c.country }));
                              setShowFilterDropdown(false);
                              setShowFilterSubMenu(null);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              width: "100%",
                              textAlign: "left" as const,
                              padding: "0.5rem 1rem",
                              fontSize: "0.8125rem",
                              color: "var(--text-primary)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            {c.countryName}
                          </button>
                        )
                      ) : (
                        <span style={{ display: "block", padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>Sin datos</span>
                      )}
                    </>
                  )}

                  {showFilterSubMenu === "source" && (
                    <>
                      <button
                        onClick={() => setShowFilterSubMenu(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          width: "100%",
                          textAlign: "left" as const,
                          padding: "0.5rem 1rem",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          background: "var(--bg-elevated)",
                          border: "none",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.04em",
                        }}
                      >
                        <ChevronLeft style={{ width: 12, height: 12 }} /> Source
                      </button>
                      {sources && sources.length > 0 ? sources.slice(0, 10).map(
                        (s: { source: string }) => (
                          <button
                            key={s.source}
                            onClick={() => {
                              setActiveFilters((prev) => [...prev, "source"]);
                              setFilterValues((prev) => ({ ...prev, source: s.source }));
                              setShowFilterDropdown(false);
                              setShowFilterSubMenu(null);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              width: "100%",
                              textAlign: "left" as const,
                              padding: "0.5rem 1rem",
                              fontSize: "0.8125rem",
                              color: "var(--text-primary)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            {s.source}
                          </button>
                        )
                      ) : (
                        <span style={{ display: "block", padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>Sin datos</span>
                      )}
                    </>
                  )}

                  {showFilterSubMenu === "device" && (
                    <>
                      <button
                        onClick={() => setShowFilterSubMenu(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          width: "100%",
                          textAlign: "left" as const,
                          padding: "0.5rem 1rem",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          background: "var(--bg-elevated)",
                          border: "none",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.04em",
                        }}
                      >
                        <ChevronLeft style={{ width: 12, height: 12 }} /> Device
                      </button>
                      {deviceData?.devices && deviceData.devices.length > 0 ? deviceData.devices.map(
                        (d: { device: string }) => (
                          <button
                            key={d.device}
                            onClick={() => {
                              setActiveFilters((prev) => [...prev, "device"]);
                              setFilterValues((prev) => ({ ...prev, device: d.device }));
                              setShowFilterDropdown(false);
                              setShowFilterSubMenu(null);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              width: "100%",
                              textAlign: "left" as const,
                              padding: "0.5rem 1rem",
                              fontSize: "0.8125rem",
                              color: "var(--text-primary)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textTransform: "capitalize" as const,
                            }}
                          >
                            {d.device}
                          </button>
                        )
                      ) : (
                        <span style={{ display: "block", padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>Sin datos</span>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* VIEW: DAILY */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowViewDropdown(!showViewDropdown);
                  setShowFilterDropdown(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.4375rem 0.875rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                VIEW: {viewMode.toUpperCase()}
              </button>
              {showViewDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    minWidth: 160,
                    overflow: "hidden",
                  }}
                >
                  {VIEW_MODES.map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => {
                        setViewMode(mode.key);
                        setShowViewDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5625rem 1rem",
                        fontSize: "0.8125rem",
                        fontWeight: viewMode === mode.key ? 500 : 400,
                        color: viewMode === mode.key ? "white" : "var(--text-primary)",
                        background: viewMode === mode.key ? "var(--accent)" : "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {mode.label}
                      {viewMode === mode.key && <Check style={{ width: 14, height: 14, marginLeft: "auto" }} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="analytics-chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={aggregatedTimeseries}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => {
                  if (viewMode === "hourly") {
                    // d is like "2026-04-17 14:00" — show "14:00"
                    const parts = d.split(" ");
                    return parts[1] || d;
                  }
                  return format(new Date(d), "dd MMM", { locale: es });
                }}
                interval={viewMode === "hourly" ? 2 : undefined}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              {chartTab === "views" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="visits"
                    name="Visitas"
                    stroke="#4338CA"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#4338CA" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#16A34A"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#16A34A" }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="CTR"
                  stroke="#4338CA"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4338CA" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* Legend */}
          {chartTab === "views" && (
            <div className="analytics-chart-legend">
              <span className="analytics-legend-item">
                <span
                  className="analytics-legend-dot"
                  style={{ background: "#4338CA" }}
                />
                Visitas
              </span>
              <span className="analytics-legend-item">
                <span
                  className="analytics-legend-dot"
                  style={{ background: "#16A34A" }}
                />
                Clicks
              </span>
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Content Clicks ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="analytics-section"
      >
        <SectionHeader title="Clicks de contenido" />

        <div className="analytics-card">
          {/* Tabs */}
          <div className="analytics-tab-bar">
            {LINK_TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setLinkTab(tab.key)}
                className={`analytics-tab ${linkTab === tab.key ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Link List */}
          <div className="analytics-link-list">
            {filteredLinks && filteredLinks.length > 0 ? (
              filteredLinks.map(
                (
                  l: {
                    linkId: string;
                    title: string;
                    type: string;
                    clicks: number;
                  },
                  i: number
                ) => (
                  <motion.div
                    key={l.linkId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="analytics-link-item"
                  >
                    <div
                      className="analytics-link-icon"
                      style={{
                        background: getLinkBgColor(l.type),
                        color: getLinkColor(l.type),
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>
                        {getLinkIcon(l.type)}
                      </span>
                    </div>
                    <div className="analytics-link-info">
                      <div className="analytics-link-name-row">
                        <span className="analytics-link-name">
                          {l.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-40" />
                      </div>
                      <div className="analytics-link-bar-track">
                        <motion.div
                          className="analytics-link-bar-fill"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(l.clicks / maxClicks) * 100}%`,
                          }}
                          transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                          style={{ background: "#4338CA" }}
                        />
                      </div>
                    </div>
                    <span className="analytics-link-clicks">
                      {l.clicks.toLocaleString()} clicks
                    </span>
                  </motion.div>
                )
              )
            ) : (
              <p className="analytics-empty">Sin datos de clicks aún</p>
            )}
          </div>

          {filteredLinks && filteredLinks.length > 0 && (
            <div className="analytics-link-pagination">
              1 – {filteredLinks.length} de {filteredLinks.length}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Sources ────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="analytics-section"
      >
        <SectionHeader title="Fuentes" />

        <div className="analytics-card">
          <div className="analytics-table-wrapper">
            {sources && sources.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th className="text-left">Fuente</th>
                    <th className="text-right">Vistas</th>
                    <th className="text-right">Clicks</th>
                    <th className="text-right">Click rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map(
                    (s: {
                      source: string;
                      visits: number;
                      clicks: number;
                      percentage: number;
                    }) => {
                      const ctr = s.visits > 0 ? Math.round(((s.clicks || 0) / s.visits) * 1000) / 10 : 0;
                      return (
                        <tr key={s.source}>
                          <td>{s.source}</td>
                          <td className="text-right font-mono">
                            {(s.visits || 0).toLocaleString()}
                          </td>
                          <td className="text-right font-mono">
                            {(s.clicks || 0).toLocaleString()}
                          </td>
                          <td className="text-right text-[var(--text-muted)] font-mono">
                            {ctr}%
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            ) : (
              <p className="analytics-empty">Sin datos de fuentes aún</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* ─── Devices ────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="analytics-section"
      >
        <SectionHeader title="Dispositivos" />

        <div className="analytics-card">
          <div className="analytics-table-wrapper">
            {deviceData?.devices && deviceData.devices.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th className="text-left">Dispositivo</th>
                    <th className="text-right">Vistas</th>
                    <th className="text-right">Clicks</th>
                    <th className="text-right">Click rate</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceData.devices.map(
                    (d: { device: string; count: number; clicks: number }) => {
                      const ctr =
                        d.count > 0
                          ? Math.round((d.clicks / d.count) * 1000) / 10
                          : 0;
                      const label =
                        d.device === "mobile"
                          ? "Mobile"
                          : d.device === "desktop"
                          ? "Desktop"
                          : "Tablet";
                      return (
                        <tr key={d.device}>
                          <td className="capitalize">{label}</td>
                          <td className="text-right font-mono">
                            {(d.count || 0).toLocaleString()}
                          </td>
                          <td className="text-right font-mono">
                            {(d.clicks || 0).toLocaleString()}
                          </td>
                          <td className="text-right text-[var(--text-muted)] font-mono">
                            {ctr}%
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            ) : (
              <p className="analytics-empty">Sin datos de dispositivos aún</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* ─── Location (Map + Country Table) ─────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="analytics-section"
      >
        <SectionHeader title="Ubicación" />

        <div className="analytics-card">
          {/* World Map */}
          <div className="analytics-map-container">
            <ComposableMap
              projectionConfig={{ scale: 147, center: [0, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup zoom={mapZoom}>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const id = geo.id;
                      const visits = countryVisitMap.get(id) || 0;
                      const intensity =
                        visits > 0
                          ? Math.min(visits / maxVisits, 1)
                          : 0;

                      // Color scale: light gray -> deep indigo
                      const fill =
                        intensity > 0
                          ? `rgba(67, 56, 202, ${0.15 + intensity * 0.85})`
                          : "#E5E7EB";

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="#fff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: {
                              fill: intensity > 0 ? "#4338CA" : "#D1D5DB",
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Zoom controls */}
            <div className="analytics-map-zoom">
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 0.5, 4))}
                className="analytics-zoom-btn"
              >
                +
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 0.5, 1))}
                className="analytics-zoom-btn"
              >
                −
              </button>
              <button
                onClick={() => setMapZoom(1)}
                className="analytics-zoom-btn text-xs"
                style={{ width: "auto", padding: "0 0.75rem", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.05em" }}
              >
                RESET
              </button>
            </div>
          </div>

          {/* Country Table */}
          <div className="analytics-table-wrapper">
            {countries && countries.length > 0 ? (
              <>
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th className="text-left">País</th>
                      <th className="text-right">Visitas</th>
                      <th className="text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCountries.map(
                      (c: {
                        country: string;
                        countryName: string;
                        visits: number;
                        percentage: number;
                      }) => (
                        <tr key={c.country}>
                          <td>
                            <span className="analytics-country-cell">
                              <span className="analytics-country-flag">
                                {countryFlag(c.country)}
                              </span>
                              {c.countryName}
                            </span>
                          </td>
                          <td className="text-right font-mono">
                            {c.visits.toLocaleString()}
                          </td>
                          <td className="text-right text-[var(--text-muted)]">
                            {c.percentage}%
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalCountryPages > 1 && (
                  <div className="analytics-pagination">
                    <button
                      onClick={() =>
                        setCountriesPage((p) => Math.max(1, p - 1))
                      }
                      disabled={countriesPage === 1}
                      className="analytics-page-btn"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="analytics-page-info">
                      {countriesPage} / {totalCountryPages}
                    </span>
                    <button
                      onClick={() =>
                        setCountriesPage((p) =>
                          Math.min(totalCountryPages, p + 1)
                        )
                      }
                      disabled={countriesPage === totalCountryPages}
                      className="analytics-page-btn"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="analytics-empty">Sin datos de ubicación aún</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <div className="analytics-footer">
        <span>⚡ Analítica en tiempo real</span>
      </div>
    </div>
  );
}

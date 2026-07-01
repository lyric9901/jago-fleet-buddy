import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Car,
  Activity,
  Pause,
  Wrench,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVehiclesSubscription, useFilteredVehicles } from "@/lib/use-vehicles";
import { formatDate } from "@/lib/expiry";
import { EXPIRY_FIELDS, type Vehicle } from "@/lib/types";


export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { vehicles, loading } = useVehiclesSubscription();
  const [query, setQuery] = useState("");
  const filtered = useFilteredVehicles(vehicles, query);

  const total = vehicles.length;
  const running = vehicles.filter((v) => v.status === "Running").length;
  const idle = vehicles.filter((v) => v.status === "Idle").length;
  const maintenance = vehicles.filter((v) => v.status === "Maintenance").length;

  let expired = 0;
  let expiringSoon = 0;
  for (const v of vehicles) {
    for (const f of EXPIRY_FIELDS) {
      const s = expiryStatus(v[f.key] as string | null | undefined);
      if (s === "expired") expired++;
      else if (s === "soon") expiringSoon++;
    }
  }

  const recent = vehicles.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your fleet at a glance.
          </p>
        </div>
        <Button asChild>
          <Link to="/vehicles/new">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by vehicle number or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 text-base shadow-sm"
        />
      </div>

      {query.trim() && (
        <SearchResults vehicles={filtered} />
      )}

      {!query.trim() && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total" value={total} icon={<Car className="h-4 w-4" />} tone="primary" />
            <StatCard label="Running" value={running} icon={<Activity className="h-4 w-4" />} tone="success" />
            <StatCard label="Idle" value={idle} icon={<Pause className="h-4 w-4" />} tone="muted" />
            <StatCard label="Maintenance" value={maintenance} icon={<Wrench className="h-4 w-4" />} tone="warning" />
            <StatCard label="Expired Docs" value={expired} icon={<AlertTriangle className="h-4 w-4" />} tone="destructive" />
            <StatCard label="Expiring Soon" value={expiringSoon} icon={<Clock className="h-4 w-4" />} tone="warning" />
          </div>

          {/* Recent */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Vehicles</h2>
              <span className="text-xs text-muted-foreground">
                {loading ? "Loading…" : `${total} total`}
              </span>
            </div>
            {recent.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recent.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning" | "destructive" | "muted";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/15 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const worst = EXPIRY_FIELDS.map((f) =>
    expiryStatus(vehicle[f.key] as string | null | undefined),
  );
  const hasExpired = worst.includes("expired");
  const hasSoon = worst.includes("soon");

  return (
    <Link
      to="/vehicles/$id"
      params={{ id: vehicle.id }}
      className="group block rounded-xl border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-base font-semibold tracking-wide">
            {vehicle.vehicleNumber}
          </div>
          {vehicle.vehicleName && (
            <div className="mt-0.5 text-sm text-muted-foreground">
              {vehicle.vehicleName}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{vehicle.vehicleType}</Badge>
        <StatusBadge status={vehicle.status} />
        {hasExpired && (
          <Badge className="bg-destructive text-destructive-foreground">
            Expired
          </Badge>
        )}
        {!hasExpired && hasSoon && (
          <Badge className="bg-warning text-warning-foreground">
            Expiring soon
          </Badge>
        )}
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Running: "bg-success/15 text-success border-success/30",
    Idle: "bg-muted text-muted-foreground border-border",
    Maintenance: "bg-warning/20 text-warning-foreground border-warning/40",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function SearchResults({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No vehicles match your search.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {vehicles.length} result{vehicles.length === 1 ? "" : "s"}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Showing expiry summary. Next renewal:{" "}
        {nextExpiryLabel(vehicles[0]) ?? "—"}
      </div>
    </div>
  );
}

function nextExpiryLabel(v: Vehicle) {
  const dates = EXPIRY_FIELDS.map((f) => v[f.key] as string | null | undefined)
    .filter(Boolean)
    .map((d) => new Date(d as string))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return null;
  return formatDate(dates[0].toISOString());
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
      <Car className="mx-auto h-10 w-10 text-muted-foreground/60" />
      <h3 className="mt-4 text-base font-semibold">No vehicles yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first vehicle to start managing your fleet.
      </p>
      <Button asChild className="mt-6">
        <Link to="/vehicles/new">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Link>
      </Button>
    </div>
  );
}

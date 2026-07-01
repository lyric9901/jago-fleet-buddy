import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2, FileText, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchVehicle, deleteVehicle } from "@/lib/vehicles";
import { DOCUMENT_LABELS, EXPIRY_FIELDS, type DocumentKey, type Vehicle, type VehicleDocument } from "@/lib/types";
import { formatDate } from "@/lib/expiry";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vehicles/$id")({
  component: VehicleProfile,
});


function isImageDoc(d: VehicleDocument) {
  const n = d.name.toLowerCase();
  return /\.(webp|jpe?g|png|gif|avif)$/.test(n);
}

function VehicleProfile() {
  const [viewer, setViewer] = useState<{ doc: VehicleDocument; label: string } | null>(null);

  const { id } = Route.useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchVehicle(id).then((v) => {
      if (alive) {
        setVehicle(v);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!vehicle) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicle);
      toast.success("Vehicle deleted");
      router.navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }
  if (!vehicle) {
    return (
      <div className="space-y-4">
        <p>Vehicle not found.</p>
        <Button asChild>
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-mono text-xl font-semibold tracking-wide sm:text-2xl md:text-3xl">
              {vehicle.vehicleNumber}
            </h1>
            <StatusBadge status={vehicle.status} />
          </div>
          {vehicle.vehicleName && (
            <p className="mt-1 truncate text-muted-foreground">{vehicle.vehicleName}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{vehicle.vehicleType}</Badge>
            <Badge variant="secondary">{vehicle.fuelType}</Badge>
            {vehicle.brand && (
              <Badge variant="outline">
                {vehicle.brand}{vehicle.model ? ` ${vehicle.model}` : ""}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/vehicles/$id/edit" params={{ id: vehicle.id }}>
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes {vehicle.vehicleNumber}, all uploaded
                  documents, and owner photos. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="vehicle">
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto bg-muted/60 p-1">
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>


        <TabsContent value="vehicle" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card title="Details">
            <Row k="Number" v={vehicle.vehicleNumber} />
            <Row k="Name" v={vehicle.vehicleName} />
            <Row k="Type" v={vehicle.vehicleType} />
            <Row k="Brand" v={vehicle.brand} />
            <Row k="Model" v={vehicle.model} />
            <Row k="Capacity" v={vehicle.capacity?.toString()} />
            <Row k="Fuel" v={vehicle.fuelType} />
            <Row k="Status" v={vehicle.status} />
          </Card>
          <Card title="Expiry Dates">
            {EXPIRY_FIELDS.map((f) => {
              const date = vehicle[f.key] as string | null | undefined;
              return (
                <div
                  key={f.label}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <span className="text-sm text-muted-foreground">{f.label}</span>
                  <span className="text-sm">{formatDate(date)}</span>
                </div>
              );
            })}
          </Card>

        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <Card title="Driver">
            <Row k="Name" v={vehicle.driverName} />
            <Row k="Phone" v={vehicle.driverPhone} />
            <Row k="Date of Birth" v={formatDate(vehicle.driverDob)} />
            <Row k="Identity Proof" v={vehicle.identityProofType} />
            <Row
              k={
                vehicle.identityProofType === "Driving Licence"
                  ? "Licence Number"
                  : "Aadhaar Number"
              }
              v={vehicle.identityProofNumber}
            />
          </Card>
        </TabsContent>

        <TabsContent value="owners" className="mt-4 space-y-3">
          {vehicle.owners.length === 0 && (
            <p className="text-sm text-muted-foreground">No owners recorded.</p>
          )}
          {vehicle.owners.map((o, i) => (
            <Card key={o.id} title={`Owner ${i + 1}`}>
              <div className="flex items-start gap-4">
                {o.photoUrl ? (
                  <img
                    src={o.photoUrl}
                    alt=""
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                    {o.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1">
                  <Row k="Name" v={o.name} />
                  <Row k="Phone" v={o.phone} />
                  <Row k="Aadhaar" v={o.aadhaar} />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 grid gap-3 md:grid-cols-2">
          {(Object.keys(DOCUMENT_LABELS) as DocumentKey[]).map((key) => {
            const d = vehicle.documents[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-medium">{DOCUMENT_LABELS[key]}</div>
                    <div className="text-xs text-muted-foreground">
                      {d ? d.name : "Not uploaded"}
                    </div>
                  </div>
                </div>
                {d && (
                  <Button asChild variant="outline" size="sm">
                    <a href={d.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      View
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card title="Notes">
            <p className="whitespace-pre-wrap text-sm">
              {vehicle.notes?.trim() || (
                <span className="text-muted-foreground">No notes.</span>
              )}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{k}</span>
      <span className="text-sm font-medium">{v?.trim() ? v : "—"}</span>
    </div>
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function ExpiryDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    expired: "bg-destructive",
    soon: "bg-warning",
    valid: "bg-success",
    missing: "bg-muted-foreground/40",
  };
  const label: Record<string, string> = {
    expired: "Expired",
    soon: "Expiring soon",
    valid: "Valid",
    missing: "Not set",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${map[status]}`} />
      {label[status]}
    </span>
  );
}

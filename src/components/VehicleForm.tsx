import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Trash2, Plus, Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  DOCUMENT_LABELS,
  type DocumentKey,
  type FuelType,
  type IdentityProofType,
  type Owner,
  type Vehicle,
  type VehicleStatus,
  type VehicleType,
} from "@/lib/types";
import {
  isAllowedFile,
  uploadVehicleFile,
  deleteStoragePath,
  UploadError,
} from "@/lib/upload";
import { saveVehicle, generateVehicleId } from "@/lib/vehicles";

const VEHICLE_TYPES: VehicleType[] = ["Bus", "Auto", "Car", "Taxi", "Tempo"];
const FUEL_TYPES: FuelType[] = ["Petrol", "Diesel", "CNG", "Electric"];
const STATUSES: VehicleStatus[] = ["Running", "Idle", "Maintenance"];
const ID_TYPES: IdentityProofType[] = ["Driving Licence", "Aadhaar Card"];

function blankOwner(): Owner {
  return {
    id: crypto.randomUUID(),
    name: "",
    phone: "",
    aadhaar: "",
    photoUrl: null,
    photoPath: null,
  };
}

export function emptyVehicle(): Vehicle {
  const now = Date.now();
  return {
    id: "",
    vehicleNumber: "",
    vehicleName: "",
    vehicleType: "Car",
    brand: "",
    model: "",
    capacity: null,
    fuelType: "Diesel",
    status: "Running",
    driverName: "",
    driverPhone: "",
    driverDob: null,
    identityProofType: "Driving Licence",
    identityProofNumber: "",
    owners: [blankOwner()],
    insuranceExpiry: null,
    permitExpiry: null,
    pucExpiry: null,
    fitnessExpiry: null,
    documents: {},
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function VehicleForm({
  initial,
  mode,
}: {
  initial: Vehicle;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [v, setV] = useState<Vehicle>(initial);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof Vehicle>(key: K, value: Vehicle[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function updateOwner(id: string, patch: Partial<Owner>) {
    setV((prev) => ({
      ...prev,
      owners: prev.owners.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  }

  function addOwner() {
    setV((prev) => ({ ...prev, owners: [...prev.owners, blankOwner()] }));
  }

  async function removeOwner(id: string) {
    const owner = v.owners.find((o) => o.id === id);
    if (owner?.photoPath) await deleteStoragePath(owner.photoPath);
    setV((prev) => ({
      ...prev,
      owners: prev.owners.filter((o) => o.id !== id),
    }));
  }

  async function handleOwnerPhoto(id: string, file: File) {
    if (!v.vehicleNumber.trim()) {
      toast.error("Enter vehicle number first");
      return;
    }
    try {
      const owner = v.owners.find((o) => o.id === id);
      if (owner?.photoPath) await deleteStoragePath(owner.photoPath);
      const res = await uploadVehicleFile(
        v.vehicleNumber,
        `owners/${id}/photo`,
        file,
      );
      updateOwner(id, { photoUrl: res.url, photoPath: res.path });
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(
        err instanceof UploadError ? err.message : "Failed to upload photo",
      );
    }
  }

  async function handleDocUpload(key: DocumentKey, file: File) {
    if (!v.vehicleNumber.trim()) {
      toast.error("Enter vehicle number first");
      return;
    }
    if (!isAllowedFile(file)) {
      toast.error("Allowed: PDF, JPG, PNG, WEBP");
      return;
    }
    try {
      const existing = v.documents[key];
      if (existing?.path) await deleteStoragePath(existing.path);
      const res = await uploadVehicleFile(v.vehicleNumber, key, file);
      setV((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [key]: { ...res, uploadedAt: Date.now() },
        },
      }));
      toast.success(`${DOCUMENT_LABELS[key]} uploaded`);
    } catch (err) {
      toast.error(
        err instanceof UploadError ? err.message : "Failed to upload",
      );
    }
  }

  async function handleDocDelete(key: DocumentKey) {
    const existing = v.documents[key];
    if (existing?.path) await deleteStoragePath(existing.path);
    setV((prev) => {
      const next = { ...prev.documents };
      delete next[key];
      return { ...prev, documents: next };
    });
    toast.success("Document removed");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.vehicleNumber.trim()) {
      toast.error("Vehicle number is required");
      return;
    }
    setSubmitting(true);
    try {
      const id = mode === "create" ? generateVehicleId(v.vehicleNumber) : v.id;
      const toSave: Vehicle = {
        ...v,
        id,
        vehicleNumber: v.vehicleNumber.toUpperCase().trim(),
      };
      await saveVehicle(toSave);
      toast.success(mode === "create" ? "Vehicle added" : "Vehicle updated");
      router.navigate({ to: "/vehicles/$id", params: { id } });
    } catch (err) {
      toast.error((err as Error).message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto bg-muted/60 p-1">
          <TabsTrigger value="basic">Vehicle</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>


        <TabsContent value="basic" className="mt-4">
          <Section title="Basic Information">
            <Grid>
              <Field label="Vehicle Number *">
                <Input
                  value={v.vehicleNumber}
                  onChange={(e) =>
                    update("vehicleNumber", e.target.value.toUpperCase())
                  }
                  placeholder="UP32AB1234"
                  className="font-mono uppercase tracking-wide"
                  disabled={mode === "edit"}
                />
              </Field>
              <Field label="Vehicle Name / Nickname">
                <Input
                  value={v.vehicleName ?? ""}
                  onChange={(e) => update("vehicleName", e.target.value)}
                />
              </Field>
              <Field label="Vehicle Type">
                <Select
                  value={v.vehicleType}
                  onValueChange={(val) => update("vehicleType", val as VehicleType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Brand">
                <Input
                  value={v.brand ?? ""}
                  onChange={(e) => update("brand", e.target.value)}
                />
              </Field>
              <Field label="Model">
                <Input
                  value={v.model ?? ""}
                  onChange={(e) => update("model", e.target.value)}
                />
              </Field>
              <Field label="Capacity">
                <Input
                  type="number"
                  min={0}
                  value={v.capacity ?? ""}
                  onChange={(e) =>
                    update(
                      "capacity",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </Field>
              <Field label="Fuel Type">
                <Select
                  value={v.fuelType}
                  onValueChange={(val) => update("fuelType", val as FuelType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={v.status}
                  onValueChange={(val) => update("status", val as VehicleStatus)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Grid>
          </Section>
        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <Section title="Driver Details">
            <Grid>
              <Field label="Driver Name">
                <Input
                  value={v.driverName ?? ""}
                  onChange={(e) => update("driverName", e.target.value)}
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  value={v.driverPhone ?? ""}
                  onChange={(e) => update("driverPhone", e.target.value)}
                  type="tel"
                />
              </Field>
              <Field label="Date of Birth">
                <Input
                  type="date"
                  value={v.driverDob ?? ""}
                  onChange={(e) => update("driverDob", e.target.value || null)}
                />
              </Field>
              <Field label="Identity Proof">
                <Select
                  value={v.identityProofType}
                  onValueChange={(val) =>
                    update("identityProofType", val as IdentityProofType)
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ID_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label={
                  v.identityProofType === "Driving Licence"
                    ? "Licence Number"
                    : "Aadhaar Number"
                }
              >
                <Input
                  value={v.identityProofNumber ?? ""}
                  onChange={(e) => update("identityProofNumber", e.target.value)}
                />
              </Field>
            </Grid>
          </Section>
        </TabsContent>

        <TabsContent value="owners" className="mt-4 space-y-4">
          {v.owners.map((o, i) => (
            <Section
              key={o.id}
              title={`Owner ${i + 1}`}
              action={
                v.owners.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOwner(o.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )
              }
            >
              <Grid>
                <Field label="Owner Name">
                  <Input
                    value={o.name}
                    onChange={(e) => updateOwner(o.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="Phone Number">
                  <Input
                    value={o.phone}
                    onChange={(e) => updateOwner(o.id, { phone: e.target.value })}
                    type="tel"
                  />
                </Field>
                <Field label="Aadhaar Number">
                  <Input
                    value={o.aadhaar}
                    onChange={(e) => updateOwner(o.id, { aadhaar: e.target.value })}
                  />
                </Field>
                <Field label="Owner Photo">
                  <div className="flex items-center gap-3">
                    {o.photoUrl && (
                      <img
                        src={o.photoUrl}
                        alt=""
                        className="h-12 w-12 rounded-md border object-cover"
                      />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      {o.photoUrl ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleOwnerPhoto(o.id, e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                </Field>
              </Grid>
            </Section>
          ))}
          <Button type="button" variant="outline" onClick={addOwner}>
            <Plus className="h-4 w-4" />
            Add another owner
          </Button>
        </TabsContent>

        <TabsContent value="expiry" className="mt-4">
          <Section title="Expiry Dates">
            <Grid>
              <Field label="Insurance Expiry">
                <Input
                  type="date"
                  value={v.insuranceExpiry ?? ""}
                  onChange={(e) =>
                    update("insuranceExpiry", e.target.value || null)
                  }
                />
              </Field>
              <Field label="Permit Expiry">
                <Input
                  type="date"
                  value={v.permitExpiry ?? ""}
                  onChange={(e) => update("permitExpiry", e.target.value || null)}
                />
              </Field>
              <Field label="PUC Expiry">
                <Input
                  type="date"
                  value={v.pucExpiry ?? ""}
                  onChange={(e) => update("pucExpiry", e.target.value || null)}
                />
              </Field>
              <Field label="Fitness Certificate Expiry">
                <Input
                  type="date"
                  value={v.fitnessExpiry ?? ""}
                  onChange={(e) => update("fitnessExpiry", e.target.value || null)}
                />
              </Field>
            </Grid>
          </Section>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-3">
          {(Object.keys(DOCUMENT_LABELS) as DocumentKey[]).map((key) => {
            const docFile = v.documents[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    {docFile?.name.endsWith(".pdf") ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium">{DOCUMENT_LABELS[key]}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {docFile ? docFile.name : "No file uploaded"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {docFile && (
                    <>
                      <Button type="button" variant="outline" size="sm" asChild>
                        <a href={docFile.url} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDocDelete(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                    {docFile ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleDocUpload(key, e.target.files[0])
                      }
                    />
                  </label>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Images are auto-compressed to WEBP (≤ 1 MB). PDFs must be under 5 MB.
          </p>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Section title="Notes">
            <Textarea
              rows={8}
              value={v.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Any additional notes about this vehicle…"
            />
          </Section>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Add Vehicle"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { VehicleForm } from "@/components/VehicleForm";
import { fetchVehicle } from "@/lib/vehicles";
import type { Vehicle } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/vehicles/$id/edit")({
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { id } = Route.useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!vehicle) return <div className="text-sm">Vehicle not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/vehicles/$id"
          params={{ id: vehicle.id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vehicle
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Edit {vehicle.vehicleNumber}
        </h1>
      </div>
      <VehicleForm initial={vehicle} mode="edit" />
    </div>
  );
}

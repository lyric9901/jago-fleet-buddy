import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { VehicleForm, emptyVehicle } from "@/components/VehicleForm";

export const Route = createFileRoute("/_authenticated/vehicles/new")({
  component: NewVehiclePage,
});

function NewVehiclePage() {
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Add Vehicle
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new vehicle record.
        </p>
      </div>
      <VehicleForm initial={emptyVehicle()} mode="create" />
    </div>
  );
}

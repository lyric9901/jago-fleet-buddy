import { useEffect, useMemo, useState } from "react";
import { subscribeVehicles } from "@/lib/vehicles";
import type { Vehicle } from "@/lib/types";

export function useVehiclesSubscription() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeVehicles((vs) => {
      setVehicles(vs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { vehicles, loading };
}

export function useFilteredVehicles(vehicles: Vehicle[], query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => {
      return (
        v.vehicleNumber.toLowerCase().includes(q) ||
        (v.vehicleName ?? "").toLowerCase().includes(q)
      );
    });
  }, [vehicles, query]);
}

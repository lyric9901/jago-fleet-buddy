import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { Vehicle, VehicleDocument } from "./types";
import { deleteStoragePath } from "./upload";

const COLLECTION = "vehicles";

function vehiclesCol() {
  const { db } = getFirebase();
  return collection(db, COLLECTION);
}

export function subscribeVehicles(cb: (vs: Vehicle[]) => void) {
  const q = query(vehiclesCol(), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vehicle, "id">) })));
  });
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const snap = await getDocs(query(vehiclesCol(), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vehicle, "id">) }));
}

export async function fetchVehicle(id: string): Promise<Vehicle | null> {
  const { db } = getFirebase();
  const s = await getDoc(doc(db, COLLECTION, id));
  if (!s.exists()) return null;
  return { id: s.id, ...(s.data() as Omit<Vehicle, "id">) };
}

export async function saveVehicle(v: Vehicle): Promise<void> {
  const { db } = getFirebase();
  const data = { ...v, updatedAt: Date.now() };
  // Remove undefined keys (Firestore rejects them).
  const cleaned = JSON.parse(JSON.stringify(data));
  await setDoc(doc(db, COLLECTION, v.id), cleaned);
}

export async function deleteVehicle(v: Vehicle): Promise<void> {
  const { db } = getFirebase();
  // Delete all storage files first.
  const docs = Object.values(v.documents ?? {}).filter(
    Boolean,
  ) as VehicleDocument[];
  await Promise.all(docs.map((d) => deleteStoragePath(d.path)));
  for (const o of v.owners ?? []) {
    if (o.photoPath) await deleteStoragePath(o.photoPath);
  }
  await deleteDoc(doc(db, COLLECTION, v.id));
}

export function generateVehicleId(vehicleNumber: string) {
  return (
    vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, "") || `V${Date.now()}`
  );
}

export const _serverTs = serverTimestamp; // re-export to silence unused

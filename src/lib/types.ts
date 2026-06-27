export type VehicleType = "Bus" | "Auto" | "Car" | "Taxi" | "Tempo";
export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric";
export type VehicleStatus = "Running" | "Idle" | "Maintenance";
export type IdentityProofType = "Driving Licence" | "Aadhaar Card";

export interface Owner {
  id: string;
  name: string;
  phone: string;
  aadhaar: string;
  photoUrl?: string | null;
  photoPath?: string | null;
}

export interface VehicleDocument {
  url: string;
  path: string;
  name: string;
  uploadedAt: number;
}

export type DocumentKey = "rc" | "insurance" | "permit" | "puc" | "fitness";

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleName?: string;
  vehicleType: VehicleType;
  brand?: string;
  model?: string;
  capacity?: number | null;
  fuelType: FuelType;
  status: VehicleStatus;

  driverName?: string;
  driverPhone?: string;
  driverDob?: string | null;
  identityProofType: IdentityProofType;
  identityProofNumber?: string;

  owners: Owner[];

  insuranceExpiry?: string | null;
  permitExpiry?: string | null;
  pucExpiry?: string | null;
  fitnessExpiry?: string | null;

  documents: Partial<Record<DocumentKey, VehicleDocument>>;

  notes?: string;

  createdAt: number;
  updatedAt: number;
}

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  rc: "RC",
  insurance: "Insurance",
  permit: "Permit",
  puc: "PUC",
  fitness: "Fitness Certificate",
};

export const EXPIRY_FIELDS: { key: keyof Vehicle; label: string }[] = [
  { key: "insuranceExpiry", label: "Insurance" },
  { key: "permitExpiry", label: "Permit" },
  { key: "pucExpiry", label: "PUC" },
  { key: "fitnessExpiry", label: "Fitness Certificate" },
];

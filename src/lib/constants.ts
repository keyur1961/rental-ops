export const VEHICLE_STATUSES = [
  "available",
  "on_rent",
  "attention",
  "maintenance",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const RENTAL_STATUSES = [
  "draft",
  "on_rent",
  "on_hold",
  "closed",
] as const;

export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const PHOTO_CATEGORIES = [
  "licence",
  "handover",
  "return",
  "odometer",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const FUEL_LEVELS = ["Empty", "1/4", "1/2", "3/4", "Full"] as const;

export type FuelLevel = (typeof FUEL_LEVELS)[number];

export const LICENCE_SLOTS = [
  { id: "front", label: "Licence front" },
  { id: "back", label: "Licence back" },
] as const;

export const CONDITION_SLOTS = [
  { id: "front", label: "Front" },
  { id: "rear", label: "Rear" },
  { id: "left", label: "Left side" },
  { id: "right", label: "Right side" },
  { id: "odometer", label: "Odometer" },
  { id: "fuel", label: "Fuel gauge" },
  { id: "interiors", label: "Interiors" },
  { id: "damage", label: "Damage / existing marks" },
] as const;

export const CHARGE_PRESETS = [
  "Toll",
  "Infringement",
  "Fuel",
  "Cleaning",
  "Damage",
  "Late return",
  "Other",
] as const;

export const DEFAULT_HOLD_DAYS = 6;
export const DEFAULT_SERVICE_INTERVAL_KM = 10000;
export const DEFAULT_TYRE_INTERVAL_KM = 40000;

export const SESSION_COOKIE = "rental_ops_session";

export const DEFAULT_TERMS = `PLACEHOLDER TERMS — not legal advice.

These standard hire terms are an operational template only. They are not a lawyer-reviewed contract and must not be treated as legal advice. Replace them with terms prepared for your business before using this system with real hirers.

1. The vehicle remains the property of the owner named in this agreement.
2. The hirer must hold a current Australian driver licence of a class that covers the vehicle, and must produce it at handover.
3. The hirer is responsible for all tolls, parking fees, traffic infringements, and similar charges incurred during the hire and during the post-return hold period.
4. The vehicle must be returned on time, with the agreed fuel level, all keys and accessories, and in the same condition as at handover aside from fair wear.
5. Excess kilometres, extra cleaning, missing fuel, damage, smoking, and late return may be charged to the hirer.
6. The owner may keep a post-return hold (typically 5–7 days) to capture delayed tolls and infringements before closing the hire.
7. The hirer must not take the vehicle outside mainland Australia, use it for rideshare or delivery without written consent, or let an unlisted driver take the wheel.
8. Queensland road rules apply. The hirer must comply with all traffic laws.

These terms are a starting point for a Brisbane private hire operation and should be reviewed by a qualified adviser before they are used commercially.`;

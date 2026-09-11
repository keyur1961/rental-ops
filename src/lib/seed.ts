import {
  DEFAULT_HOLD_DAYS,
  DEFAULT_SERVICE_INTERVAL_KM,
  DEFAULT_TERMS,
  DEFAULT_TYRE_INTERVAL_KM,
} from "./constants";
import { prisma } from "./db";

export async function seed(): Promise<void> {
  await prisma.ownerProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "Riverbend Motor Hire",
      abn: "12 345 678 901",
      address: "18 Boundary Street, West End QLD 4101",
      phone: "0412 555 018",
      email: "ops@riverbendhire.com.au",
      bankNotes:
        "Bendigo Bank · BSB 633-000 · Acc 1234 56789 · Reference: rego + hire dates. PayID: ops@riverbendhire.com.au",
      standardTerms: DEFAULT_TERMS,
      holdPeriodDays: DEFAULT_HOLD_DAYS,
    },
  });

  await prisma.vehicle.upsert({
    where: { rego: "392-RBV" },
    update: {},
    create: {
      make: "Toyota",
      model: "RAV4 GXL",
      year: 2022,
      rego: "392-RBV",
      vin: "JTMWRREV0NJ123456",
      colour: "Glacier White",
      odometerKm: 41280,
      status: "attention",
      serviceIntervalKm: DEFAULT_SERVICE_INTERVAL_KM,
      tyreIntervalKm: DEFAULT_TYRE_INTERVAL_KM,
      lastServiceKm: 30000,
      lastTyreKm: 18000,
      notes: "Demo car already over the 10,000 km service interval — shows on the attention list.",
    },
  });

  await prisma.vehicle.upsert({
    where: { rego: "618-KPT" },
    update: {},
    create: {
      make: "Mazda",
      model: "CX-5 Maxx",
      year: 2020,
      rego: "618-KPT",
      vin: "JM0KF4WLA00123456",
      colour: "Machine Grey",
      odometerKm: 67940,
      status: "available",
      serviceIntervalKm: DEFAULT_SERVICE_INTERVAL_KM,
      tyreIntervalKm: DEFAULT_TYRE_INTERVAL_KM,
      lastServiceKm: 60000,
      lastTyreKm: 42000,
      notes: "Airport run favourite. Tyre and service intervals still inside AU defaults.",
    },
  });
}

export async function seedIfEmpty(): Promise<void> {
  const owner = await prisma.ownerProfile.findUnique({ where: { id: "default" } });
  if (owner) return;
  await seed();
}

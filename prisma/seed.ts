import { seed } from "../src/lib/seed";

seed()
  .then(() => {
    console.log("Seeded Riverbend Motor Hire owner profile and demo vehicles.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

# Rental Ops

A Brisbane private car-hire operations desk. It replaces the Excel sheet: photograph an Australian licence, prefill the agreement from the owner profile, capture handover and return photos, hold the hire for delayed tolls, and keep a simple fleet board.

This is working software for a single operator. It is not a consumer booking site, and the hire terms are placeholders — not legal advice.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with password `rentalops` (override with `OPS_PASSWORD` in `.env`).

Useful extras:

```bash
npm run seed    # re-apply demo owner + cars (safe upserts)
npm test        # licence parser + maintenance flags
npm run build   # production build
```

SQLite lives at `prisma/dev.db`. Photos land in `uploads/rentals/{id}/licence|handover|return|odometer/` (and `uploads/vehicles/{id}/odometer/` when there is no open hire).

## Walkthrough

Seed data is created on first boot:

- **Owner:** Riverbend Motor Hire, 18 Boundary Street, West End QLD 4101
- **392-RBV** Toyota RAV4 — already over its service interval (shows on Attention)
- **618-KPT** Mazda CX-5 — available

### 1. Owner profile

`Owner` in the nav. Business name, optional ABN, address, phone, email, bank notes, standard terms, and the default hold period (5–7 days; seed is 6). Every agreement uses this block.

### 2. Cars

`Cars` → add or edit make, model, year, rego, optional VIN, colour, odometer, and the AU default schedules (10,000 km service / 40,000 km tyres). Statuses: available, on rent, attention, maintenance.

### 3. Start a hire

`Start hire` → pick a free car and the dates.

On the hire page:

1. Photograph the licence front and back. Tesseract.js tries to read name, licence number, expiry, address, date of birth, and class. Edit anything it gets wrong. Mobile is required.
2. The agreement is already filled with owner + renter + car. `Print agreement` opens a print sheet; use the browser dialog to save PDF.
3. Capture the handover checklist: front, rear, left, right, odometer, fuel, interiors, damage. Enter kilometres and fuel, then **Hand over vehicle**. The car moves to On rent.

### 4. Return and hold

`Take return` → same photo checklist, return odometer and fuel, hold days (defaults from the owner profile). The hire goes **On hold**. Add toll / infringement / fuel charges, or **Release hold and close hire**.

If kilometres have crossed a service or tyre interval, the car lands on the attention list instead of available.

### 5. Maintenance

`Maintain` (or a car’s own page): upload an odometer photo, or **Make SMS odometer link**. SMS sending is stubbed — copy the message and send it yourself. The public page is `/odometer/{token}` and does not need the ops password.

### 6. Board

Home shows cars on rent, cars needing attention, open holds, and hires due back in the next 48 hours.

## Design notes

- Next.js App Router, TypeScript, Tailwind v4, Prisma + SQLite
- Simple cookie password gate (`src/proxy.ts`)
- OCR behind `OcrProvider` (`src/lib/ocr`) — swap `TesseractOcrProvider` if you change engines
- Australian English, `en-AU` dates, Brisbane timezone display
- Mobile-first: camera capture on photo slots, bottom nav on small screens

## Defaults worth changing

| Item | Seed / default |
| --- | --- |
| Password | `rentalops` |
| Hold period | 6 days |
| Service interval | 10,000 km |
| Tyre interval | 40,000 km |
| Terms | Placeholder only |

Do not use the bundled terms with real hirers until they have been written for your business.

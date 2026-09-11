import {
  DEFAULT_SERVICE_INTERVAL_KM,
  DEFAULT_TYRE_INTERVAL_KM,
  VEHICLE_STATUSES,
} from "@/lib/constants";
import { vehicleStatusLabel } from "@/lib/status";

export type VehicleFormValues = {
  id?: string;
  make: string;
  model: string;
  year: number;
  rego: string;
  vin: string;
  colour: string;
  odometerKm: number;
  status: string;
  serviceIntervalKm: number;
  tyreIntervalKm: number;
  lastServiceKm: number;
  lastTyreKm: number;
  notes: string;
};

export function VehicleForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  values?: Partial<VehicleFormValues>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="card space-y-4 p-4">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Make</span>
          <input className="field" name="make" defaultValue={values?.make ?? ""} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Model</span>
          <input className="field" name="model" defaultValue={values?.model ?? ""} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Year</span>
          <input className="field" type="number" name="year" defaultValue={values?.year ?? new Date().getFullYear()} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Rego</span>
          <input className="field" name="rego" defaultValue={values?.rego ?? ""} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">VIN (optional)</span>
          <input className="field" name="vin" defaultValue={values?.vin ?? ""} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Colour</span>
          <input className="field" name="colour" defaultValue={values?.colour ?? ""} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Odometer (km)</span>
          <input className="field" type="number" name="odometerKm" defaultValue={values?.odometerKm ?? 0} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Status</span>
          <select className="field" name="status" defaultValue={values?.status ?? "available"}>
            {VEHICLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {vehicleStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Service interval (km)</span>
          <input className="field" type="number" name="serviceIntervalKm" defaultValue={values?.serviceIntervalKm ?? DEFAULT_SERVICE_INTERVAL_KM} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Last service (km)</span>
          <input className="field" type="number" name="lastServiceKm" defaultValue={values?.lastServiceKm ?? 0} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Tyre interval (km)</span>
          <input className="field" type="number" name="tyreIntervalKm" defaultValue={values?.tyreIntervalKm ?? DEFAULT_TYRE_INTERVAL_KM} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Last tyres (km)</span>
          <input className="field" type="number" name="lastTyreKm" defaultValue={values?.lastTyreKm ?? 0} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea className="field min-h-24" name="notes" defaultValue={values?.notes ?? ""} />
        </label>
      </div>
      <button className="btn btn-primary w-full sm:w-auto" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

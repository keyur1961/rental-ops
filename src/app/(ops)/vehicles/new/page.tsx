import { createVehicle } from "@/app/actions/vehicles";
import { VehicleForm } from "@/components/VehicleForm";

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-brass">Fleet</p>
        <h1 className="display text-4xl font-semibold">Add a car</h1>
        <p className="mt-1 text-ink-soft">
          Service and tyre intervals default to common Australian private-use figures. Edit them to match the car.
        </p>
      </div>
      <VehicleForm action={createVehicle} submitLabel="Save car" />
    </div>
  );
}

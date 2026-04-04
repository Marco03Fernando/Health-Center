import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/pharmacy/inventory" className="rounded border p-4">Medication Inventory</Link>
        <Link to="/pharmacy/orders" className="rounded border p-4">Pharmacy Orders</Link>
      </div>
    </div>
  );
}

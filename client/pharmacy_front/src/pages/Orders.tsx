import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/pharmacy-orders");
        setOrders(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Pharmacy Orders</h1>
      {loading ? <div>Loading...</div> : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li key={o._id} className="rounded border p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{o.orderNo}</div>
                  <div className="text-sm text-gray-600">{o.status}</div>
                </div>
                <div className="text-sm">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

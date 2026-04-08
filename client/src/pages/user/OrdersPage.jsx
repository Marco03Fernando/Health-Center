import { useUserApp } from '@/contexts/UserAppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const OrdersPage = () => {
    const { orders, user } = useUserApp();
    const navigate = useNavigate();
    const [pharmacyOrders, setPharmacyOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadPharmacyOrders = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/pharmacy-orders');
                const list = Array.isArray(data) ? data : data?.items || data?.data || [];
                // filter by logged in user's email/phone if available
                const userEmail = user?.email;
                const userPhone = user?.phone;
                const my = list.filter(o => {
                    if (!o.patient) return false;
                    if (userEmail && o.patient.email && String(o.patient.email).toLowerCase() === String(userEmail).toLowerCase()) return true;
                    if (userPhone && o.patient.phone && String(o.patient.phone) === String(userPhone)) return true;
                    return false;
                });
                setPharmacyOrders(my);
            } catch (err) {
                console.error(err);
                toast.error(err?.message || 'Failed to load pharmacy orders');
            } finally {
                setLoading(false);
            }
        };
        loadPharmacyOrders();
    }, []);

    const combined = [...pharmacyOrders, ...orders];

    if (!loading && combined.length === 0) {
        return (<div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Package className="w-16 h-16 text-muted-foreground/30 mb-4"/>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-4">Start shopping in our pharmacy</p>
        <Button onClick={() => navigate('/user/marketplace')}>Shop Now</Button>
      </div>);
    }

    const handleDownloadPdf = async (prescriptionId, filename = 'prescription.pdf') => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/prescriptions/${prescriptionId}/pdf`, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to download PDF');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        toast.error(err?.message || 'Failed to download PDF');
      }
    };

    return (<div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your orders</p>
      </div>
      <div className="space-y-4">
      {combined.map((order, idx) => {
            // normalize pharmacy order shape
            if (order._id || order.orderNo) {
                return (<Card key={order._id || order.orderNo}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{order.orderNo || order._id}</h3>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={(order.status || '').toLowerCase()} />
                    </div>
                    <div className="space-y-1 mb-3">
                      {(order.items || []).map((item, i) => (<div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.nameSnapshot || item.name || item.medicineName || 'Medicine'} × {item.requestedQty || item.qty || item.quantity || 1}</span>
                          <span className="text-foreground">Rs. {(item.itemTotal || (item.unitPriceSnapshot ? item.unitPriceSnapshot * (item.qty || item.requestedQty || 1) : 0)).toLocaleString()}</span>
                        </div>))}

                      {order.prescriptionTextSnapshot ? (
                        <details className="mt-2 bg-muted/30 rounded p-2 text-sm">
                          <summary className="cursor-pointer font-medium">View prescription</summary>
                          <pre className="whitespace-pre-wrap mt-2 text-xs">{order.prescriptionTextSnapshot}</pre>
                        </details>
                      ) : null}

                      {order.prescriptionId ? (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(order.prescriptionId, `prescription-${order.orderNo || order._id}.pdf`)}>Download prescription PDF</Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="font-display font-semibold text-foreground">Rs. {(order.total || order.subtotal || 0).toLocaleString()}</span>
                      <Button variant="outline" size="sm" onClick={() => navigate('/user/marketplace')}>Reorder</Button>
                    </div>
                  </CardContent>
                </Card>);
            }

            // fallback to existing client order shape
            return (<Card key={order.id || idx}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{order.id}</h3>
                  <p className="text-xs text-muted-foreground">{order.date} · {order.deliveryMethod}</p>
                </div>
                <StatusBadge status={order.status}/>
              </div>
              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (<div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span className="text-foreground">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-display font-semibold text-foreground">Rs. {order.total.toLocaleString()}</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/user/marketplace')}>Reorder</Button>
              </div>
            </CardContent>
          </Card>);
        })}
      </div>
    </div>);
};
export default OrdersPage;

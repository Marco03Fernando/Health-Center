import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

const OrdersPage = () => {
  const { orders } = useApp();
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-4">Start shopping in our pharmacy</p>
        <Button onClick={() => navigate('/marketplace')}>Shop Now</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your orders</p>
      </div>
      <div className="space-y-4">
        {orders.map(order => (
          <Card key={order.id}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{order.id}</h3>
                  <p className="text-xs text-muted-foreground">{order.date} · {order.deliveryMethod}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span className="text-foreground">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-display font-semibold text-foreground">Rs. {order.total.toLocaleString()}</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')}>Reorder</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;

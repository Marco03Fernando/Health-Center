import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const CartPage = () => {
  const { cart, updateCartQty, removeFromCart, placeOrder } = useApp();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');

  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Order Placed!</h2>
        <p className="text-muted-foreground text-center max-w-sm mb-6">Your order has been placed successfully. You can track it in your orders.</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/orders')}>View Orders</Button>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">Cart is empty</h2>
        <p className="text-muted-foreground mb-4">Browse our pharmacy to add items</p>
        <Button onClick={() => navigate('/marketplace')}>Shop Now</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />Back
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground">
        {step === 'cart' ? 'Shopping Cart' : 'Checkout'}
      </h1>

      {step === 'cart' && (
        <>
          <div className="space-y-3">
            {cart.map(item => (
              <Card key={item.product.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-lg shrink-0">{item.product.image}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">Rs. {item.product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQty(item.product.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="text-sm font-medium w-6 text-center text-foreground">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQty(item.product.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-display font-semibold text-foreground">Total</span>
              <span className="font-display text-xl font-bold text-foreground">Rs. {total.toLocaleString()}</span>
            </CardContent>
          </Card>
          <Button className="w-full" onClick={() => setStep('checkout')}>Proceed to Checkout</Button>
        </>
      )}

      {step === 'checkout' && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
                  <span className="text-foreground">Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-foreground border-t border-border pt-2">
                <span>Total</span>
                <span className="font-display font-bold">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Delivery Method</label>
              <div className="flex gap-3">
                <Button variant={deliveryMethod === 'delivery' ? 'default' : 'outline'} className="flex-1" onClick={() => setDeliveryMethod('delivery')}>Delivery</Button>
                <Button variant={deliveryMethod === 'pickup' ? 'default' : 'outline'} className="flex-1" onClick={() => setDeliveryMethod('pickup')}>Pickup</Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Payment Method</label>
              <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">Cash on Delivery / Pickup</div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('cart')}>Back</Button>
              <Button className="flex-1" onClick={() => { placeOrder(deliveryMethod); setStep('success'); toast.success('Order placed!'); }}>Place Order</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CartPage;

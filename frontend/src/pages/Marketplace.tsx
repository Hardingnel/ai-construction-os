import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Search, Star, Download, ShoppingCart, Users,
  Building2, Loader2, AlertCircle, CreditCard, CheckCircle,
  Clock, ArrowRight, X, Package, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  authorId: string;
  rating: number;
  sales: number;
  published: boolean;
  thumbnail?: string;
  author?: { id: string; name: string; avatar?: string };
}

interface OrderItem {
  id: string;
  planId: string;
  price: number;
  plan: Plan & { author?: { id: string; name: string } };
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface Professional {
  id: string;
  name: string;
  role: string;
  specialty: string;
  hourlyRate: number;
  avatar?: string;
  rating: number;
  projects: number;
}

export function Marketplace() {
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profLoading, setProfLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment' | 'confirm'>('review');
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    async function load() {
      try { setLoading(true); setError(null); const data = await api.get<Plan[]>('/marketplace'); setPlans(data.filter(p => p.published)); }
      catch (err: any) { setError(err.message || 'Failed to load marketplace'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const loadProfessionals = async () => {
    setProfLoading(true);
    try { const data = await api.get<Professional[]>('/marketplace/professionals'); setProfessionals(data); }
    catch { toast.error('Failed to load professionals'); }
    finally { setProfLoading(false); }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try { const data = await api.get<Order[]>('/marketplace/orders'); setOrders(data); }
    catch { toast.error('Failed to load orders'); }
    finally { setOrdersLoading(false); }
  };

  const filtered = plans.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const openCheckout = (plan: Plan) => {
    setCheckoutPlan(plan);
    setCheckoutStep('review');
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvc('');
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!checkoutPlan) return;
    setProcessing(true);
    try {
      const order = await api.post<Order>('/marketplace/checkout', { planId: checkoutPlan.id });
      setCheckoutStep('confirm');
      setPlans(prev => prev.map(p => p.id === checkoutPlan.id ? { ...p, sales: p.sales + 1 } : p));
      loadOrders();
      toast.success(`Purchased "${checkoutPlan.name}" successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed');
    } finally { setProcessing(false); }
  };

  if (loading) return (<div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading marketplace...</p></div></div>);
  if (error) return (<div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><AlertCircle className="w-12 h-12 text-destructive mx-auto" /><p className="text-sm text-muted-foreground">{error}</p><Button variant="outline" onClick={() => window.location.reload()}>Retry</Button></div></div>);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy plans, hire professionals, and sell your designs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { loadOrders(); toast('Loading purchase history...'); }}>
            <Clock className="w-4 h-4 mr-2" /> My Purchases
          </Button>
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plans..." className="pl-10" />
      </div>
      <Tabs defaultValue="plans" onValueChange={(v) => { if (v === 'professionals') loadProfessionals(); if (v === 'purchases') loadOrders(); }}>
        <TabsList>
          <TabsTrigger value="plans"><Building2 className="w-4 h-4 mr-2" /> Design Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="professionals"><Users className="w-4 h-4 mr-2" /> Professionals</TabsTrigger>
          <TabsTrigger value="purchases"><Package className="w-4 h-4 mr-2" /> My Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Store className="w-12 h-12 mb-3" /><p className="font-medium">No plans available</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((plan) => (
                <Card key={plan.id} className="glass-card group hover:border-primary/50 transition-all cursor-pointer">
                  <div className="h-36 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center relative">
                    <Building2 className="w-12 h-12 text-primary/30" />
                    <Badge className="absolute top-3 left-3 text-[10px]">{plan.type}</Badge>
                    {plan.thumbnail && <img src={plan.thumbnail} alt={plan.name} className="absolute inset-0 w-full h-full object-cover" />}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">by {plan.author?.name || 'Unknown'}</p>
                    {plan.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{plan.rating.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{plan.sales}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold">${plan.price.toFixed(2)}</span>
                      <Button size="sm" onClick={() => openCheckout(plan)}>
                        <ShoppingCart className="w-3 h-3 mr-1" /> Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="professionals" className="mt-4">
          {profLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-3" />
              <p className="font-medium">No professionals listed</p>
              <p className="text-sm">Invite team members to join the platform</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {professionals.map((prof) => (
                <Card key={prof.id} className="glass-card group hover:border-primary/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {prof.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{prof.name}</p>
                        <p className="text-xs text-muted-foreground">{prof.role}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Specialty</span><span>{prof.specialty || 'General'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium">${prof.hourlyRate?.toFixed(2) || '—'}/hr</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{prof.rating.toFixed(1)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Projects</span><span>{prof.projects}</span></div>
                    </div>
                    <Button className="w-full mt-3 text-xs" size="sm" onClick={() => toast(`Booking request sent to ${prof.name}`)}>
                      Hire Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          {ordersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mb-3" />
              <p className="font-medium">No purchases yet</p>
              <p className="text-sm">Browse plans and make your first purchase</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</Badge>
                        <Badge className={cn('text-[10px]', order.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500')}>
                          {order.status}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="font-medium">{item.plan.name}</span>
                          <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={checkoutOpen} onOpenChange={(open: boolean) => { if (!open && checkoutStep !== 'confirm') setCheckoutOpen(false); else if (!open) { setCheckoutOpen(false); setCheckoutStep('review'); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {checkoutStep === 'review' && 'Review Purchase'}
              {checkoutStep === 'payment' && 'Payment Details'}
              {checkoutStep === 'confirm' && 'Purchase Confirmed!'}
            </DialogTitle>
            <DialogDescription>
              {checkoutStep === 'review' && `You are about to purchase "${checkoutPlan?.name}"`}
              {checkoutStep === 'payment' && 'Enter your card information to complete the purchase'}
              {checkoutStep === 'confirm' && 'Your transaction has been processed successfully'}
            </DialogDescription>
          </DialogHeader>

          {checkoutStep === 'review' && checkoutPlan && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/30 border">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-8 h-8 text-primary/40" />
                  <div>
                    <p className="font-semibold text-sm">{checkoutPlan.name}</p>
                    <p className="text-xs text-muted-foreground">by {checkoutPlan.author?.name || 'Unknown'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{checkoutPlan.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-lg font-bold">${checkoutPlan.price.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => setCheckoutStep('payment')}>
                Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {checkoutStep === 'payment' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Secure payment via encrypted channel</span>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Card Number</label>
                <Input value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))} placeholder="4242 4242 4242 4242" className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Cardholder Name</label>
                <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Expiry</label>
                  <Input value={cardExpiry} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 4) setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v); }} placeholder="MM/YY" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">CVC</label>
                  <Input value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="123" className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span>Total</span>
                <span className="font-bold">${checkoutPlan?.price.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={handleCheckout} disabled={processing || !cardNumber || !cardName || !cardExpiry || !cardCvc}>
                {processing ? 'Processing...' : `Pay $${checkoutPlan?.price.toFixed(2)}`}
              </Button>
            </div>
          )}

          {checkoutStep === 'confirm' && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="font-semibold text-lg">Purchase Complete!</p>
              <p className="text-sm text-muted-foreground">
                "{checkoutPlan?.name}" has been added to your library
              </p>
              <p className="text-xs text-muted-foreground">
                You can access your purchase from the My Purchases tab
              </p>
              <Button onClick={() => { setCheckoutOpen(false); setCheckoutStep('review'); }}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

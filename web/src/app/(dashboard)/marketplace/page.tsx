'use client';
import { useState, useEffect } from 'react';
import { Store, Search, Star, ShoppingCart, Building2, Users, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function MarketplacePage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<any[]>('/marketplace').then(d => { setPlans(d.filter((p: any) => p.published)); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Marketplace</h1><p className="text-muted-foreground mt-1">Buy plans and hire professionals</p></div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plans..." className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Store className="w-12 h-12 mb-3" /><p>No plans available</p></div>
      ) : (
        <div className="grid grid-cols-3 gap-4">{plans.map((plan: any) => (
          <div key={plan.id} className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
            <div className="h-36 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center"><Building2 className="w-12 h-12 text-primary/30" /></div>
            <div className="p-4"><h3 className="font-semibold text-sm">{plan.name}</h3><p className="text-xs text-muted-foreground">by {plan.author?.name || 'Unknown'}</p>
              <div className="flex items-center gap-3 mt-2 text-xs"><span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{plan.rating}</span></div>
              <div className="flex items-center justify-between mt-3"><span className="text-lg font-bold">${plan.price}</span>
                <button onClick={() => toast('Added to cart')} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs"><ShoppingCart className="w-3 h-3 mr-1 inline" /> Buy</button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

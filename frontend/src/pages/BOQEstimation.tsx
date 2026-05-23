import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, FileSpreadsheet, Download, Wallet, TrendingUp,
  Truck, Users, Hammer, Building2, Save, Printer,
  Plus, Trash2, ArrowRight, DollarSign, ClipboardList, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils';

const boqItems = [
  { id: '1', item: 'Concrete (Grade 30)', unit: 'm³', quantity: 120, rate: 185, category: 'Structure' },
  { id: '2', item: 'Steel Reinforcement', unit: 'tonnes', quantity: 15, rate: 1200, category: 'Structure' },
  { id: '3', item: 'Cement (Portland)', unit: 'bags', quantity: 800, rate: 8.5, category: 'Materials' },
  { id: '4', item: 'Sand (Sharp)', unit: 'm³', quantity: 200, rate: 35, category: 'Materials' },
  { id: '5', item: 'Granite Aggregate', unit: 'm³', quantity: 150, rate: 45, category: 'Materials' },
  { id: '6', item: 'Clay Bricks', unit: 'pcs', quantity: 15000, rate: 0.35, category: 'Masonry' },
  { id: '7', item: 'Roofing Sheets', unit: 'm²', quantity: 350, rate: 22, category: 'Roofing' },
  { id: '8', item: 'Wood Timber', unit: 'm³', quantity: 25, rate: 280, category: 'Woodwork' },
  { id: '9', item: 'Paint (Emulsion)', unit: 'liters', quantity: 200, rate: 12, category: 'Finishing' },
  { id: '10', item: 'Floor Tiles', unit: 'm²', quantity: 280, rate: 18, category: 'Finishing' },
  { id: '11', item: 'Plumbing Pipes', unit: 'm', quantity: 450, rate: 5.5, category: 'Plumbing' },
  { id: '12', item: 'Electrical Wiring', unit: 'm', quantity: 800, rate: 3.2, category: 'Electrical' },
  { id: '13', item: 'Windows (Aluminum)', unit: 'pcs', quantity: 24, rate: 180, category: 'Joinery' },
  { id: '14', item: 'Doors (Solid Wood)', unit: 'pcs', quantity: 16, rate: 250, category: 'Joinery' },
  { id: '15', item: 'Labor - Mason', unit: 'days', quantity: 120, rate: 45, category: 'Labor' },
  { id: '16', item: 'Labor - Carpenter', unit: 'days', quantity: 80, rate: 45, category: 'Labor' },
  { id: '17', item: 'Labor - Electrician', unit: 'days', quantity: 40, rate: 55, category: 'Labor' },
  { id: '18', item: 'Labor - Plumber', unit: 'days', quantity: 35, rate: 55, category: 'Labor' },
  { id: '19', item: 'Equipment Rental', unit: 'days', quantity: 60, rate: 250, category: 'Equipment' },
  { id: '20', item: 'Scaffolding', unit: 'm²', quantity: 500, rate: 8, category: 'Equipment' },
];

const summaryCards = [
  { label: 'Total Materials', value: 148750, icon: Truck, color: 'from-blue-500 to-blue-600' },
  { label: 'Total Labor', value: 15675, icon: Users, color: 'from-purple-500 to-purple-600' },
  { label: 'Equipment', value: 19000, icon: Hammer, color: 'from-amber-500 to-amber-600' },
  { label: 'Grand Total', value: 183425, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
];

export function BOQEstimation() {
  const [activeTab, setActiveTab] = useState('boq');
  const [items] = useState(boqItems);
  const [currency, setCurrency] = useState('USD');

  const categories = [...new Set(items.map((i) => i.category))];
  const total = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">BOQ & Cost Estimation</h1>
          <p className="text-muted-foreground mt-1">Material takeoffs, labor estimates, and AI-powered cost intelligence</p>
        </div>
        <div className="flex gap-2">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['USD', 'EUR', 'GBP', 'SLL', 'NGN'].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline"><Save className="w-4 h-4 mr-2" /> Save</Button>
          <Button variant="outline"><Printer className="w-4 h-4 mr-2" /> Print</Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600"><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', card.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold">{formatCurrency(card.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="boq"><ClipboardList className="w-4 h-4 mr-2" /> BOQ Items</TabsTrigger>
          <TabsTrigger value="categories"><Wallet className="w-4 h-4 mr-2" /> By Category</TabsTrigger>
          <TabsTrigger value="ai"><Calculator className="w-4 h-4 mr-2" /> AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="boq">
          <Card className="glass-card">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-xs text-muted-foreground">Item</th>
                    <th className="text-left p-3 font-medium text-xs text-muted-foreground">Category</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Unit</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Qty</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Rate</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="p-3 font-medium">{item.item}</td>
                      <td className="p-3"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge></td>
                      <td className="p-3 text-right">{item.unit}</td>
                      <td className="p-3 text-right">{formatNumber(item.quantity)}</td>
                      <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(item.quantity * item.rate)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={5} className="p-3 text-right font-semibold">Grand Total</td>
                    <td className="p-3 text-right font-bold text-lg">{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              const catTotal = catItems.reduce((s, i) => s + i.quantity * i.rate, 0);
              return (
                <Card key={cat} className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-2">{formatCurrency(catTotal)}</p>
                    <p className="text-xs text-muted-foreground">{catItems.length} items</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">AI Cost Intelligence</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>Material costs in your region are <span className="text-emerald-500 font-medium">3.2% below</span> national average</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>Labor costs expected to <span className="text-amber-500 font-medium">increase 5%</span> next quarter</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Alternative materials could save <span className="text-blue-500 font-medium">$12,500</span></span>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Full Report <ArrowRight className="w-3 h-3 ml-1" /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

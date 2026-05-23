import { motion } from 'framer-motion';
import {
  Store, Search, Star, Download, ShoppingCart, Users,
  Building2, Award, Clock, TrendingUp, Filter, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const plans = [
  { id: '1', name: 'Modern 4-Bed Villa', author: 'ArchDesign Pro', price: 249, rating: 4.8, sales: 342, type: 'Residential', image: null },
  { id: '2', name: 'Commercial Office Complex', author: 'UrbanPlans', price: 599, rating: 4.6, sales: 128, type: 'Commercial', image: null },
  { id: '3', name: 'Sustainable School Design', author: 'EduBuild', price: 399, rating: 4.9, sales: 87, type: 'Institutional', image: null },
  { id: '4', name: ' Luxury Beach Villa', author: 'CoastalDesigns', price: 449, rating: 4.7, sales: 215, type: 'Residential', image: null },
  { id: '5', name: 'Hospital Wing Blueprint', author: 'MediPlan', price: 799, rating: 4.5, sales: 56, type: 'Institutional', image: null },
  { id: '6', name: 'Bridge Structural Plans', author: 'InfraCore', price: 999, rating: 4.4, sales: 43, type: 'Infrastructure', image: null },
];

const professionals = [
  { id: '1', name: 'Sarah Johnson', role: 'Architect', rating: 4.9, projects: 127, hourly: '$85/hr', avatar: null },
  { id: '2', name: 'Michael Chen', role: 'Structural Engineer', rating: 4.8, projects: 94, hourly: '$95/hr', avatar: null },
  { id: '3', name: 'Amara Okafor', role: 'BIM Specialist', rating: 4.7, projects: 68, hourly: '$75/hr', avatar: null },
  { id: '4', name: 'James Wilson', role: 'Project Manager', rating: 4.9, projects: 156, hourly: '$110/hr', avatar: null },
];

export function Marketplace() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy plans, hire professionals, and sell your designs</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search plans, professionals..." className="pl-10" />
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans"><Building2 className="w-4 h-4 mr-2" /> Design Plans</TabsTrigger>
          <TabsTrigger value="professionals"><Users className="w-4 h-4 mr-2" /> Professionals</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="glass-card group hover:border-primary/50 transition-all cursor-pointer">
                <div className="h-36 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center relative">
                  <Building2 className="w-12 h-12 text-primary/30" />
                  <Badge className="absolute top-3 left-3">{plan.type}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">by {plan.author}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{plan.rating}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{plan.sales}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold">${plan.price}</span>
                    <Button size="sm"><ShoppingCart className="w-3 h-3 mr-1" /> Buy</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="professionals" className="mt-4">
          <div className="grid grid-cols-4 gap-4">
            {professionals.map((pro) => (
              <Card key={pro.id} className="glass-card hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="p-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{pro.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold">{pro.name}</h3>
                  <p className="text-xs text-muted-foreground">{pro.role}</p>
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{pro.rating}</span>
                    <span>{pro.projects} projects</span>
                  </div>
                  <p className="mt-2 font-semibold text-primary">{pro.hourly}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">Hire</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

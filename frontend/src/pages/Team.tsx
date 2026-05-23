import { motion } from 'framer-motion';
import {
  Users, Plus, Mail, Phone, MapPin, MoreHorizontal,
  Star, Calendar, BadgeCheck, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const teamMembers = [
  { id: '1', name: 'Sarah Johnson', role: 'Lead Architect', email: 'sarah@aicos.com', status: 'online', projects: 12, specialty: 'Residential' },
  { id: '2', name: 'Michael Chen', role: 'Structural Engineer', email: 'michael@aicos.com', status: 'online', projects: 9, specialty: 'Structural' },
  { id: '3', name: 'Amara Okafor', role: 'BIM Specialist', email: 'amara@aicos.com', status: 'away', projects: 7, specialty: 'BIM/IFC' },
  { id: '4', name: 'James Wilson', role: 'Project Manager', email: 'james@aicos.com', status: 'online', projects: 15, specialty: 'Management' },
  { id: '5', name: 'Emily Davis', role: 'GIS Analyst', email: 'emily@aicos.com', status: 'offline', projects: 5, specialty: 'GIS' },
  { id: '6', name: 'David Thompson', role: 'Quantity Surveyor', email: 'david@aicos.com', status: 'online', projects: 8, specialty: 'BOQ/Cost' },
  { id: '7', name: 'Lisa Anderson', role: 'Interior Designer', email: 'lisa@aicos.com', status: 'away', projects: 6, specialty: 'Interior' },
  { id: '8', name: 'Robert Martinez', role: 'Civil Engineer', email: 'robert@aicos.com', status: 'offline', projects: 10, specialty: 'Infrastructure' },
];

export function Team() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your architecture and engineering team</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="glass-card hover:border-primary/50 transition-all group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{member.name.charAt(0)}</span>
                  </div>
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background',
                    member.status === 'online' ? 'bg-emerald-500' : member.status === 'away' ? 'bg-amber-500' : 'bg-muted-foreground'
                  )} />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{member.name}</h3>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-[10px]">{member.specialty}</Badge>
                <Badge variant="outline" className="text-[10px]">{member.projects} projects</Badge>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <button className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

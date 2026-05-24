import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Mail, MessageSquare, MoreHorizontal,
  Loader2, AlertCircle, Inbox
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface TeamMemberData {
  id: string;
  userId: string;
  role: string;
  specialty: string | null;
  hourlyRate: number | null;
  status: string;
  user?: { id: string; name: string; email: string; avatar: string | null };
}

export function Team() {
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<TeamMemberData[]>('/team');
        if (!cancelled) setMembers(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load team');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your architecture and engineering team</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => toast('Invite dialog would open')}>
          <Plus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="w-12 h-12 mb-3" />
          <p className="font-medium">No team members yet</p>
          <p className="text-sm">Invite your first team member to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="glass-card hover:border-primary/50 transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {(member.user?.name || '?').charAt(0)}
                      </span>
                    </div>
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background',
                      member.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'
                    )} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => toast('Team member options')}>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{member.user?.name || 'Unknown'}</h3>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {member.specialty && (
                    <Badge variant="secondary" className="text-[10px]">{member.specialty}</Badge>
                  )}
                  {member.hourlyRate && (
                    <Badge variant="outline" className="text-[10px]">${member.hourlyRate}/hr</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" onClick={() => toast('Email member')}>
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" onClick={() => toast('Message member')}>
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

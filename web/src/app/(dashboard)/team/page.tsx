'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get<any[]>('/team').then(d => { setMembers(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Team</h1><p className="text-muted-foreground mt-1">Manage your team members</p></div>
        <button onClick={() => toast('Invite dialog')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Invite Member</button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div> : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Users className="w-12 h-12 mb-3" /><p>No team members yet</p></div>
      ) : (
        <div className="grid grid-cols-3 gap-4">{members.map((m: any) => (
          <div key={m.id} className="glass-card rounded-xl p-5 group hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">{m.name?.charAt(0)}</div>
                <div><p className="font-semibold text-sm">{m.name}</p><p className="text-xs text-muted-foreground">{m.role}</p></div>
              </div>
              <button onClick={() => toast('Member options')} className="p-1.5 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-muted-foreground">•••</span></button>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <button onClick={() => toast('Email member')} className="p-1.5 rounded-lg hover:bg-accent"><Mail className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button onClick={() => toast('Message member')} className="p-1.5 rounded-lg hover:bg-accent"><MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

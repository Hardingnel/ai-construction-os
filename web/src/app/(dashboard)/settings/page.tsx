'use client';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser, theme, setTheme } = useAppStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) { setName(user.name); setEmail(user.email); } }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try { const res: any = await api.put('/auth/profile', { name, email }); setUser(res.user || res); toast.success('Profile updated'); } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-muted-foreground mt-1">Manage your account and preferences</p></div>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Profile</h3>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" /></div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4" /> Appearance</h3>
        <div className="flex gap-2">
          <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-lg text-sm ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>Light</button>
          <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>Dark</button>
        </div>
      </div>
    </div>
  );
}

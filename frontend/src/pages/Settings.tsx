import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Moon, Sun, Shield, Database, Cloud, HardDrive,
  Loader2, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { useAppStore } from '@/store/appStore';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  company: string | null;
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const user = useAppStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.get<UserProfile>('/auth/me');
        if (!cancelled) setProfile(data);
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.put('/auth/profile', { name: profile.name, phone: profile.phone, company: profile.company });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI Construction OS preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account"><Shield className="w-4 h-4 mr-2" /> Account</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-2" /> Appearance</TabsTrigger>
          <TabsTrigger value="storage"><Database className="w-4 h-4 mr-2" /> Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={profile.email} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value={profile.role} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input value={profile.company || ''} onChange={e => setProfile({ ...profile, company: e.target.value || null })} placeholder="Your company" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value || null })} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Please log in to manage your profile</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Theme & Display</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">Choose your preferred appearance</p>
                  </div>
                </div>
                <div className="flex gap-1 p-0.5 bg-accent rounded-lg">
                  <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')}>Light</Button>
                  <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>Dark</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Measurement Units</p>
                  <p className="text-xs text-muted-foreground">Default measurement system</p>
                </div>
                <Select defaultValue="metric">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-xs text-muted-foreground">Default currency for estimates</p>
                </div>
                <Select defaultValue="USD">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="SLL">SLL (Le)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Storage & Sync</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Cloud Sync</p>
                    <p className="text-xs text-muted-foreground">Sync projects to cloud automatically</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Auto Backup</p>
                    <p className="text-xs text-muted-foreground">Automatic project backups every 24h</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

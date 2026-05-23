import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Bell, Shield, Key, Globe,
  Database, Palette, Monitor, Smartphone, HardDrive,
  Cloud, Users, CreditCard, Download, Save, RefreshCw,
  LogOut, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/ThemeProvider';

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI Construction OS preferences</p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-2" /> Appearance</TabsTrigger>
          <TabsTrigger value="ai"><Shield className="w-4 h-4 mr-2" /> AI Configuration</TabsTrigger>
          <TabsTrigger value="storage"><Database className="w-4 h-4 mr-2" /> Storage</TabsTrigger>
          <TabsTrigger value="account"><Users className="w-4 h-4 mr-2" /> Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Theme & Display</CardTitle>
            </CardHeader>
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
                  <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('system')}>System</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-muted-foreground">Interface language</p>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
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

        <TabsContent value="ai" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">AI Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['OpenAI', 'Anthropic', 'Google Gemini', 'Stability AI'].map((provider) => (
                <div key={provider} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{provider}</p>
                    <p className="text-xs text-muted-foreground">API key status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" className="text-[10px]">Not configured</Badge>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">AI Model Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Default Model</p>
                  <p className="text-xs text-muted-foreground">Primary AI model for generation</p>
                </div>
                <Select defaultValue="gpt-4">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Multi-Agent Mode</p>
                  <p className="text-xs text-muted-foreground">Use multiple AI agents for complex tasks</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">AI Memory</p>
                  <p className="text-xs text-muted-foreground">Remember project context across sessions</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Storage & Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Local Storage</p>
                    <p className="text-xs text-muted-foreground">Projects stored locally: 2.3 GB / 50 GB</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Cloud Sync</p>
                    <p className="text-xs text-muted-foreground">Sync projects to cloud (optional)</p>
                  </div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Auto Backup</p>
                    <p className="text-xs text-muted-foreground">Automatic project backups</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="john@aicos.com" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input defaultValue="Architect" />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input defaultValue="AI COS" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

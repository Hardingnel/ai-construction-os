import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Tenant {
  id: string; name: string; slug: string; domain?: string; isActive: boolean;
  createdAt: string; _count: { projects: number; members: number; apiKeys: number };
}

interface ApiKey {
  id: string; provider: string; keyValue: string; isActive: boolean; tenantId?: string; createdAt: string;
}

export function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [newTenant, setNewTenant] = useState({ name: '', slug: '' });
  const [activeTab, setActiveTab] = useState<'keys' | 'tenants' | 'health'>('keys');

  const fetchData = async () => {
    try {
      const [tenantsRes, keysRes, statusRes] = await Promise.all([
        api.get<any>('/admin/tenants'),
        api.get<any>('/admin/api-keys'),
        api.get<any>('/admin/status'),
      ]);
      setTenants(tenantsRes);
      setApiKeys(keysRes);
      setStatus(statusRes);
    } catch { }
  };

  useEffect(() => { fetchData(); }, []);

  const handleKeyUpdate = async (provider: string) => {
    if (!keyValue.trim()) return;
    try {
      await api.put<any>(`/admin/api-keys/${provider}`, { keyValue: keyValue.trim() });
      setEditingKey(null);
      setKeyValue('');
      fetchData();
    } catch { }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.slug) return;
    try {
      await api.post<any>('/admin/tenants', newTenant);
      setNewTenant({ name: '', slug: '' });
      fetchData();
    } catch { }
  };

  const providers = [
    { id: 'openai', label: 'OpenAI', icon: '' },
    { id: 'openrouter', label: 'OpenRouter', icon: '' },
    { id: 'anthropic', label: 'Anthropic', icon: '' },
    { id: 'gemini', label: 'Gemini', icon: '' },
    { id: 'cloudinary', label: 'Cloudinary', icon: '' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
        <span className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">super_admin</span>
      </div>

      <div className="flex gap-2 mb-6 border-b border-zinc-700 pb-2">
        {(['keys', 'tenants', 'health'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${activeTab === tab ? 'text-white bg-zinc-800 border-b-2 border-blue-500' : 'text-zinc-400 hover:text-white'}`}>
            {tab === 'keys' ? 'API Keys' : tab === 'tenants' ? 'Tenants' : 'System Health'}
          </button>
        ))}
      </div>

      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map(p => {
              const key = apiKeys.find(k => k.provider === p.id && !k.tenantId);
              return (
                <div key={p.id} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{p.label}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${key?.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {key?.isActive ? 'Active' : 'Not Set'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono mb-3 truncate">
                    {key?.keyValue || 'No key configured'}
                  </p>
                  {editingKey === p.id ? (
                    <div className="flex gap-2">
                      <input value={keyValue} onChange={e => setKeyValue(e.target.value)} placeholder="Enter new API key..."
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-white" />
                      <button onClick={() => handleKeyUpdate(p.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded">Save</button>
                      <button onClick={() => { setEditingKey(null); setKeyValue(''); }} className="bg-zinc-700 hover:bg-zinc-600 text-xs px-3 py-1.5 rounded">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingKey(p.id)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-1.5 rounded border border-zinc-600">
                      {key?.keyValue ? 'Rotate Key' : 'Set Key'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Create New Tenant</h3>
            <div className="flex gap-3">
              <input value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                placeholder="Tenant name" className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-white" />
              <input value={newTenant.slug} onChange={e => setNewTenant({ ...newTenant, slug: e.target.value })}
                placeholder="slug" className="w-48 bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-white font-mono" />
              <button onClick={handleCreateTenant} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">Create</button>
            </div>
          </div>

          <div className="space-y-3">
            {tenants.map(t => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{t.slug}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>{t._count.projects} projects</span>
                  <span>{t._count.members} members</span>
                  <span>{t._count.apiKeys} keys</span>
                  <span className={`px-2 py-0.5 rounded ${t.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Tenants', value: status?.tenants, color: 'text-blue-400' },
            { label: 'Users', value: status?.users, color: 'text-green-400' },
            { label: 'Projects', value: status?.projects, color: 'text-purple-400' },
            { label: 'API Keys', value: status?.apiKeys, color: 'text-yellow-400' },
            { label: 'Python AI', value: status?.pythonStatus, color: status?.pythonStatus === 'running' ? 'text-green-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

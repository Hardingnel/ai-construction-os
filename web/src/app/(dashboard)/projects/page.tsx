'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<any[]>('/projects').then(d => { setProjects(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-[60vh] text-destructive"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>;

  const filtered = projects.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Projects</h1><p className="text-muted-foreground mt-1">Manage your construction projects</p></div>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2 hover:bg-primary/90"><Plus className="w-4 h-4" /> New Project</button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm" />
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><FolderKanban className="w-12 h-12 mb-3" /><p className="font-medium">No projects found</p></div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <div key={p.id} onClick={() => router.push(`/projects?id=${p.id}`)} className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all group">
              <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.type} • {p.location || 'No location'}</p>
              <div className="mt-3 flex items-center gap-2"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.status}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

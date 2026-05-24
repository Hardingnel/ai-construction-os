'use client';
import { useState, useEffect } from 'react';
import { GitBranch, Upload, Download, RefreshCw, History, FileText, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function InteroperabilityPage() {
  const [tab, setTab] = useState<'import' | 'export' | 'convert' | 'history'>('import');
  const [importContent, setImportContent] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('ifc');
  const [exportResult, setExportResult] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [conversions, setConversions] = useState<any[]>([]);

  useEffect(() => { api.get<any[]>('/projects').then(setProjects).catch(() => {}); }, []);

  const handleImport = async () => {
    if (!importContent.trim()) return;
    setLoading(true);
    try { const res: any = await api.post('/interoperability/import', { content: importContent, format: 'ifc' }); setImportResult(res); toast.success('Imported successfully'); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const handleExport = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try { const res: any = await api.post('/interoperability/export', { projectId: selectedProject, format: exportFormat }); setExportResult(res); toast.success('Export ready'); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoading(true);
    try { const res: any = await api.get('/interoperability/jobs'); setConversions(Array.isArray(res) ? res : []); } catch { setConversions([]); }
    setLoading(false);
  };

  const fillSampleIFC = () => {
    setImportContent(`ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('IFC File'),'2;1');
FILE_NAME('sample.ifc','2024-01-01',('Architect'),('Firm'),'','','');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;
DATA;
#1=IFCPROJECT('GlobalId_1',#2,'Sample Project','','',$,#3,$);
#2=IFCOWNERHISTORY(#4,$,$,.ADDED.,$,#5,$);
#3=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.00000000000000E-05,#6,#7);
#4=IFCPERSONANDORGANIZATION($,$,$);
#5=IFCAPPLICATION($,'1.0','AI COS','');
#6=IFCAXIS2PLACEMENT2D(#8,#9);
#7=IFCDIRECTION((1.,0.,0.));
#8=IFCCARTESIANPOINT((0.,0.));
#9=IFCDIRECTION((1.,0.));
ENDSEC;
END-ISO-10303-21;`);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Interoperability</h1><p className="text-muted-foreground mt-1">Import, export, and convert between BIM formats</p></div>
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setTab('import')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'import' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><Upload className="w-4 h-4 inline mr-1" />Import</button>
        <button onClick={() => setTab('export')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'export' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><Download className="w-4 h-4 inline mr-1" />Export</button>
        <button onClick={() => setTab('convert')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'convert' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><RefreshCw className="w-4 h-4 inline mr-1" />Convert</button>
        <button onClick={() => { setTab('history'); loadHistory(); }} className={`px-4 py-2 rounded-lg text-sm ${tab === 'history' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><History className="w-4 h-4 inline mr-1" />History</button>
      </div>

      {tab === 'import' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <textarea value={importContent} onChange={e => setImportContent(e.target.value)} rows={8} className="w-full rounded-lg border border-input bg-background/50 p-3 text-xs font-mono resize-none" placeholder="Paste IFC file content here..." />
          <div className="flex gap-2"><button onClick={fillSampleIFC} className="px-3 py-2 rounded-lg border border-input text-sm hover:bg-accent"><FileText className="w-4 h-4 inline mr-1" />Load Sample IFC</button><button onClick={handleImport} disabled={loading || !importContent.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">{loading ? 'Importing...' : 'Import'}</button></div>
          {importResult && <div className="p-3 rounded-lg bg-accent/30 text-sm"><pre className="text-xs">{JSON.stringify(importResult, null, 2)}</pre></div>}
        </div>
      )}

      {tab === 'export' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground">Project</label><select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select...</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground">Format</label><select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="ifc">IFC</option><option value="ifcxml">IFCXML</option><option value="gbxml">gbXML</option><option value="citygml">CityGML</option><option value="obj">OBJ</option><option value="dae">DAE</option><option value="json">JSON</option></select></div>
          </div>
          <button onClick={handleExport} disabled={loading || !selectedProject} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">{loading ? 'Exporting...' : 'Export'}</button>
          {exportResult && <div className="p-3 rounded-lg bg-accent/30 text-sm"><pre className="text-xs">{typeof exportResult === 'string' ? exportResult.substring(0, 500) : JSON.stringify(exportResult, null, 2).substring(0, 500)}...</pre></div>}
        </div>
      )}

      {tab === 'convert' && <div className="glass-card rounded-xl p-5 text-center text-muted-foreground py-12"><RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Format conversion available via import/export</p></div>}

      {tab === 'history' && (
        <div className="space-y-2">{conversions.map((j: any, i: number) => <div key={i} className="glass-card rounded-xl p-4 flex items-center justify-between"><div><p className="text-sm font-medium">{j.type || j.status || 'Job'}</p><p className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</p></div><span className="text-xs px-2 py-1 rounded-full bg-accent">{j.status}</span></div>)}</div>
      )}
    </div>
  );
}

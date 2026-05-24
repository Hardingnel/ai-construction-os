import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitCompare, Upload, Download, Repeat, FileType,
  Building2, Loader2, CheckCircle2, AlertTriangle, FileText,
  History, ExternalLink, Copy, DownloadCloud
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ProjectSummary {
  id: string;
  name: string;
  type: string;
}

interface FormatList {
  import: string[];
  export: string[];
}

interface JobRecord {
  id: string;
  type: string;
  format: string;
  direction: string;
  fileName: string | null;
  status: string;
  message: string | null;
  createdAt: string;
}

interface ConversionRecord {
  id: string;
  sourceFormat: string;
  targetFormat: string;
  status: string;
  message: string | null;
  createdAt: string;
}

export function Interoperability() {
  const [activeTab, setActiveTab] = useState('import');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [formats, setFormats] = useState<FormatList | null>(null);

  const [importContent, setImportContent] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);

  const [exportFormat, setExportFormat] = useState('');
  const [exportResult, setExportResult] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [convertContent, setConvertContent] = useState('');
  const [convertSource, setConvertSource] = useState('');
  const [convertTarget, setConvertTarget] = useState('');
  const [convertResult, setConvertResult] = useState<any>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const [p, f] = await Promise.all([
          api.get<ProjectSummary[]>('/projects'),
          api.get<FormatList>('/interoperability/formats'),
        ]);
        setProjects(p);
        setFormats(f);
        if (p.length > 0) setSelectedProject(p[0].id);
      } catch { /* ignore */ }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    loadJobs();
  }, [selectedProject]);

  useEffect(() => {
    loadConversions();
  }, []);

  async function loadJobs() {
    try {
      setJobs(await api.get<JobRecord[]>(`/interoperability/jobs/${selectedProject}`));
    } catch { /* ignore */ }
  }

  async function loadConversions() {
    try {
      setConversions(await api.get<ConversionRecord[]>('/interoperability/conversions'));
    } catch { /* ignore */ }
  }

  async function handleImport() {
    if (!selectedProject || !importContent.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await api.post(`/interoperability/import/${selectedProject}`, {
        content: importContent,
        fileName: importFileName || 'imported_file.ifc',
      });
      setImportResult(res);
      loadJobs();
    } catch (e: any) {
      setImportResult({ success: false, message: e.message });
    }
    setImportLoading(false);
  }

  async function handleExport() {
    if (!selectedProject || !exportFormat) return;
    setExportLoading(true);
    setExportResult(null);
    try {
      const res = await api.post(`/interoperability/export/${selectedProject}`, { format: exportFormat });
      setExportResult(res);
      loadJobs();
    } catch (e: any) {
      setExportResult({ success: false, message: e.message });
    }
    setExportLoading(false);
  }

  async function handleConvert() {
    if (!convertContent.trim() || !convertSource || !convertTarget) return;
    setConvertLoading(true);
    setConvertResult(null);
    try {
      const res = await api.post('/interoperability/convert', {
        content: convertContent,
        sourceFormat: convertSource,
        targetFormat: convertTarget,
      });
      setConvertResult(res);
      loadConversions();
    } catch (e: any) {
      setConvertResult({ success: false, message: e.message });
    }
    setConvertLoading(false);
  }

  function downloadContent(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function fillSampleIFC() {
    setImportFileName('sample_project.ifc');
    setImportContent(`ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('AI COS Sample Project'),'2;1');
FILE_NAME('sample_project','${new Date().toISOString()}',(''),(''),'AI COS','${new Date().toISOString()}','');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;
DATA;
#1=IFCPROJECT($,'Sample Project','Sample IFC for testing',$,$,$,$,(#2));
#2=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,0.00000001,$,#3);
#3=IFCWALL('3cPcTnN5fA4O000000000001',#4,'Wall 1','Exterior wall',$,#5,#6,$);
#4=IFCBUILDING('3cPcTnN5fA4O000000000000',#4,'Main Building','',$,$,$,$,$);
#5=IFCLOCALPLACEMENT($,#7);
#6=IFCPRODUCTDEFINITIONSHAPE($,$,(#8));
#7=IFCAXIS2PLACEMENT3D(#9,#10,#11);
#8=IFCSHAPEREPRESENTATION(#2,'Body','SweptSolid',(#12));
#9=IFCCARTESIANPOINT((0.,0.,0.));
#10=IFCDIRECTION((1.,0.,0.));
#11=IFCDIRECTION((0.,0.,1.));
#12=IFCEXTRIBEDAREASOLID(#13,#14,#15,3.0);
#13=IFCRECTANGLEPROFILEDEF(.AREA.,$,#16,0.3,3.0);
#14=IFCAXIS2PLACEMENT3D(#9,#10,#11);
#15=IFCDIRECTION((0.,0.,1.));
#16=IFCAXIS2PLACEMENT2D(#17,#18);
#17=IFCCARTESIANPOINT((0.,0.));
#18=IFCDIRECTION((1.,0.));
ENDSEC;
END-ISO-10303-21;`);
  }

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interoperability Engine</h1>
          <p className="text-muted-foreground">Import, export, and convert between AEC file formats</p>
        </div>
        {formats && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <Badge variant="outline">{formats.import.length} import formats</Badge>
            <Badge variant="outline">{formats.export.length} export formats</Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-56">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="import"><Upload className="h-4 w-4 mr-2" />Import</TabsTrigger>
          <TabsTrigger value="export"><Download className="h-4 w-4 mr-2" />Export</TabsTrigger>
          <TabsTrigger value="convert"><Repeat className="h-4 w-4 mr-2" />Convert</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                Import AEC File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">File Name</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="e.g. building.ifc"
                    value={importFileName} onChange={e => setImportFileName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">File Content (paste or type)</label>
                <textarea className="flex h-48 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Paste IFC, IFCXML, gbXML, CityGML, OBJ, or DAE content..."
                  value={importContent}
                  onChange={e => setImportContent(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!selectedProject || !importContent.trim() || importLoading}>
                  {importLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import
                </Button>
                <Button variant="outline" onClick={fillSampleIFC}>Load Sample IFC</Button>
              </div>

              {importResult && (
                <Card className={cn(importResult.success ? 'border-green-500/50' : 'border-red-500/50')}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {importResult.success ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                      <div>
                        <p className="font-medium">{importResult.success ? 'Import Successful' : 'Import Failed'}</p>
                        <p className="text-sm text-muted-foreground">{importResult.message || importResult.message}</p>
                        {importResult.model && (
                          <div className="mt-2 flex gap-2">
                            <Badge variant="secondary">{importResult.model.elements.length} elements</Badge>
                            <Badge variant="outline">{importResult.format?.toUpperCase()}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-green-500" />
                Export to Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-48">
                    <FileType className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Target format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formats?.export.map(f => (
                      <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleExport} disabled={!selectedProject || !exportFormat || exportLoading}>
                  {exportLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-2" />}
                  Export
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formats?.export.map(f => (
                  <button key={f} onClick={() => setExportFormat(f)}
                    className={cn('p-3 rounded-lg border text-center text-sm transition-colors',
                      exportFormat === f ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted')}>
                    <FileType className="h-5 w-5 mx-auto mb-1" />
                    <span className="font-medium">{f.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              {exportResult && (
                <>
                  <Card className={cn(exportResult.success !== false ? 'border-green-500/50' : 'border-red-500/50')}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {exportResult.success !== false ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                        <div>
                          <p className="font-medium">Export Ready</p>
                          <p className="text-sm text-muted-foreground">{exportResult.job?.message || 'Export completed'}</p>
                          <div className="flex gap-2 mt-2">
                            {exportResult.content && (
                              <Button size="sm" variant="outline" className="text-xs"
                                onClick={() => downloadContent(exportResult.content, exportResult.fileName || `export.${exportFormat}`)}>
                                <Download className="h-3 w-3 mr-1" /> Download
                              </Button>
                            )}
                            <Badge variant="secondary">{exportFormat.toUpperCase()}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="convert" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="h-4 w-4 text-purple-500" />
                Format Converter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={convertSource} onValueChange={setConvertSource}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    {formats?.import.map(f => (
                      <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center text-muted-foreground"><Repeat className="h-4 w-4" /></div>
                <Select value={convertTarget} onValueChange={setConvertTarget}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    {formats?.export.map(f => (
                      <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <textarea className="flex h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Paste source content..." value={convertContent} onChange={(e: any) => setConvertContent(e.target.value)} />
              <Button onClick={handleConvert} disabled={!convertContent.trim() || !convertSource || !convertTarget || convertLoading}>
                {convertLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Repeat className="h-4 w-4 mr-2" />}
                Convert
              </Button>

              {convertResult && (
                <Card className={cn(convertResult.success !== false ? 'border-green-500/50' : 'border-red-500/50')}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {convertResult.success !== false ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                      <div>
                        <p className="font-medium">{convertResult.success !== false ? 'Conversion Complete' : 'Conversion Failed'}</p>
                        <p className="text-sm text-muted-foreground">{convertResult.message}</p>
                        {convertResult.content && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="text-xs"
                              onClick={() => downloadContent(convertResult.content, `converted.${convertTarget}`)}>
                              <Download className="h-3 w-3 mr-1" /> Download
                            </Button>
                            <Badge variant="outline">{convertSource.toUpperCase()} → {convertTarget.toUpperCase()}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Import/Export Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No import/export jobs yet</p>
                ) : (
                  <div className="space-y-2">
                    {jobs.map(j => (
                      <div key={j.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                        <div className="flex items-center gap-2">
                          {j.direction === 'import' ? <Upload className="h-3 w-3 text-blue-500" /> : <Download className="h-3 w-3 text-green-500" />}
                          <div>
                            <p className="font-medium text-xs">{j.fileName || `${j.direction}.${j.format}`}</p>
                            <p className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={j.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                          {j.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-purple-500" />
                  Format Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No conversions yet</p>
                ) : (
                  <div className="space-y-2">
                    {conversions.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-3 w-3 text-purple-500" />
                          <div>
                            <p className="font-medium text-xs">{c.sourceFormat.toUpperCase()} → {c.targetFormat.toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={c.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

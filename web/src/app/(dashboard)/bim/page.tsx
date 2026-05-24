'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Layers, Move3d, Grid3x3, Plus, Trash2, Save,
  Building2, Loader2, CheckCircle2, AlertTriangle,
  MessageSquare, Brain, FileType, Ruler, Hash,
  Wand2, Swords, BarChart3, Download, Upload, RefreshCw,
  PanelRight, PanelLeft, DoorOpen, Wallpaper, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CursorOverlay } from '@/components/collaboration/CursorOverlay';
import { useAppStore } from '@/store/appStore';
import { CollaborativeEditor } from '@/components/collaboration/CollaborativeEditor';

interface ProjectSummary { id: string; name: string; }
interface BIMElement {
  id: string; type: string; subType: string | null; name: string | null;
  x: number; y: number; width: number; height: number; rotation: number;
  classification: string | null; classificationScore: number | null;
  layer: string | null; color: string | null; properties: string | null;
}
interface BIMFloorPlan {
  id: string; name: string; description: string | null; floorLevel: number;
  width: number; height: number; elements: BIMElement[];
}
interface ElementTypes { types: string[]; subtypes: Record<string, string[]>; classifications: Record<string, string>; materials: Record<string, string[]>; }
interface ClashResult { element1: { id: string; name: string; type: string }; element2: { id: string; name: string; type: string }; severity: string; description: string; overlapArea: number; }
interface TakeoffResult { totalElements: number; byType: Record<string, any>; totalWallLength: number; totalFloorArea: number; elementCounts: Record<string, number>; }
interface AssistantResponse { answer: string; suggestions: string[]; }

export default function BIMViewerPage() {
  const [activeTab, setActiveTab] = useState('editor');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [floorPlans, setFloorPlans] = useState<BIMFloorPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [elementTypes, setElementTypes] = useState<ElementTypes | null>(null);
  const [selectedElementType, setSelectedElementType] = useState('wall');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [planName, setPlanName] = useState('');
  const [planFloor, setPlanFloor] = useState(0);

  const [clashes, setClashes] = useState<ClashResult[]>([]);
  const [takeoff, setTakeoff] = useState<TakeoffResult | null>(null);
  const [classifyResult, setClassifyResult] = useState<any>(null);

  const [notesContent, setNotesContent] = useState('');
  const [notesVersion, setNotesVersion] = useState(1);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const user = useAppStore(s => s.user);
  const { remoteCursors, collabUsers, lastDocChange, sendCursorMove, sendDocEdit } = useCollaboration({
    projectId: selectedProject || null,
    userId: user?.id || 'anon',
    userName: user?.name || 'Anonymous',
    avatar: user?.avatar,
    enabled: !!user && !!selectedProject,
  });

  useEffect(() => {
    api.get<ProjectSummary[]>('/projects').then(setProjects).catch(() => {});
    api.get<ElementTypes>('/bim/element-types').then(setElementTypes).catch(() => {});
  }, []);

  useEffect(() => { if (selectedProject) loadFloorPlans(); }, [selectedProject]);

  useEffect(() => { if (activePlanId) loadPlan(activePlanId); }, [activePlanId]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
    sendCursorMove(x, y);
  }, [sendCursorMove]);

  async function loadFloorPlans() {
    setLoading(true);
    try {
      const plans = await api.get<BIMFloorPlan[]>(`/bim/floor-plans/${selectedProject}`);
      setFloorPlans(plans);
      if (plans.length > 0 && !activePlanId) setActivePlanId(plans[0].id);
    } catch {}
    setLoading(false);
  }

  async function loadPlan(planId: string) {
    const plan = await api.get<BIMFloorPlan>(`/bim/floor-plan/${planId}`);
    setFloorPlans(prev => prev.map(p => p.id === planId ? plan : p));
  }

  async function createPlan() {
    if (!planName.trim() || !selectedProject) return;
    const plan = await api.post<BIMFloorPlan>(`/bim/floor-plans/${selectedProject}`, {
      name: planName, floorLevel: planFloor, width: 25, height: 20,
    });
    setActivePlanId(plan.id);
    setPlanName('');
    loadFloorPlans();
  }

  async function addElementToPlan() {
    if (!activePlanId) return;
    await api.post<BIMElement>(`/bim/elements/${activePlanId}`, {
      type: selectedElementType,
      subType: selectedSubType || undefined,
      name: `${selectedElementType}_${Date.now()}`,
      x: Math.random() * 15 + 2,
      y: Math.random() * 10 + 2,
      width: selectedElementType === 'wall' ? 4 : selectedElementType === 'door' ? 0.9 : selectedElementType === 'window' ? 1.2 : 3,
      height: selectedElementType === 'wall' ? 0.2 : selectedElementType === 'door' ? 2.1 : selectedElementType === 'window' ? 1.5 : 3,
    });
    loadPlan(activePlanId);
  }

  async function runClassify() {
    if (!activePlanId) return;
    setClassifyResult(await api.post(`/bim/classify/${activePlanId}`, {}));
    loadPlan(activePlanId);
  }

  async function runClash() {
    if (!activePlanId) return;
    const res = await api.get<{ total: number; clashes: ClashResult[] }>(`/bim/clash/${activePlanId}`);
    setClashes(res.clashes);
  }

  async function runTakeoff() {
    if (!activePlanId) return;
    const res = await api.get<TakeoffResult>(`/bim/takeoff/${activePlanId}`);
    setTakeoff(res);
  }

  async function askAssistant() {
    if (!assistantQuery.trim()) return;
    setAssistantLoading(true);
    try {
      const res = await api.post<AssistantResponse>('/bim/assistant', { query: assistantQuery, floorPlanId: activePlanId || undefined });
      setAssistantResponse(res);
    } catch {}
    setAssistantLoading(false);
  }

  async function deleteElement(elementId: string) {
    await api.delete(`/bim/element/${elementId}`);
    if (activePlanId) loadPlan(activePlanId);
  }

  const activePlan = floorPlans.find(p => p.id === activePlanId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BIM Workflows</h1>
          <p className="text-muted-foreground text-sm">Floor plan editor, classification, clash detection & analysis</p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor"><Grid3x3 className="h-4 w-4 mr-2" />Floor Plan Editor</TabsTrigger>
          <TabsTrigger value="analyze"><Brain className="h-4 w-4 mr-2" />Analyze</TabsTrigger>
          <TabsTrigger value="assistant"><MessageSquare className="h-4 w-4 mr-2" />BIM Assistant</TabsTrigger>
          <TabsTrigger value="notes"><Users className="h-4 w-4 mr-2" />Collaborative Notes</TabsTrigger>
          <TabsTrigger value="layers"><Layers className="h-4 w-4 mr-2" />Layers</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Floor Plans
                    {collabUsers.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        <Users className="h-3 w-3" /> {collabUsers.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {collabUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {collabUsers.map(u => (
                        <Badge key={u.userId} variant="outline" className="text-[9px]">{u.userName}</Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {floorPlans.map(p => (
                    <button key={p.id} onClick={() => setActivePlanId(p.id)}
                      className={cn('w-full text-left p-2 rounded-lg text-xs transition-colors',
                        activePlanId === p.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-muted-foreground">Floor {p.floorLevel} — {p.elements?.length || 0} elements</p>
                    </button>
                  ))}
                  <div className="pt-2 border-t space-y-2 mt-2">
                    <Input placeholder="Plan name" value={planName} onChange={e => setPlanName(e.target.value)} className="text-xs h-8" />
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Floor" value={planFloor} onChange={e => setPlanFloor(Number(e.target.value))} className="text-xs h-8 w-16" />
                      <Button size="sm" className="text-xs h-8" onClick={createPlan} disabled={!planName.trim()}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Element Palette</CardTitle></CardHeader>
                <CardContent className="p-2 space-y-1">
                  {elementTypes?.types.map(type => (
                    <button key={type} onClick={() => setSelectedElementType(type)}
                      className={cn('w-full text-left p-2 rounded-lg text-xs capitalize transition-colors',
                        selectedElementType === type ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                      {type} ({activePlan?.elements?.filter(e => e.type === type).length || 0})
                    </button>
                  ))}
                  <Button size="sm" className="w-full mt-2 text-xs" onClick={addElementToPlan} disabled={!activePlanId}>
                    <Plus className="h-3 w-3 mr-1" /> Add {selectedElementType}
                  </Button>
                  {selectedElementType && elementTypes?.subtypes[selectedElementType] && (
                    <Select value={selectedSubType} onValueChange={setSelectedSubType}>
                      <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Subtype" /></SelectTrigger>
                      <SelectContent>
                        {elementTypes.subtypes[selectedElementType].map(st => (
                          <SelectItem key={st} value={st} className="text-xs capitalize">{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    {activePlan ? `${activePlan.name} (Floor ${activePlan.floorLevel})` : 'Select a floor plan'}
                    {activePlan && <Badge variant="outline" className="ml-auto text-[10px]">{activePlan.elements?.length || 0} elements</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!activePlan ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                      <Box className="h-12 w-12 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Select a project and create a floor plan</p>
                    </div>
                  ) : (
                    <div className="relative bg-grid" style={{ minHeight: 400 }}>
                      <div ref={svgContainerRef} className="relative w-full" style={{ aspectRatio: `${activePlan.width}/${activePlan.height}`, maxHeight: 500, background: '#f8f9fa', borderRadius: 8, overflow: 'hidden' }}
                        onMouseMove={handleSvgMouseMove}>
                        <CursorOverlay cursors={remoteCursors} containerRef={svgContainerRef} />
                        <svg viewBox={`0 0 ${activePlan.width} ${activePlan.height}`} className="w-full h-full">
                          <defs>
                            <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                              <path d="M 0 0.5 L 0.5 0.5 0.5 0" fill="none" stroke="#e0e0e0" strokeWidth="0.02" />
                            </pattern>
                          </defs>
                          <rect width={activePlan.width} height={activePlan.height} fill="url(#grid)" />
                          {activePlan.elements?.map(el => (
                            <g key={el.id} transform={`translate(${el.x},${el.y}) rotate(${el.rotation || 0})`}
                              className="cursor-pointer hover:opacity-80" onClick={() => deleteElement(el.id)}>
                              {el.type === 'wall' ? (
                                <rect x={0} y={-el.height / 2} width={el.width} height={el.height}
                                  fill={el.color || '#4A90D9'} stroke="#2c5f8a" strokeWidth={0.05} rx={0.1} />
                              ) : el.type === 'door' ? (
                                <g>
                                  <rect x={0} y={0} width={el.width} height={el.height}
                                    fill={el.color || '#8B4513'} stroke="#5c2d0a" strokeWidth={0.05} rx={0.1} opacity={0.8} />
                                  <path d={`M 0 ${el.height} Q ${el.width * 0.5} ${el.height * 0.3} ${el.width} 0`}
                                    fill="none" stroke="#5c2d0a" strokeWidth={0.08} strokeDasharray="0.15" />
                                </g>
                              ) : el.type === 'window' ? (
                                <rect x={0} y={0} width={el.width} height={el.height}
                                  fill={el.color || '#87CEEB'} stroke="#4682b4" strokeWidth={0.05} rx={0.1} opacity={0.7} />
                              ) : el.type === 'column' ? (
                                <rect x={-el.width / 2} y={-el.height / 2} width={el.width} height={el.height}
                                  fill={el.color || '#808080'} stroke="#555" strokeWidth={0.05} rx={0.2} />
                              ) : el.type === 'room' ? (
                                <rect x={0} y={0} width={el.width} height={el.height}
                                  fill={el.color || '#F0FFF0'} stroke="#2e8b57" strokeWidth={0.05} rx={0.1} opacity={0.4} />
                              ) : (
                                <rect x={0} y={0} width={el.width} height={el.height}
                                  fill={el.color || '#ccc'} stroke="#999" strokeWidth={0.05} rx={0.1} />
                              )}
                              <text x={el.type === 'wall' ? el.width / 2 : el.width / 2}
                                y={el.type === 'wall' ? 0.3 : el.height / 2}
                                textAnchor="middle" dominantBaseline="middle" fontSize={0.25} fill="#333" className="pointer-events-none">
                                {el.name?.replace(/_\d+$/, '') || el.type}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  )}

                  {activePlan && activePlan.elements && activePlan.elements.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Elements — click to delete</p>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 max-h-24 overflow-y-auto">
                        {activePlan.elements.map(el => (
                          <button key={el.id} onClick={() => deleteElement(el.id)}
                            className="text-[10px] p-1 rounded bg-muted/50 hover:bg-red-500/10 hover:text-red-500 transition-colors truncate text-left">
                            <span className="capitalize">{el.type}</span>
                            {el.classificationScore && <Badge variant="outline" className="ml-1 text-[8px]">{(el.classificationScore * 100).toFixed(0)}%</Badge>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <Wand2 className="h-8 w-8 text-purple-500" />
                <p className="font-medium text-sm">Auto-Classify</p>
                <p className="text-xs text-muted-foreground text-center">Detect IFC types from element geometry & naming</p>
                <Button size="sm" className="w-full" onClick={runClassify} disabled={!activePlanId}>Classify</Button>
                {classifyResult && (
                  <div className="text-xs text-center">
                    <Badge variant="secondary">{classifyResult.classified} classified</Badge>
                    <p className="text-muted-foreground mt-1">Avg confidence: {((classifyResult.results || []).reduce((s: number, r: any) => s + (r.confidence || 0), 0) / (classifyResult.results?.length || 1) * 100).toFixed(0)}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <Swords className="h-8 w-8 text-red-500" />
                <p className="font-medium text-sm">Clash Detection</p>
                <p className="text-xs text-muted-foreground text-center">Find overlapping elements</p>
                <Button size="sm" className="w-full" onClick={runClash} disabled={!activePlanId}>Detect Clashes</Button>
                {clashes.length > 0 && (
                  <div className="text-xs text-center">
                    <Badge variant={clashes.some(c => c.severity === 'high') ? 'destructive' : 'secondary'}>{clashes.length} clashes</Badge>
                    <Badge variant="outline" className="ml-1">{clashes.filter(c => c.severity === 'high').length} high</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-500" />
                <p className="font-medium text-sm">Quantity Takeoff</p>
                <p className="text-xs text-muted-foreground text-center">Element counts, wall length, floor area</p>
                <Button size="sm" className="w-full" onClick={runTakeoff} disabled={!activePlanId}>Takeoff</Button>
                {takeoff && (
                  <div className="text-xs text-center">
                    <p className="font-medium">{takeoff.totalElements} elements</p>
                    <p className="text-muted-foreground">{takeoff.totalWallLength.toFixed(1)}m walls · {takeoff.totalFloorArea.toFixed(1)}m² floor</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {clashes.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Clash Results</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {clashes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                    <div>
                      <p className="font-medium">{c.element1.name} ↔ {c.element2.name}</p>
                      <p className="text-muted-foreground">{c.description}</p>
                    </div>
                    <Badge variant={c.severity === 'high' ? 'destructive' : c.severity === 'medium' ? 'secondary' : 'outline'}>{c.severity}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {classifyResult?.results && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Classification Results</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {classifyResult.results.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{r.name || r.detectedType}</span>
                      <Badge variant="outline" className="text-[9px]">{r.ifcClass}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{(r.confidence * 100).toFixed(0)}%</span>
                      {r.reasoning?.slice(0, 1).map((reason: string, j: number) => (
                        <span key={j} className="text-[9px] text-muted-foreground truncate max-w-[150px]">{reason}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assistant" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    AI BIM Assistant
                    {activePlan && <Badge variant="outline" className="ml-auto text-[10px]">{activePlan.name}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ScrollArea className="flex-1 pr-4">
                    {!assistantResponse ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Ask me about BIM workflows, floor plans, or classifications</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {['How to create a floor plan?', 'What is clash detection?', 'Explain IFC classification', 'How to add doors?', 'Calculate quantities'].map(q => (
                            <button key={q} onClick={() => { setAssistantQuery(q); api.post<AssistantResponse>('/bim/assistant', { query: q, floorPlanId: activePlanId || undefined }).then(setAssistantResponse); }}
                              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 transition-colors">{q}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-end"><div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm max-w-[80%]">{assistantQuery}</div></div>
                        <div className="flex justify-start"><div className="bg-muted rounded-xl px-4 py-2 text-sm whitespace-pre-line max-w-[80%]">{assistantResponse.answer}</div></div>
                        {assistantResponse.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {assistantResponse.suggestions.map((s, i) => (
                              <button key={i} onClick={() => { setAssistantQuery(s); api.post<AssistantResponse>('/bim/assistant', { query: s, floorPlanId: activePlanId || undefined }).then(setAssistantResponse); }}
                                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 transition-colors">{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {assistantLoading && (
                      <div className="flex justify-start"><div className="bg-muted rounded-xl px-4 py-2 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</div></div>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input placeholder="Ask about BIM..." value={assistantQuery}
                      onChange={e => setAssistantQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askAssistant()} />
                    <Button size="icon" onClick={askAssistant} disabled={!assistantQuery.trim()}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Create Floor Plan', query: 'How to create a floor plan?', icon: Plus },
                    { label: 'Clash Detection Guide', query: 'What is clash detection?', icon: Swords },
                    { label: 'IFC Classification', query: 'Explain IFC classification', icon: Wand2 },
                    { label: 'Quantity Takeoff', query: 'How to calculate quantities from BIM?', icon: BarChart3 },
                    { label: 'Export Guide', query: 'Export to IFC format', icon: FileType },
                  ].map(action => (
                    <Button key={action.label} variant="outline" className="w-full justify-start text-xs h-8"
                      onClick={() => { setAssistantQuery(action.query); api.post<AssistantResponse>('/bim/assistant', { query: action.query, floorPlanId: activePlanId || undefined }).then(setAssistantResponse).then(() => setActiveTab('assistant')); }}>
                      <action.icon className="h-3 w-3 mr-2" /> {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Collaborative Notes</span>
                {collabUsers.length > 0 && <Badge variant="secondary" className="text-[10px]">{collabUsers.length} online</Badge>}
              </CardTitle>
              {collabUsers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {collabUsers.map(u => (
                    <Badge key={u.userId} variant="outline" className="text-[9px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {u.userName}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!activePlan ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Select a floor plan to collaborate on notes</p>
              ) : (
                <CollaborativeEditor
                  documentId={`notes-${activePlanId}`}
                  initialContent={activePlan.description || ''}
                  version={notesVersion}
                  onSendEdit={sendDocEdit}
                  lastDocChange={lastDocChange}
                  onContentChange={setNotesContent}
                  remoteUserCount={collabUsers.length}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Element Layers</CardTitle></CardHeader>
            <CardContent>
              {activePlan ? (
                <div className="space-y-2">
                  {['structural', 'architectural', 'mechanical', 'electrical', 'plumbing', 'fire', 'default'].map(layer => {
                    const count = activePlan.elements?.filter(e => (e.layer || 'default') === layer).length || 0;
                    return (
                      <div key={layer} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-3 h-3 rounded', layer === 'structural' ? 'bg-blue-500' : layer === 'architectural' ? 'bg-purple-500' : layer === 'mechanical' ? 'bg-amber-500' : layer === 'electrical' ? 'bg-emerald-500' : layer === 'plumbing' ? 'bg-cyan-500' : layer === 'fire' ? 'bg-red-500' : 'bg-gray-400')} />
                          <span className="capitalize">{layer} ({count})</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{count > 0 ? `${((count / activePlan.elements.length) * 100).toFixed(0)}%` : 'empty'}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Select a floor plan to view layers</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, BookOpen, MessageSquare, Lightbulb, Search,
  Send, Loader2, Brain, ChevronRight, Sparkles,
  History, BookType
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

interface ConceptResult {
  found: boolean;
  concept: string;
  category?: string;
  explanation: string;
  level: string;
  relatedTerms?: { term: string; category: string }[];
  nextSteps?: string[];
}

interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
  difficulty: string;
}

interface GlossaryResult {
  total: number;
  results: GlossaryEntry[];
  categories: string[];
}

interface MentorResponse {
  sessionId: string;
  answer: string;
  relatedTerms: string[];
  conversation: { role: string; content: string; createdAt: string }[];
}

interface SessionSummary {
  id: string;
  topic: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: { role: string; content: string; createdAt: string }[];
}

interface HelpContent {
  title: string;
  content: string;
  tips: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-blue-500/10 text-blue-600',
  advanced: 'bg-purple-500/10 text-purple-600',
};

const PAGES = ['dashboard', 'generator', 'design', 'bim', 'gis', 'boq', 'projects', 'marketplace', 'team', 'compliance', 'sustainability', 'settings'];

export function Tutor() {
  const [activeTab, setActiveTab] = useState('mentor');
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<{ role: string; content: string }[]>([]);

  const [explainConcept, setExplainConcept] = useState('');
  const [explainLevel, setExplainLevel] = useState('beginner');
  const [explainResult, setExplainResult] = useState<ConceptResult | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [showAllConcepts, setShowAllConcepts] = useState(false);

  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState('');
  const [glossaryResult, setGlossaryResult] = useState<GlossaryResult | null>(null);
  const [glossaryLoading, setGlossaryLoading] = useState(false);

  const [helpPage, setHelpPage] = useState('dashboard');
  const [helpContent, setHelpContent] = useState<HelpContent | null>(null);
  const [helpLoading, setHelpLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const COMMON_CONCEPTS = [
    'Foundation', 'Beam', 'Column', 'Slab', 'Concrete',
    'Reinforcement', 'Brick', 'Roof', 'Formwork', 'Excavation',
    'BIM', 'Sustainable Construction', 'Quantity Surveying',
    'Project Management',
  ];

  const displayedConcepts = showAllConcepts ? COMMON_CONCEPTS : COMMON_CONCEPTS.slice(0, 6);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  async function loadSessions() {
    try { setSessions(await api.get<SessionSummary[]>('/tutor/sessions')); } catch { /* ignore */ }
  }

  async function askMentor(question?: string) {
    const q = question || mentorQuestion;
    if (!q.trim() || mentorLoading) return;
    setMentorLoading(true);
    try {
      const res = await api.post<MentorResponse>('/tutor/mentor', { question: q, sessionId: selectedSession || undefined });
      setSessionMessages(res.conversation || []);
      if (!selectedSession) { setSelectedSession(res.sessionId); }
      loadSessions();
    } catch { /* ignore */ }
    setMentorLoading(false);
    setMentorQuestion('');
  }

  async function loadSessionMessages(sessionId: string) {
    try {
      const msgs = await api.get<{ role: string; content: string; createdAt: string }[]>(`/tutor/sessions/${sessionId}/messages`);
      setSessionMessages(msgs);
      setSelectedSession(sessionId);
    } catch { /* ignore */ }
  }

  async function explainConceptFn(concept?: string) {
    const c = concept || explainConcept;
    if (!c.trim()) return;
    setExplainLoading(true);
    try {
      setExplainResult(await api.post<ConceptResult>('/tutor/explain', { concept: c, level: explainLevel }));
    } catch { /* ignore */ }
    setExplainLoading(false);
  }

  async function searchGlossaryFn() {
    const params = new URLSearchParams();
    if (glossaryQuery) params.set('query', glossaryQuery);
    if (glossaryCategory) params.set('category', glossaryCategory);
    setGlossaryLoading(true);
    try {
      setGlossaryResult(await api.get<GlossaryResult>(`/tutor/glossary?${params}`));
    } catch { /* ignore */ }
    setGlossaryLoading(false);
  }

  async function loadHelp() {
    setHelpLoading(true);
    try {
      setHelpContent(await api.get<HelpContent>(`/tutor/context-help?page=${helpPage}`));
    } catch { /* ignore */ }
    setHelpLoading(false);
  }

  useEffect(() => { loadHelp(); }, [helpPage]);

  const quickQuestions = ['What is a beam?', 'Explain foundations like I\'m a beginner', 'How does BIM work?', 'Construction career paths', 'What is concrete grade?'];

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Construction Tutor</h1>
          <p className="text-muted-foreground">Learn, understand, and master construction knowledge</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          40+ concepts & terms
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="mentor"><MessageSquare className="h-4 w-4 mr-2" />AI Mentor</TabsTrigger>
          <TabsTrigger value="explain"><Lightbulb className="h-4 w-4 mr-2" />Explain</TabsTrigger>
          <TabsTrigger value="glossary"><BookOpen className="h-4 w-4 mr-2" />Glossary</TabsTrigger>
          <TabsTrigger value="help"><BookType className="h-4 w-4 mr-2" />Help</TabsTrigger>
        </TabsList>

        <TabsContent value="mentor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Interactive Mentor
                    {selectedSession && (
                      <Button variant="ghost" size="sm" className="ml-auto text-xs h-6"
                        onClick={() => { setSelectedSession(null); setSessionMessages([]); }}>
                        New Chat
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {sessionMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Ask me anything about construction!</p>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md">
                          {quickQuestions.map(q => (
                            <button key={q} onClick={() => { setMentorQuestion(q); askMentor(q); }}
                              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      sessionMessages.map((msg, i) => (
                        <div key={i} className={cn('mb-4 flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-line',
                            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {mentorLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-muted rounded-xl px-4 py-2 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input placeholder="Ask a construction question..." value={mentorQuestion}
                      onChange={e => setMentorQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askMentor()} />
                    <Button size="icon" onClick={() => askMentor()} disabled={!mentorQuestion.trim() || mentorLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Chat History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No previous chats</p>
                  ) : (
                    <div className="space-y-1">
                      {sessions.slice(0, 8).map(s => (
                        <button key={s.id}
                          onClick={() => loadSessionMessages(s.id)}
                          className={cn('w-full text-left p-2 rounded-lg text-xs transition-colors',
                            selectedSession === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                          <p className="font-medium truncate">{s.topic || 'Chat'}</p>
                          <p className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="explain" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Explain Like I'm a Beginner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Concept (foundation, beam, BIM...)" value={explainConcept}
                      onChange={e => setExplainConcept(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && explainConceptFn()} />
                    <Select value={explainLevel} onValueChange={setExplainLevel}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => explainConceptFn()} disabled={!explainConcept.trim() || explainLoading}>
                      {explainLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  {explainLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}

                  {explainResult && !explainLoading && (
                    <div className="space-y-4">
                      {explainResult.found ? (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold">{explainResult.concept}</h3>
                            {explainResult.category && <Badge variant="secondary">{explainResult.category}</Badge>}
                            <Badge className={DIFFICULTY_COLORS[explainResult.level]}>{explainResult.level}</Badge>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-line">{explainResult.explanation}</p>
                          {explainResult.relatedTerms && explainResult.relatedTerms.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Related Concepts</p>
                              <div className="flex flex-wrap gap-2">
                                {explainResult.relatedTerms.map((t: any) => (
                                  <button key={t.term} onClick={() => { setExplainConcept(t.term); explainConceptFn(t.term); }}
                                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 transition-colors">
                                    {t.term}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">{explainResult.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!explainResult && !explainLoading && (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                      <Lightbulb className="h-12 w-12 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Enter a concept to get an explanation at your level</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Concepts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {displayedConcepts.map(c => (
                    <button key={c} onClick={() => { setExplainConcept(c); explainConceptFn(c); }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-muted transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
                {COMMON_CONCEPTS.length > 6 && (
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs"
                    onClick={() => setShowAllConcepts(!showAllConcepts)}>
                    {showAllConcepts ? 'Show less' : `Show all (${COMMON_CONCEPTS.length})`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Construction Glossary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search terms..." className="pl-9" value={glossaryQuery}
                    onChange={e => setGlossaryQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchGlossaryFn()} />
                </div>
                <Select value={glossaryCategory} onValueChange={v => { setGlossaryCategory(v); }}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Architectural">Architectural</SelectItem>
                    <SelectItem value="Masonry">Masonry</SelectItem>
                    <SelectItem value="Geotechnical">Geotechnical</SelectItem>
                    <SelectItem value="Finishing">Finishing</SelectItem>
                    <SelectItem value="Roofing">Roofing</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={searchGlossaryFn} disabled={glossaryLoading}>
                  {glossaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {glossaryResult && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{glossaryResult.total} term(s) found</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2">
                    {glossaryResult.results.map(entry => (
                      <div key={entry.term} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium text-sm">{entry.term}</h4>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entry.category}</Badge>
                          <Badge className={cn('text-[10px] px-1.5 py-0', DIFFICULTY_COLORS[entry.difficulty])}>{entry.difficulty}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!glossaryResult && !glossaryLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Search the glossary for construction terms and definitions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookType className="h-4 w-4 text-primary" />
                Contextual Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={helpPage} onValueChange={setHelpPage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a page..." />
                </SelectTrigger>
                <SelectContent>
                  {PAGES.map(p => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {helpLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}

              {helpContent && !helpLoading && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">{helpContent.title}</h3>
                  <p className="text-sm leading-relaxed">{helpContent.content}</p>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tips</p>
                    <ul className="space-y-2">
                      {helpContent.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                          </div>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

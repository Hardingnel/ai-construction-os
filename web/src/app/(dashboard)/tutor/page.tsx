'use client';
import { useState } from 'react';
import { GraduationCap, BookOpen, MessageSquare, HelpCircle, Send, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TutorPage() {
  const [tab, setTab] = useState<'mentor' | 'explain' | 'glossary'>('mentor');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [concept, setConcept] = useState('foundation');
  const [level, setLevel] = useState('beginner');
  const [explanation, setExplanation] = useState<any>(null);
  const [glossary, setGlossary] = useState<any[]>([]);
  const [glossarySearch, setGlossarySearch] = useState('');

  const askMentor = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try { const res: any = await api.post('/tutor/mentor', { question }); setAnswer(res.answer); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const explainConcept = async () => {
    setLoading(true);
    try { const res: any = await api.post('/tutor/explain', { concept, level }); setExplanation(res); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const searchGlossary = async () => {
    setLoading(true);
    try { const res: any = await api.get(`/tutor/glossary?search=${glossarySearch}`); setGlossary(Array.isArray(res) ? res : []); } catch { setGlossary([]); }
    setLoading(false);
  };

  const concepts = ['foundation', 'beam', 'column', 'slab', 'reinforcement', 'sustainability', 'bim', 'ifc', 'structural load', 'soil mechanics', 'cost estimation', 'project management', 'water supply', 'fire safety'];

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">AI Tutor</h1><p className="text-muted-foreground mt-1">Learn construction concepts with AI mentorship</p></div>
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setTab('mentor')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'mentor' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><MessageSquare className="w-4 h-4 inline mr-1" />AI Mentor</button>
        <button onClick={() => setTab('explain')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'explain' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><BookOpen className="w-4 h-4 inline mr-1" />Explain</button>
        <button onClick={() => setTab('glossary')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'glossary' ? 'bg-accent text-primary' : 'hover:bg-accent'}`}><Search className="w-4 h-4 inline mr-1" />Glossary</button>
      </div>

      {tab === 'mentor' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5 min-h-[200px]">
            {answer ? <p className="text-sm whitespace-pre-wrap">{answer}</p> : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><GraduationCap className="w-12 h-12 mb-3 opacity-40" /><p>Ask me anything about construction</p></div>}
          </div>
          <div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a construction question..." className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm" onKeyDown={e => e.key === 'Enter' && askMentor()} /><button onClick={askMentor} disabled={loading || !question.trim()} className="px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Send className="w-4 h-4" /></button></div>
        </div>
      )}

      {tab === 'explain' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-muted-foreground">Concept</label><select value={concept} onChange={e => setConcept(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">{concepts.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-muted-foreground">Level</label><select value={level} onChange={e => setLevel(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
            </div>
            <button onClick={explainConcept} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">{loading ? 'Loading...' : 'Explain'}</button>
          </div>
          {explanation && (
            <div className="glass-card rounded-xl p-5">
              {explanation.found === false ? <p className="text-sm text-muted-foreground">{explanation.message}</p> : <p className="text-sm whitespace-pre-wrap">{explanation.explanation}</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'glossary' && (
        <div className="space-y-4">
          <div className="flex gap-2"><input value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} placeholder="Search glossary..." className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm" /><button onClick={searchGlossary} disabled={loading} className="px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Search className="w-4 h-4" /></button></div>
          <div className="space-y-2">{glossary.map((g: any, i: number) => <div key={i} className="glass-card rounded-xl p-4"><p className="font-medium text-sm">{g.term}</p><p className="text-xs text-muted-foreground mt-1">{g.definition}</p></div>)}</div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, ChevronRight, MessageSquare, Mic, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function detectType(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\b(boq|bill of quantities|cost estimate|quantity|pricing|budget)\b/.test(lower)) return 'boq';
  if (/\b(gis|site analysis|geospatial|terrain|flood|elevation|sunlight|coordinates?|latitude|longitude)\b/.test(lower)) return 'gis';
  if (/\b(structural|foundation|beam|column|slab|seismic|load bearing|reinforcement)\b/.test(lower)) return 'structural';
  return 'design';
}

function formatResult(type: string, data: any): string {
  switch (type) {
    case 'design':
      return [
        '**' + data.name + '**',
        '- Type: ' + data.type,
        '- Style: ' + data.style,
        '- Area: ' + data.area_sqm + ' m\u00B2',
        '- Bedrooms: ' + data.bedrooms,
        '- Floors: ' + data.floors,
        '',
        '**Features:**',
        ...(data.features || []).map((f: string) => '- ' + f),
        '',
        '**Room Layout:**',
        ...Object.entries(data.room_layout || {}).map(([k, v]) => '- ' + k + ': ' + v),
        '',
        '**Recommendations:**',
        ...(data.recommendations || []).map((r: string) => '- ' + r),
      ].join('\n');
    case 'boq':
      return [
        '**Bill of Quantities**',
        '- Total Estimated Cost: $' + (data.total_estimated_cost || 0).toLocaleString(),
        '- Cost per m\u00B2: $' + (data.cost_per_sqm || 0),
        '',
        '**Breakdown:**',
        ...Object.entries(data.breakdown || {}).map(([k, v]) => '- ' + k.replace(/_/g, ' ') + ': $' + Number(v).toLocaleString()),
        '',
        '**Items:**',
        ...(data.items || []).map((i: any) => '- ' + i.item + ': ' + i.quantity + ' ' + i.unit + ' @ $' + i.rate),
      ].join('\n');
    case 'gis':
      return [
        '**GIS Analysis Results**',
        '- Terrain: ' + (data.elevation?.terrain_type || 'N/A'),
        '- Elevation: ' + (data.elevation?.average_elevation || 'N/A'),
        '- Suitability: ' + (data.elevation?.suitability || 'N/A'),
        '',
        '**Flood Assessment:**',
        '- Risk: ' + (data.flood?.risk_level || 'N/A'),
        '- Zone: ' + (data.flood?.flood_zone || 'N/A'),
        '- ' + (data.flood?.recommendation || ''),
        '',
        '**Solar Analysis:**',
        '- Solar Potential: ' + (data.sunlight?.solar_potential || 'N/A'),
        '- Sunlight Hours: ' + (data.sunlight?.annual_sunlight_hours || 'N/A'),
        '- Optimal Panel Angle: ' + (data.sunlight?.optimal_panel_angle || 'N/A'),
      ].join('\n');
    case 'structural':
      return [
        '**Structural Recommendations**',
        '- Foundation: ' + data.foundation,
        '',
        '**Columns:**',
        '- Size: ' + data.columns?.size,
        '- Spacing: ' + data.columns?.spacing,
        '- Reinforcement: ' + data.columns?.reinforcement,
        '',
        '**Beams:**',
        '- Size: ' + data.beams?.size,
        '- Reinforcement: ' + data.beams?.reinforcement,
        '',
        '**Slabs:**',
        '- Thickness: ' + data.slabs?.thickness,
        '- Reinforcement: ' + data.slabs?.reinforcement,
        '',
        '**Soil Requirements:**',
        '- Bearing Capacity: ' + data.soil_requirements?.bearing_capacity,
        '- Recommended Depth: ' + data.soil_requirements?.recommended_depth,
      ].join('\n');
    default:
      return JSON.stringify(data, null, 2);
  }
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Construction Assistant. I can help you design buildings, analyze sites, generate BOQs, and more. What would you like to create?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const genType = detectType(input);
      const params: any = { prompt: input, type: genType };
      if (genType === 'gis') {
        const latMatch = input.match(/lat(?:itude)?[:\s]*([-\d.]+)/i);
        const lngMatch = input.match(/lng?|lon(?:gitude)?[:\s]*([-\d.]+)/i);
        const coordMatch = input.match(/([-\d.]+),\s*([-\d.]+)/);
        if (coordMatch) { params.latitude = parseFloat(coordMatch[1]); params.longitude = parseFloat(coordMatch[2]); }
        else if (latMatch) params.latitude = parseFloat(latMatch[1]);
        if (lngMatch) params.longitude = parseFloat(lngMatch[1]);
      }
      const res = await api.post<{ id: string; result: string; model: string }>('/generations', params);
      const resultData = JSON.parse(res.result);
      setMessages((prev) => [...prev, {
        id: res.id,
        role: 'assistant',
        content: formatResult(genType, resultData),
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${e.message}. Please try again later.`,
        timestamp: new Date(),
      }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
        </button>
      )}

      <div
        className={cn(
          'fixed bottom-0 right-0 z-40 h-[calc(100vh-2.5rem)] w-96 border-l bg-card shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Online • Ready to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 animate-fade-in',
                msg.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                )}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 max-w-[80%] text-sm whitespace-pre-line',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your building project..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <button className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Mic className="h-3 w-3" />
            <span>Voice input (coming soon)</span>
          </button>
        </div>
      </div>
    </>
  );
}

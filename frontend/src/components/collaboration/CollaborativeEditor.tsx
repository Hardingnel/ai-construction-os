import { useState, useRef, useEffect, useCallback } from 'react';
import { type DocChange } from '@/hooks/useCollaboration';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent: string;
  version: number;
  onSendEdit: (documentId: string, content: string, version: number) => void;
  lastDocChange: DocChange | null;
  onContentChange?: (content: string) => void;
  remoteUserCount?: number;
}

export function CollaborativeEditor({ documentId, initialContent, version: initialVersion, onSendEdit, lastDocChange, onContentChange, remoteUserCount = 0 }: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [version, setVersion] = useState(initialVersion);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastRemoteRef = useRef<string | null>(null);

  useEffect(() => { setContent(initialContent); setVersion(initialVersion); }, [initialContent, initialVersion, documentId]);

  useEffect(() => {
    if (lastDocChange && lastDocChange.documentId === documentId && lastDocChange.content !== lastRemoteRef.current) {
      lastRemoteRef.current = lastDocChange.content;
      setContent(lastDocChange.content);
      setVersion(lastDocChange.version);
    }
  }, [lastDocChange, documentId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsTyping(true);
    onContentChange?.(newContent);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newVersion = version + 1;
      setVersion(newVersion);
      onSendEdit(documentId, newContent, newVersion);
      setIsTyping(false);
    }, 300);
  }, [documentId, version, onSendEdit, onContentChange]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        {isTyping && <Badge variant="outline" className="text-[10px] animate-pulse">Saving...</Badge>}
        {remoteUserCount > 0 && (
          <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
            <Users className="h-3 w-3" /> {remoteUserCount} online
          </Badge>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        className="w-full min-h-[200px] p-4 rounded-lg border bg-background text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="Start typing..."
      />
      <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
        <span>v{version}</span>
        <span>{content.length} chars</span>
      </div>
    </div>
  );
}

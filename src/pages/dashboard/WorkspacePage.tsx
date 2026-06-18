import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Plus,
  FileText,
  Trash2,
  Clock,
  FilePlus,
  Save,
  Bold,
  Italic,
  Heading1,
  Heading2,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

function formatContent(content: string): string {
  return content
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4" style="color:var(--ds-text)">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3" style="color:var(--ds-text)">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2" style="color:var(--ds-text)">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ds-text)">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--ds-text-muted)">$1</em>')
    .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><div class="w-4 h-4 rounded border" style="border-color:var(--ds-border-subtle)"></div><span style="color:var(--ds-text-muted)">$1</span></div>')
    .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><div class="w-4 h-4 rounded flex items-center justify-center" style="background:var(--ds-success)"><svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div><span style="color:var(--ds-text-muted);text-decoration:line-through">$1</span></div>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 my-1" style="color:var(--ds-text-muted);list-style-type:disc">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1" style="color:var(--ds-text-muted);list-style-type:decimal">$1</li>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="border rounded-lg p-4 my-4 overflow-x-auto" style="background:var(--ds-input);border-color:var(--ds-border-subtle)"><code class="text-xs font-mono" style="color:var(--ds-accent)">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-sm font-mono" style="background:var(--ds-input);color:var(--ds-accent)">$1</code>')
    .replace(/\n/g, '<br>');
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

const TOOLBAR_TOOLS = [
  { icon: <Bold className="h-3.5 w-3.5" />, label: 'Bold', insert: '**bold**' },
  { icon: <Italic className="h-3.5 w-3.5" />, label: 'Italic', insert: '*italic*' },
  { icon: <Heading1 className="h-3.5 w-3.5" />, label: 'H1', insert: '\n# Heading 1\n' },
  { icon: <Heading2 className="h-3.5 w-3.5" />, label: 'H2', insert: '\n## Heading 2\n' },
  { icon: <ListOrdered className="h-3.5 w-3.5" />, label: 'List', insert: '\n- Item 1\n- Item 2\n' },
  { icon: <CheckSquare className="h-3.5 w-3.5" />, label: 'Todo', insert: '\n- [ ] Task\n' },
  { icon: <Code className="h-3.5 w-3.5" />, label: 'Code', insert: '\n```python\n# code here\n```\n' },
  { icon: <Quote className="h-3.5 w-3.5" />, label: 'Quote', insert: '\n> blockquote\n' },
  { icon: <Table2 className="h-3.5 w-3.5" />, label: 'Table', insert: '\n| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| A     | B     | C     |\n' },
];

const TEMPLATES: Record<string, string> = {
  'Analysis Plan': `# Analysis Plan\n\n## Objective\n\n## Key Metrics\n- Metric 1\n- Metric 2\n\n## Data Sources\n1. Source A\n2. Source B\n\n## Timeline\n| Phase | Start | End | Owner |\n|-------|-------|-----|-------|\n| Data Collection | TBD | TBD | Team |\n\n## Action Items\n- [ ] Item 1\n- [ ] Item 2\n`,
  'Weekly Report': `# Weekly Report\n\n**Week of:** ${new Date().toLocaleDateString()}\n\n## Summary\n\n## Completed\n- [ ] Task 1\n- [ ] Task 2\n\n## In Progress\n- Item 1\n\n## Blockers\n- None\n\n## Next Week\n- [ ] Planned task\n`,
  'Project Spec': `# Project Specification\n\n## Overview\n\n## Goals\n1. Goal 1\n2. Goal 2\n\n## Requirements\n### Functional\n- Requirement 1\n\n### Non-Functional\n- Performance\n- Security\n\n## Out of Scope\n- Item 1\n\n## Timeline\n\n## Stakeholders\n`,
  'Meeting Notes': `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n**Agenda:** \n\n## Discussion\n\n## Decisions\n- Decision 1\n\n## Action Items\n- [ ] Owner: Task\n\n## Next Meeting\n`,
};

export default function WorkspacePage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: workspaces, isLoading, error } = trpc.workspace.list.useQuery();
  const createMutation = trpc.workspace.create.useMutation();
  const updateMutation = trpc.workspace.update.useMutation();
  const deleteMutation = trpc.workspace.delete.useMutation();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = workspaces?.find(w => w.id === activeId);

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && activeId === null) {
      setActiveId(workspaces[0].id);
    }
  }, [workspaces, activeId]);

  useEffect(() => {
    if (activeDoc) {
      const contentData = activeDoc.contentJson as { content?: string } | null;
      setEditContent(contentData?.content ?? '');
      setEditTitle(activeDoc.title);
      setIsEditing(false);
    }
  }, [activeDoc?.id]);

  // Auto-save with debounce
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSave = useCallback(async (id: number, title: string, content: string) => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateMutation.mutateAsync({
          id,
          title,
          contentJson: { content },
        });
        setLastSaved(new Date());
        utils.workspace.list.invalidate();
      } catch {
        // silent
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [updateMutation, utils]);

  const handleContentChange = (val: string) => {
    setEditContent(val);
    if (activeId) autoSave(activeId, editTitle, val);
  };

  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    if (activeId) autoSave(activeId, val, editContent);
  };

  const createDoc = async (type: 'document' | 'notebook', templateContent?: string) => {
    const title = `Untitled ${type === 'notebook' ? 'Notebook' : 'Document'}`;
    const content = templateContent ?? `# ${title}\n\nStart writing...`;
    try {
      const result = await createMutation.mutateAsync({
        title,
        contentJson: { content, type },
      });
      await utils.workspace.list.invalidate();
      setActiveId(result.id);
      setEditContent(content);
      setEditTitle(title);
      setIsEditing(true);
    } catch {
      toast({ title: 'Failed to create document', variant: 'destructive' });
    }
  };

  const deleteDoc = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.workspace.list.invalidate();
      if (activeId === id) {
        const remaining = workspaces?.filter(w => w.id !== id) ?? [];
        setActiveId(remaining[0]?.id ?? null);
      }
    } catch {
      toast({ title: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newContent = editContent.substring(0, start) + text + editContent.substring(end);
    setEditContent(newContent);
    if (activeId) autoSave(activeId, editTitle, newContent);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#000000' }}>
        <div className="flex items-center gap-3" style={{ color: '#94A3B8' }}>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4" style={{ background: '#000000', color: '#B5B5B5' }}>
        <AlertCircle className="h-8 w-8" style={{ color: '#F43F5E' }} />
        <p className="text-sm">Failed to load workspace</p>
        <Button size="sm" onClick={() => utils.workspace.list.invalidate()} className="gap-2" style={{ background: '#141414', color: '#B5B5B5' }}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Document List Sidebar */}
      <div
        className="w-72 border-r flex flex-col"
        style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
      >
        <div className="p-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1 text-xs h-8"
              style={{ background: '#3B82F6', color: '#fff' }}
              onClick={() => createDoc('document')}
              disabled={createMutation.isPending}
            >
              <Plus className="h-3 w-3" />
              New Doc
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1 text-xs h-8"
              style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8', background: 'transparent' }}
              onClick={() => createDoc('notebook')}
              disabled={createMutation.isPending}
            >
              <FilePlus className="h-3 w-3" />
              Notebook
            </Button>
          </div>
        </div>

        <div className="mx-3 mb-2" style={{ height: 1, background: 'rgba(148, 163, 184, 0.1)' }} />

        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            <div className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: '#64748B' }}>
              Documents ({workspaces?.length ?? 0})
            </div>

            {(!workspaces || workspaces.length === 0) && (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: '#334155' }} />
                <p className="text-xs" style={{ color: '#64748B' }}>No documents yet</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>Create your first document above</p>
              </div>
            )}

            {workspaces?.map(doc => {
              const contentData = doc.contentJson as { type?: string } | null;
              const docType = contentData?.type ?? 'document';
              return (
                <div
                  key={doc.id}
                  onClick={() => setActiveId(doc.id)}
                  className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer group mb-0.5"
                  style={{
                    background: activeId === doc.id ? '#1A1A1A' : 'transparent',
                    borderLeft: activeId === doc.id ? '2px solid #3B82F6' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (activeId !== doc.id) e.currentTarget.style.background = '#141414'; }}
                  onMouseLeave={e => { if (activeId !== doc.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <FileText
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: docType === 'notebook' ? '#8B5CF6' : '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate" style={{ color: activeId === doc.id ? '#F1F5F9' : '#94A3B8' }}>
                      {doc.title}
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#64748B' }}>
                      <Clock className="h-2.5 w-2.5" />
                      {formatDate(doc.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteDoc(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" style={{ color: '#64748B' }} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Templates */}
          <div className="px-3 py-2 border-t mt-2" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
            <div className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: '#64748B' }}>Templates</div>
            {Object.keys(TEMPLATES).map(name => (
              <button
                key={name}
                onClick={() => createDoc('document', TEMPLATES[name])}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs mb-0.5"
                style={{ color: '#94A3B8' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#243447'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <FileText className="h-3.5 w-3.5" style={{ color: '#475569' }} />
                {name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Document Editor/Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#000000' }}>
        {activeDoc ? (
          <>
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ background: '#1A1A1A', borderColor: '#2D2D2D' }}
            >
              <div className="flex items-center gap-3 flex-1">
                <Input
                  value={editTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  className="h-8 text-sm font-medium border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-80"
                  style={{ color: '#F1F5F9' }}
                  placeholder="Document title..."
                />
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </div>
                )}
                {!isSaving && lastSaved && (
                  <span className="text-xs" style={{ color: '#475569' }}>
                    Saved {formatDate(lastSaved)}
                  </span>
                )}
                {!isEditing ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="gap-1 text-xs"
                    style={{ color: '#94A3B8' }}
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!activeId) return;
                      setIsSaving(true);
                      try {
                        await updateMutation.mutateAsync({
                          id: activeId,
                          title: editTitle,
                          contentJson: { content: editContent },
                        });
                        setLastSaved(new Date());
                        utils.workspace.list.invalidate();
                        setIsEditing(false);
                        toast({ title: 'Document saved' });
                      } catch {
                        toast({ title: 'Save failed', variant: 'destructive' });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="gap-1 text-xs"
                    style={{ background: '#10B981', color: '#fff' }}
                    disabled={isSaving}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                )}
              </div>
            </div>

            {/* Formatting Toolbar */}
            {isEditing && (
              <div
                className="flex items-center gap-1 px-4 py-1.5 border-b flex-wrap"
                style={{ background: '#0F172A', borderColor: 'rgba(148, 163, 184, 0.1)' }}
              >
                {TOOLBAR_TOOLS.map((tool, i) => (
                  <button
                    key={i}
                    onClick={() => insertAtCursor(tool.insert)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: '#94A3B8' }}
                    title={tool.label}
                    onMouseEnter={e => { e.currentTarget.style.background = '#243447'; e.currentTarget.style.color = '#F1F5F9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                  >
                    {tool.icon}
                  </button>
                ))}
                <div className="ml-auto text-xs" style={{ color: '#475569' }}>
                  {editContent.length.toLocaleString()} chars · {editContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </div>
              </div>
            )}

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto py-10 px-10">
                {isEditing ? (
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={e => handleContentChange(e.target.value)}
                    className="w-full min-h-[600px] bg-transparent outline-none resize-none font-mono text-sm leading-relaxed"
                    style={{ color: '#F1F5F9', caretColor: '#3B82F6' }}
                    placeholder="Start writing in Markdown..."
                    spellCheck={false}
                  />
                ) : (
                  <div
                    className="prose prose-invert max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(editContent || '') }}
                  />
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: '#64748B' }}>
            <FileText className="h-12 w-12" style={{ color: '#1E293B' }} />
            <div className="text-center">
              <p className="text-sm font-medium mb-1" style={{ color: '#475569' }}>No document selected</p>
              <p className="text-xs" style={{ color: '#334155' }}>Create a new document or select one from the sidebar</p>
            </div>
            <Button
              size="sm"
              onClick={() => createDoc('document')}
              className="gap-2"
              style={{ background: '#3B82F6', color: '#fff' }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

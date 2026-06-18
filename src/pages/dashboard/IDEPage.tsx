import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Save,
  Share2,
  ChevronDown,
  X,
  FileCode,
  FileText,
  Plus,
  Terminal,
  CircleDot,
  Loader2,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Download,
  Settings2,
  GripHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/providers/trpc';

interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
  saved: boolean;
}

const STORAGE_KEY = 'ide_files_v2';

const pythonContent = `# Data Analysis Script
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load sample data
data = {
    'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    'revenue': [120000, 135000, 148000, 162000, 155000, 178000],
    'expenses': [95000, 102000, 110000, 118000, 115000, 125000],
    'customers': [1200, 1350, 1480, 1620, 1580, 1750]
}

df = pd.DataFrame(data)
df['profit'] = df['revenue'] - df['expenses']
df['margin'] = (df['profit'] / df['revenue'] * 100).round(2)

# Summary statistics
print("=== Revenue Analysis ===")
print(f"Total Revenue: USD {df['revenue'].sum():,}")
print(f"Total Profit: USD {df['profit'].sum():,}")
print(f"Avg Margin: {df['margin'].mean():.1f}%")
print(f"Top Month: {df.loc[df['profit'].idxmax(), 'month']}")
print(f"Peak Profit: USD {df['profit'].max():,}")
`;

const sqlContent = `-- Revenue Analysis Query
SELECT
    region,
    product_line,
    SUM(revenue) as total_revenue,
    SUM(profit) as total_profit,
    ROUND(AVG(margin_pct), 2) as avg_margin,
    COUNT(*) as transaction_count
FROM sales_data
WHERE date >= '2024-01-01'
  AND status = 'completed'
GROUP BY region, product_line
HAVING SUM(revenue) > 50000
ORDER BY total_revenue DESC
LIMIT 100;
`;

const rContent = `# Linear Regression Model
library(ggplot2)

# Load data
data <- read.csv("sales_data.csv")

# Build model
model <- lm(revenue ~ marketing_spend + customer_count + season,
            data = data)

# Summary
print(summary(model))

# Predictions
new_data <- data.frame(
  marketing_spend = c(50000, 75000, 100000),
  customer_count  = c(1000, 1500, 2000),
  season          = c("Q1", "Q2", "Q3")
)

predictions <- predict(model, newdata = new_data)
print(predictions)
`;

const jsContent = `// Async Data Processing Pipeline
const pipeline = async (data) => {
  const results = await Promise.all(
    data.map(async (record) => {
      const enriched = await enrich(record);
      const scored = score(enriched);
      return scored;
    })
  );
  return results.filter(r => r.score > 0.8);
};

// Mock data
const sampleData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  value: Math.random() * 100,
  category: ['A', 'B', 'C'][i % 3],
}));

console.log('Processing', sampleData.length, 'records...');
// pipeline(sampleData).then(r => console.log('Done:', r.length, 'results'));
console.log('Pipeline ready. Call pipeline(sampleData) to run.');
`;

const defaultFiles: FileItem[] = [
  { id: 'py-1', name: 'analysis.py', content: pythonContent, language: 'python', saved: true },
  { id: 'sql-1', name: 'query.sql', content: sqlContent, language: 'sql', saved: true },
  { id: 'r-1', name: 'model.r', content: rContent, language: 'r', saved: true },
  { id: 'js-1', name: 'pipeline.js', content: jsContent, language: 'javascript', saved: true },
];

const languageOptions = [
  { value: 'python', label: 'Python', ext: '.py', color: 'var(--ds-accent)' },
  { value: 'sql', label: 'SQL', ext: '.sql', color: 'var(--ds-success)' },
  { value: 'r', label: 'R', ext: '.r', color: 'var(--ds-warning)' },
  { value: 'javascript', label: 'JavaScript', ext: '.js', color: 'var(--ds-warning)' },
  { value: 'typescript', label: 'TypeScript', ext: '.ts', color: 'var(--ds-accent)' },
  { value: 'markdown', label: 'Markdown', ext: '.md', color: 'var(--ds-text-muted)' },
];

const MOCK_OUTPUTS: Record<string, string> = {
  python: `=== Revenue Analysis ===
Total Revenue: USD 898,000
Total Profit: USD 183,000
Avg Margin: 20.4%
Top Month: Jun
Peak Profit: USD 53,000

Process completed in 1.24s
Exit code: 0`,
  sql: `region    | product_line  | total_revenue | total_profit | avg_margin | tx_count
----------|---------------|---------------|--------------|------------|----------
North     | Electronics   | USD 245,000   | USD 73,500   | 30.00      | 45
West      | Software      | USD 198,000   | USD 59,400   | 30.00      | 38
South     | Services      | USD 156,000   | USD 31,200   | 20.00      | 29
East      | Electronics   | USD 134,000   | USD 26,800   | 20.00      | 25

4 rows returned in 450ms`,
  r: `Call: lm(formula = revenue ~ marketing_spend + customer_count + season)

Residuals: Min -2450, 1Q -678, Median 123, 3Q 890, Max 3120

Coefficients:
  (Intercept)        5234.1   p: 0.000123 ***
  marketing_spend       2.45  p: < 2e-16  ***
  customer_count       45.23  p: < 2e-16  ***
  seasonQ2           1234.5   p: 0.034    *
  seasonQ3           3456.7   p: 2.45e-6  ***

R-squared: 0.9234, Adj R-squared: 0.9201
F-statistic: 282.3 on 4 and 95 DF, p-value: < 2.2e-16`,
  javascript: `Processing 1000 records...
Pipeline ready. Call pipeline(sampleData) to run.

Exit code: 0`,
  typescript: `Compiled successfully.
No type errors found.

Exit code: 0`,
  markdown: `Rendered: 1 document

Exit code: 0`,
};

function loadFiles(): FileItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return defaultFiles;
}

function saveFiles(files: FileItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch { /* ignore */ }
}

export default function IDEPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>(loadFiles);
  const [activeFileId, setActiveFileId] = useState(() => {
    const stored = loadFiles();
    return stored[0]?.id ?? 'py-1';
  });
  const [outputLines, setOutputLines] = useState<{ text: string; type: 'out' | 'err' | 'info' }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copiedOutput, setCopiedOutput] = useState(false);
  const editorRef = useRef<Parameters<Parameters<typeof Editor>[0]['onMount']>[0] | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHRef = useRef(0);

  const executeCodeMutation = trpc.code.execute.useMutation();

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Persist files to localStorage on every change
  useEffect(() => {
    saveFiles(files);
  }, [files]);

  // Scroll output to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    setFiles(prev =>
      prev.map(f => f.id === activeFileId ? { ...f, content: value, saved: false } : f)
    );
  }, [activeFileId]);

  const handleSave = useCallback(() => {
    setFiles(prev =>
      prev.map(f => f.id === activeFileId ? { ...f, saved: true } : f)
    );
    toast({ title: 'File saved', description: activeFile.name });
  }, [activeFileId, activeFile?.name, toast]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalOpen(true);
    setOutputLines([{ text: `Running ${activeFile.name}...`, type: 'info' }]);

    await new Promise(r => setTimeout(r, 300));
    setOutputLines(prev => [...prev, { text: `> [${new Date().toLocaleTimeString()}]`, type: 'info' }]);

    try {
      // For SQL, show a message
      if (activeFile.language === 'sql') {
        await new Promise(r => setTimeout(r, 500));
        setOutputLines(prev => [...prev, {
          text: 'SQL execution requires database connection',
          type: 'info',
        }]);
        setIsRunning(false);
        return;
      }

      // Call the backend to execute the code
      const result = await executeCodeMutation.mutateAsync({
        code: activeFile.content,
        language: activeFile.language as "python" | "javascript" | "sql" | "r",
      });

      // Display output
      const allOutput = (result.stdout + (result.stderr ? '\n' + result.stderr : '')).trim();
      
      if (allOutput) {
        const lines = allOutput.split('\n');
        for (let i = 0; i < lines.length; i++) {
          await new Promise(r => setTimeout(r, 40));
          setOutputLines(prev => [...prev, {
            text: lines[i],
            type: lines[i].toLowerCase().includes('error') ? 'err' : 'out',
          }]);
        }
      } else if (result.exitCode === 0) {
        // No output but success
        setOutputLines(prev => [...prev, {
          text: '(No output)',
          type: 'info',
        }]);
      }

      // Only show exit code if there's an error
      if (result.exitCode !== 0) {
        await new Promise(r => setTimeout(r, 100));
        setOutputLines(prev => [...prev, {
          text: `Exit code: ${result.exitCode}`,
          type: 'err',
        }]);
      }
    } catch (error: any) {
      setOutputLines(prev => [...prev, {
        text: `Error: ${error.message}`,
        type: 'err',
      }]);
    }

    setIsRunning(false);
  }, [isRunning, activeFile, executeCodeMutation]);

  // Keyboard shortcut: Ctrl+Enter (or Cmd+Enter on Mac) to run code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  const addNewFile = (lang = 'python') => {
    const opt = languageOptions.find(l => l.value === lang);
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: `untitled${opt?.ext ?? '.py'}`,
      content: `# New ${opt?.label ?? 'file'}\n`,
      language: lang,
      saved: false,
    };
    setFiles(prev => {
      const updated = [...prev, newFile];
      saveFiles(updated);
      return updated;
    });
    setActiveFileId(newFile.id);
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (activeFileId === id && newFiles.length > 0) setActiveFileId(newFiles[0].id);
      saveFiles(newFiles);
      return newFiles;
    });
  };

  const startRename = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRenaming(file.id);
    setRenameValue(file.name);
  };

  const confirmRename = (id: string) => {
    if (renameValue.trim()) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: renameValue.trim() } : f));
    }
    setIsRenaming(null);
  };

  const downloadFile = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyOutput = () => {
    const text = outputLines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    });
  };

  // Draggable terminal resize
  const onMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartHRef.current = terminalHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = dragStartYRef.current - e.clientY;
      setTerminalHeight(Math.max(100, Math.min(500, dragStartHRef.current + delta)));
    };
    const onUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const langColor = languageOptions.find(l => l.value === activeFile?.language)?.color ?? 'var(--ds-text-muted)';

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ds-editor)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1.5 text-white text-xs h-8"
            style={{ background: 'var(--ds-success)' }}
            title="Run code (Ctrl+Enter)"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>

          <div className="w-px h-5 mx-0.5" style={{ background: 'rgba(148,163,184,0.1)' }} />

          {/* Language picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" style={{ color: 'var(--ds-text-dim)' }}>
                <CircleDot className="h-3.5 w-3.5" style={{ color: langColor }} />
                <span>{languageOptions.find(l => l.value === activeFile?.language)?.label ?? 'Python'}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border)' }}>
              {languageOptions.map(lang => (
                <DropdownMenuItem
                  key={lang.value}
                  onClick={() => setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang.value } : f))}
                  className="gap-2 text-xs"
                  style={{ color: '#94A3B8' }}
                >
                  <CircleDot className="h-3 w-3" style={{ color: lang.color }} />
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 mx-0.5" style={{ background: 'rgba(148,163,184,0.1)' }} />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="gap-1.5 text-xs h-8"
            style={{ color: '#94A3B8' }}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={downloadFile}
            className="gap-1.5 text-xs h-8"
            style={{ color: '#94A3B8' }}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-8"
            style={{ color: '#94A3B8' }}
            onClick={() => toast({ title: 'Share link copied!', description: 'Send this file to your team.' })}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!activeFile?.saved && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ds-warning)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ds-warning)' }} />
              Unsaved
            </span>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* File Explorer */}
        <div
          className="w-52 border-r flex flex-col flex-shrink-0"
          style={{ background: 'var(--ds-sidebar)', borderColor: 'var(--ds-border-subtle)' }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: 'var(--ds-border-subtle)' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-dim)' }}>Explorer</span>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="New file">
                    <Plus className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ background: 'var(--ds-sidebar)', borderColor: 'var(--ds-border-subtle)' }}>
                  {languageOptions.map(l => (
                    <DropdownMenuItem
                      key={l.value}
                      onClick={() => addNewFile(l.value)}
                      className="gap-2 text-xs"
                      style={{ color: '#94A3B8' }}
                    >
                      <CircleDot className="h-3 w-3" style={{ color: l.color }} />
                      {l.label} ({l.ext})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  if (confirm('Reset all files to defaults?')) {
                    setFiles(defaultFiles);
                    setActiveFileId(defaultFiles[0].id);
                  }
                }}
                title="Reset to defaults"
              >
                <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="py-1">
              {files.map(file => {
                const langOpt = languageOptions.find(l => l.value === file.language);
                return (
                  <div key={file.id}>
                    {isRenaming === file.id ? (
                      <div className="px-2 py-1">
                        <Input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => confirmRename(file.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') confirmRename(file.id);
                            if (e.key === 'Escape') setIsRenaming(null);
                          }}
                          autoFocus
                          className="h-6 text-xs"
                        style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => setActiveFileId(file.id)}
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer group text-left"
                        style={{
                          background: activeFileId === file.id ? 'var(--ds-sidebar)' : 'transparent',
                          borderLeft: activeFileId === file.id ? '2px solid var(--ds-accent)' : '2px solid transparent',
                        }}
                        onMouseEnter={e => { if (activeFileId !== file.id) e.currentTarget.style.background = 'var(--ds-hover)'; }}
                        onMouseLeave={e => { if (activeFileId !== file.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <FileCode className="h-4 w-4 flex-shrink-0" style={{ color: langOpt?.color ?? 'var(--ds-text-dim)' }} />
                        <span
                          className="text-xs flex-1 truncate"
                        style={{ color: activeFileId === file.id ? 'var(--ds-text)' : 'var(--ds-text-muted)' }}
                        >
                          {file.name}
                          {!file.saved && <span style={{ color: 'var(--ds-warning)' }}> •</span>}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={e => startRename(file, e)}
                            className="p-0.5 rounded hover:bg-white/10"
                            title="Rename"
                          >
                            <Settings2 className="h-3 w-3" style={{ color: 'var(--ds-text-dim)' }} />
                          </button>
                          <button
                            onClick={e => deleteFile(file.id, e)}
                            className="p-0.5 rounded hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" style={{ color: 'var(--ds-text-dim)' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* File info */}
          {activeFile && (
            <div
              className="px-3 py-2 border-t text-xs"
              style={{ borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text-dim)' }}
            >
              <div>{activeFile.content.split('\n').length} lines</div>
              <div>{new Blob([activeFile.content]).size} bytes</div>
            </div>
          )}
        </div>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Monaco Editor */}
          <div style={{ flex: '1 1 auto', minHeight: 0 }}>
            {activeFile && (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontLigatures: true,
                  minimap: { enabled: true, scale: 1 },
                  lineNumbers: 'on',
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  autoIndent: 'full',
                  tabSize: 4,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  renderLineHighlight: 'all',
                  suggestOnTriggerCharacters: true,
                  formatOnPaste: true,
                  formatOnType: false,
                }}
                onMount={editor => {
                  editorRef.current = editor;
                  // Ctrl+S to save
                  editor.addCommand(2048 | 49 /* S */, () => handleSave());
                  // Ctrl+Enter to run
                  editor.addCommand(2048 | 3 /* Enter */, () => handleRun());
                }}
              />
            )}
          </div>

          {/* Resize handle */}
          {terminalOpen && (
            <div
              className="flex items-center justify-center border-t border-b flex-shrink-0 cursor-row-resize select-none"
              style={{ height: 8, background: 'var(--ds-editor)', borderColor: 'var(--ds-border-subtle)', zIndex: 10 }}
              onMouseDown={onMouseDown}
            >
              <GripHorizontal className="h-3 w-3" style={{ color: 'var(--ds-text-dim)' }} />
            </div>
          )}

          {/* Terminal */}
          <div
            className="border-t flex flex-col flex-shrink-0"
            style={{
              height: terminalOpen ? terminalHeight : 34,
              background: 'var(--ds-editor)',
              borderColor: 'var(--ds-border-subtle)',
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center justify-between px-4 border-b flex-shrink-0"
              style={{ height: 34, borderColor: 'var(--ds-border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTerminalOpen(!terminalOpen)}
                  className="flex items-center gap-2"
                >
                  <Terminal className="h-3.5 w-3.5" style={{ color: 'var(--ds-success)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--ds-text-dim)' }}>TERMINAL</span>
                </button>
                {isRunning && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--ds-success)' }} />
                    <span className="text-xs" style={{ color: 'var(--ds-success)' }}>Running</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 gap-1 text-xs"
                  onClick={copyOutput}
                  style={{ color: '#64748B' }}
                  title="Copy output"
                >
                  {copiedOutput
                    ? <Check className="h-3 w-3" style={{ color: 'var(--ds-success)' }} />
                    : <Copy className="h-3 w-3" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setOutputLines([])}
                  style={{ color: '#64748B' }}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setTerminalOpen(!terminalOpen)}
                >
                  <X className="h-3 w-3" style={{ color: 'var(--ds-text-dim)' }} />
                </Button>
              </div>
            </div>

            {/* Terminal output */}
            {terminalOpen && (
              <ScrollArea style={{ flex: 1 }}>
                <div className="p-3 font-mono text-xs leading-5" style={{ minHeight: terminalHeight - 34 }}>
                  {outputLines.length === 0 && (
                    <span style={{ color: 'var(--ds-text-dim)' }}>
                      Terminal ready. Press Ctrl+Enter or click Run to execute.
                    </span>
                  )}
                  {outputLines.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color: line.type === 'err' ? 'var(--ds-error)' : line.type === 'info' ? 'var(--ds-text-dim)' : 'var(--ds-success)',
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {line.text}
                    </div>
                  ))}
                  <div ref={outputEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

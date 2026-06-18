import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { trpc } from '@/providers/trpc';
import {
  Play,
  Save,
  ChevronDown,
  ChevronRight,
  Table,
  Clock,
  Rows3,
  CheckCircle2,
  AlertCircle,
  Star,
  History,
  FileText,
  Download,
  Trash2,
  Plus,
  Loader2,
  Database,
  Copy,
  Check,
  AlignLeft,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  message?: string;
}

interface HistoryEntry {
  query: string;
  time: string;
  duration: number;
  success: boolean;
}

const SCHEMA_TABLES = [
  {
    name: 'sales_data',
    rowCount: '125K rows',
    columns: [
      { name: 'id', type: 'INT', key: true },
      { name: 'date', type: 'DATE' },
      { name: 'region', type: 'VARCHAR(50)' },
      { name: 'product_line', type: 'VARCHAR(100)' },
      { name: 'revenue', type: 'DECIMAL(12,2)' },
      { name: 'profit', type: 'DECIMAL(12,2)' },
      { name: 'margin_pct', type: 'DECIMAL(5,2)' },
      { name: 'quantity', type: 'INT' },
    ],
  },
  {
    name: 'customers',
    rowCount: '8,980 rows',
    columns: [
      { name: 'id', type: 'INT', key: true },
      { name: 'name', type: 'VARCHAR(200)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'tier', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'region', type: 'VARCHAR(50)' },
      { name: 'ltv', type: 'DECIMAL(10,2)' },
    ],
  },
  {
    name: 'products',
    rowCount: '342 rows',
    columns: [
      { name: 'id', type: 'INT', key: true },
      { name: 'name', type: 'VARCHAR(200)' },
      { name: 'category', type: 'VARCHAR(100)' },
      { name: 'price', type: 'DECIMAL(10,2)' },
      { name: 'stock', type: 'INT' },
      { name: 'sku', type: 'VARCHAR(50)' },
    ],
  },
  {
    name: 'orders',
    rowCount: '45K rows',
    columns: [
      { name: 'id', type: 'INT', key: true },
      { name: 'customer_id', type: 'INT' },
      { name: 'product_id', type: 'INT' },
      { name: 'quantity', type: 'INT' },
      { name: 'total', type: 'DECIMAL(12,2)' },
      { name: 'status', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
];

const DEFAULT_QUERY = `SELECT
  region,
  SUM(revenue) AS total_revenue,
  SUM(profit) AS total_profit,
  ROUND(AVG(margin_pct), 2) AS avg_margin,
  COUNT(*) AS transactions
FROM sales_data
WHERE date >= '2024-01-01'
GROUP BY region
ORDER BY total_revenue DESC;`;

function exportCSV(columns: string[], rows: Record<string, unknown>[]) {
  const header = columns.join(',');
  const lines = rows.map(row =>
    columns.map(col => {
      const val = String(row[col] ?? '');
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `query_result_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SQLWorkbenchPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: savedQueries, isLoading: savedLoading } = trpc.sql.list.useQuery();
  const executeMutation = trpc.sql.execute.useMutation();
  const createMutation = trpc.sql.create.useMutation();
  const deleteMutation = trpc.sql.delete.useMutation();

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTables, setExpandedTables] = useState<string[]>(['sales_data']);
  const [activeTab, setActiveTab] = useState<'results' | 'history' | 'saved'>('results');
  const [queryHistory, setQueryHistory] = useState<HistoryEntry[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const filteredTables = SCHEMA_TABLES.filter(t =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const toggleTable = (name: string) => {
    setExpandedTables(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleRun = useCallback(async () => {
    if (!query.trim() || isRunning) return;
    setIsRunning(true);
    setActiveTab('results');
    const startTime = Date.now();
    try {
      const res = await executeMutation.mutateAsync({ query });
      const duration = Date.now() - startTime;
      if (res.success) {
        setResult({
          columns: res.columns,
          rows: res.rows,
          rowCount: res.rowCount,
          executionTime: res.executionTime,
          message: res.message,
        });
        setQueryHistory(prev => [{
          query,
          time: new Date().toLocaleTimeString(),
          duration: res.executionTime,
          success: true,
        }, ...prev].slice(0, 100));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Query execution failed';
      setResult({ columns: [], rows: [], rowCount: 0, executionTime: 0, message: `Error: ${msg}` });
      setQueryHistory(prev => [{
        query,
        time: new Date().toLocaleTimeString(),
        duration: Date.now() - startTime,
        success: false,
      }, ...prev].slice(0, 100));
    } finally {
      setIsRunning(false);
    }
  }, [query, isRunning, executeMutation]);

  const handleSaveQuery = async () => {
    if (!saveName.trim()) return;
    try {
      await createMutation.mutateAsync({ name: saveName, queryText: query, description: saveDesc });
      utils.sql.list.invalidate();
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDesc('');
      toast({ title: 'Query saved successfully' });
    } catch {
      toast({ title: 'Failed to save query', variant: 'destructive' });
    }
  };

  const handleDeleteSaved = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync({ id });
      utils.sql.list.invalidate();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const formatQuery = () => {
    // Basic SQL formatter: uppercase keywords, add newlines
    const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'AND', 'OR', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'];
    let formatted = query;
    keywords.forEach(kw => {
      formatted = formatted.replace(new RegExp(`\\b${kw}\\b`, 'gi'), kw);
    });
    setQuery(formatted);
  };

  const copyCellValue = (val: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopiedCell(val);
      setTimeout(() => setCopiedCell(null), 1500);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
            style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.2)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
            <Database className="h-3 w-3" />
            <span>User Warehouse</span>
            <ChevronDown className="h-3 w-3" />
          </div>
          <div
            className="text-xs px-2 py-1 rounded font-mono"
            style={{ background: '#1E293B', color: '#64748B' }}
          >
            schema: public
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={formatQuery}
            style={{ color: '#94A3B8' }}
            title="Format SQL"
          >
            <AlignLeft className="h-3.5 w-3.5" />
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setShowSaveDialog(true)}
            style={{ color: '#94A3B8' }}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1.5 text-white text-xs"
            style={{ background: '#10B981' }}
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <div className="text-xs px-2 py-1 rounded" style={{ background: '#1E293B', color: '#475569' }}>
            <Keyboard className="h-3 w-3 inline mr-1" />
            Ctrl+Enter
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schema Browser */}
        <div
          className="w-60 border-r flex flex-col flex-shrink-0"
          style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
            <Input
              placeholder="Search tables & columns..."
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              className="h-7 text-xs"
              style={{ background: '#1E293B', borderColor: 'rgba(148, 163, 184, 0.2)', color: '#F1F5F9' }}
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="px-2 py-2">
              <div className="text-xs font-medium mb-2 px-2 uppercase tracking-wide" style={{ color: '#64748B' }}>
                Tables ({filteredTables.length})
              </div>
              {filteredTables.map(table => (
                <div key={table.name}>
                  <button
                    onClick={() => toggleTable(table.name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left mb-0.5"
                    style={{ color: '#F1F5F9' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#243447'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {expandedTables.includes(table.name)
                      ? <ChevronDown className="h-3 w-3" style={{ color: '#64748B' }} />
                      : <ChevronRight className="h-3 w-3" style={{ color: '#64748B' }} />
                    }
                    <Table className="h-3.5 w-3.5" style={{ color: '#10B981' }} />
                    <span className="text-xs flex-1">{table.name}</span>
                    <span className="text-xs" style={{ color: '#334155' }}>{table.rowCount}</span>
                  </button>
                  {expandedTables.includes(table.name) && (
                    <div className="ml-5 mb-1">
                      {table.columns.map(col => (
                        <div
                          key={col.name}
                          className="flex items-center gap-2 px-2 py-0.5 rounded cursor-pointer"
                          onClick={() => setQuery(prev => prev + `\n-- ${col.name} (${col.type})`)}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          style={{ color: '#94A3B8' }}
                        >
                          {col.key && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />}
                          {!col.key && <div className="w-1.5 h-1.5 flex-shrink-0" />}
                          <span className="text-xs">{col.name}</span>
                          <span className="text-xs ml-auto font-mono" style={{ color: '#475569', fontSize: 10 }}>{col.type}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => setQuery(`SELECT * FROM ${table.name} LIMIT 100;`)}
                        className="w-full text-left text-xs px-2 py-1 mt-1 rounded"
                        style={{ color: '#3B82F6' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        SELECT * FROM {table.name}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Saved Queries in sidebar */}
            <div className="px-2 py-2 border-t mt-2" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
              <div className="text-xs font-medium mb-2 px-2 uppercase tracking-wide" style={{ color: '#64748B' }}>
                Saved Queries
              </div>
              {savedLoading && <div className="flex justify-center py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#64748B' }} /></div>}
              {savedQueries?.map(sq => (
                <button
                  key={sq.id}
                  onClick={() => setQuery(sq.queryText)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left group mb-0.5"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#243447'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Star className="h-3 w-3 flex-shrink-0" style={{ color: '#F59E0B' }} />
                  <span className="text-xs flex-1 truncate">{sq.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleDeleteSaved(sq.id, e)}
                  >
                    <Trash2 className="h-3 w-3" style={{ color: '#64748B' }} />
                  </button>
                </button>
              ))}
              {!savedLoading && (!savedQueries || savedQueries.length === 0) && (
                <p className="text-xs px-2 py-2" style={{ color: '#334155' }}>No saved queries</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor & Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query Editor */}
          <div style={{ flex: '1 1 55%', minHeight: 0 }}>
            <Editor
              height="100%"
              language="sql"
              value={query}
              onChange={val => val !== undefined && setQuery(val)}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                folding: true,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                bracketPairColorization: { enabled: true },
                renderLineHighlight: 'line',
                suggestOnTriggerCharacters: true,
                wordBasedSuggestions: 'currentDocument',
              }}
              onMount={editor => {
                editor.addCommand(
                  // Ctrl+Enter
                  2048 | 3,
                  () => handleRun(),
                );
              }}
            />
          </div>

          {/* Results Panel */}
          <div
            className="border-t flex flex-col"
            style={{ borderColor: 'rgba(148, 163, 184, 0.1)', flex: '0 0 45%', minHeight: 180 }}
          >
            {/* Tabs */}
            <div
              className="flex items-center border-b px-4 flex-shrink-0"
              style={{ borderColor: 'rgba(148, 163, 184, 0.1)', background: '#151E32' }}
            >
              {[
                { id: 'results' as const, label: 'Results', icon: <Rows3 className="h-3.5 w-3.5" /> },
                { id: 'history' as const, label: `History (${queryHistory.length})`, icon: <History className="h-3.5 w-3.5" /> },
                { id: 'saved' as const, label: `Saved (${savedQueries?.length ?? 0})`, icon: <FileText className="h-3.5 w-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors"
                  style={{
                    color: activeTab === tab.id ? 'var(--ds-text)' : 'var(--ds-text-dim)',
                    borderBottom: activeTab === tab.id ? '2px solid var(--ds-accent)' : '2px solid transparent',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3">
                {result && activeTab === 'results' && (
                  <>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ds-text-dim)' }}>
                      <Clock className="h-3 w-3" />
                      {result.executionTime.toFixed(0)}ms
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>{result.rowCount.toLocaleString()} rows</span>
                    {result.columns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 gap-1 text-xs"
                        onClick={() => exportCSV(result.columns, result.rows)}
                        style={{ color: 'var(--ds-success)' }}
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1" style={{ background: 'var(--ds-editor)' }}>
              {activeTab === 'results' && (
                <div>
                  {result?.message && !result.columns.length && (
                    <div className="p-4 flex items-center gap-2">
                      {result.message.includes('Error')
                        ? <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#F43F5E' }} />
                        : <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#10B981' }} />
                      }
                      <span className="text-sm" style={{ color: result.message.includes('Error') ? '#F43F5E' : '#10B981' }}>
                        {result.message}
                      </span>
                    </div>
                  )}
                  {result && result.columns.length > 0 && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: '#1E293B' }}>
                          <th className="px-3 py-2 text-left font-medium w-10 sticky top-0" style={{ color: '#475569', background: '#1E293B', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>#</th>
                          {result.columns.map(col => (
                            <th
                              key={col}
                              className="text-left px-3 py-2 font-medium sticky top-0"
                              style={{ color: '#94A3B8', borderBottom: '1px solid rgba(148,163,184,0.2)', background: '#1E293B' }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.04)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#0F172A'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td className="px-3 py-1.5 select-none" style={{ color: '#334155' }}>{i + 1}</td>
                            {result.columns.map(col => {
                              const val = String(row[col] ?? '');
                              return (
                                <td
                                  key={col}
                                  className="px-3 py-1.5 cursor-pointer group relative"
                                  style={{ color: '#F1F5F9' }}
                                  onClick={() => copyCellValue(val)}
                                  title="Click to copy"
                                >
                                  {val}
                                  <span className="opacity-0 group-hover:opacity-100 ml-2 inline-flex">
                                    {copiedCell === val ? <Check className="h-2.5 w-2.5" style={{ color: '#10B981' }} /> : <Copy className="h-2.5 w-2.5" style={{ color: '#475569' }} />}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {!result && (
                    <div className="flex flex-col items-center justify-center py-12" style={{ color: '#64748B' }}>
                      <Rows3 className="h-8 w-8 mb-3" style={{ color: '#1E293B' }} />
                      <p className="text-sm">Run a query to see results</p>
                      <p className="text-xs mt-1" style={{ color: '#334155' }}>Press Ctrl+Enter or click Run</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="p-2">
                  {queryHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12" style={{ color: '#64748B' }}>
                      <History className="h-8 w-8 mb-3" style={{ color: '#1E293B' }} />
                      <p className="text-sm">Query history will appear here</p>
                    </div>
                  ) : (
                    queryHistory.map((h, i) => (
                      <div
                        key={i}
                        onClick={() => setQuery(h.query)}
                        className="p-2 rounded cursor-pointer mb-1"
                        style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#151E32'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {h.success
                            ? <CheckCircle2 className="h-3 w-3" style={{ color: '#10B981' }} />
                            : <AlertCircle className="h-3 w-3" style={{ color: '#F43F5E' }} />
                          }
                          <span className="text-xs" style={{ color: '#64748B' }}>{h.time}</span>
                          <span className="text-xs ml-auto" style={{ color: '#475569' }}>{h.duration.toFixed(0)}ms</span>
                        </div>
                        <pre className="text-xs font-mono truncate" style={{ color: '#94A3B8' }}>{h.query}</pre>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="p-4">
                  {!savedLoading && (!savedQueries || savedQueries.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-12" style={{ color: '#64748B' }}>
                      <Star className="h-8 w-8 mb-3" style={{ color: '#1E293B' }} />
                      <p className="text-sm">No saved queries</p>
                      <p className="text-xs mt-1" style={{ color: '#334155' }}>Click Save to store a query</p>
                    </div>
                  )}
                  {savedQueries?.map(sq => (
                    <div
                      key={sq.id}
                      onClick={() => setQuery(sq.queryText)}
                      className="p-3 rounded-lg mb-2 cursor-pointer"
                      style={{ background: '#151E32', border: '1px solid rgba(148, 163, 184, 0.1)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)'; }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />
                        <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{sq.name}</span>
                        <button
                          className="ml-auto p-1 rounded hover:bg-red-500/10"
                          onClick={e => handleDeleteSaved(sq.id, e)}
                        >
                          <Trash2 className="h-3 w-3" style={{ color: '#64748B' }} />
                        </button>
                      </div>
                      {sq.description && (
                        <p className="text-xs mb-2" style={{ color: '#64748B' }}>{sq.description}</p>
                      )}
                      <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#94A3B8' }}>{sq.queryText}</pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent style={{ background: '#151E32', border: '1px solid rgba(148,163,184,0.2)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#F1F5F9' }}>Save Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Query Name *</label>
              <Input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. Revenue by Region Q4"
                style={{ background: '#1E293B', borderColor: 'rgba(148,163,184,0.2)', color: '#F1F5F9' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Description (optional)</label>
              <Input
                value={saveDesc}
                onChange={e => setSaveDesc(e.target.value)}
                placeholder="What does this query do?"
                style={{ background: '#1E293B', borderColor: 'rgba(148,163,184,0.2)', color: '#F1F5F9' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Query Preview</label>
              <pre
                className="text-xs font-mono p-3 rounded-lg overflow-x-auto max-h-32"
                style={{ background: '#0B1120', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.1)' }}
              >
                {query.slice(0, 300)}{query.length > 300 ? '...' : ''}
              </pre>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)} style={{ color: '#94A3B8' }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveQuery}
                disabled={!saveName.trim() || createMutation.isPending}
                style={{ background: '#3B82F6', color: '#fff' }}
              >
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Save Query
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

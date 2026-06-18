import { useState } from 'react';
import {
  Database, Plus, Check, X, Loader2, Globe, FileSpreadsheet,
  Server, Plug, Eye, Trash2, RefreshCw, ChevronRight,
  Shield, Link2, AlertCircle, Wifi, WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/providers/trpc';

type ConnectionStatus = 'connected' | 'error' | 'idle' | 'testing';

interface DbConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'bigquery' | 'snowflake' | 'redshift' | 'mssql';
  host: string;
  port: string;
  database: string;
  username: string;
  status: ConnectionStatus;
  lastTested?: string;
}

interface SheetConnection {
  id: string;
  name: string;
  sheetUrl: string;
  sheetId: string;
  tab: string;
  status: ConnectionStatus;
  rows?: number;
  cols?: number;
  lastSync?: string;
}

const DB_TYPES = [
  { value: 'postgresql', label: 'PostgreSQL', color: '#336791', defaultPort: '5432' },
  { value: 'mysql',      label: 'MySQL',      color: '#00618A', defaultPort: '3306' },
  { value: 'mssql',      label: 'SQL Server', color: '#CC2927', defaultPort: '1433' },
  { value: 'mongodb',    label: 'MongoDB',    color: '#13AA52', defaultPort: '27017' },
  { value: 'bigquery',   label: 'BigQuery',   color: '#4285F4', defaultPort: '443' },
  { value: 'snowflake',  label: 'Snowflake',  color: '#29B5E8', defaultPort: '443' },
  { value: 'redshift',   label: 'Redshift',   color: '#8C4FFF', defaultPort: '5439' },
  { value: 'sqlite',     label: 'SQLite',     color: '#003B57', defaultPort: '' },
];

const STORAGE_KEY_DBS = 'datasuite_db_connections';
const STORAGE_KEY_SHEETS = 'datasuite_sheet_connections';

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function saveToStorage<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const map = {
    connected: { color: 'var(--ds-success)', label: 'Connected', Icon: Wifi },
    error:     { color: 'var(--ds-error)',   label: 'Error',     Icon: WifiOff },
    idle:      { color: 'var(--ds-text-dim)',label: 'Not tested', Icon: Plug },
    testing:   { color: 'var(--ds-warning)', label: 'Testing…',  Icon: Loader2 },
  };
  const { color, label, Icon } = map[status];
  return (
    <span className="flex items-center gap-1 text-[11px]" style={{ color }}>
      <Icon className={`h-3 w-3 ${status === 'testing' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}

export default function DataSourcesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'databases' | 'sheets' | 'api'>('databases');
  const [dbConnections, setDbConnections] = useState<DbConnection[]>(() =>
    loadFromStorage<DbConnection>(STORAGE_KEY_DBS, [])
  );
  const [sheetConnections, setSheetConnections] = useState<SheetConnection[]>(() =>
    loadFromStorage<SheetConnection>(STORAGE_KEY_SHEETS, [])
  );
  const [showDbDialog, setShowDbDialog] = useState(false);
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [previewConn, setPreviewConn] = useState<DbConnection | null>(null);

  const [dbForm, setDbForm] = useState({
    name: '', type: 'postgresql', host: '', port: '5432',
    database: '', username: '', password: '',
  });
  const [sheetForm, setSheetForm] = useState({ name: '', sheetUrl: '', tab: 'Sheet1', apiKey: '' });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null);

  const testConnectionMutation = trpc.datasources.testConnection.useMutation();
  const fetchSheetMutation = trpc.datasources.fetchGoogleSheet.useMutation();

  const saveDbConnections = (conns: DbConnection[]) => {
    // Strip passwords before saving
    const safe = conns.map(c => ({ ...c, password: '' }));
    saveToStorage(STORAGE_KEY_DBS, safe);
    setDbConnections(conns);
  };

  const addDbConnection = async () => {
    if (!dbForm.name || !dbForm.host || !dbForm.database) {
      toast({ title: 'Missing fields', description: 'Name, host and database are required.', variant: 'destructive' });
      return;
    }
    const newConn: DbConnection = {
      id: Date.now().toString(),
      name: dbForm.name,
      type: dbForm.type as DbConnection['type'],
      host: dbForm.host,
      port: dbForm.port,
      database: dbForm.database,
      username: dbForm.username,
      status: 'idle',
    };
    saveDbConnections([...dbConnections, newConn]);
    setShowDbDialog(false);
    setDbForm({ name: '', type: 'postgresql', host: '', port: '5432', database: '', username: '', password: '' });
    toast({ title: 'Connection saved', description: newConn.name });
  };

  const testConnection = async (conn: DbConnection) => {
    setTestingId(conn.id);
    setDbConnections(prev => prev.map(c => c.id === conn.id ? { ...c, status: 'testing' } : c));
    try {
      await testConnectionMutation.mutateAsync({
        type: conn.type,
        host: conn.host,
        port: parseInt(conn.port) || 5432,
        database: conn.database,
        username: conn.username,
        password: '',
      });
      setDbConnections(prev => prev.map(c => c.id === conn.id
        ? { ...c, status: 'connected', lastTested: new Date().toLocaleTimeString() } : c));
      toast({ title: `Connected to ${conn.name}` });
    } catch {
      setDbConnections(prev => prev.map(c => c.id === conn.id ? { ...c, status: 'error' } : c));
      toast({ title: 'Connection failed', description: 'Check your credentials and network.', variant: 'destructive' });
    }
    setTestingId(null);
  };

  const removeDbConnection = (id: string) => {
    saveDbConnections(dbConnections.filter(c => c.id !== id));
  };

  const addSheetConnection = async () => {
    if (!sheetForm.name || !sheetForm.sheetUrl) {
      toast({ title: 'Missing fields', description: 'Name and Sheet URL are required.', variant: 'destructive' });
      return;
    }

    // Extract sheet ID from URL
    const match = sheetForm.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match?.[1] ?? '';
    if (!sheetId) {
      toast({ title: 'Invalid URL', description: 'Could not extract Google Sheets ID from URL.', variant: 'destructive' });
      return;
    }

    const newConn: SheetConnection = {
      id: Date.now().toString(),
      name: sheetForm.name,
      sheetUrl: sheetForm.sheetUrl,
      sheetId,
      tab: sheetForm.tab,
      status: 'idle',
    };
    const updated = [...sheetConnections, newConn];
    saveToStorage(STORAGE_KEY_SHEETS, updated);
    setSheetConnections(updated);
    setShowSheetDialog(false);
    setSheetForm({ name: '', sheetUrl: '', tab: 'Sheet1', apiKey: '' });
    toast({ title: 'Sheet connected', description: newConn.name });
  };

  const fetchSheet = async (conn: SheetConnection) => {
    const updated = sheetConnections.map(c => c.id === conn.id ? { ...c, status: 'testing' as ConnectionStatus } : c);
    setSheetConnections(updated);
    try {
      const result = await fetchSheetMutation.mutateAsync({ sheetId: conn.sheetId, tab: conn.tab });
      setSheetConnections(prev => prev.map(c => c.id === conn.id ? {
        ...c, status: 'connected', rows: result.rows.length, cols: result.columns.length,
        lastSync: new Date().toLocaleTimeString()
      } : c));
      toast({ title: `Fetched ${result.rows.length} rows from ${conn.name}` });
    } catch (e: any) {
      setSheetConnections(prev => prev.map(c => c.id === conn.id ? { ...c, status: 'error' } : c));
      toast({ title: 'Failed to fetch sheet', description: e.message, variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'databases', label: 'Databases', icon: Database },
    { id: 'sheets',    label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'api',       label: 'REST / API',    icon: Globe },
  ] as const;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ds-editor)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0" style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--ds-text)' }}>Data Sources</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>
              Connect databases, Google Sheets, and APIs to use as data sources across your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'databases' && (
              <Button size="sm" className="gap-1.5 text-xs h-7" style={{ background: 'var(--ds-accent)', color: '#fff' }}
                onClick={() => setShowDbDialog(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Database
              </Button>
            )}
            {activeTab === 'sheets' && (
              <Button size="sm" className="gap-1.5 text-xs h-7" style={{ background: '#0F9D58', color: '#fff' }}
                onClick={() => setShowSheetDialog(true)}>
                <Plus className="h-3.5 w-3.5" /> Connect Sheet
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: activeTab === tab.id ? 'var(--ds-accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ds-accent)' : 'var(--ds-text-dim)',
                background: 'transparent',
              }}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5">

          {/* Databases Tab */}
          {activeTab === 'databases' && (
            <div className="space-y-3">
              {dbConnections.length === 0 ? (
                <EmptyState
                  icon={<Database className="h-8 w-8" />}
                  title="No database connections"
                  description="Connect PostgreSQL, MySQL, MongoDB, BigQuery, Snowflake and more."
                  action={<Button size="sm" style={{ background: 'var(--ds-accent)', color: '#fff' }} onClick={() => setShowDbDialog(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Database
                  </Button>}
                />
              ) : (
                dbConnections.map(conn => {
                  const dbType = DB_TYPES.find(t => t.value === conn.type);
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                      style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs text-white"
                        style={{ background: dbType?.color ?? '#444' }}
                      >
                        {dbType?.label?.slice(0, 2).toUpperCase() ?? 'DB'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>{conn.name}</span>
                          <StatusBadge status={conn.status} />
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ds-text-dim)' }}>
                          {dbType?.label} · {conn.host}{conn.port ? `:${conn.port}` : ''} · {conn.database}
                        </p>
                        {conn.lastTested && (
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>
                            Last tested: {conn.lastTested}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => testConnection(conn)}
                          disabled={testingId === conn.id}
                          className="text-xs h-7 gap-1"
                          style={{ color: 'var(--ds-text-dim)' }}
                        >
                          {testingId === conn.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />}
                          Test
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => removeDbConnection(conn.id)}
                          className="text-xs h-7 gap-1"
                          style={{ color: 'var(--ds-error)' }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Supported types */}
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'var(--ds-text-dim)' }}>Supported databases</p>
                <div className="flex flex-wrap gap-2">
                  {DB_TYPES.map(t => (
                    <div key={t.value} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded"
                      style={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-dim)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Google Sheets Tab */}
          {activeTab === 'sheets' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg flex items-start gap-3 mb-4"
                style={{ background: 'rgba(15, 157, 88, 0.06)', border: '1px solid rgba(15,157,88,0.2)' }}>
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#0F9D58' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: '#0F9D58' }}>Google Sheets Integration</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>
                    Connect public sheets directly or private sheets using your Google API key.
                    Set <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>GOOGLE_SHEETS_API_KEY</code> in environment settings.
                  </p>
                </div>
              </div>

              {sheetConnections.length === 0 ? (
                <EmptyState
                  icon={<FileSpreadsheet className="h-8 w-8" />}
                  title="No sheets connected"
                  description="Paste a Google Sheets URL to import data directly into your workspace."
                  action={<Button size="sm" style={{ background: '#0F9D58', color: '#fff' }} onClick={() => setShowSheetDialog(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Connect Sheet
                  </Button>}
                />
              ) : (
                sheetConnections.map(conn => (
                  <div key={conn.id} className="flex items-center gap-4 p-4 rounded-lg border"
                    style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(15,157,88,0.12)', border: '1px solid rgba(15,157,88,0.2)' }}>
                      <FileSpreadsheet className="h-4 w-4" style={{ color: '#0F9D58' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>{conn.name}</span>
                        <StatusBadge status={conn.status} />
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ds-text-dim)' }}>
                        Tab: {conn.tab}
                        {conn.rows !== undefined && ` · ${conn.rows.toLocaleString()} rows × ${conn.cols} cols`}
                      </p>
                      {conn.lastSync && (
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>Last sync: {conn.lastSync}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => fetchSheet(conn)}
                        className="text-xs h-7 gap-1" style={{ color: 'var(--ds-text-dim)' }}>
                        <RefreshCw className="h-3 w-3" /> Sync
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => { setSheetConnections(prev => prev.filter(c => c.id !== conn.id)); }}
                        className="text-xs h-7" style={{ color: 'var(--ds-error)' }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* REST API Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg flex items-start gap-3"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--ds-accent)' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--ds-accent)' }}>REST API / Webhook Sources</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>
                    Fetch data from any REST endpoint. Use in your IDE scripts with the <code>requests</code> (Python) or <code>fetch</code> (JS) library.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--ds-border-subtle)' }}>
                <div className="px-4 py-3 border-b" style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--ds-text)' }}>Example usage in Python</span>
                </div>
                <pre className="px-4 py-3 text-[12px] font-mono overflow-x-auto" style={{ background: '#0d1117', color: '#c9d1d9' }}>
{`import requests
import pandas as pd

# Fetch from any REST API
response = requests.get("https://api.example.com/data",
    headers={"Authorization": "Bearer YOUR_TOKEN"})
data = response.json()

# Convert to DataFrame
df = pd.DataFrame(data["results"])
print(df.head())
print(df.describe())`}
                </pre>
              </div>

              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--ds-border-subtle)' }}>
                <div className="px-4 py-3 border-b" style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--ds-text)' }}>Example usage in R</span>
                </div>
                <pre className="px-4 py-3 text-[12px] font-mono overflow-x-auto" style={{ background: '#0d1117', color: '#c9d1d9' }}>
{`library(httr)
library(jsonlite)

response <- GET("https://api.example.com/data",
  add_headers(Authorization = "Bearer YOUR_TOKEN"))

data <- fromJSON(content(response, "text"))
df <- as.data.frame(data$results)
summary(df)`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Database Dialog */}
      <Dialog open={showDbDialog} onOpenChange={setShowDbDialog}>
        <DialogContent className="sm:max-w-lg" style={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', color: 'var(--ds-text)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--ds-text)' }}>
              <Database className="h-4 w-4" style={{ color: 'var(--ds-accent)' }} />
              Add Database Connection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Connection name</label>
                <Input placeholder="My Database" value={dbForm.name} onChange={e => setDbForm(f => ({ ...f, name: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Database type</label>
                <Select value={dbForm.type} onValueChange={v => {
                  const t = DB_TYPES.find(d => d.value === v);
                  setDbForm(f => ({ ...f, type: v, port: t?.defaultPort ?? '' }));
                }}>
                  <SelectTrigger className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border)' }}>
                    {DB_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-xs" style={{ color: 'var(--ds-text)' }}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Host</label>
                <Input placeholder="db.example.com" value={dbForm.host} onChange={e => setDbForm(f => ({ ...f, host: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Port</label>
                <Input placeholder="5432" value={dbForm.port} onChange={e => setDbForm(f => ({ ...f, port: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Database name</label>
                <Input placeholder="analytics" value={dbForm.database} onChange={e => setDbForm(f => ({ ...f, database: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Username</label>
                <Input placeholder="admin" value={dbForm.username} onChange={e => setDbForm(f => ({ ...f, username: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Password</label>
                <Input type="password" placeholder="••••••••" value={dbForm.password} onChange={e => setDbForm(f => ({ ...f, password: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={() => setShowDbDialog(false)} style={{ color: 'var(--ds-text-dim)' }}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1 text-xs h-8" style={{ background: 'var(--ds-accent)', color: '#fff' }} onClick={addDbConnection}>
                Save Connection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Sheet Dialog */}
      <Dialog open={showSheetDialog} onOpenChange={setShowSheetDialog}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', color: 'var(--ds-text)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--ds-text)' }}>
              <FileSpreadsheet className="h-4 w-4" style={{ color: '#0F9D58' }} />
              Connect Google Sheet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Connection name</label>
              <Input placeholder="Sales Data Sheet" value={sheetForm.name} onChange={e => setSheetForm(f => ({ ...f, name: e.target.value }))}
                className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
            </div>
            <div>
              <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Google Sheets URL</label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetForm.sheetUrl}
                onChange={e => setSheetForm(f => ({ ...f, sheetUrl: e.target.value }))}
                className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Tab / Sheet name</label>
                <Input placeholder="Sheet1" value={sheetForm.tab} onChange={e => setSheetForm(f => ({ ...f, tab: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>API Key (optional)</label>
                <Input type="password" placeholder="AIza..." value={sheetForm.apiKey} onChange={e => setSheetForm(f => ({ ...f, apiKey: e.target.value }))}
                  className="h-8 text-xs" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }} />
              </div>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--ds-text-dim)' }}>
              For public sheets, no API key needed. For private sheets, set GOOGLE_SHEETS_API_KEY in environment settings or paste above.
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-8" onClick={() => setShowSheetDialog(false)} style={{ color: 'var(--ds-text-dim)' }}>Cancel</Button>
              <Button size="sm" className="flex-1 text-xs h-8" style={{ background: '#0F9D58', color: '#fff' }} onClick={addSheetConnection}>Connect</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div style={{ color: 'var(--ds-text-dim)', opacity: 0.3 }}>{icon}</div>
      <p className="text-sm font-medium" style={{ color: 'var(--ds-text-dim)' }}>{title}</p>
      <p className="text-xs text-center max-w-xs" style={{ color: 'var(--ds-text-dim)', opacity: 0.7 }}>{description}</p>
      {action}
    </div>
  );
}

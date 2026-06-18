import { useState, useCallback, useRef } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Plus, Save, Trash2, Download, Eye, X, BarChart3, LineChart, PieChart,
  AreaChart, Table2, Zap, Settings2, Loader2, LayoutDashboard, ChevronDown,
  Copy, Check, Filter, RefreshCw, Maximize2, GripVertical, TrendingUp,
  TrendingDown, Minus, Sparkles, Database, Link2, FileSpreadsheet,
  SlidersHorizontal, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AreaChart as ReAreaChart, Area, BarChart, Bar, LineChart as ReLineChart,
  Line, PieChart as RePieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Treemap,
} from 'recharts';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type WidgetType = 'kpi' | 'line' | 'bar' | 'pie' | 'area' | 'table' | 'scatter' | 'treemap' | 'text';
type AggFn = 'sum' | 'avg' | 'count' | 'min' | 'max';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  metric?: string;
  agg?: AggFn;
  filters?: Record<string, string>;
  description?: string;
  kpiChange?: number;
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4', '#84CC16', '#EC4899'];

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'kpi',      label: 'KPI Card',    icon: <Zap className="h-4 w-4" />,         description: 'Single metric with trend' },
  { type: 'line',     label: 'Line Chart',  icon: <LineChart className="h-4 w-4" />,    description: 'Time series, trends' },
  { type: 'bar',      label: 'Bar Chart',   icon: <BarChart3 className="h-4 w-4" />,    description: 'Category comparisons' },
  { type: 'area',     label: 'Area Chart',  icon: <AreaChart className="h-4 w-4" />,    description: 'Cumulative trends' },
  { type: 'pie',      label: 'Pie / Donut', icon: <PieChart className="h-4 w-4" />,     description: 'Part-to-whole' },
  { type: 'scatter',  label: 'Scatter',     icon: <TrendingUp className="h-4 w-4" />,   description: 'Correlation analysis' },
  { type: 'treemap',  label: 'Treemap',     icon: <LayoutDashboard className="h-4 w-4" />, description: 'Hierarchical data' },
  { type: 'table',    label: 'Data Table',  icon: <Table2 className="h-4 w-4" />,       description: 'Detailed row data' },
  { type: 'text',     label: 'Text / Note', icon: <FileSpreadsheet className="h-4 w-4" />, description: 'Labels, annotations' },
];

// Sample data sets
const timeSeriesData = [
  { name: 'Jan', revenue: 120000, profit: 25000, users: 1200, sessions: 8400 },
  { name: 'Feb', revenue: 135000, profit: 32000, users: 1350, sessions: 9100 },
  { name: 'Mar', revenue: 148000, profit: 38000, users: 1480, sessions: 10200 },
  { name: 'Apr', revenue: 162000, profit: 45000, users: 1620, sessions: 11500 },
  { name: 'May', revenue: 155000, profit: 41000, users: 1580, sessions: 10800 },
  { name: 'Jun', revenue: 178000, profit: 53000, users: 1750, sessions: 12600 },
  { name: 'Jul', revenue: 192000, profit: 61000, users: 1920, sessions: 13900 },
  { name: 'Aug', revenue: 185000, profit: 58000, users: 1840, sessions: 13100 },
];

const pieData = [
  { name: 'North', value: 245000, color: '#3B82F6' },
  { name: 'West',  value: 198000, color: '#10B981' },
  { name: 'South', value: 156000, color: '#8B5CF6' },
  { name: 'East',  value: 134000, color: '#F59E0B' },
];

const scatterData = Array.from({ length: 40 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100 + i,
  z: Math.random() * 20 + 5,
}));

const treemapData = [
  { name: 'Product A', size: 4500, fill: '#3B82F6' },
  { name: 'Product B', size: 3200, fill: '#10B981' },
  { name: 'Product C', size: 2800, fill: '#8B5CF6' },
  { name: 'Product D', size: 2100, fill: '#F59E0B' },
  { name: 'Product E', size: 1800, fill: '#F43F5E' },
  { name: 'Product F', size: 1200, fill: '#06B6D4' },
];

const tableRows = [
  { region: 'North', revenue: '$245K', margin: '30%', growth: '+12%', orders: 1240, status: 'Above target' },
  { region: 'West',  revenue: '$198K', margin: '28%', growth: '+8%',  orders: 980,  status: 'On target' },
  { region: 'South', revenue: '$156K', margin: '22%', growth: '+3%',  orders: 740,  status: 'Below target' },
  { region: 'East',  revenue: '$134K', margin: '20%', growth: '-2%',  orders: 620,  status: 'Below target' },
];

const kpiData = [
  { metric: 'Total Revenue', value: '$1.24M', change: 12.4, suffix: '' },
  { metric: 'Active Users',  value: '14,240', change: 8.1,  suffix: '' },
  { metric: 'Avg Margin',    value: '24.8%',  change: 2.3,  suffix: '' },
  { metric: 'Orders',        value: '3,580',  change: -1.2, suffix: '' },
];

const STORAGE_KEY = 'ds_studio_widgets_v2';

function loadWidgets(): Widget[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : defaultWidgets();
  } catch { return defaultWidgets(); }
}

function defaultWidgets(): Widget[] {
  return [
    { id: 'w1', type: 'kpi', title: 'Total Revenue', x: 0, y: 0, w: 3, h: 2, metric: 'revenue', kpiChange: 12.4 },
    { id: 'w2', type: 'kpi', title: 'Active Users',  x: 3, y: 0, w: 3, h: 2, metric: 'users',   kpiChange: 8.1 },
    { id: 'w3', type: 'kpi', title: 'Avg Margin',    x: 6, y: 0, w: 3, h: 2, metric: 'margin',  kpiChange: 2.3 },
    { id: 'w4', type: 'kpi', title: 'Growth',        x: 9, y: 0, w: 3, h: 2, metric: 'growth',  kpiChange: -1.2 },
    { id: 'w5', type: 'area', title: 'Revenue & Profit Trend', x: 0, y: 2, w: 8, h: 5 },
    { id: 'w6', type: 'pie',  title: 'Revenue by Region',      x: 8, y: 2, w: 4, h: 5 },
    { id: 'w7', type: 'bar',  title: 'Monthly Orders',         x: 0, y: 7, w: 6, h: 5 },
    { id: 'w8', type: 'table',title: 'Regional Summary',       x: 6, y: 7, w: 6, h: 5 },
  ];
}

function KpiCard({ widget }: { widget: Widget }) {
  const idx = kpiData.findIndex(k => k.metric === widget.metric);
  const data = idx >= 0 ? kpiData[idx] : kpiData[0];
  const isPos = (data.change ?? 0) >= 0;

  return (
    <div className="h-full flex flex-col justify-between p-4">
      <p className="text-xs font-medium" style={{ color: 'var(--ds-text-dim)' }}>{widget.title}</p>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--ds-text)' }}>{data.value}</p>
        <div className="flex items-center gap-1 mt-1">
          {isPos
            ? <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--ds-success)' }} />
            : <TrendingDown className="h-3.5 w-3.5" style={{ color: 'var(--ds-error)' }} />}
          <span className="text-xs font-medium" style={{ color: isPos ? 'var(--ds-success)' : 'var(--ds-error)' }}>
            {isPos ? '+' : ''}{data.change}%
          </span>
          <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>vs last period</span>
        </div>
      </div>
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  const common = { background: 'transparent', border: 'none' };

  if (widget.type === 'kpi')   return <KpiCard widget={widget} />;
  if (widget.type === 'text')  return (
    <div className="h-full flex items-center justify-center p-4">
      <p className="text-sm" style={{ color: 'var(--ds-text-dim)' }}>{widget.description || widget.title}</p>
    </div>
  );

  if (widget.type === 'table') return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
              {Object.keys(tableRows[0]).map(k => (
                <th key={k} className="text-left px-3 py-2 font-medium" style={{ color: 'var(--ds-text-dim)', background: 'var(--ds-sidebar)' }}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
                {Object.values(row).map((v, j) => (
                  <td key={j} className="px-3 py-2" style={{ color: 'var(--ds-text)' }}>
                    {j === Object.keys(row).length - 1
                      ? <span className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{
                            background: String(v).includes('Above') ? 'rgba(16,185,129,0.12)' : String(v).includes('On') ? 'rgba(59,130,246,0.12)' : 'rgba(244,63,94,0.12)',
                            color: String(v).includes('Above') ? 'var(--ds-success)' : String(v).includes('On') ? 'var(--ds-accent)' : 'var(--ds-error)',
                          }}>
                          {String(v)}
                        </span>
                      : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (widget.type === 'scatter') return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="x" type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
        <YAxis dataKey="y" type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', borderRadius: 6, fontSize: 11 }} />
        <Scatter data={scatterData} fill={widget.color ?? CHART_COLORS[0]} fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );

  if (widget.type === 'treemap') return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} stroke="var(--ds-editor)"
        content={({ x, y, width, height, fill, name }: any) => (
          <g>
            <rect x={x} y={y} width={width} height={height} fill={fill} stroke="var(--ds-editor)" strokeWidth={2} rx={2} />
            {width > 50 && height > 30 && (
              <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={11}>
                {name}
              </text>
            )}
          </g>
        )} />
    </ResponsiveContainer>
  );

  if (widget.type === 'pie') return (
    <ResponsiveContainer width="100%" height="100%">
      <RePieChart>
        <Pie data={pieData} cx="50%" cy="48%" innerRadius="40%" outerRadius="68%" dataKey="value" paddingAngle={2}>
          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [`$${(v / 1000).toFixed(0)}K`, '']}
          contentStyle={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', borderRadius: 6, fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RePieChart>
    </ResponsiveContainer>
  );

  if (widget.type === 'area') return (
    <ResponsiveContainer width="100%" height="100%">
      <ReAreaChart data={timeSeriesData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id={`grad-rev-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`grad-pr-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
        <Tooltip formatter={(v: number) => [`$${(v / 1000).toFixed(0)}K`, '']}
          contentStyle={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', borderRadius: 6, fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={2}
          fill={`url(#grad-rev-${widget.id})`} />
        <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2}
          fill={`url(#grad-pr-${widget.id})`} />
      </ReAreaChart>
    </ResponsiveContainer>
  );

  if (widget.type === 'line') return (
    <ResponsiveContainer width="100%" height="100%">
      <ReLineChart data={timeSeriesData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', borderRadius: 6, fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="users" name="Users" stroke="#8B5CF6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#F59E0B" strokeWidth={2} dot={false} />
      </ReLineChart>
    </ResponsiveContainer>
  );

  if (widget.type === 'bar') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={timeSeriesData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', borderRadius: 6, fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="profit"  name="Profit"  fill="#10B981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return null;
}

const GRID_COLS = 12;
const CELL_W = 88;
const CELL_H = 56;

export default function DashboardStudioPage() {
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);
  const [selected, setSelected] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [dateRange, setDateRange] = useState('last_30d');
  const [dataSource, setDataSource] = useState('sample');
  const [copied, setCopied] = useState(false);
  const [filterPanel, setFilterPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(null);

  const aiSuggest = trpc.code.aiSuggest.useMutation();

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch {}
    toast({ title: 'Dashboard saved' });
  };

  const addWidget = (type: WidgetType) => {
    const catalog = WIDGET_CATALOG.find(c => c.type === type);
    const newW: Widget = {
      id: Date.now().toString(),
      type,
      title: catalog?.label ?? type,
      x: 0, y: 99, w: type === 'kpi' ? 3 : type === 'table' ? 6 : 6,
      h: type === 'kpi' ? 2 : 5,
      color: CHART_COLORS[widgets.length % CHART_COLORS.length],
    };
    setWidgets(prev => [...prev, newW]);
    setShowCatalog(false);
    toast({ title: `${catalog?.label} added`, description: 'Drag to position it.' });
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selected === id) setSelected(null);
  };

  const updateWidget = (id: string, patch: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    try {
      const result = await aiSuggest.mutateAsync({
        code: `Dashboard currently has: ${widgets.map(w => `${w.type}:${w.title}`).join(', ')}. Data source: ${dataSource}. Date range: ${dateRange}.`,
        language: 'dashboard_design',
        errorContext: '',
      });
      toast({ title: 'AI Suggestion', description: result.suggestion.slice(0, 120) + '…' });
    } catch {
      toast({ title: 'AI unavailable', description: 'Set GEMINI_API_KEY to enable AI suggestions.' });
    }
    setAiLoading(false);
  };

  const exportDashboard = () => {
    const data = JSON.stringify({ widgets, dateRange, dataSource }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dashboard.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedWidget = widgets.find(w => w.id === selected);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ds-editor)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-b flex-shrink-0 gap-3"
        style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs h-7" style={{ background: 'var(--ds-accent)', color: '#fff' }}
            onClick={() => setShowCatalog(v => !v)}>
            <Plus className="h-3.5 w-3.5" /> Add Widget
          </Button>

          <div className="w-px h-4" style={{ background: 'rgba(148,163,184,0.12)' }} />

          {/* Data Source */}
          <Select value={dataSource} onValueChange={setDataSource}>
            <SelectTrigger className="h-7 text-xs w-36 gap-1.5" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text-dim)' }}>
              <Database className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border)' }}>
              <SelectItem value="sample"       className="text-xs" style={{ color: 'var(--ds-text)' }}>Sample Data</SelectItem>
              <SelectItem value="datasources"  className="text-xs" style={{ color: 'var(--ds-text)' }}>Data Sources</SelectItem>
              <SelectItem value="sql"          className="text-xs" style={{ color: 'var(--ds-text)' }}>SQL Query</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-7 text-xs w-32" style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text-dim)' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border)' }}>
              <SelectItem value="last_7d"   className="text-xs" style={{ color: 'var(--ds-text)' }}>Last 7 days</SelectItem>
              <SelectItem value="last_30d"  className="text-xs" style={{ color: 'var(--ds-text)' }}>Last 30 days</SelectItem>
              <SelectItem value="last_90d"  className="text-xs" style={{ color: 'var(--ds-text)' }}>Last 90 days</SelectItem>
              <SelectItem value="this_year" className="text-xs" style={{ color: 'var(--ds-text)' }}>This year</SelectItem>
              <SelectItem value="custom"    className="text-xs" style={{ color: 'var(--ds-text)' }}>Custom range</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-4" style={{ background: 'rgba(148,163,184,0.12)' }} />

          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" style={{ color: '#94A3B8' }}
            onClick={() => setFilterPanel(v => !v)}>
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>

          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" style={{ color: '#94A3B8' }}
            onClick={handleAISuggest} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Suggest
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 text-xs h-7"
            style={{ color: editMode ? 'var(--ds-accent)' : '#94A3B8', background: editMode ? 'rgba(99,102,241,0.08)' : undefined }}
            onClick={() => setEditMode(v => !v)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {editMode ? 'Done' : 'Edit'}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" style={{ color: '#94A3B8' }} onClick={save}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" style={{ color: '#94A3B8' }} onClick={exportDashboard}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Widget Catalog Sidebar */}
        {showCatalog && (
          <div className="w-56 border-r flex-shrink-0 flex flex-col" style={{ background: 'var(--ds-sidebar)', borderColor: 'var(--ds-border-subtle)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--ds-border-subtle)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--ds-text-dim)' }}>Chart Types</span>
              <button onClick={() => setShowCatalog(false)} className="p-0.5 rounded hover:bg-white/10">
                <X className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {WIDGET_CATALOG.map(item => (
                  <button
                    key={item.type}
                    onClick={() => addWidget(item.type)}
                    className="w-full flex items-start gap-2.5 p-2 rounded text-left transition-colors hover:bg-white/06"
                    style={{ border: '1px solid var(--ds-border-subtle)' }}
                  >
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--ds-accent)' }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--ds-text)' }}>{item.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--ds-text-dim)' }}>{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto relative" style={{ background: 'var(--ds-editor)' }}>
          <div
            className="relative"
            style={{
              minWidth: GRID_COLS * CELL_W + 48,
              minHeight: 800,
              padding: '20px 24px',
              backgroundImage: editMode
                ? 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)'
                : 'none',
              backgroundSize: `${CELL_W}px ${CELL_H}px`,
            }}
          >
            {widgets.map(widget => (
              <div
                key={widget.id}
                onClick={() => setSelected(widget.id)}
                style={{
                  position: 'absolute',
                  left: widget.x * CELL_W + 24,
                  top: widget.y * CELL_H + 20,
                  width: widget.w * CELL_W - 8,
                  height: widget.h * CELL_H - 8,
                  borderRadius: 8,
                  background: 'var(--ds-panel)',
                  border: selected === widget.id && editMode
                    ? '1.5px solid var(--ds-accent)'
                    : '1px solid var(--ds-border-subtle)',
                  overflow: 'hidden',
                  cursor: editMode ? 'grab' : 'default',
                  transition: 'border-color 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: selected === widget.id ? '0 0 0 3px rgba(99,102,241,0.15)' : undefined,
                }}
              >
                {/* Widget header */}
                <div
                  className="flex items-center justify-between px-3 py-2 flex-shrink-0"
                  style={{ borderBottom: widget.type !== 'kpi' ? '1px solid var(--ds-border-subtle)' : 'none' }}
                >
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--ds-text-dim)' }}>
                    {widget.title}
                  </span>
                  {editMode && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); removeWidget(widget.id); }}
                        className="h-5 w-5 rounded flex items-center justify-center hover:bg-red-500/15 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" style={{ color: 'var(--ds-error)' }} />
                      </button>
                    </div>
                  )}
                </div>
                {/* Widget content */}
                <div className="flex-1 min-h-0 p-1">
                  <WidgetRenderer widget={widget} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        {editMode && selectedWidget && (
          <div className="w-56 border-l flex-shrink-0 flex flex-col" style={{ background: 'var(--ds-sidebar)', borderColor: 'var(--ds-border-subtle)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--ds-border-subtle)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--ds-text-dim)' }}>Properties</span>
              <button onClick={() => setSelected(null)} className="p-0.5 rounded hover:bg-white/10">
                <X className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
              </button>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Title</label>
                  <Input
                    value={selectedWidget.title}
                    onChange={e => updateWidget(selectedWidget.id, { title: e.target.value })}
                    className="h-7 text-xs"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Position X</label>
                  <Input
                    type="number" min={0} max={11} value={selectedWidget.x}
                    onChange={e => updateWidget(selectedWidget.id, { x: parseInt(e.target.value) || 0 })}
                    className="h-7 text-xs"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Width (cols)</label>
                  <Input
                    type="number" min={1} max={12} value={selectedWidget.w}
                    onChange={e => updateWidget(selectedWidget.id, { w: parseInt(e.target.value) || 3 })}
                    className="h-7 text-xs"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Height (rows)</label>
                  <Input
                    type="number" min={1} max={12} value={selectedWidget.h}
                    onChange={e => updateWidget(selectedWidget.id, { h: parseInt(e.target.value) || 2 })}
                    className="h-7 text-xs"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--ds-text-dim)' }}>Accent Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CHART_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => updateWidget(selectedWidget.id, { color: c })}
                        className="w-5 h-5 rounded-full border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: selectedWidget.color === c ? '#fff' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    size="sm" variant="ghost"
                    className="w-full text-xs h-7 gap-1.5"
                    style={{ color: 'var(--ds-error)' }}
                    onClick={() => removeWidget(selectedWidget.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Widget
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

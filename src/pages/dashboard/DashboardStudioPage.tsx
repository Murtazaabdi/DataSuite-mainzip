import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Plus,
  Save,
  Trash2,
  Download,
  Eye,
  GripVertical,
  X,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Table2,
  Zap,
  Settings2,
  Loader2,
  LayoutDashboard,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AreaChart as ReAreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface Widget {
  id: string;
  type: 'kpi' | 'line' | 'bar' | 'pie' | 'area' | 'table';
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  metric?: string;
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4'];

const revenueData = [
  { name: 'Jan', revenue: 120000, profit: 25000, customers: 1200 },
  { name: 'Feb', revenue: 135000, profit: 32000, customers: 1350 },
  { name: 'Mar', revenue: 148000, profit: 38000, customers: 1480 },
  { name: 'Apr', revenue: 162000, profit: 45000, customers: 1620 },
  { name: 'May', revenue: 155000, profit: 41000, customers: 1580 },
  { name: 'Jun', revenue: 178000, profit: 53000, customers: 1750 },
];

const salesByRegion = [
  { name: 'North', value: 245000, color: '#3B82F6' },
  { name: 'West', value: 198000, color: '#10B981' },
  { name: 'South', value: 156000, color: '#8B5CF6' },
  { name: 'East', value: 134000, color: '#F59E0B' },
];

const tableData = [
  { region: 'North', revenue: '$245K', margin: '30%', growth: '+12%', status: 'Above target' },
  { region: 'West', revenue: '$198K', margin: '28%', growth: '+8%', status: 'On target' },
  { region: 'South', revenue: '$156K', margin: '22%', growth: '+3%', status: 'Below target' },
  { region: 'East', revenue: '$134K', margin: '20%', growth: '-2%', status: 'Below target' },
];

const kpiData: Record<string, { value: string; change: string; positive: boolean }> = {
  revenue: { value: '$898K', change: '+14.2%', positive: true },
  profit: { value: '$234K', change: '+22.1%', positive: true },
  customers: { value: '8,980', change: '+9.5%', positive: true },
  churn: { value: '2.3%', change: '-0.4%', positive: true },
};

function KPIWidget({ title, metric = 'revenue' }: { title: string; metric?: string }) {
  const kpi = kpiData[metric] || kpiData.revenue;
  return (
    <div className="flex flex-col justify-between h-full p-2">
      <div className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>{title}</div>
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--ds-text)' }}>{kpi.value}</div>
        <div className="text-xs mt-1 font-medium" style={{ color: kpi.positive ? 'var(--ds-success)' : 'var(--ds-error)' }}>
          {kpi.change} vs last period
        </div>
      </div>
    </div>
  );
}

function ChartWidget({ type, color = 'var(--ds-accent)' }: { type: Widget['type']; color?: string }) {
  const tooltipStyle = { background: 'var(--ds-input)', border: '1px solid var(--ds-border-subtle)', borderRadius: 8, color: 'var(--ds-text)', fontSize: 12 };
  if (type === 'line') return (
    <ResponsiveContainer width="100%" height="100%">
      <ReLineChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-subtle)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--ds-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--ds-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="profit" stroke="var(--ds-success)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
      </ReLineChart>
    </ResponsiveContainer>
  );
  if (type === 'bar') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-subtle)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--ds-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--ds-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="revenue" fill={color} radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" fill="var(--ds-success)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
  if (type === 'pie') return (
    <ResponsiveContainer width="100%" height="100%">
      <RePieChart>
        <Pie data={salesByRegion} cx="50%" cy="50%" outerRadius="70%" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
          {salesByRegion.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
      </RePieChart>
    </ResponsiveContainer>
  );
  if (type === 'area') return (
    <ResponsiveContainer width="100%" height="100%">
      <ReAreaChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-subtle)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--ds-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--ds-text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="revenue" stroke={color} fill="url(#colorRev)" strokeWidth={2} />
      </ReAreaChart>
    </ResponsiveContainer>
  );
  if (type === 'table') return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--ds-input)' }}>
            {['Region', 'Revenue', 'Margin', 'Growth', 'Status'].map(h => (
              <th key={h} className="text-left px-3 py-2 font-medium" style={{ color: 'var(--ds-text-muted)', borderBottom: '1px solid var(--ds-border-subtle)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
              <td className="px-3 py-1.5" style={{ color: 'var(--ds-text)' }}>{row.region}</td>
              <td className="px-3 py-1.5" style={{ color: 'var(--ds-text)' }}>{row.revenue}</td>
              <td className="px-3 py-1.5" style={{ color: 'var(--ds-success)' }}>{row.margin}</td>
              <td className="px-3 py-1.5" style={{ color: row.growth.startsWith('-') ? 'var(--ds-error)' : 'var(--ds-success)' }}>{row.growth}</td>
              <td className="px-3 py-1.5">
                <span className="px-2 py-0.5 rounded-full text-xs" style={{
                  background: row.status === 'Above target' ? 'rgba(78, 201, 176, 0.15)' : row.status === 'On target' ? 'rgba(0, 122, 204, 0.15)' : 'rgba(241, 76, 76, 0.15)',
                  color: row.status === 'Above target' ? 'var(--ds-success)' : row.status === 'On target' ? 'var(--ds-accent)' : 'var(--ds-error)',
                }}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return null;
}

const WIDGET_PALETTE = [
  { type: 'kpi' as const, label: 'KPI Card', icon: <Zap className="h-4 w-4" />, color: '#F59E0B' },
  { type: 'line' as const, label: 'Line Chart', icon: <LineChart className="h-4 w-4" />, color: '#3B82F6' },
  { type: 'bar' as const, label: 'Bar Chart', icon: <BarChart3 className="h-4 w-4" />, color: '#10B981' },
  { type: 'pie' as const, label: 'Pie Chart', icon: <PieChart className="h-4 w-4" />, color: '#8B5CF6' },
  { type: 'area' as const, label: 'Area Chart', icon: <AreaChart className="h-4 w-4" />, color: '#06B6D4' },
  { type: 'table' as const, label: 'Data Table', icon: <Table2 className="h-4 w-4" />, color: '#64748B' },
];

const KPI_METRICS = [
  { value: 'revenue', label: 'Total Revenue' },
  { value: 'profit', label: 'Net Profit' },
  { value: 'customers', label: 'Customers' },
  { value: 'churn', label: 'Churn Rate' },
];

export default function DashboardStudioPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: dashboards, isLoading } = trpc.dashboard.list.useQuery();
  const createDashMutation = trpc.dashboard.create.useMutation();
  const updateDashMutation = trpc.dashboard.update.useMutation();
  const deleteDashMutation = trpc.dashboard.delete.useMutation();

  const [activeDashId, setActiveDashId] = useState<number | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showDashList, setShowDashList] = useState(true);
  const [copied, setCopied] = useState(false);

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDash = dashboards?.find(d => d.id === activeDashId);

  useEffect(() => {
    if (dashboards && dashboards.length > 0 && activeDashId === null) {
      const first = dashboards[0];
      setActiveDashId(first.id);
      setDashboardTitle(first.title);
      const savedWidgets = first.widgetsJson as Widget[] | null;
      setWidgets(savedWidgets && savedWidgets.length > 0 ? savedWidgets : getDefaultWidgets());
    }
  }, [dashboards, activeDashId]);

  const getDefaultWidgets = (): Widget[] => [
    { id: '1', type: 'kpi', title: 'Total Revenue', x: 0, y: 0, w: 1, h: 1, color: '#3B82F6', metric: 'revenue' },
    { id: '2', type: 'kpi', title: 'Net Profit', x: 1, y: 0, w: 1, h: 1, color: '#10B981', metric: 'profit' },
    { id: '3', type: 'kpi', title: 'Customers', x: 2, y: 0, w: 1, h: 1, color: '#8B5CF6', metric: 'customers' },
    { id: '4', type: 'kpi', title: 'Churn Rate', x: 3, y: 0, w: 1, h: 1, color: '#F59E0B', metric: 'churn' },
    { id: '5', type: 'line', title: 'Revenue Trend', x: 0, y: 1, w: 2, h: 2, color: '#3B82F6' },
    { id: '6', type: 'bar', title: 'Sales by Region', x: 2, y: 1, w: 2, h: 2, color: '#10B981' },
    { id: '7', type: 'area', title: 'Growth Trajectory', x: 0, y: 3, w: 2, h: 2, color: '#06B6D4' },
    { id: '8', type: 'pie', title: 'Regional Mix', x: 2, y: 3, w: 2, h: 2, color: '#8B5CF6' },
  ];

  const autoSave = useCallback(async (id: number, title: string, wgts: Widget[]) => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateDashMutation.mutateAsync({ id, title, widgetsJson: wgts });
        utils.dashboard.list.invalidate();
      } catch { /* silent */ }
      finally { setIsSaving(false); }
    }, 1500);
  }, [updateDashMutation, utils]);

  const selectDashboard = (id: number) => {
    const dash = dashboards?.find(d => d.id === id);
    if (!dash) return;
    setActiveDashId(id);
    setDashboardTitle(dash.title);
    const savedWidgets = dash.widgetsJson as Widget[] | null;
    setWidgets(savedWidgets && savedWidgets.length > 0 ? savedWidgets : getDefaultWidgets());
    setSelectedWidget(null);
  };

  const createDashboard = async () => {
    try {
      const result = await createDashMutation.mutateAsync({ title: 'New Dashboard' });
      await utils.dashboard.list.invalidate();
      setActiveDashId(result.id);
      setDashboardTitle('New Dashboard');
      setWidgets(getDefaultWidgets());
      setSelectedWidget(null);
      toast({ title: 'Dashboard created' });
    } catch {
      toast({ title: 'Failed to create dashboard', variant: 'destructive' });
    }
  };

  const deleteDashboard = async (id: number) => {
    try {
      await deleteDashMutation.mutateAsync({ id });
      await utils.dashboard.list.invalidate();
      if (activeDashId === id) {
        setActiveDashId(null);
        setWidgets([]);
        setDashboardTitle('');
      }
    } catch {
      toast({ title: 'Failed to delete dashboard', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!activeDashId) return;
    setIsSaving(true);
    try {
      await updateDashMutation.mutateAsync({ id: activeDashId, title: dashboardTitle, widgetsJson: widgets });
      utils.dashboard.list.invalidate();
      toast({ title: 'Dashboard saved' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const addWidget = (type: Widget['type']) => {
    const palette = WIDGET_PALETTE.find(p => p.type === type);
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: palette?.label ?? type,
      x: 0,
      y: widgets.length,
      w: type === 'kpi' ? 1 : 2,
      h: type === 'kpi' ? 1 : 2,
      color: palette?.color ?? '#3B82F6',
    };
    const updated = [...widgets, newWidget];
    setWidgets(updated);
    if (activeDashId) autoSave(activeDashId, dashboardTitle, updated);
  };

  const removeWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    setWidgets(updated);
    if (selectedWidget === id) setSelectedWidget(null);
    if (activeDashId) autoSave(activeDashId, dashboardTitle, updated);
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    const updated = widgets.map(w => w.id === id ? { ...w, ...updates } : w);
    setWidgets(updated);
    if (activeDashId) autoSave(activeDashId, dashboardTitle, updated);
  };

  const exportDashboard = () => {
    const data = JSON.stringify({ title: dashboardTitle, widgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboardTitle.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copied to clipboard' });
    });
  };

  const selectedWidgetData = widgets.find(w => w.id === selectedWidget);

  // Group widgets into rows
  const gridWidgets = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDashList(!showDashList)}
            style={{ color: '#94A3B8' }}
            title="Toggle dashboard list"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-5" style={{ background: 'rgba(148,163,184,0.1)' }} />
          <Input
            value={dashboardTitle}
            onChange={e => {
              setDashboardTitle(e.target.value);
              if (activeDashId) autoSave(activeDashId, e.target.value, widgets);
            }}
            className="h-8 w-56 text-sm font-medium border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ background: 'transparent', color: '#F1F5F9' }}
            placeholder="Dashboard title..."
          />
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#64748B' }} />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setPreviewMode(!previewMode)}
            style={{ color: previewMode ? '#3B82F6' : '#94A3B8' }}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">{previewMode ? 'Edit' : 'Preview'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={shareLink}
            style={{ color: '#94A3B8' }}
          >
            {copied ? <Check className="h-3.5 w-3.5" style={{ color: '#10B981' }} /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-xs">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleSave}
            disabled={!activeDashId || isSaving}
            style={{ color: '#94A3B8' }}
          >
            <Save className="h-3.5 w-3.5" />
            <span className="text-xs">Save</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={exportDashboard}
            style={{ color: '#94A3B8' }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard List */}
        {showDashList && (
          <div
            className="w-52 border-r flex flex-col flex-shrink-0"
            style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
          >
            <div className="p-2 border-b" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs h-8"
                style={{ background: '#3B82F6', color: '#fff' }}
                onClick={createDashboard}
                disabled={createDashMutation.isPending}
              >
                <Plus className="h-3 w-3" />
                New Dashboard
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <div className="text-xs font-medium mb-2 uppercase tracking-wide px-1" style={{ color: '#64748B' }}>
                  Dashboards
                </div>
                {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" style={{ color: '#64748B' }} /></div>}
                {!isLoading && (!dashboards || dashboards.length === 0) && (
                  <div className="text-center py-4 text-xs" style={{ color: '#475569' }}>No dashboards yet</div>
                )}
                {dashboards?.map(dash => (
                  <div
                    key={dash.id}
                    onClick={() => selectDashboard(dash.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group mb-0.5"
                    style={{
                      background: activeDashId === dash.id ? '#243447' : 'transparent',
                      borderLeft: activeDashId === dash.id ? '2px solid #3B82F6' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (activeDashId !== dash.id) e.currentTarget.style.background = '#1E293B'; }}
                    onMouseLeave={e => { if (activeDashId !== dash.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" style={{ color: activeDashId === dash.id ? '#3B82F6' : '#64748B' }} />
                    <span className="text-xs flex-1 truncate" style={{ color: activeDashId === dash.id ? '#F1F5F9' : '#94A3B8' }}>
                      {dash.title}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteDashboard(dash.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded"
                    >
                      <Trash2 className="h-3 w-3" style={{ color: '#64748B' }} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Widget Palette */}
        {!previewMode && (
          <div
            className="w-44 border-r flex flex-col flex-shrink-0"
            style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>Add Widget</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {WIDGET_PALETTE.map(item => (
                  <button
                    key={item.type}
                    onClick={() => addWidget(item.type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all"
                    style={{ color: '#94A3B8', border: '1px solid rgba(148,163,184,0.08)', background: '#0F172A' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#1E293B';
                      e.currentTarget.style.borderColor = `${item.color}40`;
                      e.currentTarget.style.color = '#F1F5F9';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#0F172A';
                      e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto" style={{ background: '#000000' }}>
          {!activeDashId ? (
            <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: '#64748B' }}>
              <LayoutDashboard className="h-12 w-12" style={{ color: '#1E293B' }} />
              <div className="text-center">
                <p className="text-sm font-medium mb-1" style={{ color: '#475569' }}>No dashboard selected</p>
                <p className="text-xs" style={{ color: '#334155' }}>Create a new dashboard to get started</p>
              </div>
              <Button size="sm" onClick={createDashboard} style={{ background: '#3B82F6', color: '#fff' }} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Dashboard
              </Button>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4" style={{ gridAutoRows: 'auto' }}>
                {gridWidgets.map(widget => (
                  <div
                    key={widget.id}
                    onClick={() => !previewMode && setSelectedWidget(widget.id)}
                    className="relative rounded-xl overflow-hidden transition-all"
                    style={{
                      gridColumn: `span ${Math.min(widget.w, 4)}`,
                      minHeight: widget.type === 'kpi' ? 110 : 280,
                      background: '#151E32',
                      border: selectedWidget === widget.id && !previewMode
                        ? '1.5px solid #3B82F6'
                        : '1px solid rgba(148, 163, 184, 0.1)',
                      cursor: previewMode ? 'default' : 'pointer',
                      boxShadow: selectedWidget === widget.id && !previewMode ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
                    }}
                  >
                    {/* Widget Header */}
                    <div
                      className="flex items-center justify-between px-4 py-2.5 border-b"
                      style={{ borderColor: 'rgba(148, 163, 184, 0.06)' }}
                    >
                      <div className="flex items-center gap-2">
                        {!previewMode && <GripVertical className="h-3 w-3 cursor-move" style={{ color: '#334155' }} />}
                        <span className="text-xs font-medium" style={{ color: '#F1F5F9' }}>{widget.title}</span>
                      </div>
                      {!previewMode && selectedWidget === widget.id && (
                        <button
                          onClick={e => { e.stopPropagation(); removeWidget(widget.id); }}
                          className="p-0.5 rounded hover:bg-red-500/10"
                        >
                          <X className="h-3.5 w-3.5" style={{ color: '#F43F5E' }} />
                        </button>
                      )}
                    </div>

                    {/* Widget Body */}
                    <div className="p-3" style={{ height: widget.type === 'kpi' ? 70 : 230 }}>
                      {widget.type === 'kpi'
                        ? <KPIWidget title={widget.title} metric={widget.metric} />
                        : <ChartWidget type={widget.type} color={widget.color} />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Widget Config Panel */}
        {!previewMode && selectedWidgetData && (
          <div
            className="w-56 border-l flex flex-col flex-shrink-0"
            style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
              <div className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" style={{ color: '#64748B' }} />
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>Widget Config</span>
              </div>
              <button onClick={() => setSelectedWidget(null)}>
                <X className="h-3.5 w-3.5" style={{ color: '#475569' }} />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Title</label>
                  <Input
                    value={selectedWidgetData.title}
                    onChange={e => updateWidget(selectedWidgetData.id, { title: e.target.value })}
                    className="h-7 text-xs"
                    style={{ background: '#1E293B', borderColor: 'rgba(148,163,184,0.2)', color: '#F1F5F9' }}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Chart Type</label>
                  <div className="grid grid-cols-3 gap-1">
                    {WIDGET_PALETTE.map(p => (
                      <button
                        key={p.type}
                        onClick={() => updateWidget(selectedWidgetData.id, { type: p.type })}
                        className="flex flex-col items-center gap-1 p-1.5 rounded text-xs"
                        title={p.label}
                        style={{
                          background: selectedWidgetData.type === p.type ? '#243447' : 'transparent',
                          color: selectedWidgetData.type === p.type ? p.color : '#64748B',
                          border: selectedWidgetData.type === p.type ? `1px solid ${p.color}40` : '1px solid transparent',
                        }}
                      >
                        {p.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Metric */}
                {selectedWidgetData.type === 'kpi' && (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Metric</label>
                    <div className="space-y-1">
                      {KPI_METRICS.map(m => (
                        <button
                          key={m.value}
                          onClick={() => updateWidget(selectedWidgetData.id, { metric: m.value })}
                          className="w-full text-left px-2 py-1.5 rounded text-xs"
                          style={{
                            background: selectedWidgetData.metric === m.value ? '#243447' : 'transparent',
                            color: selectedWidgetData.metric === m.value ? '#F1F5F9' : '#94A3B8',
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color */}
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Accent Color</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {CHART_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => updateWidget(selectedWidgetData.id, { color: c })}
                        className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: c,
                          outline: selectedWidgetData.color === c ? `2px solid ${c}` : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Width (columns)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => updateWidget(selectedWidgetData.id, { w: n })}
                        className="flex-1 py-1 rounded text-xs font-medium"
                        style={{
                          background: selectedWidgetData.w === n ? '#3B82F6' : '#1E293B',
                          color: selectedWidgetData.w === n ? '#fff' : '#94A3B8',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(148,163,184,0.1)' }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full gap-1.5 text-xs justify-start"
                    onClick={() => removeWidget(selectedWidgetData.id)}
                    style={{ color: '#F43F5E' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove Widget
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

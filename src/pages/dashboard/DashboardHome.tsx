import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import {
  Code2,
  Database,
  LayoutDashboard,
  Sparkles,
  FileText,
  Zap,
  BarChart3,
  Activity,
  Users,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const quickActions = [
  { label: 'IDE', description: 'Python, R, SQL, JavaScript', icon: Code2, path: '/dashboard/ide', shortcut: 'Ctrl+1' },
  { label: 'SQL Workbench', description: 'Query your data warehouse', icon: Database, path: '/dashboard/sql', shortcut: 'Ctrl+2' },
  { label: 'Dashboard Studio', description: 'Build visual dashboards', icon: LayoutDashboard, path: '/dashboard/studio', shortcut: 'Ctrl+3' },
  { label: 'AI Analyst', description: 'Conversational data analysis', icon: Sparkles, path: '/dashboard/ai', shortcut: 'Ctrl+4' },
  { label: 'Documents', description: 'Notebooks and documentation', icon: FileText, path: '/dashboard/workspace', shortcut: 'Ctrl+5' },
];

const tierLabels: Record<string, string> = {
  free: 'Free',
  analyst: 'Analyst',
  data_scientist: 'Data Scientist',
  enterprise: 'Enterprise',
};

function MetricCell({
  label,
  value,
  sublabel,
  loading,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="ds-metric">
      <div className="ds-metric-label">{label}</div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin mt-1" style={{ color: 'var(--ds-text-dim)' }} />
      ) : (
        <div className="ds-metric-value">{value}</div>
      )}
      {sublabel && <div className="ds-metric-sub">{sublabel}</div>}
    </div>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: aiStats, isLoading: aiLoading } = trpc.ai.getUsage.useQuery(undefined, { enabled: !!user });
  const { data: dashboards, isLoading: dashLoading } = trpc.dashboard.list.useQuery(undefined, { enabled: !!user });
  const { data: workspaces, isLoading: wsLoading } = trpc.workspace.list.useQuery(undefined, { enabled: !!user });
  const { data: sqlQueries, isLoading: sqlLoading } = trpc.sql.list.useQuery(undefined, { enabled: !!user });
  const { data: conversations, isLoading: convLoading } = trpc.ai.listConversations.useQuery(undefined, { enabled: !!user });

  const usagePercent = aiStats ? Math.min((aiStats.daily / aiStats.limit) * 100, 100) : 0;
  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

  const recentActivity = [
    ...(dashboards?.slice(0, 3).map(d => ({
      type: 'Dashboard',
      name: d.title,
      time: new Date(d.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    })) ?? []),
    ...(workspaces?.slice(0, 3).map(w => ({
      type: 'Document',
      name: w.title,
      time: new Date(w.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    })) ?? []),
    ...(conversations?.slice(0, 2).map(c => ({
      type: 'AI Session',
      name: c.title,
      time: new Date(c.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    })) ?? []),
    ...(sqlQueries?.slice(0, 2).map(q => ({
      type: 'SQL Query',
      name: q.name,
      time: new Date(q.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    })) ?? []),
  ].slice(0, 10);

  return (
    <div className="ds-page">
      <div className="ds-page-inner">
        {/* Header */}
        <header className="ds-page-header">
          <div>
            <h1 className="ds-page-title">
              Good {greeting}, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="ds-page-subtitle">
              Enterprise data workspace — all systems operational
            </p>
          </div>
          <span className="ds-badge accent">
            {tierLabels[user?.tier || 'free'] || 'Free'} Plan
          </span>
        </header>

        {/* KPI metrics */}
        <div className="ds-metric-grid">
          <MetricCell
            label="AI Requests Today"
            value={aiStats?.daily ?? 0}
            sublabel={`${usagePercent.toFixed(0)}% of ${aiStats?.limit ?? 50} daily limit`}
            loading={aiLoading}
          />
          <MetricCell
            label="Dashboards"
            value={dashboards?.length ?? 0}
            sublabel="Total created"
            loading={dashLoading}
          />
          <MetricCell
            label="Documents"
            value={workspaces?.length ?? 0}
            sublabel="Workspace files"
            loading={wsLoading}
          />
          <MetricCell
            label="Saved Queries"
            value={sqlQueries?.length ?? 0}
            sublabel={`${conversations?.length ?? 0} AI sessions`}
            loading={sqlLoading || convLoading}
          />
        </div>

        {/* Two-column work area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          {/* Quick launch */}
          <div className="lg:col-span-2">
            <h2 className="ds-section-title">
              <Zap className="h-3.5 w-3.5" />
              Quick Launch
            </h2>
            <div className="ds-panel-card">
              <div className="ds-panel-card-header">Applications</div>
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    className="ds-list-row w-full text-left"
                    onClick={() => navigate(action.path)}
                  >
                    <div className="ds-list-row-icon">
                      <Icon className="h-4 w-4" style={{ color: 'var(--ds-accent)' }} />
                    </div>
                    <div className="ds-list-row-body">
                      <div className="ds-list-row-title">{action.label}</div>
                      <div className="ds-list-row-desc">{action.description}</div>
                    </div>
                    <kbd className="ds-kbd">{action.shortcut}</kbd>
                    <ArrowUpRight className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* AI usage */}
            {aiStats && (
              <div>
                <h2 className="ds-section-title">
                  <Activity className="h-3.5 w-3.5" />
                  Resource Usage
                </h2>
                <div className="ds-panel-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Daily AI quota</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--ds-text)' }}>
                      {aiStats.daily.toLocaleString()} / {aiStats.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="ds-usage-bar" style={{ height: 4 }}>
                    <div
                      className={`ds-usage-fill${usagePercent > 90 ? ' critical' : usagePercent > 70 ? ' warn' : ''}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: 'var(--ds-text-dim)' }}>
                    Resets at midnight UTC
                  </p>
                </div>
              </div>
            )}

            {/* Platform status */}
            <div>
              <h2 className="ds-section-title">
                <CheckCircle2 className="h-3.5 w-3.5" />
                System Status
              </h2>
              <div className="ds-panel-card">
                <table className="ds-data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      'API Services',
                      'AI Engine',
                      'Database',
                      'Authentication',
                    ].map(name => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>
                          <span className="ds-status-dot ok" />
                          Operational
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mb-5">
          <h2 className="ds-section-title">Recent Activity</h2>
          <div className="ds-panel-card">
            {recentActivity.length === 0 ? (
              <div className="py-10 text-center text-xs" style={{ color: 'var(--ds-text-dim)' }}>
                No recent activity. Create a dashboard, document, or query to get started.
              </div>
            ) : (
              <table className="ds-data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--ds-text)' }}>{item.type}</td>
                      <td>{item.name}</td>
                      <td className="font-mono text-[11px]">{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-5">
          <h2 className="ds-section-title">
            <Shield className="h-3.5 w-3.5" />
            Platform Capabilities
          </h2>
          <div className="ds-cap-grid">
            {[
              { icon: Code2, label: 'Multi-Language IDE', desc: 'Python, R, SQL, and JavaScript with Monaco editor' },
              { icon: Database, label: 'SQL Workbench', desc: 'Schema browser, query execution, and CSV export' },
              { icon: BarChart3, label: 'Dashboard Studio', desc: 'Drag-and-drop BI dashboards with six widget types' },
              { icon: MessageSquare, label: 'AI Analyst', desc: 'Kimi-powered analysis and code generation' },
              { icon: FileText, label: 'Documents', desc: 'Markdown documents, notebooks, and templates' },
              { icon: Users, label: 'Team Management', desc: 'Role-based access control with audit logging' },
              { icon: Activity, label: 'Usage Analytics', desc: 'Real-time AI usage tracking with tier limits' },
              { icon: CheckCircle2, label: 'Enterprise Security', desc: 'TOTP 2FA, JWT sessions, and OAuth 2.0' },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="ds-cap-item">
                  <Icon className="h-4 w-4" style={{ color: 'var(--ds-accent)' }} />
                  <h4>{feat.label}</h4>
                  <p>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade */}
        {user?.tier !== 'enterprise' && (
          <div className="ds-upgrade-banner">
            <div>
              <h3 className="text-sm font-semibold m-0 mb-1" style={{ color: 'var(--ds-text)' }}>
                Upgrade to Enterprise
              </h3>
              <p className="text-xs m-0" style={{ color: 'var(--ds-text-dim)' }}>
                Unlimited AI requests, dedicated support, SLA, and team administration.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              style={{ borderColor: 'var(--ds-accent)', color: 'var(--ds-accent)' }}
              onClick={() => navigate('/dashboard/settings')}
            >
              View Plans
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import {
  Database, LayoutDashboard, Sparkles, FileText, Settings, Shield,
  Search, Bell, ChevronLeft, ChevronRight, X, LogOut, Code2, Terminal,
  BarChart3, Bot, BookOpen, Monitor, CheckCircle2, AlertCircle, Info,
  Clock, GitBranch, Wifi, Home, PanelLeftClose, PanelLeft, Link2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { id: 'home',        label: 'Overview',        icon: Home,          path: '/dashboard' },
      { id: 'ide',         label: 'IDE',             icon: Code2,         path: '/dashboard/ide' },
      { id: 'sql',         label: 'SQL Workbench',   icon: Database,      path: '/dashboard/sql' },
      { id: 'studio',      label: 'Dashboard Studio',icon: LayoutDashboard,path: '/dashboard/studio' },
      { id: 'ai',          label: 'AI Analyst',      icon: Sparkles,      path: '/dashboard/ai' },
      { id: 'datasources', label: 'Data Sources',    icon: Link2,         path: '/dashboard/datasources' },
      { id: 'workspace',   label: 'Documents',       icon: FileText,      path: '/dashboard/workspace' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
    ],
  },
];

const ACTIVITY_ITEMS = [
  { id: 'home',        icon: Home,          path: '/dashboard',             title: 'Overview' },
  { id: 'ide',         icon: Code2,         path: '/dashboard/ide',         title: 'IDE' },
  { id: 'sql',         icon: Database,      path: '/dashboard/sql',         title: 'SQL Workbench' },
  { id: 'studio',      icon: BarChart3,     path: '/dashboard/studio',      title: 'Dashboard Studio' },
  { id: 'ai',          icon: Bot,           path: '/dashboard/ai',          title: 'AI Analyst' },
  { id: 'datasources', icon: Link2,         path: '/dashboard/datasources', title: 'Data Sources' },
  { id: 'workspace',   icon: BookOpen,      path: '/dashboard/workspace',   title: 'Documents' },
];

const COMMAND_PALETTE_ITEMS = [
  { label: 'Overview',         shortcut: 'Ctrl+H', path: '/dashboard',             icon: Monitor },
  { label: 'IDE',              shortcut: 'Ctrl+1', path: '/dashboard/ide',         icon: Code2 },
  { label: 'SQL Workbench',    shortcut: 'Ctrl+2', path: '/dashboard/sql',         icon: Database },
  { label: 'Dashboard Studio', shortcut: 'Ctrl+3', path: '/dashboard/studio',      icon: BarChart3 },
  { label: 'AI Analyst',       shortcut: 'Ctrl+4', path: '/dashboard/ai',          icon: Bot },
  { label: 'Data Sources',     shortcut: 'Ctrl+5', path: '/dashboard/datasources', icon: Link2 },
  { label: 'Documents',        shortcut: 'Ctrl+6', path: '/dashboard/workspace',   icon: BookOpen },
  { label: 'Settings',         shortcut: 'Ctrl+,', path: '/dashboard/settings',    icon: Settings },
];

const ROUTE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  '/dashboard':             { label: 'Overview',         icon: <Monitor className="h-3.5 w-3.5" /> },
  '/dashboard/ide':         { label: 'IDE',              icon: <Code2 className="h-3.5 w-3.5" /> },
  '/dashboard/sql':         { label: 'SQL Workbench',    icon: <Terminal className="h-3.5 w-3.5" /> },
  '/dashboard/studio':      { label: 'Dashboard Studio', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  '/dashboard/ai':          { label: 'AI Analyst',       icon: <Bot className="h-3.5 w-3.5" /> },
  '/dashboard/datasources': { label: 'Data Sources',     icon: <Link2 className="h-3.5 w-3.5" /> },
  '/dashboard/workspace':   { label: 'Documents',        icon: <BookOpen className="h-3.5 w-3.5" /> },
  '/dashboard/settings':    { label: 'Settings',         icon: <Settings className="h-3.5 w-3.5" /> },
  '/admin':                 { label: 'Administration',   icon: <Shield className="h-3.5 w-3.5" /> },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'success', title: 'Platform Ready',         message: 'All services are operational.',    time: 'Just now', read: false },
  { id: '2', type: 'info',    title: 'Gemini AI Available',    message: 'Set GEMINI_API_KEY to enable AI.', time: '1h ago',   read: false },
];

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const cls = 'h-3.5 w-3.5';
  if (type === 'success') return <CheckCircle2 className={cls} style={{ color: 'var(--ds-success)' }} />;
  if (type === 'error')   return <AlertCircle  className={cls} style={{ color: 'var(--ds-error)' }} />;
  if (type === 'warning') return <AlertCircle  className={cls} style={{ color: 'var(--ds-warning)' }} />;
  return <Info className={cls} style={{ color: 'var(--ds-accent)' }} />;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: aiUsage } = trpc.ai.getUsage.useQuery(undefined, { enabled: !!user });
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    setTabs(prev => {
      const exists = prev.find(t => t.path === path);
      const tabInfo = ROUTE_LABELS[path] || { label: 'Page', icon: <FileText className="h-3.5 w-3.5" /> };
      if (!exists && path.startsWith('/dashboard')) {
        return [...prev, { id: path, label: tabInfo.label, path, icon: tabInfo.icon }];
      }
      return prev;
    });
    setActiveTab(path);
  }, [location.pathname]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); setShowSearch(true); return; }
      if (e.key === '1') { e.preventDefault(); navigate('/dashboard/ide'); return; }
      if (e.key === '2') { e.preventDefault(); navigate('/dashboard/sql'); return; }
      if (e.key === '3') { e.preventDefault(); navigate('/dashboard/studio'); return; }
      if (e.key === '4') { e.preventDefault(); navigate('/dashboard/ai'); return; }
      if (e.key === '5') { e.preventDefault(); navigate('/dashboard/datasources'); return; }
      if (e.key === '6') { e.preventDefault(); navigate('/dashboard/workspace'); return; }
      if (e.key === ',') { e.preventDefault(); navigate('/dashboard/settings'); return; }
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); navigate('/dashboard'); return; }
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setSidebarCollapsed(v => !v); return; }
    }
    if (e.key === 'Escape') { setShowSearch(false); setShowNotifications(false); }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTab === tabId && newTabs.length > 0) {
        const last = newTabs[newTabs.length - 1];
        navigate(last.path);
        setActiveTab(last.path);
      } else if (newTabs.length === 0) {
        navigate('/dashboard');
      }
      return newTabs;
    });
  };

  const isActive = (path: string) => location.pathname === path;
  const filteredCommands = COMMAND_PALETTE_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const pathParts = location.pathname.split('/').filter(Boolean);
  const usagePercent = aiUsage ? Math.min((aiUsage.daily / aiUsage.limit) * 100, 100) : 0;

  return (
    <div className="ds-shell">
      {/* Title bar */}
      <header className="ds-titlebar">
        <div className="ds-titlebar-brand">
          <div className="ds-titlebar-logo" style={{ background: 'linear-gradient(135deg, #007acc 0%, #1a8ad4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database className="h-4 w-4" style={{ color: '#fff' }} />
          </div>
          <span className="ds-titlebar-name">DataSuite</span>
          <span className="ds-titlebar-sub">Enterprise</span>
          {user?.role === 'admin' && (
            <button className="ds-badge accent ml-1" onClick={() => navigate('/admin')}>Admin</button>
          )}
          <div className="ds-titlebar-divider" />
          <button className="ds-icon-btn" onClick={() => navigate(-1)} title="Back">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="ds-icon-btn" onClick={() => navigate(1)} title="Forward">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="ds-command-trigger" onClick={() => setShowSearch(true)}>
          <Search className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
          <span>Search commands, pages, and actions</span>
          <kbd className="ds-kbd">Ctrl+K</kbd>
        </div>

        <div className="flex items-center gap-1">
          <button className="ds-icon-btn" onClick={() => setSidebarCollapsed(v => !v)} title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button className="ds-icon-btn relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ background: 'var(--ds-error)', fontSize: 9, padding: '0 3px' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="ds-notif-panel">
                <div className="ds-notif-header">
                  <span>Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button className="text-[11px]" style={{ color: 'var(--ds-accent)' }} onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                    <button className="ds-icon-btn" style={{ width: 22, height: 22 }} onClick={() => setShowNotifications(false)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} className={cn('ds-notif-item', !n.read && 'unread')}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                      <NotificationIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: 'var(--ds-text)' }}>{n.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>{n.message}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--ds-text-dim)' }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-7 px-2 rounded-sm hover:bg-[var(--ds-hover)] transition-colors">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'var(--ds-accent)', color: '#fff' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs max-w-[100px] truncate" style={{ color: 'var(--ds-text-muted)' }}>
                  {user?.name || 'User'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" style={{ background: 'var(--ds-sidebar)', border: '1px solid var(--ds-border)' }}>
              <DropdownMenuLabel style={{ color: 'var(--ds-text)' }}>
                <div className="flex flex-col gap-1">
                  <span className="text-sm">{user?.name || 'User'}</span>
                  <span className="text-[11px] font-normal" style={{ color: 'var(--ds-text-dim)' }}>{user?.email || user?.unionId || ''}</span>
                  <span className="ds-badge accent w-fit mt-1">{(user?.tier || 'free').replace('_', ' ')}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: 'var(--ds-border-subtle)' }} />
              <DropdownMenuItem onClick={() => navigate('/dashboard')} style={{ color: 'var(--ds-text-muted)' }}>
                <Home className="h-4 w-4 mr-2" /> Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} style={{ color: 'var(--ds-text-muted)' }}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')} style={{ color: 'var(--ds-accent)' }}>
                  <Shield className="h-4 w-4 mr-2" /> Administration
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator style={{ background: 'var(--ds-border-subtle)' }} />
              <DropdownMenuItem onClick={logout} style={{ color: 'var(--ds-error)' }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Workbench */}
      <div className="ds-workbench">
        {/* Activity bar */}
        <nav className="ds-activity-bar" aria-label="Primary navigation">
          {ACTIVITY_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={cn('ds-activity-item', isActive(item.path) && 'active')}
                onClick={() => navigate(item.path)} title={item.title}>
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
          <div className="ds-activity-spacer" />
          <button className={cn('ds-activity-item', isActive('/dashboard/settings') && 'active')}
            onClick={() => navigate('/dashboard/settings')} title="Settings">
            <Settings className="h-5 w-5" />
          </button>
          {user?.role === 'admin' && (
            <button className={cn('ds-activity-item', isActive('/admin') && 'active')}
              onClick={() => navigate('/admin')} title="Administration">
              <Shield className="h-5 w-5" />
            </button>
          )}
        </nav>

        {/* Sidebar */}
        <aside className={cn('ds-sidebar', sidebarCollapsed && 'collapsed')}>
          <div className="ds-sidebar-header">
            <span>Explorer</span>
            <button className="ds-icon-btn" style={{ width: 22, height: 22 }} onClick={() => setSidebarCollapsed(true)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {NAV_SECTIONS.map(section => (
              <div key={section.label} className="ds-sidebar-section">
                <div className="ds-sidebar-section-label">{section.label}</div>
                {section.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} className={cn('ds-nav-item', isActive(item.path) && 'active')}
                      onClick={() => navigate(item.path)}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {user?.role === 'admin' && (
              <div className="ds-sidebar-section">
                <div className="ds-sidebar-section-label">Administration</div>
                <button className={cn('ds-nav-item', isActive('/admin') && 'active')} onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4" />
                  <span>Admin Console</span>
                </button>
              </div>
            )}
          </div>

          {aiUsage && (
            <div className="ds-sidebar-footer">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ds-text-dim)' }}>AI Usage</span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--ds-text-dim)' }}>
                  {aiUsage.daily}/{aiUsage.limit}
                </span>
              </div>
              <div className="ds-usage-bar">
                <div className={cn('ds-usage-fill', usagePercent > 90 && 'critical', usagePercent > 70 && usagePercent <= 90 && 'warn')}
                  style={{ width: `${usagePercent}%` }} />
              </div>
            </div>
          )}
        </aside>

        {/* Editor area */}
        <div className="ds-editor-area">
          {tabs.length > 0 && (
            <div className="ds-tab-strip">
              {tabs.map(tab => (
                <button key={tab.id} className={cn('ds-tab', activeTab === tab.path && 'active')}
                  onClick={() => { setActiveTab(tab.path); navigate(tab.path); }}>
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className="ds-tab-close" onClick={(e) => closeTab(e, tab.id)}>
                    <X className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="ds-breadcrumb">
            <span>DataSuite</span>
            {pathParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 ds-breadcrumb-sep" />
                <span className={i === pathParts.length - 1 ? 'ds-breadcrumb-current' : ''}>
                  {part.replace(/-/g, ' ')}
                </span>
              </span>
            ))}
          </div>

          <main className="ds-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Status bar */}
      <footer className="ds-statusbar">
        <div className="ds-statusbar-left">
          <span className="ds-status-item clickable">
            <GitBranch className="h-3 w-3" /> main
          </span>
          <span className="ds-status-divider" />
          <span className="ds-status-item">
            <CheckCircle2 className="h-3 w-3" /> No issues
          </span>
          <span className="ds-status-divider" />
          <span className="ds-status-item clickable" onClick={() => navigate('/dashboard')}>
            DataSuite v2.0
          </span>
        </div>
        <div className="ds-statusbar-right">
          <span className="ds-status-item">
            <Wifi className="h-3 w-3" /> Connected
          </span>
          <span className="ds-status-divider" />
          <span className="ds-status-item">{(user?.tier || 'free').replace('_', ' ')}</span>
          <span className="ds-status-divider" />
          <span className="ds-status-item">
            <Clock className="h-3 w-3" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </footer>

      {/* Command palette */}
      <Dialog open={showSearch} onOpenChange={open => { setShowSearch(open); if (!open) setSearchQuery(''); }}>
        <DialogContent className="ds-palette sm:max-w-lg">
          <div className="ds-palette-input-row">
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--ds-text-dim)' }} />
            <Input
              placeholder="Type a command or search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <kbd className="ds-kbd">ESC</kbd>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <div className="ds-palette-section">
              <div className="ds-palette-section-label">
                {searchQuery ? `Results for "${searchQuery}"` : 'Navigation'}
              </div>
              {filteredCommands.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className="ds-palette-item"
                    onClick={() => { navigate(item.path); setShowSearch(false); setSearchQuery(''); }}>
                    <div className="flex items-center">
                      <span className="ds-palette-item-icon"><Icon className="h-3.5 w-3.5" /></span>
                      {item.label}
                    </div>
                    <kbd className="ds-kbd">{item.shortcut}</kbd>
                  </button>
                );
              })}
              {filteredCommands.length === 0 && (
                <p className="text-center py-8 text-xs" style={{ color: 'var(--ds-text-dim)' }}>
                  No commands found for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

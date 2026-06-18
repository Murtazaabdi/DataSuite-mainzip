import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bot,
  Shield,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const adminNavItems = [
  { id: '', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/admin' },
  { id: 'users', label: 'User Management', icon: <Users className="h-5 w-5" />, path: '/admin/users' },
  { id: 'audit', label: 'Audit Logs', icon: <ClipboardList className="h-5 w-5" />, path: '/admin/audit' },
  { id: 'ai-config', label: 'AI Configuration', icon: <Bot className="h-5 w-5" />, path: '/admin/ai-config' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0B1120' }}>
      {/* Admin Header */}
      <header
        className="flex items-center justify-between px-4 border-b"
        style={{
          height: 48,
          background: '#151E32',
          borderColor: 'rgba(148, 163, 184, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
          >
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Admin Panel</span>
          <div
            className="px-2 py-0.5 rounded text-xs"
            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}
          >
            2FA Protected
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={() => navigate('/dashboard')}
            style={{ color: '#94A3B8' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to App
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={logout}
            style={{ color: '#F43F5E' }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Sidebar */}
        <aside
          className="w-56 border-r"
          style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.1)' }}
        >
          <ScrollArea className="h-full">
            <div className="py-2">
              {adminNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: isActive(item.path) ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    borderLeft: isActive(item.path) ? '3px solid #8B5CF6' : '3px solid transparent',
                    color: isActive(item.path) ? '#8B5CF6' : '#94A3B8',
                  }}
                  onMouseEnter={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Admin Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'rgba(148, 163, 184, 0.1)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', color: '#fff' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#F1F5F9' }}>{user?.name || 'Admin'}</div>
                  <div className="text-xs" style={{ color: '#64748B' }}>Administrator</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

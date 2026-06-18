import { trpc } from '@/providers/trpc';
import {
  ClipboardList,
  Download,
  Filter,
  Search,
  Shield,
  Ban,
  UserX,
  Settings,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const actionIcons: Record<string, React.ReactNode> = {
  'USER_APPROVED': <CheckCircle2 className="h-4 w-4" style={{ color: '#10B981' }} />,
  'USER_REJECTED': <UserX className="h-4 w-4" style={{ color: '#F43F5E' }} />,
  'USER_SUSPENDED': <Ban className="h-4 w-4" style={{ color: '#F59E0B' }} />,
  'USER_UPDATED': <Settings className="h-4 w-4" style={{ color: '#3B82F6' }} />,
  'AI_CONFIG_UPDATED': <Shield className="h-4 w-4" style={{ color: '#8B5CF6' }} />,
};

const actionColors: Record<string, string> = {
  'USER_APPROVED': '#10B981',
  'USER_REJECTED': '#F43F5E',
  'USER_SUSPENDED': '#F59E0B',
  'USER_UPDATED': '#3B82F6',
  'AI_CONFIG_UPDATED': '#8B5CF6',
};

export default function AdminAuditLogs() {
  const { data: logs, isLoading } = trpc.admin.listAuditLogs.useQuery();

  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>Audit Logs</h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Immutable record of all admin actions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4 border-0" style={{ background: '#151E32' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#64748B' }} />
              <Input
                placeholder="Search logs..."
                className="pl-9 h-9 text-sm"
                style={{ background: '#1E293B', borderColor: 'rgba(148, 163, 184, 0.2)', color: '#F1F5F9' }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 overflow-hidden" style={{ background: '#151E32' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1E293B' }}>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Target</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8" style={{ color: '#64748B' }}>
                      Loading logs...
                    </td>
                  </tr>
                ) : !logs?.length ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12" style={{ color: '#64748B' }}>
                        <ClipboardList className="h-8 w-8 mb-3" />
                        <p className="text-sm">No audit logs yet</p>
                        <p className="text-xs">Logs will appear when admin actions are taken</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0B1120'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-1.5 rounded"
                            style={{ background: `${actionColors[log.action] || '#64748B'}15` }}
                          >
                            {actionIcons[log.action] || <Info className="h-4 w-4" style={{ color: '#64748B' }} />}
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: '#F1F5F9' }}>
                              {log.action.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs" style={{ color: '#64748B' }}>{log.entityType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', color: '#fff' }}
                          >
                            {log.userName?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <span className="text-xs" style={{ color: '#94A3B8' }}>{log.userName || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: '#94A3B8' }}>
                          {log.entityId || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-xs font-mono"
                          style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#64748B' }}
                        >
                          {log.ipAddress || '127.0.0.1'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: '#64748B' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Banner */}
        <div
          className="mt-4 p-4 rounded-lg flex items-start gap-3"
          style={{ background: '#1E293B', border: '1px solid rgba(148, 163, 184, 0.1)' }}
        >
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
          <div>
            <div className="text-xs font-medium" style={{ color: '#F1F5F9' }}>Immutable Audit Trail</div>
            <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>
              Audit logs cannot be modified or deleted. They provide a permanent record of all administrative actions for compliance and security purposes.
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Users,
  Search,
  Shield,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#F59E0B15', text: '#F59E0B' },
  approved: { bg: '#10B98115', text: '#10B981' },
  rejected: { bg: '#F43F5E15', text: '#F43F5E' },
  suspended: { bg: '#64748B15', text: '#64748B' },
};

const tierColors: Record<string, string> = {
  free: '#64748B',
  analyst: '#3B82F6',
  data_scientist: '#8B5CF6',
  enterprise: '#F59E0B',
};

export default function AdminUsers() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const utils = trpc.useUtils();

  const { data: usersData, isLoading } = trpc.admin.listUsers.useQuery(
    statusFilter !== 'all' ? { status: statusFilter as any } : undefined
  );

  const approveMutation = trpc.admin.approveUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const rejectMutation = trpc.admin.rejectUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const suspendMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const filteredUsers = usersData?.users.filter(u =>
    searchQuery === '' ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>User Management</h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Manage users, approvals, and access</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs" style={{ borderColor: '#3B82F6', color: '#3B82F6' }}>
              <Users className="h-3 w-3 mr-1" />
              {usersData?.total ?? 0} total
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4 border-0" style={{ background: '#151E32' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#64748B' }} />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
                style={{ background: '#1E293B', borderColor: 'rgba(148, 163, 184, 0.2)', color: '#F1F5F9' }}
              />
            </div>
            <div className="flex items-center gap-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'suspended', label: 'Suspended' },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className="px-3 py-1.5 rounded-md text-xs transition-colors"
                  style={{
                    background: statusFilter === filter.value ? '#243447' : 'transparent',
                    color: statusFilter === filter.value ? '#F1F5F9' : '#94A3B8',
                    border: statusFilter === filter.value ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid transparent',
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="border-0 overflow-hidden" style={{ background: '#151E32' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1E293B' }}>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#94A3B8' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: '#64748B' }}>
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: '#64748B' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const sColors = statusColors[user.status] || statusColors.pending;
                    const tColor = tierColors[user.tier] || '#64748B';
                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#0B1120'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff' }}
                            >
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ color: '#F1F5F9' }}>{user.name || 'Unnamed'}</div>
                              <div className="text-xs" style={{ color: '#64748B' }}>{user.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                            style={{ borderColor: tColor, color: tColor, background: `${tColor}15` }}
                          >
                            {user.tier}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                            style={{ borderColor: sColors.text, color: sColors.text, background: sColors.bg }}
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {user.role === 'admin' ? (
                              <>
                                <Shield className="h-3.5 w-3.5" style={{ color: '#8B5CF6' }} />
                                <span className="text-xs" style={{ color: '#8B5CF6' }}>Admin</span>
                              </>
                            ) : (
                              <span className="text-xs" style={{ color: '#94A3B8' }}>User</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: '#64748B' }}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => approveMutation.mutate({ id: user.id })}
                                  className="p-1.5 rounded"
                                  title="Approve"
                                  onMouseEnter={e => { e.currentTarget.style.background = '#10B98120'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <CheckCircle2 className="h-4 w-4" style={{ color: '#10B981' }} />
                                </button>
                                <button
                                  onClick={() => rejectMutation.mutate({ id: user.id })}
                                  className="p-1.5 rounded"
                                  title="Reject"
                                  onMouseEnter={e => { e.currentTarget.style.background = '#F43F5E20'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <XCircle className="h-4 w-4" style={{ color: '#F43F5E' }} />
                                </button>
                              </>
                            )}
                            {user.status === 'approved' && (
                              <button
                                onClick={() => suspendMutation.mutate({ id: user.id })}
                                className="p-1.5 rounded"
                                title="Suspend"
                                onMouseEnter={e => { e.currentTarget.style.background = '#F59E0B20'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Ban className="h-4 w-4" style={{ color: '#F59E0B' }} />
                              </button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded" style={{ color: '#64748B' }}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent style={{ background: '#151E32', borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                                <DropdownMenuItem style={{ color: '#94A3B8' }}>View Details</DropdownMenuItem>
                                <DropdownMenuItem style={{ color: '#94A3B8' }}>Edit User</DropdownMenuItem>
                                <DropdownMenuItem style={{ color: '#F43F5E' }}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}

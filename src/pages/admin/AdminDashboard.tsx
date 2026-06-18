import { trpc } from '@/providers/trpc';
import {
  Users,
  Shield,
  Activity,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const mockActivity = [
  { action: 'User approved', user: 'john@example.com', admin: 'Admin', time: '2 min ago', type: 'success' },
  { action: 'Payment received', user: 'sarah@example.com', admin: 'System', time: '15 min ago', type: 'info' },
  { action: 'Login attempt blocked', user: 'unknown@example.com', admin: 'System', time: '1 hour ago', type: 'warning' },
  { action: 'AI key updated', user: '-', admin: 'Admin', time: '2 hours ago', type: 'info' },
  { action: 'User suspended', user: 'spam@example.com', admin: 'Admin', time: '3 hours ago', type: 'warning' },
  { action: 'New registration', user: 'mike@example.com', admin: 'System', time: '5 hours ago', type: 'success' },
  { action: 'Audit log exported', user: '-', admin: 'Admin', time: '1 day ago', type: 'info' },
];

const usageData = [
  { day: 'Mon', requests: 245, users: 18 },
  { day: 'Tue', requests: 312, users: 22 },
  { day: 'Wed', requests: 287, users: 20 },
  { day: 'Thu', requests: 356, users: 25 },
  { day: 'Fri', requests: 298, users: 21 },
  { day: 'Sat', requests: 156, users: 12 },
  { day: 'Sun', requests: 134, users: 10 },
];

export default function AdminDashboard() {
  const { data: stats } = trpc.admin.stats.useQuery();

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: '#3B82F6',
      change: '+12%',
    },
    {
      label: 'Pending Approval',
      value: stats?.pendingUsers ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: '#F59E0B',
      change: '3 new',
    },
    {
      label: 'Admin Users',
      value: stats?.adminUsers ?? 0,
      icon: <Shield className="h-5 w-5" />,
      color: '#8B5CF6',
      change: 'Active',
    },
    {
      label: 'AI Usage Today',
      value: stats?.aiUsageToday ?? 0,
      icon: <Bot className="h-5 w-5" />,
      color: '#10B981',
      change: '+8%',
    },
  ];

  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>Admin Dashboard</h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Platform overview and key metrics</p>
          </div>
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: '#10B981', color: '#10B981', background: '#10B98115' }}
          >
            <Activity className="h-3 w-3 mr-1" />
            All Systems Operational
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <Card
              key={i}
              className="p-5 border-0"
              style={{ background: '#151E32' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <span className="text-xs" style={{ color: '#64748B' }}>{stat.change}</span>
              </div>
              <div className="text-2xl font-semibold mb-1" style={{ color: '#F1F5F9' }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-3 gap-6">
          {/* AI Usage Chart */}
          <Card className="col-span-2 p-5 border-0" style={{ background: '#151E32' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium" style={{ color: '#F1F5F9' }}>AI Usage This Week</div>
                <div className="text-xs" style={{ color: '#64748B' }}>Requests and active users</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />
                  <span className="text-xs" style={{ color: '#94A3B8' }}>Requests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                  <span className="text-xs" style={{ color: '#94A3B8' }}>Users</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#151E32',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
                <Bar dataKey="requests" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Recent Activity */}
          <Card className="p-5 border-0" style={{ background: '#151E32' }}>
            <div className="text-sm font-medium mb-4" style={{ color: '#F1F5F9' }}>Recent Activity</div>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {mockActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {item.type === 'success' && <CheckCircle2 className="h-4 w-4" style={{ color: '#10B981' }} />}
                      {item.type === 'warning' && <AlertTriangle className="h-4 w-4" style={{ color: '#F59E0B' }} />}
                      {item.type === 'info' && <Info className="h-4 w-4" style={{ color: '#3B82F6' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs" style={{ color: '#F1F5F9' }}>{item.action}</div>
                      {item.user !== '-' && (
                        <div className="text-xs truncate" style={{ color: '#64748B' }}>{item.user}</div>
                      )}
                      <div className="text-xs" style={{ color: '#475569' }}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

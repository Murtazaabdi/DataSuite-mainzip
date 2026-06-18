import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Users,
  MessageSquare,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const providers = [
  { id: 'kimi', name: 'Kimi (Moonshot)', status: 'active', color: '#8B5CF6', description: 'Primary AI provider - no API key needed' },
  { id: 'deepseek', name: 'DeepSeek', status: 'available', color: '#3B82F6', description: 'DeepSeek V3 - requires API key' },
  { id: 'qwen', name: 'Qwen (Alibaba)', status: 'available', color: '#F59E0B', description: 'Qwen series - requires API key' },
  { id: 'mistral', name: 'Mistral', status: 'available', color: '#10B981', description: 'Mistral models - requires API key' },
];

const tierLimits = [
  { tier: 'free', requests: 50, color: '#64748B' },
  { tier: 'analyst', requests: 500, color: '#3B82F6' },
  { tier: 'data_scientist', requests: 5000, color: '#8B5CF6' },
  { tier: 'enterprise', requests: 999999, color: '#F59E0B' },
];

export default function AdminAIConfig() {
  const { data: usageOverview } = trpc.admin.aiUsageOverview.useQuery();
  const [activeProvider, setActiveProvider] = useState('kimi');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  const handleTestConnection = (providerId: string) => {
    setTestStatus(prev => ({ ...prev, [providerId]: 'testing' }));
    setTimeout(() => {
      setTestStatus(prev => ({ ...prev, [providerId]: providerId === 'kimi' ? 'success' : 'error' }));
    }, 1500);
  };

  return (
    <ScrollArea className="h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>AI Configuration</h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Manage AI providers, API keys, and usage limits</p>
          </div>
          <Badge
            variant="outline"
            className="text-xs gap-1"
            style={{ borderColor: '#10B981', color: '#10B981', background: '#10B98115' }}
          >
            <Sparkles className="h-3 w-3" />
            AI Active
          </Badge>
        </div>

        {/* Usage Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-0" style={{ background: '#151E32' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: '#8B5CF615', color: '#8B5CF6' }}>
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>{usageOverview?.daily ?? 0}</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Requests Today</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0" style={{ background: '#151E32' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: '#3B82F615', color: '#3B82F6' }}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>{usageOverview?.topUsers?.length ?? 0}</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Active Users</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0" style={{ background: '#151E32' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: '#10B98115', color: '#10B981' }}>
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>
                  {providers.filter(p => p.status === 'active').length}/{providers.length}
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Providers Active</div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Providers */}
        <div className="mb-8">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#F1F5F9' }}>AI Providers</h2>
          <div className="space-y-3">
            {providers.map(provider => (
              <Card
                key={provider.id}
                className="p-5 border-0"
                style={{
                  background: '#151E32',
                  border: provider.id === activeProvider ? '1px solid #3B82F6' : '1px solid transparent',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${provider.color}15`, color: provider.color }}
                    >
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{provider.name}</span>
                        {provider.status === 'active' ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: '#10B981', color: '#10B981', background: '#10B98115' }}
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: '#64748B', color: '#64748B', background: '#64748B15' }}
                          >
                            Available
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>{provider.description}</p>

                      {provider.id !== 'kimi' && (
                        <div className="flex items-center gap-3">
                          <Input
                            type="password"
                            placeholder={`Enter ${provider.name} API key`}
                            value={apiKeys[provider.id] || ''}
                            onChange={e => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                            className="h-8 text-xs max-w-sm font-mono"
                            style={{ background: '#1E293B', borderColor: 'rgba(148, 163, 184, 0.2)', color: '#F1F5F9' }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}
                            onClick={() => handleTestConnection(provider.id)}
                          >
                            {testStatus[provider.id] === 'testing' ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : testStatus[provider.id] === 'success' ? (
                              <CheckCircle2 className="h-3 w-3" style={{ color: '#10B981' }} />
                            ) : testStatus[provider.id] === 'error' ? (
                              <AlertCircle className="h-3 w-3" style={{ color: '#F43F5E' }} />
                            ) : null}
                            Test
                          </Button>
                        </div>
                      )}

                      {provider.id === 'kimi' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" style={{ color: '#10B981' }} />
                          <span className="text-xs" style={{ color: '#10B981' }}>
                            Built-in integration - no API key required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {provider.id === activeProvider ? (
                      <Badge
                        className="text-xs"
                        style={{ background: '#3B82F6', color: '#fff' }}
                      >
                        Selected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setActiveProvider(provider.id)}
                        style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Usage Limits */}
        <div className="mb-8">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#F1F5F9' }}>Usage Limits by Tier</h2>
          <Card className="p-5 border-0" style={{ background: '#151E32' }}>
            <div className="space-y-4">
              {tierLimits.map(tier => (
                <div key={tier.tier} className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="w-32 justify-center text-xs capitalize"
                    style={{ borderColor: tier.color, color: tier.color, background: `${tier.color}15` }}
                  >
                    {tier.tier.replace('_', ' ')}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#94A3B8' }}>Daily AI Requests</span>
                      <span className="text-xs font-medium" style={{ color: '#F1F5F9' }}>
                        {tier.requests === 999999 ? 'Unlimited' : tier.requests}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: '#1E293B' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: tier.requests === 999999 ? '100%' : `${(tier.requests / 5000) * 100}%`, background: tier.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="text-xs"
            style={{ borderColor: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}
          >
            Reset to Defaults
          </Button>
          <Button className="text-xs gap-2" style={{ background: '#3B82F6' }}>
            <Save className="h-3.5 w-3.5" />
            Save Configuration
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

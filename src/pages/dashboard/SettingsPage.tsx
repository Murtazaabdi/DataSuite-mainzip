import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import {
  User,
  CreditCard,
  Shield,
  Bell,
  Monitor,
  CheckCircle2,
  Loader2,
  Smartphone,
  Copy,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const tabs = [
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
];

const tierInfo: Record<string, { name: string; color: string; price: string; features: string[] }> = {
  free: {
    name: 'Free',
    color: 'var(--ds-text-dim)',
    price: '$0',
    features: ['Basic IDE', 'SQLite only', '1 Dashboard', '50 AI requests/day'],
  },
  analyst: {
    name: 'Analyst',
    color: 'var(--ds-accent)',
    price: '$29/mo',
    features: ['Full IDE', 'PostgreSQL schema', '10 Dashboards', '500 AI requests/day', 'CSV upload'],
  },
  data_scientist: {
    name: 'Data Scientist',
    color: 'var(--ds-accent)',
    price: '$79/mo',
    features: ['Unlimited IDE', '200GB storage', 'Unlimited dashboards', '5,000 AI requests/day', 'Team sharing'],
  },
  enterprise: {
    name: 'Enterprise',
    color: 'var(--ds-warning)',
    price: '$299/mo',
    features: ['Dedicated support', 'SLA', 'White-label', 'Unlimited everything'],
  },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [totpCode, setTotpCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUrl, setTotpUrl] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    marketing: false,
    security: true,
  });

  const { data: twoFAStatus } = trpc.user.get2FAStatus.useQuery();
  const { refetch: setup2FARefetch } = trpc.user.setup2FA.useQuery(undefined, { enabled: false });
  const verify2FAMutation = trpc.user.verify2FA.useMutation();
  const disable2FAMutation = trpc.user.disable2FA.useMutation();
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    },
  });
  const utils = trpc.useUtils();

  const tier = tierInfo[user?.tier || 'free'];

  const handleSetup2FA = async () => {
    const { data } = await setup2FARefetch();
    if (data) {
      setTotpSecret(data.secret);
      setTotpUrl(data.otpauthUrl);
      setTwoFactorStep('setup');
    }
  };

  const handleVerify2FA = async () => {
    if (totpCode.length !== 6) return;
    const result = await verify2FAMutation.mutateAsync({ code: totpCode });
    if (result.success) {
      setTwoFactorStep('idle');
      setTotpCode('');
      utils.user.get2FAStatus.invalidate();
      toast({ title: '2FA Enabled', description: 'Two-factor authentication is now active.' });
    } else {
      toast({ title: 'Verification Failed', description: result.message, variant: 'destructive' });
    }
  };

  const handleDisable2FA = async () => {
    if (totpCode.length !== 6) return;
    const result = await disable2FAMutation.mutateAsync({ code: totpCode });
    if (result.success) {
      setTotpCode('');
      utils.user.get2FAStatus.invalidate();
      toast({ title: '2FA Disabled', description: 'Two-factor authentication has been turned off.' });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    updateProfileMutation.mutate({ name: profileName.trim() });
  };

  return (
    <div className="h-full flex">
      {/* Settings Sidebar */}
      <div
        className="w-56 border-r"
        style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
      >
        <ScrollArea className="h-full">
          <div className="p-3">
            <div className="text-xs font-medium mb-3 px-2" style={{ color: 'var(--ds-text-dim)' }}>SETTINGS</div>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded text-left transition-colors"
                style={{
                  background: activeTab === tab.id ? 'var(--ds-hover)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--ds-text)' : 'var(--ds-text-muted)',
                  borderLeft: activeTab === tab.id ? '2px solid var(--ds-accent)' : '2px solid transparent',
                }}
              >
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto py-8 px-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--ds-text)' }}>Profile</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--ds-text-muted)' }}>Manage your personal information</p>

              <Card className="p-6 mb-4 border-0" style={{ background: 'var(--ds-panel)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold"
                    style={{ background: 'linear-gradient(135deg, var(--ds-accent), var(--ds-accent))', color: '#fff' }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>{user?.name || 'User'}</div>
                    <div className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>{user?.email || ''}</div>
                    <Badge
                      variant="outline"
                      className="mt-1 text-xs"
                      style={{ borderColor: 'var(--ds-accent)', color: 'var(--ds-accent)', background: 'rgba(0, 122, 204, 0.08)' }}
                    >
                      {tier.name}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>Full Name</label>
                    <Input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="h-9 text-sm"
                      style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>Email</label>
                    <Input
                      defaultValue={user?.email || ''}
                      readOnly
                      className="h-9 text-sm"
                      style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text-dim)' }}
                    />
                  </div>
                  <Button
                    className="text-xs"
                    style={{ background: 'var(--ds-accent)' }}
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending || !profileName.trim()}
                  >
                    {updateProfileMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Save Changes
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--ds-text)' }}>Billing</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--ds-text-muted)' }}>Manage your subscription and usage</p>

              <Card className="p-6 mb-4 border-0" style={{ background: '#151E32' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>Current Plan</div>
                    <div className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Your subscription details</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1"
                    style={{ borderColor: tier.color, color: tier.color, background: `${tier.color}15` }}
                  >
                    {tier.name} — {tier.price}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--ds-success)' }} />
                      <span className="text-sm" style={{ color: 'var(--ds-text)' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button className="text-xs" style={{ background: '#3B82F6' }}>
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" className="text-xs" style={{ borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text-dim)' }}>
                    Cancel Subscription
                  </Button>
                </div>
              </Card>

              {/* Usage Meters */}
              <Card className="p-6 border-0" style={{ background: 'var(--ds-panel)' }}>
                <div className="text-sm font-medium mb-4" style={{ color: 'var(--ds-text)' }}>Usage This Period</div>
                {[
                  { label: 'AI Requests', used: 234, limit: 500, color: 'var(--ds-accent)' },
                  { label: 'Dashboards', used: 3, limit: 10, color: 'var(--ds-accent)' },
                  { label: 'Storage', used: 12, limit: 50, color: 'var(--ds-success)', unit: 'GB' },
                ].map((meter, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>{meter.label}</span>
                      <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>
                        {meter.used}{meter.unit || ''} / {meter.limit}{meter.unit || ''}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--ds-input)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((meter.used / meter.limit) * 100, 100)}%`,
                          background: meter.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--ds-text)' }}>Security</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--ds-text-muted)' }}>Manage your account security settings</p>

              {/* Two-Factor Authentication */}
              <Card className="p-6 mb-4 border-0" style={{ background: 'var(--ds-panel)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                      <Smartphone className="h-5 w-5" style={{ color: 'var(--ds-accent)' }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>Two-Factor Authentication</div>
                      <div className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Add an extra layer of security</div>
                    </div>
                  </div>
                  {twoFAStatus?.enabled ? (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ds-success)', color: 'var(--ds-success)', background: 'var(--ds-success)15' }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ds-text-dim)', color: 'var(--ds-text-dim)', background: 'var(--ds-text-dim)15' }}>
                      Disabled
                    </Badge>
                  )}
                </div>

                {twoFactorStep === 'idle' && !twoFAStatus?.enabled && (
                  <div>
                    <p className="text-xs mb-4" style={{ color: 'var(--ds-text-muted)' }}>
                      When enabled, you'll need to enter a code from your authenticator app each time you log in.
                    </p>
                    <Button
                      onClick={handleSetup2FA}
                      className="text-xs gap-2"
                      style={{ background: 'var(--ds-accent)' }}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                )}

                {twoFactorStep === 'idle' && twoFAStatus?.enabled && (
                  <div>
                    <p className="text-xs mb-4" style={{ color: 'var(--ds-text-muted)' }}>
                      2FA is currently enabled. To disable it, enter your 6-digit code.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-9 w-32 text-center text-sm font-mono"
                        style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                      />
                      <Button
                        onClick={handleDisable2FA}
                        disabled={totpCode.length !== 6 || disable2FAMutation.isPending}
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: 'var(--ds-error)', color: 'var(--ds-error)' }}
                      >
                        {disable2FAMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                )}

                {twoFactorStep === 'setup' && (
                  <div>
                    <p className="text-xs mb-4" style={{ color: 'var(--ds-text-muted)' }}>
                      Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code.
                    </p>

                    {/* QR Code Display */}
                    <div className="flex items-center gap-6 mb-6">
                      <div
                        className="rounded-lg flex items-center justify-center"
                        style={{ background: '#fff', padding: 12 }}
                      >
                        {totpUrl && (
                          <QRCodeSVG
                            value={totpUrl}
                            size={140}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="M"
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-xs mb-2" style={{ color: 'var(--ds-text-muted)' }}>Secret Key (manual entry)</div>
                        <div className="flex items-center gap-2">
                          <code
                            className="text-xs font-mono px-3 py-1.5 rounded"
                            style={{ background: 'var(--ds-input)', color: 'var(--ds-text)' }}
                          >
                            {totpSecret}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(totpSecret);
                              toast({ title: 'Copied', description: 'Secret key copied to clipboard' });
                            }}
                            className="p-1.5 rounded"
                            style={{ color: 'var(--ds-text-dim)' }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="h-9 w-40 text-sm font-mono"
                        style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                      />
                      <Button
                        onClick={handleVerify2FA}
                        disabled={totpCode.length !== 6 || verify2FAMutation.isPending}
                        className="text-xs gap-2"
                        style={{ background: 'var(--ds-success)' }}
                      >
                        {verify2FAMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        Verify & Enable
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setTwoFactorStep('idle'); setTotpCode(''); }}
                        className="text-xs"
                        style={{ color: 'var(--ds-text-muted)' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Change Password */}
              <Card className="p-6 border-0" style={{ background: 'var(--ds-panel)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <Shield className="h-5 w-5" style={{ color: 'var(--ds-accent)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>Change Password</div>
                    <div className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Update your password regularly</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Current password"
                    className="h-9 text-sm"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    className="h-9 text-sm"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="h-9 text-sm"
                    style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                  />
                  <Button className="text-xs" style={{ background: 'var(--ds-accent)' }}>
                    Update Password
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--ds-text)' }}>Notifications</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--ds-text-muted)' }}>Choose how you want to be notified</p>

              <Card className="p-6 border-0" style={{ background: 'var(--ds-panel)' }}>
                {[
                  { id: 'email', label: 'Email Notifications', description: 'Receive updates via email', icon: <Bell className="h-4 w-4" /> },
                  { id: 'browser', label: 'Browser Notifications', description: 'Show desktop notifications', icon: <Monitor className="h-4 w-4" /> },
                  { id: 'security', label: 'Security Alerts', description: 'Get notified about security events', icon: <Shield className="h-4 w-4" /> },
                  { id: 'marketing', label: 'Marketing Updates', description: 'Product news and feature announcements', icon: <Bell className="h-4 w-4" /> },
                ].map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4"
                    style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ color: 'var(--ds-text-muted)' }}>{item.icon}</div>
                      <div>
                        <div className="text-sm" style={{ color: 'var(--ds-text)' }}>{item.label}</div>
                        <div className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>{item.description}</div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.id as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, [item.id]: checked }))
                      }
                    />
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

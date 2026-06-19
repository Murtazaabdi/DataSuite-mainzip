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
  ExternalLink,
  Key,
  LogIn,
  Trash2,
  ChevronRight,
  AlertCircle,
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

const WIZARD_STEPS = [
  { id: 1, label: 'Google Cloud Console' },
  { id: 2, label: 'Paste Credentials' },
  { id: 3, label: 'Confirm' },
];

function GoogleOAuthWizard() {
  const { toast } = useToast();
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const utils = trpc.useUtils();
  const { data: oauthData, isLoading } = trpc.admin.getOAuthConfig.useQuery();
  const saveMutation = trpc.admin.saveGoogleOAuth.useMutation({
    onSuccess: () => {
      toast({ title: 'Google OAuth Saved', description: 'Credentials stored successfully.' });
      utils.admin.getOAuthConfig.invalidate();
      setShowEditForm(false);
      setWizardStep(1);
      setClientId('');
      setClientSecret('');
    },
    onError: (err) => {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    },
  });
  const clearMutation = trpc.admin.clearGoogleOAuth.useMutation({
    onSuccess: () => {
      toast({ title: 'Google OAuth Cleared', description: 'Credentials have been removed.' });
      utils.admin.getOAuthConfig.invalidate();
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const redirectUri = `${window.location.origin}/api/oauth/google/callback`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied', description: `${label} copied to clipboard` });
    });
  };

  const handleSave = () => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    saveMutation.mutate({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });
  };

  const configured = oauthData?.google?.configured ?? false;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4" style={{ color: 'var(--ds-text-dim)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Loading OAuth config…</span>
      </div>
    );
  }

  return (
    <Card className="p-6 mb-4 border-0" style={{ background: 'var(--ds-panel)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(66, 133, 244, 0.12)' }}>
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.147-3.2-.42-4.704H24.48v8.896h12.932c-.556 3.004-2.244 5.548-4.784 7.26v6.036h7.748c4.532-4.176 7.156-10.32 7.156-17.488z" fill="#4285F4"/>
              <path d="M24.48 48c6.48 0 11.916-2.148 15.888-5.828l-7.748-6.036c-2.148 1.44-4.9 2.288-8.14 2.288-6.26 0-11.564-4.228-13.464-9.908H2.976v6.232C6.932 42.876 15.14 48 24.48 48z" fill="#34A853"/>
              <path d="M11.016 28.516A14.437 14.437 0 0 1 10.26 24c0-1.572.272-3.096.756-4.516v-6.232H2.976A23.982 23.982 0 0 0 .48 24c0 3.868.928 7.528 2.496 10.748l8.04-6.232z" fill="#FBBC05"/>
              <path d="M24.48 9.576c3.524 0 6.688 1.212 9.176 3.588l6.876-6.876C36.392 2.384 30.956 0 24.48 0 15.14 0 6.932 5.124 2.976 13.252l8.04 6.232c1.9-5.68 7.204-9.908 13.464-9.908z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>Google Sign-In</div>
            <div className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Allow users to sign in with their Google account</div>
          </div>
        </div>
        {configured ? (
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: 'var(--ds-success)', color: 'var(--ds-success)', background: 'rgba(22,163,74,0.1)' }}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: 'var(--ds-text-dim)', color: 'var(--ds-text-dim)', background: 'rgba(110,110,110,0.1)' }}
          >
            Not configured
          </Badge>
        )}
      </div>

      {/* Configured state — show summary and actions */}
      {configured && !showEditForm && (
        <div>
          <div
            className="rounded-lg p-3 mb-4 flex items-start gap-3"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--ds-success)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--ds-success)' }}>Google OAuth is active</div>
              <div className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                Client ID: <span className="font-mono" style={{ color: 'var(--ds-text)' }}>
                  {oauthData?.google?.clientId
                    ? `${oauthData.google.clientId.slice(0, 12)}…`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => { setShowEditForm(true); setWizardStep(2); }}
              style={{ borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text-muted)' }}
            >
              <Key className="h-3.5 w-3.5" />
              Update Credentials
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              style={{ borderColor: 'rgba(239,68,68,0.5)', color: 'var(--ds-error)' }}
            >
              {clearMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />}
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Setup wizard */}
      {(!configured || showEditForm) && (
        <div>
          {/* Step indicators */}
          <div className="flex items-center gap-0 mb-6">
            {WIZARD_STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      background: wizardStep === step.id
                        ? 'var(--ds-accent)'
                        : wizardStep > step.id
                        ? 'var(--ds-success)'
                        : 'var(--ds-input)',
                      color: wizardStep >= step.id ? '#fff' : 'var(--ds-text-dim)',
                    }}
                  >
                    {wizardStep > step.id ? <CheckCircle2 className="h-3 w-3" /> : step.id}
                  </div>
                  <span
                    className="text-xs hidden sm:block"
                    style={{ color: wizardStep === step.id ? 'var(--ds-text)' : 'var(--ds-text-dim)' }}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 mx-2 flex-shrink-0" style={{ color: 'var(--ds-border-subtle)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Instructions */}
          {wizardStep === 1 && (
            <div>
              <div className="text-xs font-medium mb-3" style={{ color: 'var(--ds-text)' }}>
                Create a Google OAuth App
              </div>
              <ol className="space-y-3 mb-5">
                {[
                  <>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--ds-accent)' }}>Google Cloud Console → Credentials</a></>,
                  <>Click <strong style={{ color: 'var(--ds-text)' }}>+ Create Credentials</strong> → <strong style={{ color: 'var(--ds-text)' }}>OAuth client ID</strong></>,
                  <>Set Application type to <strong style={{ color: 'var(--ds-text)' }}>Web application</strong></>,
                  <>Under <strong style={{ color: 'var(--ds-text)' }}>Authorized redirect URIs</strong>, add the URI below</>,
                  <>Copy your <strong style={{ color: 'var(--ds-text)' }}>Client ID</strong> and <strong style={{ color: 'var(--ds-text)' }}>Client Secret</strong></>,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-px"
                      style={{ background: 'var(--ds-input)', color: 'var(--ds-text-dim)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>{item}</span>
                  </li>
                ))}
              </ol>

              {/* Redirect URI */}
              <div className="mb-5">
                <div className="text-xs mb-1.5 font-medium" style={{ color: 'var(--ds-text-muted)' }}>
                  Authorized Redirect URI
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--ds-input)', border: '1px solid var(--ds-border-subtle)' }}
                >
                  <code className="text-xs flex-1 font-mono truncate" style={{ color: 'var(--ds-text)' }}>
                    {redirectUri}
                  </code>
                  <button
                    onClick={() => handleCopy(redirectUri, 'Redirect URI')}
                    className="p-1 rounded flex-shrink-0 hover:opacity-75 transition-opacity"
                    style={{ color: 'var(--ds-text-dim)' }}
                    title="Copy redirect URI"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-3 w-3" style={{ color: 'var(--ds-warning)' }} />
                  <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>
                    This exact URI must be added to your Google OAuth app
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="text-xs gap-1.5"
                  style={{ background: 'var(--ds-accent)' }}
                  onClick={() => setWizardStep(2)}
                >
                  I've created the app
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    style={{ borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text-muted)' }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Google Console
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Step 2: Paste credentials */}
          {wizardStep === 2 && (
            <div>
              <div className="text-xs font-medium mb-3" style={{ color: 'var(--ds-text)' }}>
                Paste your Google OAuth credentials
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs block mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>
                    Client ID
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
                    <Input
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      placeholder="123456789-abcdefghijk.apps.googleusercontent.com"
                      className="h-9 text-xs pl-9 font-mono"
                      style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--ds-text-dim)' }}>
                    Ends with <code className="font-mono">.apps.googleusercontent.com</code>
                  </p>
                </div>
                <div>
                  <label className="text-xs block mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>
                    Client Secret
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
                    <Input
                      type="password"
                      value={clientSecret}
                      onChange={e => setClientSecret(e.target.value)}
                      placeholder="GOCSPX-…"
                      className="h-9 text-xs pl-9 font-mono"
                      style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text)' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--ds-text-dim)' }}>
                    Starts with <code className="font-mono">GOCSPX-</code>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="text-xs gap-1.5"
                  style={{ background: 'var(--ds-accent)' }}
                  disabled={!clientId.trim() || !clientSecret.trim()}
                  onClick={() => setWizardStep(3)}
                >
                  Review
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  style={{ color: 'var(--ds-text-dim)' }}
                  onClick={() => { setWizardStep(1); setClientId(''); setClientSecret(''); }}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm and save */}
          {wizardStep === 3 && (
            <div>
              <div className="text-xs font-medium mb-3" style={{ color: 'var(--ds-text)' }}>
                Confirm and save credentials
              </div>
              <div
                className="rounded-lg p-4 mb-5 space-y-3"
                style={{ background: 'var(--ds-input)', border: '1px solid var(--ds-border-subtle)' }}
              >
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--ds-text-dim)' }}>Client ID</div>
                  <div className="text-xs font-mono break-all" style={{ color: 'var(--ds-text)' }}>{clientId}</div>
                </div>
                <div style={{ height: 1, background: 'var(--ds-border-subtle)' }} />
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--ds-text-dim)' }}>Client Secret</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--ds-text)' }}>
                    {clientSecret.slice(0, 8)}{'•'.repeat(Math.max(0, clientSecret.length - 8))}
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--ds-border-subtle)' }} />
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--ds-text-dim)' }}>Redirect URI</div>
                  <div className="text-xs font-mono break-all" style={{ color: 'var(--ds-text-muted)' }}>{redirectUri}</div>
                </div>
              </div>
              <div
                className="flex items-center gap-2 mb-4 p-3 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--ds-accent)' }} />
                <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                  Credentials are stored securely on the server. Never share your Client Secret publicly.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="text-xs gap-1.5"
                  style={{ background: 'var(--ds-success)' }}
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <LogIn className="h-3.5 w-3.5" />}
                  Save & Enable Google Sign-In
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  style={{ color: 'var(--ds-text-dim)' }}
                  onClick={() => setWizardStep(2)}
                  disabled={saveMutation.isPending}
                >
                  Back
                </Button>
                {showEditForm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs ml-auto"
                    style={{ color: 'var(--ds-text-dim)' }}
                    onClick={() => { setShowEditForm(false); setWizardStep(1); setClientId(''); setClientSecret(''); }}
                    disabled={saveMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

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

  const isAdmin = user?.role === 'admin';

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

              {/* Google OAuth Wizard — admins only */}
              {isAdmin && <GoogleOAuthWizard />}

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

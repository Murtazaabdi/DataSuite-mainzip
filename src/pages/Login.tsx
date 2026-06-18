import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trpc } from '@/providers/trpc';
import {
  Shield,
  Database,
  ArrowRight,
  Smartphone,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  Check,
  LineChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type AuthMode = 'signin' | 'register' | '2fa';

const INPUT_STYLE = {
  background: '#1A2540',
  borderColor: 'rgba(148, 163, 184, 0.15)',
  color: '#F1F5F9',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Store credentials to reuse in the TOTP step
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: providers } = trpc.auth.oauthProviders.useQuery();
  const loginMutation = trpc.auth.loginEmail.useMutation();
  const loginTotpMutation = trpc.auth.loginTotp.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'google_denied' || err === 'yandex_denied') {
      setError('OAuth sign-in was cancelled.');
    } else if (err === 'google_failed' || err === 'yandex_failed') {
      setError('OAuth sign-in failed. Please try again.');
    }
  }, [searchParams]);

  const totpCode = totpDigits.join('');

  const handleEmailSignIn = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.requires2FA) {
        // Store credentials for the TOTP step and switch view
        setPendingEmail(email);
        setPendingPassword(password);
        setTotpDigits(['', '', '', '', '', '']);
        setMode('2fa');
        setTimeout(() => totpRefs.current[0]?.focus(), 100);
      } else {
        navigate('/dashboard');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    }
  };

  const handleTotpVerify = async () => {
    if (totpCode.length !== 6) return;
    setError('');
    try {
      await loginTotpMutation.mutateAsync({
        email: pendingEmail,
        password: pendingPassword,
        totpCode,
      });
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
      setTotpDigits(['', '', '', '', '', '']);
      setTimeout(() => totpRefs.current[0]?.focus(), 50);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      await registerMutation.mutateAsync({ name, email, password });
      setSuccess('Account created! Signing you in...');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    }
  };

  const handleTotpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...totpDigits];
    newDigits[index] = digit;
    setTotpDigits(newDigits);

    if (digit && index < 5) {
      totpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are filled
    if (digit && index === 5) {
      const code = newDigits.join('');
      if (code.length === 6) {
        setTimeout(() => handleTotpVerifyWithCode(code), 50);
      }
    }
  };

  const handleTotpDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      totpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && totpCode.length === 6) {
      handleTotpVerify();
    }
  };

  const handleTotpVerifyWithCode = async (code: string) => {
    setError('');
    try {
      await loginTotpMutation.mutateAsync({
        email: pendingEmail,
        password: pendingPassword,
        totpCode: code,
      });
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
      setTotpDigits(['', '', '', '', '', '']);
      setTimeout(() => totpRefs.current[0]?.focus(), 50);
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || loginTotpMutation.isPending;

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.07) 0%, transparent 60%), #060D1A',
      }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#F1F5F9', letterSpacing: '-0.01em' }}>
              DS<span style={{ color: '#3B82F6' }}>-PaaS</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>Enterprise Data Science Platform</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#111827',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Tab switcher — hidden on 2FA step */}
          {mode !== '2fa' && (
            <div className="flex border-b" style={{ borderColor: 'rgba(148,163,184,0.1)' }}>
              {(['signin', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-3.5 text-sm font-medium transition-colors"
                  style={{
                    color: mode === m ? '#F1F5F9' : '#64748B',
                    borderBottom: mode === m ? '2px solid #3B82F6' : '2px solid transparent',
                    background: 'transparent',
                  }}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          <div className="p-6">
            {/* Error / Success banners */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#F43F5E' }} />
                <span className="text-xs" style={{ color: '#FDA4AF' }}>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#10B981' }} />
                <span className="text-xs" style={{ color: '#6EE7B7' }}>{success}</span>
              </div>
            )}

            {/* ── Sign In Form ── */}
            {mode === 'signin' && (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs block mb-1.5 font-medium" style={{ color: '#94A3B8' }}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEmailSignIn()}
                        className="h-10 text-sm pl-9"
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>Password</label>
                      <button className="text-xs" style={{ color: '#3B82F6' }}>Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEmailSignIn()}
                        className="h-10 text-sm pl-9 pr-10"
                        style={INPUT_STYLE}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#475569' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-10 text-sm mb-4 font-medium"
                  style={{ background: '#3B82F6', color: '#fff' }}
                  onClick={handleEmailSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>

                <Divider />
                <OAuthButtons providers={providers} />
              </>
            )}

            {/* ── Register Form ── */}
            {mode === 'register' && (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs block mb-1.5 font-medium" style={{ color: '#94A3B8' }}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="h-10 text-sm pl-9"
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5 font-medium" style={{ color: '#94A3B8' }}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="h-10 text-sm pl-9"
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5 font-medium" style={{ color: '#94A3B8' }}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="h-10 text-sm pl-9 pr-10"
                        style={INPUT_STYLE}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#475569' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password strength */}
                    {password && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              background: i < passwordStrength(password)
                                ? ['#F43F5E', '#F59E0B', '#06B6D4', '#10B981'][passwordStrength(password) - 1]
                                : 'rgba(148,163,184,0.15)',
                            }}
                          />
                        ))}
                        <span className="text-xs" style={{ color: '#64748B' }}>
                          {['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength(password)]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5 font-medium" style={{ color: '#94A3B8' }}>Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        className="h-10 text-sm pl-9"
                        style={{
                          ...INPUT_STYLE,
                          borderColor: confirmPassword && confirmPassword !== password
                            ? 'rgba(244,63,94,0.5)'
                            : confirmPassword && confirmPassword === password
                              ? 'rgba(16,185,129,0.5)'
                              : INPUT_STYLE.borderColor,
                        }}
                      />
                      {confirmPassword === password && confirmPassword && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#10B981' }} />
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs mb-4 leading-relaxed" style={{ color: '#475569' }}>
                  By creating an account you agree to our{' '}
                  <span style={{ color: '#3B82F6', cursor: 'pointer' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span style={{ color: '#3B82F6', cursor: 'pointer' }}>Privacy Policy</span>.
                </p>

                <Button
                  className="w-full h-10 text-sm mb-4 font-medium"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff' }}
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>

                <Divider />
                <OAuthButtons providers={providers} />
              </>
            )}

            {/* ── 2FA Step ── */}
            {mode === '2fa' && (
              <>
                <div className="text-center mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(139, 92, 246, 0.15)' }}
                  >
                    <Smartphone className="h-6 w-6" style={{ color: '#8B5CF6' }} />
                  </div>
                  <h2 className="text-base font-semibold mb-1" style={{ color: '#F1F5F9' }}>Two-Factor Authentication</h2>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                {/* Individual digit inputs */}
                <div className="flex justify-center gap-2 mb-6">
                  {totpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { totpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleTotpDigitChange(i, e.target.value)}
                      onKeyDown={e => handleTotpDigitKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                      className="w-11 h-12 text-center text-lg font-mono rounded-lg outline-none transition-all"
                      style={{
                        background: '#1A2540',
                        border: `2px solid ${digit ? '#8B5CF6' : 'rgba(148, 163, 184, 0.15)'}`,
                        color: '#F1F5F9',
                        caretColor: 'transparent',
                      }}
                    />
                  ))}
                </div>

                <Button
                  className="w-full h-10 text-sm mb-3 font-medium"
                  style={{ background: '#8B5CF6', color: '#fff' }}
                  disabled={totpCode.length !== 6 || isLoading}
                  onClick={handleTotpVerify}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                  {!isLoading && <Check className="h-4 w-4" />}
                </Button>

                <button
                  onClick={() => { switchMode('signin'); setPendingEmail(''); setPendingPassword(''); }}
                  className="w-full text-center text-xs py-2"
                  style={{ color: '#64748B' }}
                >
                  ← Back to sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer badges */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            {[
              { icon: <Shield className="h-3 w-3" />, label: 'SOC 2 Compliant' },
              { icon: <KeyRound className="h-3 w-3" />, label: '256-bit Encryption' },
              { icon: <Database className="h-3 w-3" />, label: 'GDPR Ready' },
            ].map(b => (
              <Badge key={b.label} variant="outline" className="text-xs gap-1" style={{ borderColor: 'rgba(148,163,184,0.15)', color: '#475569', background: 'transparent' }}>
                {b.icon}
                {b.label}
              </Badge>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#334155' }}>Protected by enterprise-grade security.</p>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4" style={{ color: '#334155' }}>
      <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,0.1)' }} />
      <span className="text-xs">or continue with</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(148,163,184,0.1)' }} />
    </div>
  );
}

function OAuthButtons({ providers }: { providers?: { google: boolean; yandex: boolean; kimi: boolean } }) {
  return (
    <div className="space-y-2.5">
      {/* Google */}
      <button
        onClick={() => { window.location.href = '/api/oauth/google'; }}
        disabled={!providers?.google}
        className="w-full h-10 flex items-center justify-center gap-3 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: providers?.google ? '#fff' : 'rgba(255,255,255,0.05)',
          color: providers?.google ? '#1F2937' : '#64748B',
          border: '1px solid rgba(148,163,184,0.15)',
        }}
        onMouseEnter={e => { if (providers?.google) (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
        onMouseLeave={e => { if (providers?.google) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
      >
        <GoogleIcon />
        {providers?.google ? 'Continue with Google' : 'Google (not configured)'}
      </button>

      {/* Yandex */}
      <button
        onClick={() => { window.location.href = '/api/oauth/yandex'; }}
        disabled={!providers?.yandex}
        className="w-full h-10 flex items-center justify-center gap-3 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: providers?.yandex ? '#FC3F1D' : 'rgba(252,63,29,0.08)',
          color: '#fff',
          border: '1px solid rgba(252,63,29,0.3)',
        }}
        onMouseEnter={e => { if (providers?.yandex) (e.currentTarget as HTMLElement).style.background = '#e53520'; }}
        onMouseLeave={e => { if (providers?.yandex) (e.currentTarget as HTMLElement).style.background = providers?.yandex ? '#FC3F1D' : 'rgba(252,63,29,0.08)'; }}
      >
        <YandexIcon />
        {providers?.yandex ? 'Continue with Yandex' : 'Yandex (not configured)'}
      </button>
    </div>
  );
}

function passwordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M14.35 2H12.5C9.08 2 7 3.9 7 7.05c0 2.5 1.18 4.05 3.5 5.6L7 22h3.1l3.35-8.9 3.4 8.9H20L14.35 2zm-1.9 9.9c-1.65-1.15-2.4-2.2-2.4-4C10.05 5.4 11.15 4.3 13 4.3h1l2.85 7.6c-1.2.15-2.5-.25-4.4 0z" />
    </svg>
  );
}

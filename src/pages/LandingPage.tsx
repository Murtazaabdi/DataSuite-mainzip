import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Database,
  Code2,
  BarChart3,
  Zap,
  GitBranch,
  Lock,
  Users,
  ChevronRight,
  Star,
  Check,
  Bot,
  LineChart,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: <Code2 className="h-6 w-6" />,
    title: 'Multi-Language IDE',
    description: 'Python, R, SQL, and JavaScript with full syntax highlighting, autocomplete, and animated terminal output.',
    color: '#3B82F6',
    badge: 'Monaco Editor',
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: 'SQL Workbench',
    description: 'Query your data warehouse with a powerful editor, schema browser, CSV export, and one-click query saving.',
    color: '#10B981',
    badge: 'Auto-format',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Dashboard Studio',
    description: 'Build interactive dashboards with drag-and-drop KPI widgets, live charts, and team sharing.',
    color: '#06B6D4',
    badge: 'Recharts',
  },
  {
    icon: <Bot className="h-6 w-6" />,
    title: 'AI Analyst',
    description: 'Chat with Kimi AI to write SQL, analyze data, explain trends, and generate code — in plain language.',
    color: '#8B5CF6',
    badge: 'Kimi AI',
  },
  {
    icon: <FileCode className="h-6 w-6" />,
    title: 'Workspace & Docs',
    description: 'Notebooks, markdown docs, and team workspaces with embedded code, rich formatting, and auto-save.',
    color: '#F43F5E',
    badge: 'Markdown',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Enterprise Security',
    description: 'RBAC, 2FA, audit logs, encrypted secrets, SOC 2-ready compliance controls, and admin panel.',
    color: '#F59E0B',
    badge: 'SOC 2',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<200ms', label: 'Query Response' },
  { value: '10TB+', label: 'Data Processed' },
  { value: 'SOC 2', label: 'Compliant' },
];

const testimonials = [
  {
    quote: 'DS-PaaS cut our data team\'s workflow in half. The SQL Workbench + AI Analyst combo is genuinely game-changing.',
    name: 'Sarah Chen',
    role: 'Head of Data, FinTech Corp',
    avatar: 'SC',
  },
  {
    quote: 'Finally a platform that combines the IDE experience with enterprise-grade dashboards. Our analysts love it.',
    name: 'Marcus Webb',
    role: 'VP Engineering, RetailCo',
    avatar: 'MW',
  },
  {
    quote: 'The Kimi AI integration means junior analysts can produce senior-level SQL in minutes. ROI was immediate.',
    name: 'Yuki Tanaka',
    role: 'Data Science Lead, HealthTech',
    avatar: 'YT',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    desc: 'For individuals exploring data science',
    features: ['5 Dashboards', 'IDE with 3 languages', '50 AI requests/day', '1 GB storage', 'Community support'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    desc: 'For data professionals and small teams',
    features: ['Unlimited dashboards', 'All languages + extensions', '500 AI requests/day', '100 GB storage', 'Priority support', 'Team workspaces'],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large teams with compliance needs',
    features: ['Everything in Pro', 'SSO / SAML', 'Audit logs & RBAC', 'SLA guarantee', 'Dedicated CSM', 'On-prem option'],
    cta: 'Contact sales',
    highlight: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#050A14', minHeight: '100vh', color: '#F1F5F9' }}>

      {/* ── Navbar ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '0 5vw',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.3s, border-color 0.3s',
          background: scrolled ? 'rgba(5, 10, 20, 0.85)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(148,163,184,0.1)' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LineChart style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.03em', color: '#F1F5F9' }}>
            DS<span style={{ color: '#3B82F6' }}>-PaaS</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[
            { label: 'Features', id: 'features' },
            { label: 'Platform', id: 'platform' },
            { label: 'Pricing', id: 'pricing' },
            { label: 'Testimonials', id: 'testimonials' },
          ].map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(241,245,249,0.6)',
                fontSize: 14,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F1F5F9')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(241,245,249,0.6)')}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: 'rgba(241,245,249,0.7)', fontSize: 13 }}
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
          <Button
            size="sm"
            style={{ background: '#3B82F6', color: '#fff', fontSize: 13 }}
            onClick={() => navigate('/login')}
          >
            Get started
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 6vw 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '20%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '25%', right: '15%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Eyebrow badge */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <Badge
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60A5FA',
              padding: '5px 14px',
              fontSize: 12,
              letterSpacing: '0.08em',
            }}
          >
            <Sparkles style={{ width: 11, height: 11, marginRight: 6 }} />
            Enterprise Data Science Platform — Powered by Kimi AI
          </Badge>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(38px, 6vw, 88px)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            maxWidth: 900,
            marginBottom: 28,
            position: 'relative',
          }}
        >
          <span style={{ color: '#F1F5F9' }}>Your entire data stack,</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            in one platform.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(15px, 1.4vw, 20px)',
            color: 'rgba(148,163,184,0.9)',
            maxWidth: 640,
            lineHeight: 1.7,
            marginBottom: 48,
            position: 'relative',
          }}
        >
          DS-PaaS combines a VSCode-grade IDE, SQL workbench, BI dashboards, and an AI analyst
          into a single enterprise workspace — so your team can move from raw data to insight in minutes.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          <Button
            size="lg"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              color: '#fff',
              fontSize: 15,
              padding: '12px 28px',
              boxShadow: '0 8px 30px rgba(59,130,246,0.35)',
            }}
            onClick={() => navigate('/login')}
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            style={{
              borderColor: 'rgba(148,163,184,0.25)',
              color: '#F1F5F9',
              fontSize: 15,
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.03)',
            }}
            onClick={() => scrollTo('features')}
          >
            <Sparkles className="h-4 w-4" />
            See the platform
          </Button>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 28, marginTop: 56, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          {['SOC 2 Compliant', '256-bit Encryption', 'GDPR Ready', 'RBAC & SSO'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(148,163,184,0.5)', fontSize: 12, letterSpacing: '0.04em' }}>
              <Shield style={{ width: 12, height: 12 }} />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section
        style={{
          padding: '40px 6vw',
          borderTop: '1px solid rgba(148,163,184,0.08)',
          borderBottom: '1px solid rgba(148,163,184,0.08)',
          background: 'rgba(21,30,50,0.5)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '100px 6vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: '#3B82F6', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>EVERYTHING YOU NEED</p>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Built for data teams that move fast
            </h2>
            <p style={{ color: '#64748B', maxWidth: 560, margin: '0 auto', fontSize: 16, lineHeight: 1.7 }}>
              Every tool your data team needs — tightly integrated, beautifully designed, and production-ready.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '28px 24px',
                  borderRadius: 16,
                  background: '#111827',
                  border: '1px solid rgba(148,163,184,0.08)',
                  transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${f.color}30`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${f.color}12`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.08)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: `${f.color}15`, color: f.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 6,
                      background: `${f.color}12`, color: f.color,
                      border: `1px solid ${f.color}25`, letterSpacing: '0.05em',
                    }}
                  >
                    {f.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform showcase ── */}
      <section
        id="platform"
        style={{
          padding: '80px 6vw',
          background: 'linear-gradient(180deg, rgba(17,24,39,0.6) 0%, rgba(5,10,20,0) 100%)',
          borderTop: '1px solid rgba(148,163,184,0.07)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <p style={{ color: '#8B5CF6', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>AI-FIRST WORKFLOW</p>
              <h2 style={{ fontSize: 'clamp(26px,3vw,42px)', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.02em' }}>
                From raw data to insight in minutes
              </h2>
              <p style={{ color: '#64748B', lineHeight: 1.7, marginBottom: 32, fontSize: 15 }}>
                Kimi AI understands your entire data context — schema, query history, and business domain. Ask it anything
                and get SQL, Python code, chart recommendations, or plain-English explanations instantly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <Zap style={{ width: 16, height: 16 }} />, text: 'AI writes SQL from plain English descriptions', color: '#F59E0B' },
                  { icon: <BarChart3 style={{ width: 16, height: 16 }} />, text: 'Auto-generates dashboard layouts from your data', color: '#06B6D4' },
                  { icon: <Code2 style={{ width: 16, height: 16 }} />, text: 'Explains query performance and suggests optimizations', color: '#3B82F6' },
                  { icon: <GitBranch style={{ width: 16, height: 16 }} />, text: 'Version-controlled notebooks and workspace docs', color: '#10B981' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(148,163,184,0.85)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                style={{ marginTop: 36, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', color: '#fff', fontSize: 14 }}
                onClick={() => navigate('/login')}
              >
                Try AI Analyst free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Mock UI preview */}
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.12)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                background: '#0D1526',
              }}
            >
              {/* Mock title bar */}
              <div style={{ padding: '12px 16px', background: '#151E32', borderBottom: '1px solid rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#F43F5E','#F59E0B','#10B981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#475569' }}>AI Analyst — Kimi AI</div>
              </div>
              {/* Mock chat */}
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { role: 'user', text: 'Show me revenue by region for Q4, highlight the top performer' },
                  { role: 'ai', text: 'Here\'s the SQL query for that:\n\n```sql\nSELECT region,\n  SUM(revenue) AS total_revenue,\n  RANK() OVER (ORDER BY SUM(revenue) DESC) AS rank\nFROM sales\nWHERE quarter = \'Q4\'\nGROUP BY region\nORDER BY total_revenue DESC;\n```\n\nNorth region leads at $2.4M, 18% above Q3. Run this in SQL Workbench?' },
                  { role: 'user', text: 'Yes, and build a bar chart dashboard for it' },
                  { role: 'ai', text: '✓ Query saved · Dashboard "Q4 Revenue by Region" created with bar chart widget. Opening in Studio...' },
                ].map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role === 'ai' && (
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles style={{ width: 13, height: 13, color: '#fff' }} />
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                        background: msg.role === 'user' ? 'linear-gradient(135deg,#3B82F6,#2563EB)' : '#1A2540',
                        border: msg.role === 'ai' ? '1px solid rgba(148,163,184,0.1)' : 'none',
                        fontSize: 12,
                        color: '#E2E8F0',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {/* Typing indicator */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles style={{ width: 13, height: 13, color: '#fff' }} />
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: '#1A2540', border: '1px solid rgba(148,163,184,0.1)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0,0.2,0.4].map(d => (
                      <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', animation: 'bounce 1.2s infinite', animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '100px 6vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: '#10B981', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>TRUSTED BY DATA TEAMS</p>
            <h2 style={{ fontSize: 'clamp(26px,3vw,42px)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
              Teams that run on DS-PaaS
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '28px 24px',
                  borderRadius: 16,
                  background: '#111827',
                  border: '1px solid rgba(148,163,184,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} style={{ width: 13, height: 13, color: '#F59E0B', fill: '#F59E0B' }} />)}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.85)', lineHeight: 1.7, flex: 1 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        style={{
          padding: '100px 6vw',
          background: 'rgba(17,24,39,0.4)',
          borderTop: '1px solid rgba(148,163,184,0.07)',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: '#06B6D4', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>SIMPLE PRICING</p>
            <h2 style={{ fontSize: 'clamp(26px,3vw,42px)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Start free, scale when you're ready
            </h2>
            <p style={{ color: '#64748B', fontSize: 15 }}>No credit card required for Starter plan.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {plans.map((plan, i) => (
              <div
                key={i}
                style={{
                  padding: '32px 28px',
                  borderRadius: 20,
                  background: plan.highlight ? 'linear-gradient(160deg, #1a2a4a, #111827)' : '#111827',
                  border: plan.highlight ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(148,163,184,0.08)',
                  position: 'relative',
                  boxShadow: plan.highlight ? '0 0 40px rgba(59,130,246,0.12)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: '#64748B' }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{plan.desc}</p>
                </div>

                <Button
                  style={{
                    width: '100%',
                    marginBottom: 24,
                    background: plan.highlight ? 'linear-gradient(135deg,#3B82F6,#2563EB)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    border: plan.highlight ? 'none' : '1px solid rgba(148,163,184,0.15)',
                    fontSize: 13,
                  }}
                  onClick={() => navigate('/login')}
                >
                  {plan.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check style={{ width: 10, height: 10, color: '#10B981' }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.8)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise row */}
          <div
            style={{
              marginTop: 24, padding: '20px 28px',
              borderRadius: 14, background: '#111827',
              border: '1px solid rgba(148,163,184,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock style={{ width: 18, height: 18, color: '#F59E0B' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>Need custom compliance, on-prem, or 1000+ seats?</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>We'll design a deployment that fits your security and governance requirements.</div>
              </div>
            </div>
            <Button
              variant="outline"
              style={{ borderColor: 'rgba(148,163,184,0.2)', color: '#F1F5F9', whiteSpace: 'nowrap', fontSize: 13 }}
              onClick={() => navigate('/login')}
            >
              <Users className="h-4 w-4" />
              Talk to sales
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '100px 6vw', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,3.5vw,52px)', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.025em', marginBottom: 20 }}>
            Ready to supercharge<br />your data team?
          </h2>
          <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Join data teams using DS-PaaS to go from raw data to boardroom dashboards — in the same platform.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              size="lg"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#fff', fontSize: 15, padding: '13px 32px',
                boxShadow: '0 8px 30px rgba(59,130,246,0.3)',
              }}
              onClick={() => navigate('/login')}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              style={{ borderColor: 'rgba(148,163,184,0.2)', color: '#F1F5F9', fontSize: 15, padding: '13px 32px' }}
              onClick={() => navigate('/login')}
            >
              Sign in
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '40px 6vw', borderTop: '1px solid rgba(148,163,184,0.08)', background: '#050A14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LineChart style={{ width: 14, height: 14, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>DS-PaaS</span>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Privacy', 'Terms', 'Security', 'Docs', 'Status'].map(l => (
              <span key={l} style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#334155' }}>© 2026 DS-PaaS. All rights reserved.</div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

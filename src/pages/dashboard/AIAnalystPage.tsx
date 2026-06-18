import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  MessageSquare,
  BarChart3,
  Code2,
  Database,
  ChevronLeft,
  ChevronRight,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Download,
  Clock,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  { icon: <Code2 className="h-4 w-4" />, label: 'Write SQL', prompt: 'Write a SQL query to analyze monthly revenue by region and product line, showing growth vs previous month', color: 'var(--ds-accent)' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Dashboard Design', prompt: 'Design a KPI dashboard for a SaaS company showing MRR, churn, CAC, and LTV with recommended chart types', color: 'var(--ds-accent)' },
  { icon: <Database className="h-4 w-4" />, label: 'Data Analysis', prompt: 'Analyze customer churn patterns: what signals indicate a customer is likely to churn and how to predict it?', color: 'var(--ds-accent)' },
  { icon: <Zap className="h-4 w-4" />, label: 'Optimize Query', prompt: 'My SQL query is slow. Here is the query: SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id WHERE created_at > \'2024-01-01\'', color: 'var(--ds-accent)' },
  { icon: <Code2 className="h-4 w-4" />, label: 'Python Code', prompt: 'Write a Python script using pandas and matplotlib to create a cohort analysis chart from transaction data', color: 'var(--ds-accent)' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'ML Model', prompt: 'Build a simple linear regression model in Python to predict next month\'s sales based on marketing spend and seasonality', color: 'var(--ds-accent)' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="p-1 rounded transition-all"
      style={{ color: copied ? 'var(--ds-success)' : 'var(--ds-text-dim)' }}
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function MessageBubble({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg"
          style={{ background: 'var(--ds-sidebar)', border: '1px solid var(--ds-border-subtle)' }}
        >
          <Bot className="h-4 w-4" style={{ color: 'var(--ds-accent)' }} />
        </div>
      )}

      <div className="max-w-2xl">
        <div
          className="px-4 py-3 rounded-2xl relative"
          style={{
            background: isUser ? 'var(--ds-accent)' : 'var(--ds-sidebar)',
            border: isUser ? 'none' : '1px solid var(--ds-border-subtle)',
            boxShadow: isUser ? '0 4px 15px rgba(0,122,204,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="text-sm prose prose-invert prose-sm max-w-none leading-relaxed"
            style={{ color: isUser ? '#fff' : 'var(--ds-text)' }}
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          />
          <div className="flex items-center justify-between mt-2 pt-1 border-t" style={{ borderColor: isUser ? 'rgba(255,255,255,0.15)' : 'var(--ds-border-subtle)' }}>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" style={{ color: isUser ? 'rgba(255,255,255,0.4)' : 'var(--ds-text-dim)' }} />
              <span className="text-xs" style={{ color: isUser ? 'rgba(255,255,255,0.4)' : 'var(--ds-text-dim)' }}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
              {!isUser && onRetry && (
                <button onClick={onRetry} className="p-1 rounded" style={{ color: 'var(--ds-text-dim)' }} title="Regenerate">
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
          style={{ background: 'var(--ds-accent)' }}
        >
          <User className="h-4 w-4" style={{ color: '#FFFFFF' }} />
        </div>
      )}
    </div>
  );
}

export default function AIAnalystPage() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();
  const { data: conversations } = trpc.ai.listConversations.useQuery();
  const { data: usage } = trpc.ai.getUsage.useQuery();
  const sendMessageMutation = trpc.ai.sendMessage.useMutation();
  const createConversationMutation = trpc.ai.createConversation.useMutation();
  const deleteConversationMutation = trpc.ai.deleteConversation.useMutation();
  const { data: conversationData } = trpc.ai.getConversation.useQuery(
    { id: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(
        conversationData.messages.map(m => ({
          id: String(m.id),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      );
    }
  }, [conversationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewConversation = async () => {
    const result = await createConversationMutation.mutateAsync({ title: 'New Conversation' });
    setActiveConversationId(result.id);
    setMessages([]);
    utils.ai.listConversations.invalidate();
  };

  const handleSendMessage = async (overrideContent?: string) => {
    const content = (overrideContent ?? inputValue).trim();
    if (!content || isLoading) return;

    setInputValue('');
    setCharCount(0);
    setIsLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      const result = await createConversationMutation.mutateAsync({
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      });
      convId = result.id;
      setActiveConversationId(result.id);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        conversationId: convId!,
        content,
      });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      }]);
      utils.ai.getUsage.invalidate();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** ${errorMsg}\n\nPlease try again. If the issue persists, check your API configuration in Settings.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      utils.ai.listConversations.invalidate();
    }
  };

  const handleDeleteConversation = async (id: number) => {
    await deleteConversationMutation.mutateAsync({ id });
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    utils.ai.listConversations.invalidate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const exportConversation = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toISOString()}\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${activeConversationId || 'new'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const usagePercent = usage ? Math.min((usage.daily / usage.limit) * 100, 100) : 0;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="w-64 border-r flex flex-col flex-shrink-0"
          style={{ background: 'var(--ds-sidebar)', borderColor: 'var(--ds-border-subtle)' }}
        >
          <div className="p-3 space-y-2">
            <Button
              onClick={handleNewConversation}
              className="w-full gap-2 text-white text-sm h-9"
              style={{ background: 'var(--ds-accent)' }}
              disabled={createConversationMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            {messages.length > 0 && (
              <Button
                onClick={exportConversation}
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-xs h-7"
                style={{ color: 'var(--ds-text-dim)' }}
              >
                <Download className="h-3.5 w-3.5" />
                Export Conversation
              </Button>
            )}
          </div>

          <div className="mx-3 mb-2" style={{ height: 1, background: 'var(--ds-border-subtle)' }} />

          <ScrollArea className="flex-1">
            <div className="px-3 py-2">
              <div className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--ds-text-dim)' }}>
                Conversations ({conversations?.length ?? 0})
              </div>
              {conversations?.length === 0 && (
                <div className="text-center py-6">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--ds-border)' }} />
                  <p className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>No conversations yet</p>
                </div>
              )}
              {conversations?.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group mb-0.5"
                  style={{
                    background: activeConversationId === conv.id ? 'var(--ds-hover)' : 'transparent',
                    borderLeft: activeConversationId === conv.id ? '2px solid var(--ds-accent)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (activeConversationId !== conv.id) e.currentTarget.style.background = 'var(--ds-hover)'; }}
                  onMouseLeave={e => { if (activeConversationId !== conv.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" style={{ color: activeConversationId === conv.id ? 'var(--ds-accent)' : 'var(--ds-text-dim)' }} />
                  <span className="text-xs flex-1 truncate" style={{ color: activeConversationId === conv.id ? 'var(--ds-text)' : 'var(--ds-text-muted)' }}>
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" style={{ color: 'var(--ds-text-dim)' }} />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Usage */}
          <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--ds-border-subtle)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>Daily AI Requests</span>
              <span className="text-xs font-mono" style={{ color: 'var(--ds-text-muted)' }}>{usage?.daily ?? 0}/{usage?.limit ?? 50}</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--ds-input)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usagePercent}%`,
                  background: usagePercent > 90 ? 'var(--ds-error)' : usagePercent > 70 ? 'var(--ds-warning)' : 'var(--ds-accent)',
                }}
              />
            </div>
            <div className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>
              {(usage?.limit ?? 50) - (usage?.daily ?? 0)} requests remaining today
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--ds-editor)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ color: 'var(--ds-text-muted)' }}
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold" style={{ color: 'var(--ds-text)' }}>Kimi AI Analyst</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ds-success)' }} />
                  <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeConversationId && (
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
                <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>{messages.length} messages</span>
              </div>
            )}
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: 'var(--ds-accent)', color: 'var(--ds-accent)', background: 'rgba(0, 122, 204, 0.08)' }}
            >
              {usage?.tier?.replace('_', ' ') || 'free'} tier
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full px-8 py-12">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, var(--ds-accent), #3B82F6)' }}
              >
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ds-text)' }}>
                Kimi AI Analyst
              </h2>
              <p className="text-sm text-center mb-8 max-w-lg leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
                Powered by Kimi AI. Ask me to write SQL queries, analyze data, build dashboards,
                generate Python/R code, or explain statistical concepts.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt.prompt)}
                    className="flex items-start gap-3 p-4 rounded-xl text-left transition-all group"
                    style={{
                      background: 'var(--ds-sidebar)',
                      border: '1px solid var(--ds-border-subtle)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `${prompt.color}30`;
                      e.currentTarget.style.background = `${prompt.color}08`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--ds-border-subtle)';
                      e.currentTarget.style.background = 'var(--ds-sidebar)';
                    }}
                  >
                    <div
                      className="p-2 rounded-lg flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: `${prompt.color}15`, color: prompt.color }}
                    >
                      {prompt.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ds-text)' }}>{prompt.label}</div>
                      <div className="text-xs leading-snug line-clamp-2" style={{ color: 'var(--ds-text-dim)' }}>{prompt.prompt.slice(0, 80)}...</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 px-5 space-y-5 max-w-4xl mx-auto w-full">
              {messages.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRetry={
                    message.role === 'assistant'
                      ? () => {
                          const userMsg = messages[i - 1];
                          if (userMsg) handleSendMessage(userMsg.content);
                        }
                      : undefined
                  }
                />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--ds-accent), #3B82F6)' }}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: 'var(--ds-sidebar)', border: '1px solid var(--ds-border-subtle)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--ds-accent)' }} />
                      <div className="flex gap-1">
                        {[0, 0.2, 0.4].map(delay => (
                          <div
                            key={delay}
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: 'var(--ds-accent)', animationDelay: `${delay}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          className="p-4 border-t flex-shrink-0"
          style={{ background: 'var(--ds-editor)', borderColor: 'var(--ds-border-subtle)' }}
        >
          <div
            className="flex items-end gap-3 p-3 rounded-2xl"
            style={{ background: 'var(--ds-sidebar)', border: '1px solid var(--ds-border-subtle)' }}
          >
            <div className="flex-shrink-0 pb-0.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
              >
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setCharCount(e.target.value.length); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your data, SQL, dashboards, or analysis..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
              style={{
                color: 'var(--ds-text)',
                minHeight: 24,
                maxHeight: 120,
              }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
              {charCount > 0 && (
                <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>{charCount}</span>
              )}
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="h-8 w-8 rounded-xl shadow-lg"
                style={{ background: inputValue.trim() ? 'linear-gradient(135deg, var(--ds-accent), #3B82F6)' : 'var(--ds-input)' }}
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                  : <Send className="h-4 w-4 text-white" />
                }
              </Button>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>
              Press Enter to send · Shift+Enter for new line · Powered by Kimi AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Format AI message content with code blocks and markdown
function formatMessage(content: string): string {
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks with language label
  formatted = formatted.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const langLabel = lang ? `<span class="text-xs font-mono" style="color:var(--ds-text-dim)">${lang}</span>` : '';
      return `<div class="my-3 rounded-xl overflow-hidden" style="background:var(--ds-sidebar);border:1px solid var(--ds-border-subtle)">
        <div class="flex items-center justify-between px-3 py-1.5" style="background:var(--ds-panel);border-bottom:1px solid var(--ds-border-subtle)">
          ${langLabel}
          <span class="text-xs" style="color:var(--ds-text-dim)">code</span>
        </div>
        <pre class="px-4 py-3 overflow-x-auto text-xs leading-relaxed font-mono" style="color:#D1FAE5">${code}</pre>
      </div>`;
    }
  );

  // Inline code
  formatted = formatted.replace(
    /`([^`\n]+)`/g,
    '<code class="px-1.5 py-0.5 rounded text-xs font-mono" style="background:var(--ds-input);color:#06B6D4">$1</code>'
  );

  // Headers
  formatted = formatted
    .replace(/^### (.*?)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2" style="color:var(--ds-text)">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2" style="color:var(--ds-text)">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold mt-5 mb-3" style="color:var(--ds-text)">$1</h1>');

  // Bold and italic
  formatted = formatted
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ds-text)">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--ds-text-muted)">$1</em>');

  // Bullet lists
  formatted = formatted.replace(
    /^[-•]\s+(.+)$/gm,
    '<div class="flex items-start gap-2 my-1"><span style="color:var(--ds-accent);margin-top:2px">•</span><span>$1</span></div>'
  );

  // Numbered lists
  formatted = formatted.replace(
    /^(\d+)\.\s+(.+)$/gm,
    '<div class="flex items-start gap-2 my-1"><span class="text-xs font-mono flex-shrink-0 mt-0.5 w-5 text-right" style="color:var(--ds-accent)">$1.</span><span>$2</span></div>'
  );

  // Newlines
  formatted = formatted.replace(/\n\n/g, '<div class="my-2"></div>');
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

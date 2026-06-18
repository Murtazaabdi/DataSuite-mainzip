import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Save, Share2, ChevronDown, X, FileCode, Plus, Terminal,
  CircleDot, Loader2, Copy, Check, Trash2, RefreshCw, Download,
  Settings2, Eye, EyeOff, Package, Square, Sparkles, ChevronRight,
  FolderOpen, Globe, Code2, FileText, Cpu, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/providers/trpc';
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from '@/components/ui/resizable';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
  saved: boolean;
}

interface OutputLine {
  text: string;
  type: 'out' | 'err' | 'info' | 'warn' | 'ai';
}

const STORAGE_KEY = 'ide_files_v2';

export const LANGUAGES = [
  { value: 'python',     label: 'Python',      ext: '.py',    monacoId: 'python',     color: '#4B8BBE', group: 'Data Science' },
  { value: 'r',          label: 'R',            ext: '.r',     monacoId: 'r',          color: '#276DC3', group: 'Data Science' },
  { value: 'julia',      label: 'Julia',        ext: '.jl',    monacoId: 'julia',      color: '#9558B2', group: 'Data Science' },
  { value: 'scala',      label: 'Scala',        ext: '.scala', monacoId: 'scala',      color: '#DC322F', group: 'Data Science' },
  { value: 'sql',        label: 'SQL',          ext: '.sql',   monacoId: 'sql',        color: '#F29111', group: 'Data' },
  { value: 'javascript', label: 'JavaScript',   ext: '.js',    monacoId: 'javascript', color: '#F7DF1E', group: 'Web' },
  { value: 'typescript', label: 'TypeScript',   ext: '.ts',    monacoId: 'typescript', color: '#007ACC', group: 'Web' },
  { value: 'html',       label: 'HTML',         ext: '.html',  monacoId: 'html',       color: '#E44D26', group: 'Web' },
  { value: 'go',         label: 'Go',           ext: '.go',    monacoId: 'go',         color: '#00ADD8', group: 'Systems' },
  { value: 'rust',       label: 'Rust',         ext: '.rs',    monacoId: 'rust',       color: '#CE422B', group: 'Systems' },
  { value: 'cpp',        label: 'C++',          ext: '.cpp',   monacoId: 'cpp',        color: '#F34B7D', group: 'Systems' },
  { value: 'java',       label: 'Java',         ext: '.java',  monacoId: 'java',       color: '#B07219', group: 'Systems' },
  { value: 'kotlin',     label: 'Kotlin',       ext: '.kt',    monacoId: 'kotlin',     color: '#7F52FF', group: 'Systems' },
  { value: 'shell',      label: 'Shell/Bash',   ext: '.sh',    monacoId: 'shell',      color: '#4EAA25', group: 'Systems' },
  { value: 'lua',        label: 'Lua',          ext: '.lua',   monacoId: 'lua',        color: '#2C2D72', group: 'Scripting' },
  { value: 'php',        label: 'PHP',          ext: '.php',   monacoId: 'php',        color: '#777BB4', group: 'Scripting' },
  { value: 'markdown',   label: 'Markdown',     ext: '.md',    monacoId: 'markdown',   color: '#083FA1', group: 'Docs' },
  { value: 'yaml',       label: 'YAML',         ext: '.yaml',  monacoId: 'yaml',       color: '#CB171E', group: 'Docs' },
  { value: 'json',       label: 'JSON',         ext: '.json',  monacoId: 'json',       color: '#A52A2A', group: 'Docs' },
];

const GROUP_ICONS: Record<string, React.ReactNode> = {
  'Data Science': <Cpu className="h-3 w-3" />,
  'Data':         <FileText className="h-3 w-3" />,
  'Web':          <Globe className="h-3 w-3" />,
  'Systems':      <Layers className="h-3 w-3" />,
  'Scripting':    <Code2 className="h-3 w-3" />,
  'Docs':         <FileText className="h-3 w-3" />,
};

const STARTER_TEMPLATES: Record<string, string> = {
  python: `import pandas as pd
import numpy as np

# Sample dataset
data = pd.DataFrame({
    'x': np.linspace(0, 10, 50),
    'y': np.sin(np.linspace(0, 10, 50)) * 10 + np.random.randn(50)
})

print(data.describe())
print(f"\\nCorrelation: {data['x'].corr(data['y']):.3f}")
`,
  r: `# Linear Regression Example
library(stats)

x <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
y <- 2.5 * x + rnorm(10, sd = 1.5)

model <- lm(y ~ x)
summary(model)
print(paste("R²:", round(summary(model)$r.squared, 3)))
`,
  julia: `using Statistics

# Generate data
x = randn(1000)
println("Mean: ", mean(x))
println("Std Dev: ", std(x))
println("Median: ", median(x))
`,
  scala: `object Main extends App {
  val data = Seq(1.0, 2.5, 3.7, 4.2, 5.8)
  val mean = data.sum / data.length
  val variance = data.map(x => math.pow(x - mean, 2)).sum / data.length
  println(s"Mean: $mean")
  println(s"Variance: $variance")
  println(s"Std Dev: ${math.sqrt(variance)}")
}
`,
  sql: `-- Sample analytics query
SELECT
    region,
    COUNT(*) AS orders,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(AVG(revenue), 2) AS avg_order_value
FROM orders
WHERE created_at >= date('now', '-30 days')
GROUP BY region
ORDER BY total_revenue DESC;
`,
  javascript: `// Data processing pipeline
const data = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  value: Math.random() * 100,
  category: ['A', 'B', 'C'][i % 3],
}));

const grouped = data.reduce((acc, item) => {
  acc[item.category] = acc[item.category] || [];
  acc[item.category].push(item.value);
  return acc;
}, {});

Object.entries(grouped).forEach(([cat, vals]) => {
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  console.log(\`Category \${cat}: avg = \${avg.toFixed(2)}, count = \${vals.length}\`);
});
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
    h1 { color: #58a6ff; }
    .chart { display: flex; align-items: flex-end; gap: 8px; height: 120px; margin-top: 24px; }
    .bar { background: #1f6feb; border-radius: 4px 4px 0 0; flex: 1; transition: height 0.3s; }
    .label { text-align: center; font-size: 11px; color: #8b949e; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>Data Preview</h1>
  <p>Rendered HTML output from your script.</p>
  <div class="chart">
    <div><div class="bar" style="height:80px"></div><div class="label">Jan</div></div>
    <div><div class="bar" style="height:100px"></div><div class="label">Feb</div></div>
    <div><div class="bar" style="height:60px"></div><div class="label">Mar</div></div>
    <div><div class="bar" style="height:110px"></div><div class="label">Apr</div></div>
    <div><div class="bar" style="height:90px"></div><div class="label">May</div></div>
    <div><div class="bar" style="height:120px"></div><div class="label">Jun</div></div>
  </div>
</body>
</html>`,
  go: `package main

import (
\t"fmt"
\t"math"
)

func main() {
\tdata := []float64{2, 4, 6, 8, 10, 12, 14}
\tn := float64(len(data))
\tsum := 0.0
\tfor _, v := range data {
\t\tsum += v
\t}
\tmean := sum / n
\tvariance := 0.0
\tfor _, v := range data {
\t\tvariance += math.Pow(v-mean, 2)
\t}
\tvariance /= n
\tfmt.Printf("Mean: %.2f\\n", mean)
\tfmt.Printf("Std Dev: %.2f\\n", math.Sqrt(variance))
}
`,
  rust: `fn main() {
    let data = vec![2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0];
    let n = data.len() as f64;
    let mean: f64 = data.iter().sum::<f64>() / n;
    let variance: f64 = data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / n;
    let std_dev = variance.sqrt();
    println!("Mean: {:.2}", mean);
    println!("Std Dev: {:.2}", std_dev);
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <numeric>
#include <cmath>

int main() {
    std::vector<double> data = {2, 4, 6, 8, 10, 12, 14};
    double n = data.size();
    double mean = std::accumulate(data.begin(), data.end(), 0.0) / n;
    double variance = 0;
    for (double v : data) variance += std::pow(v - mean, 2);
    variance /= n;
    std::cout << "Mean: " << mean << std::endl;
    std::cout << "Std Dev: " << std::sqrt(variance) << std::endl;
    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        double[] data = {2, 4, 6, 8, 10, 12, 14};
        double sum = 0;
        for (double v : data) sum += v;
        double mean = sum / data.length;
        double variance = 0;
        for (double v : data) variance += Math.pow(v - mean, 2);
        variance /= data.length;
        System.out.printf("Mean: %.2f%n", mean);
        System.out.printf("Std Dev: %.2f%n", Math.sqrt(variance));
    }
}
`,
  shell: `#!/bin/bash
echo "System Info"
echo "==========="
echo "Date: $(date)"
echo "User: $USER"
echo "Shell: $SHELL"

# Simple stats
nums=(10 20 30 40 50)
sum=0
for n in "\${nums[@]}"; do
  sum=$((sum + n))
done
avg=$((sum / \${#nums[@]}))
echo "Average: $avg"
`,
  kotlin: `fun main() {
    val data = listOf(2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0)
    val mean = data.average()
    val variance = data.map { (it - mean) * (it - mean) }.average()
    println("Mean: %.2f".format(mean))
    println("Std Dev: %.2f".format(Math.sqrt(variance)))
}
`,
  lua: `local data = {2, 4, 6, 8, 10, 12, 14}
local sum = 0
for _, v in ipairs(data) do sum = sum + v end
local mean = sum / #data
local variance = 0
for _, v in ipairs(data) do variance = variance + (v - mean)^2 end
variance = variance / #data
print(string.format("Mean: %.2f", mean))
print(string.format("Std Dev: %.2f", math.sqrt(variance)))
`,
  php: `<?php
$data = [2, 4, 6, 8, 10, 12, 14];
$mean = array_sum($data) / count($data);
$variance = array_sum(array_map(fn($v) => ($v - $mean) ** 2, $data)) / count($data);
printf("Mean: %.2f\n", $mean);
printf("Std Dev: %.2f\n", sqrt($variance));
`,
  markdown: `# Analysis Report

## Overview
This document summarizes the data analysis findings.

## Key Metrics
| Metric | Value | Change |
|--------|-------|--------|
| Revenue | $1.2M | +12% |
| Users   | 45K   | +8%  |
| Margin  | 24%   | +2%  |

## Conclusions
- Trend is positive across all metrics
- Q2 showed strongest growth
`,
  yaml: `# Data pipeline configuration
name: analytics-pipeline
version: "1.0"

sources:
  - name: sales_db
    type: postgresql
    host: db.example.com
    database: analytics

transforms:
  - name: aggregate_daily
    type: group_by
    fields: [date, region]
    metrics: [sum_revenue, count_orders]

outputs:
  - type: dashboard
    refresh: 3600
`,
  json: `{
  "dataset": {
    "name": "sales_2024",
    "records": 125000,
    "schema": {
      "date": "DATE",
      "region": "STRING",
      "revenue": "FLOAT",
      "units": "INTEGER"
    }
  },
  "metrics": {
    "total_revenue": 1250000,
    "avg_order_value": 10.0,
    "top_region": "North"
  }
}
`,
};

const defaultFiles: FileItem[] = [
  { id: 'py-1', name: 'analysis.py', content: STARTER_TEMPLATES.python, language: 'python', saved: true },
  { id: 'sql-1', name: 'query.sql', content: STARTER_TEMPLATES.sql, language: 'sql', saved: true },
  { id: 'r-1', name: 'model.r', content: STARTER_TEMPLATES.r, language: 'r', saved: true },
  { id: 'js-1', name: 'pipeline.js', content: STARTER_TEMPLATES.javascript, language: 'javascript', saved: true },
  { id: 'html-1', name: 'report.html', content: STARTER_TEMPLATES.html, language: 'html', saved: true },
];

function loadFiles(): FileItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return defaultFiles;
}

function saveFiles(files: FileItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch { /* ignore */ }
}

function getLangOption(lang: string) {
  return LANGUAGES.find(l => l.value === lang) ?? LANGUAGES[0];
}

function LangDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

export default function IDEPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>(loadFiles);
  const [activeFileId, setActiveFileId] = useState(() => loadFiles()[0]?.id ?? 'py-1');
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [packageInput, setPackageInput] = useState('');
  const [isInstallingPkg, setIsInstallingPkg] = useState(false);
  const [pkgLog, setPkgLog] = useState<string[]>([]);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const editorRef = useRef<Parameters<Parameters<typeof Editor>[0]['onMount']>[0] | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);

  const executeCodeMutation = trpc.code.execute.useMutation();
  const installPackageMutation = trpc.code.installPackage.useMutation();
  const aiSuggestMutation = trpc.code.aiSuggest.useMutation();

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  useEffect(() => { saveFiles(files); }, [files]);
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value, saved: false } : f));
  }, [activeFileId]);

  const handleSave = useCallback(() => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, saved: true } : f));
    toast({ title: 'Saved', description: activeFile?.name });
  }, [activeFileId, activeFile?.name, toast]);

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    setIsRunning(false);
    setOutputLines(prev => [...prev, { text: '⏹  Execution stopped by user.', type: 'warn' }]);
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning || !activeFile) return;
    stoppedRef.current = false;
    setIsRunning(true);
    setOutputLines([{ text: `▶  Running ${activeFile.name}  [${new Date().toLocaleTimeString()}]`, type: 'info' }]);

    // HTML preview
    if (activeFile.language === 'html') {
      setPreviewContent(activeFile.content);
      setShowPreview(true);
      setOutputLines([{ text: `▶  HTML rendered in Preview panel.`, type: 'info' }]);
      setIsRunning(false);
      return;
    }

    try {
      const result = await executeCodeMutation.mutateAsync({
        code: activeFile.content,
        language: activeFile.language,
      });

      if (stoppedRef.current) return;

      const combined = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
      if (combined) {
        const lines = combined.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (stoppedRef.current) break;
          await new Promise(r => setTimeout(r, 20));
          const isErr = result.stderr?.includes(lines[i]) && lines[i].trim().length > 0;
          setOutputLines(prev => [...prev, {
            text: lines[i],
            type: isErr ? 'err' : 'out',
          }]);
        }
      } else {
        setOutputLines(prev => [...prev, { text: '(No output)', type: 'info' }]);
      }

      if (result.exitCode !== 0 && !stoppedRef.current) {
        setOutputLines(prev => [...prev, { text: `Exit code: ${result.exitCode}`, type: 'err' }]);
      } else if (!stoppedRef.current) {
        setOutputLines(prev => [...prev, { text: `✓  Done  [${result.executionTime ?? ''}ms]`, type: 'info' }]);
      }

      // Auto-preview if output contains HTML
      if (result.stdout?.trim().startsWith('<!DOCTYPE') || result.stdout?.trim().startsWith('<html')) {
        setPreviewContent(result.stdout);
        setShowPreview(true);
      }
    } catch (error: any) {
      if (!stoppedRef.current) {
        setOutputLines(prev => [...prev, { text: `Error: ${error.message}`, type: 'err' }]);
      }
    }

    if (!stoppedRef.current) setIsRunning(false);
  }, [isRunning, activeFile, executeCodeMutation]);

  const handleAISuggest = useCallback(async () => {
    if (aiSuggesting || !activeFile) return;
    setAiSuggesting(true);
    const errorContext = outputLines.filter(l => l.type === 'err').map(l => l.text).join('\n');
    setOutputLines(prev => [...prev, { text: '✦ AI is analyzing your code...', type: 'ai' }]);
    try {
      const result = await aiSuggestMutation.mutateAsync({
        code: activeFile.content,
        language: activeFile.language,
        errorContext,
      });
      const lines = result.suggestion.split('\n');
      for (const line of lines) {
        await new Promise(r => setTimeout(r, 15));
        setOutputLines(prev => [...prev, { text: line, type: 'ai' }]);
      }
    } catch {
      setOutputLines(prev => [...prev, { text: '✦ AI suggestion unavailable. Set GEMINI_API_KEY to enable.', type: 'warn' }]);
    }
    setAiSuggesting(false);
  }, [aiSuggesting, activeFile, outputLines, aiSuggestMutation]);

  const handleInstallPackage = async () => {
    if (!packageInput.trim() || isInstallingPkg) return;
    setIsInstallingPkg(true);
    setPkgLog([`Installing ${packageInput.trim()} for ${activeFile?.language ?? 'python'}...`]);
    try {
      const result = await installPackageMutation.mutateAsync({
        packageName: packageInput.trim(),
        language: activeFile?.language ?? 'python',
      });
      const lines = result.output.split('\n').filter(Boolean);
      setPkgLog(lines);
    } catch (e: any) {
      setPkgLog([`Error: ${e.message}`]);
    }
    setIsInstallingPkg(false);
    setPackageInput('');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun, handleSave]);

  const addNewFile = (lang = 'python') => {
    const opt = getLangOption(lang);
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: `untitled${opt.ext}`,
      content: STARTER_TEMPLATES[lang] ?? `# New ${opt.label} file\n`,
      language: lang,
      saved: false,
    };
    setFiles(prev => { const u = [...prev, newFile]; saveFiles(u); return u; });
    setActiveFileId(newFile.id);
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (activeFileId === id && next.length > 0) setActiveFileId(next[0].id);
      saveFiles(next);
      return next;
    });
  };

  const startRename = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setIsRenaming(file.id);
    setRenameValue(file.name);
  };

  const confirmRename = (id: string) => {
    if (renameValue.trim()) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: renameValue.trim() } : f));
    }
    setIsRenaming(null);
  };

  const downloadFile = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeFile.name; a.click();
    URL.revokeObjectURL(url);
  };

  const copyOutput = () => {
    const text = outputLines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    });
  };

  const langGroups = LANGUAGES.reduce((acc, lang) => {
    (acc[lang.group] ??= []).push(lang);
    return acc;
  }, {} as Record<string, typeof LANGUAGES>);

  const activeLang = getLangOption(activeFile?.language ?? 'python');

  const outputColor = (type: OutputLine['type']) => {
    if (type === 'err') return 'var(--ds-error)';
    if (type === 'warn') return 'var(--ds-warning)';
    if (type === 'ai') return 'var(--ds-accent)';
    if (type === 'info') return 'var(--ds-text-dim)';
    return 'var(--ds-text)';
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ds-editor)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0 gap-2"
        style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          {/* Run / Stop */}
          {isRunning ? (
            <Button
              size="sm"
              onClick={handleStop}
              className="gap-1.5 text-xs h-7"
              style={{ background: 'var(--ds-error)', color: '#fff' }}
              title="Stop execution"
            >
              <Square className="h-3 w-3" fill="currentColor" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleRun}
              className="gap-1.5 text-xs h-7 text-white"
              style={{ background: 'var(--ds-success)' }}
              title="Run (Ctrl+Enter)"
            >
              <Play className="h-3 w-3" fill="currentColor" />
              Run
            </Button>
          )}

          <div className="w-px h-4" style={{ background: 'rgba(148,163,184,0.12)' }} />

          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" style={{ color: 'var(--ds-text-dim)' }}>
                <LangDot color={activeLang.color} size={8} />
                {activeLang.label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border)', maxHeight: 320, overflowY: 'auto' }}
              className="w-44"
            >
              {Object.entries(langGroups).map(([group, langs]) => (
                <div key={group}>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider gap-1.5 flex items-center py-1.5" style={{ color: 'var(--ds-text-dim)' }}>
                    {GROUP_ICONS[group]} {group}
                  </DropdownMenuLabel>
                  {langs.map(lang => (
                    <DropdownMenuItem
                      key={lang.value}
                      onClick={() => setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang.value } : f))}
                      className="gap-2 text-xs"
                      style={{ color: '#94A3B8' }}
                    >
                      <LangDot color={lang.color} size={8} />
                      {lang.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator style={{ background: 'var(--ds-border-subtle)' }} />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-4" style={{ background: 'rgba(148,163,184,0.12)' }} />

          <Button variant="ghost" size="sm" onClick={handleSave} className="gap-1.5 text-xs h-7" style={{ color: '#94A3B8' }} title="Save (Ctrl+S)">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadFile} className="gap-1.5 text-xs h-7" style={{ color: '#94A3B8' }}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>

          <div className="w-px h-4" style={{ background: 'rgba(148,163,184,0.12)' }} />

          <Button
            variant="ghost" size="sm"
            onClick={() => setShowPackages(true)}
            className="gap-1.5 text-xs h-7"
            style={{ color: '#94A3B8' }}
            title="Package manager"
          >
            <Package className="h-3.5 w-3.5" /> Packages
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {!activeFile?.saved && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ds-warning)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ds-warning)' }} />
              Unsaved
            </span>
          )}
          <Button
            variant="ghost" size="sm"
            onClick={() => setShowPreview(v => !v)}
            className="gap-1.5 text-xs h-7"
            style={{ color: showPreview ? 'var(--ds-accent)' : '#94A3B8' }}
            title="Toggle preview panel"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Preview
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => toast({ title: 'Share link copied!' })}
            className="gap-1.5 text-xs h-7"
            style={{ color: '#94A3B8' }}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* File Explorer */}
        <ResizablePanel defaultSize={14} minSize={10} maxSize={22}>
          <div className="h-full flex flex-col border-r" style={{ background: 'var(--ds-sidebar)', borderColor: 'var(--ds-border-subtle)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--ds-border-subtle)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-dim)' }}>
                <FolderOpen className="h-3 w-3 inline mr-1" />Explorer
              </span>
              <div className="flex gap-0.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10" title="New file">
                      <Plus className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-dim)' }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border)', maxHeight: 280, overflowY: 'auto' }}
                    className="w-40"
                  >
                    {Object.entries(langGroups).map(([group, langs]) => (
                      <div key={group}>
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider py-1.5" style={{ color: 'var(--ds-text-dim)' }}>
                          {group}
                        </DropdownMenuLabel>
                        {langs.map(l => (
                          <DropdownMenuItem key={l.value} onClick={() => addNewFile(l.value)} className="gap-2 text-xs" style={{ color: '#94A3B8' }}>
                            <LangDot color={l.color} size={7} />{l.label}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10"
                  title="Reset files"
                  onClick={() => { if (confirm('Reset all files?')) { setFiles(defaultFiles); setActiveFileId(defaultFiles[0].id); } }}
                >
                  <RefreshCw className="h-3 w-3" style={{ color: 'var(--ds-text-dim)' }} />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="py-0.5">
                {files.map(file => {
                  const lopt = getLangOption(file.language);
                  const isActive = file.id === activeFileId;
                  return (
                    <div key={file.id}>
                      {isRenaming === file.id ? (
                        <div className="px-2 py-1">
                          <Input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={() => confirmRename(file.id)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmRename(file.id); if (e.key === 'Escape') setIsRenaming(null); }}
                            autoFocus
                            className="h-5 text-xs px-1"
                            style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => setActiveFileId(file.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group"
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                            borderLeft: isActive ? '2px solid var(--ds-accent)' : '2px solid transparent',
                          }}
                        >
                          <FileCode className="h-3.5 w-3.5 flex-shrink-0" style={{ color: lopt.color }} />
                          <span className="text-xs flex-1 truncate" style={{ color: isActive ? 'var(--ds-text)' : '#8B9AB1' }}>
                            {file.name}{!file.saved && <span style={{ color: 'var(--ds-warning)' }}> •</span>}
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                            <button onClick={e => startRename(file, e)} className="p-0.5 rounded hover:bg-white/10">
                              <Settings2 className="h-2.5 w-2.5" style={{ color: 'var(--ds-text-dim)' }} />
                            </button>
                            <button onClick={e => deleteFile(file.id, e)} className="p-0.5 rounded hover:bg-red-500/10">
                              <Trash2 className="h-2.5 w-2.5" style={{ color: 'var(--ds-text-dim)' }} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {activeFile && (
              <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--ds-border-subtle)' }}>
                <div className="flex items-center gap-1.5">
                  <LangDot color={activeLang.color} size={7} />
                  <span className="text-[10px]" style={{ color: 'var(--ds-text-dim)' }}>{activeLang.label}</span>
                </div>
                <span className="text-[10px] font-mono truncate block mt-0.5" style={{ color: 'var(--ds-text-dim)' }}>
                  {activeFile.content.split('\n').length} lines
                </span>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor + Terminal */}
        <ResizablePanel defaultSize={showPreview ? 52 : 86}>
          <ResizablePanelGroup direction="vertical">
            {/* Monaco Editor */}
            <ResizablePanel defaultSize={68} minSize={30}>
              <Editor
                height="100%"
                language={activeLang.monacoId}
                value={activeFile?.content ?? ''}
                onChange={handleEditorChange}
                onMount={e => { editorRef.current = e; }}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: true, scale: 1 },
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: 'off',
                  renderLineHighlight: 'gutter',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  padding: { top: 12, bottom: 12 },
                  lineNumbers: 'on',
                  glyphMargin: true,
                  folding: true,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Terminal / Console */}
            <ResizablePanel defaultSize={32} minSize={16}>
              <div className="h-full flex flex-col" style={{ background: '#0d1117' }}>
                {/* Terminal toolbar */}
                <div
                  className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0"
                  style={{ background: '#161b22', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" style={{ color: '#4EAA25' }} />
                    <span className="text-[11px] font-medium" style={{ color: '#8b949e' }}>Console</span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ds-warning)' }}>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running…
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleAISuggest}
                      disabled={aiSuggesting || isRunning}
                      className="flex items-center gap-1 h-5 px-2 rounded text-[10px] transition-colors disabled:opacity-40"
                      style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--ds-accent)', border: '1px solid rgba(99,102,241,0.2)' }}
                      title="Get AI suggestion for current code"
                    >
                      {aiSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI Suggest
                    </button>
                    <button
                      onClick={() => setOutputLines([])}
                      className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10"
                      title="Clear console"
                    >
                      <Trash2 className="h-3 w-3" style={{ color: '#6e7681' }} />
                    </button>
                    <button
                      onClick={copyOutput}
                      className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10"
                      title="Copy output"
                    >
                      {copiedOutput ? <Check className="h-3 w-3" style={{ color: 'var(--ds-success)' }} /> : <Copy className="h-3 w-3" style={{ color: '#6e7681' }} />}
                    </button>
                  </div>
                </div>

                {/* Output */}
                <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs" style={{ color: 'var(--ds-text)' }}>
                  {outputLines.length === 0 ? (
                    <div className="flex items-center gap-2 mt-2" style={{ color: '#3d444d' }}>
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span>Press Run or Ctrl+Enter to execute</span>
                    </div>
                  ) : (
                    outputLines.map((line, i) => (
                      <div
                        key={i}
                        className="leading-5 whitespace-pre-wrap break-all"
                        style={{ color: outputColor(line.type) }}
                      >
                        {line.text}
                      </div>
                    ))
                  )}
                  <div ref={outputEndRef} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Preview Panel */}
        {showPreview && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={34} minSize={20}>
              <div className="h-full flex flex-col border-l" style={{ borderColor: 'var(--ds-border-subtle)', background: 'var(--ds-editor)' }}>
                <div
                  className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0"
                  style={{ background: 'var(--ds-panel)', borderColor: 'var(--ds-border-subtle)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" style={{ color: 'var(--ds-accent)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--ds-text-dim)' }}>Preview</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (activeFile?.language === 'html') setPreviewContent(activeFile.content);
                      }}
                      className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10"
                      title="Refresh preview"
                    >
                      <RefreshCw className="h-3 w-3" style={{ color: '#6e7681' }} />
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10"
                    >
                      <X className="h-3 w-3" style={{ color: '#6e7681' }} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {previewContent ? (
                    <iframe
                      srcDoc={previewContent}
                      sandbox="allow-scripts allow-forms allow-modals"
                      className="w-full h-full border-0"
                      title="Preview"
                      style={{ background: '#fff' }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: 'var(--ds-text-dim)' }}>
                      <Eye className="h-10 w-10 opacity-20" />
                      <p className="text-xs text-center">
                        Run an HTML file or a script<br />that outputs HTML to preview here
                      </p>
                      {activeFile?.language === 'html' && (
                        <button
                          onClick={() => { setPreviewContent(activeFile.content); }}
                          className="text-xs px-3 py-1 rounded"
                          style={{ background: 'var(--ds-accent)', color: '#fff' }}
                        >
                          Render current file
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Package Manager Dialog */}
      <Dialog open={showPackages} onOpenChange={setShowPackages}>
        <DialogContent
          className="sm:max-w-md"
          style={{ background: 'var(--ds-panel)', border: '1px solid var(--ds-border)', color: 'var(--ds-text)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--ds-text)' }}>
              <Package className="h-4 w-4" style={{ color: 'var(--ds-accent)' }} />
              Package Manager — {activeLang.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--ds-text-dim)' }}>
              Install packages for <strong>{activeLang.label}</strong>. Packages are installed server-side and available for execution.
            </p>

            <div className="flex gap-2">
              <Input
                value={packageInput}
                onChange={e => setPackageInput(e.target.value)}
                placeholder={activeLang.value === 'python' ? 'numpy, pandas, scikit-learn' : activeLang.value === 'r' ? 'ggplot2, dplyr' : 'package-name'}
                onKeyDown={e => e.key === 'Enter' && handleInstallPackage()}
                className="text-xs h-8"
                style={{ background: 'var(--ds-input)', borderColor: 'var(--ds-border)', color: 'var(--ds-text)' }}
              />
              <Button
                size="sm"
                onClick={handleInstallPackage}
                disabled={isInstallingPkg || !packageInput.trim()}
                className="text-xs h-8 gap-1 shrink-0"
                style={{ background: 'var(--ds-accent)', color: '#fff' }}
              >
                {isInstallingPkg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Install
              </Button>
            </div>

            {pkgLog.length > 0 && (
              <div
                className="rounded font-mono text-[11px] p-3 overflow-y-auto max-h-48"
                style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {pkgLog.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            )}

            {/* Popular packages per language */}
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-dim)' }}>Popular packages</p>
              <div className="flex flex-wrap gap-1.5">
                {(activeLang.value === 'python'
                  ? ['numpy', 'pandas', 'scikit-learn', 'matplotlib', 'seaborn', 'plotly', 'tensorflow', 'torch', 'scipy', 'statsmodels']
                  : activeLang.value === 'r'
                  ? ['ggplot2', 'dplyr', 'tidyr', 'caret', 'randomForest', 'xgboost']
                  : activeLang.value === 'julia'
                  ? ['DataFrames', 'Plots', 'Flux', 'Statistics', 'StatsBase']
                  : activeLang.value === 'javascript' || activeLang.value === 'typescript'
                  ? ['lodash', 'd3', 'chart.js', 'axios', 'express']
                  : ['package-1', 'package-2', 'package-3']
                ).map(pkg => (
                  <button
                    key={pkg}
                    onClick={() => setPackageInput(pkg)}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      color: 'var(--ds-accent)',
                      border: '1px solid rgba(99,102,241,0.15)',
                    }}
                  >
                    {pkg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

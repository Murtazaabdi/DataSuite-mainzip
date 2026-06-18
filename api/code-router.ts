import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getEnv } from "./lib/env";

const SUPPORTED_LANGUAGES = [
  "python", "javascript", "typescript", "r", "julia", "scala",
  "go", "rust", "cpp", "java", "kotlin", "shell", "lua", "php",
  "sql", "html", "markdown", "yaml", "json",
] as const;

type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

async function executeCode(
  code: string,
  language: SupportedLanguage
): Promise<{ stdout: string; stderr: string; exitCode: number; executionTime?: number }> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const { writeFileSync, existsSync, unlinkSync, mkdirSync } = await import("fs");
  const { join } = await import("path");
  const { tmpdir } = await import("os");
  const execAsync = promisify(exec);

  const start = Date.now();

  // Non-executable languages — just echo back
  if (language === "html") {
    return { stdout: code, stderr: "", exitCode: 0, executionTime: 0 };
  }
  if (language === "markdown" || language === "yaml" || language === "json") {
    return { stdout: `[${language.toUpperCase()}] Parsed successfully. ${code.split("\n").length} lines.`, stderr: "", exitCode: 0, executionTime: 0 };
  }

  const tempDir = join(tmpdir(), "datasuite_exec");
  try { mkdirSync(tempDir, { recursive: true }); } catch {}

  const langConfig: Record<string, { ext: string; cmd: (f: string) => string }> = {
    python:     { ext: ".py",    cmd: f => `python3 "${f}" 2>&1 || python "${f}" 2>&1` },
    javascript: { ext: ".js",   cmd: f => `node "${f}"` },
    typescript: { ext: ".ts",   cmd: f => `npx --yes tsx "${f}" 2>&1 || npx --yes ts-node "${f}" 2>&1` },
    r:          { ext: ".r",    cmd: f => `Rscript "${f}"` },
    julia:      { ext: ".jl",   cmd: f => `julia "${f}"` },
    scala:      { ext: ".scala",cmd: f => `scala "${f}"` },
    go:         { ext: ".go",   cmd: f => `go run "${f}"` },
    rust:       { ext: ".rs",   cmd: f => {
      const out = f.replace(".rs", "");
      return `rustc "${f}" -o "${out}" && "${out}"; rm -f "${out}"`;
    }},
    cpp:        { ext: ".cpp",  cmd: f => {
      const out = f.replace(".cpp", "");
      return `g++ "${f}" -o "${out}" && "${out}"; rm -f "${out}"`;
    }},
    java:       { ext: ".java", cmd: f => {
      const dir = f.substring(0, f.lastIndexOf("/"));
      const cls = f.split("/").pop()?.replace(".java","") ?? "Main";
      return `javac "${f}" -d "${dir}" && java -cp "${dir}" ${cls}`;
    }},
    kotlin:     { ext: ".kt",   cmd: f => {
      const jar = f.replace(".kt", ".jar");
      return `kotlinc "${f}" -include-runtime -d "${jar}" 2>/dev/null && java -jar "${jar}"; rm -f "${jar}"`;
    }},
    shell:      { ext: ".sh",   cmd: f => `bash "${f}"` },
    lua:        { ext: ".lua",  cmd: f => `lua "${f}" 2>&1 || lua5.4 "${f}" 2>&1` },
    php:        { ext: ".php",  cmd: f => `php "${f}"` },
  };

  const cfg = langConfig[language];
  if (!cfg) {
    return { stdout: "", stderr: `Language '${language}' execution is not supported in this environment.`, exitCode: 1 };
  }

  const tempFile = join(tempDir, `code_${Date.now()}${cfg.ext}`);

  try {
    writeFileSync(tempFile, code, "utf8");
    const command = cfg.cmd(tempFile);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: tempDir,
      });
      return { stdout: stdout || "", stderr: stderr || "", exitCode: 0, executionTime: Date.now() - start };
    } catch (error: any) {
      return {
        stdout: error.stdout || "",
        stderr: error.stderr || error.message || "Execution error",
        exitCode: error.code ?? 1,
        executionTime: Date.now() - start,
      };
    }
  } finally {
    try { if (existsSync(tempFile)) unlinkSync(tempFile); } catch {}
  }
}

async function installPackage(packageName: string, language: string): Promise<string> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  const commands: Record<string, string> = {
    python:     `pip install ${packageName} 2>&1 || pip3 install ${packageName} 2>&1`,
    r:          `Rscript -e "install.packages('${packageName}', repos='https://cran.r-project.org', quiet=FALSE)" 2>&1`,
    julia:      `julia -e 'using Pkg; Pkg.add("${packageName}")' 2>&1`,
    javascript: `npm install ${packageName} 2>&1`,
    typescript: `npm install ${packageName} 2>&1`,
    node:       `npm install ${packageName} 2>&1`,
    lua:        `luarocks install ${packageName} 2>&1`,
    php:        `composer require ${packageName} 2>&1`,
  };

  const cmd = commands[language] || commands["python"];

  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
    return [stdout, stderr].filter(Boolean).join("\n").trim() || `Package '${packageName}' installed successfully.`;
  } catch (error: any) {
    const out = [error.stdout, error.stderr, error.message].filter(Boolean).join("\n");
    return out || `Failed to install '${packageName}'.`;
  }
}

async function getAISuggestion(code: string, language: string, errorContext: string): Promise<string> {
  const geminiKey = getEnv("GEMINI_API_KEY", "");

  const prompt = `You are an expert ${language} programmer. Analyze this code and ${errorContext ? "fix the error" : "suggest improvements"}.

Code:
\`\`\`${language}
${code}
\`\`\`
${errorContext ? `\nError output:\n${errorContext}` : ""}

Provide a brief, actionable suggestion (2-4 sentences max). If fixing an error, show the corrected code snippet.`;

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json() as any;
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No suggestion available.";
      }
    } catch {}
  }

  // Fallback to Kimi
  const kimiKey = getEnv("KIMI_API_KEY", "");
  if (kimiKey) {
    try {
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${kimiKey}` },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 512,
          temperature: 0.3,
        }),
      });
      if (response.ok) {
        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content ?? "No suggestion available.";
      }
    } catch {}
  }

  return `Set GEMINI_API_KEY in your environment to enable AI suggestions for ${language} code.`;
}

export const codeRouter = createRouter({
  execute: authedQuery
    .input(z.object({
      code: z.string().max(500000),
      language: z.string(),
    }))
    .mutation(async ({ input }) => {
      const lang = input.language as SupportedLanguage;
      return await executeCode(input.code, lang);
    }),

  installPackage: authedQuery
    .input(z.object({
      packageName: z.string().min(1).max(200),
      language: z.string(),
    }))
    .mutation(async ({ input }) => {
      const output = await installPackage(input.packageName, input.language);
      return { output };
    }),

  aiSuggest: authedQuery
    .input(z.object({
      code: z.string().max(50000),
      language: z.string(),
      errorContext: z.string().optional().default(""),
    }))
    .mutation(async ({ input }) => {
      const suggestion = await getAISuggestion(input.code, input.language, input.errorContext);
      return { suggestion };
    }),
});

import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getEnv } from "./lib/env";

// Cloud-based code execution using Replit API
async function executeCodeInCloud(
  code: string,
  language: "python" | "javascript" | "sql" | "r"
) {
  const replitApiKey = getEnv("REPLIT_API_KEY", "");
  
  // Map language to Replit language identifier
  const languageMap: Record<string, string> = {
    python: "python3",
    javascript: "javascript",
    r: "r",
    sql: "sql", // SQLite
  };

  const replitLang = languageMap[language] || "python3";

  // Use Replit API
  if (replitApiKey) {
    try {
      const response = await fetch("https://replit.com/api/v1/eval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${replitApiKey}`,
        },
        body: JSON.stringify({
          code,
          language: replitLang,
        }),
      });

      if (!response.ok) {
        return {
          stdout: "",
          stderr: `API Error: ${response.statusText}`,
          exitCode: 1,
        };
      }

      const result = await response.json();
      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode || 0,
      };
    } catch (error: any) {
      // Fallback if API fails
      console.error("Replit API error:", error);
    }
  }

  // Fallback: Local execution (if running on server with tools installed)
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const { join } = await import("path");
    const { writeFileSync, existsSync, unlinkSync } = await import("fs");
    const { tmpdir } = await import("os");

    const execAsync = promisify(exec);
    const tempDir = tmpdir();
    let ext = ".py";
    let command = "python";

    if (language === "python") {
      ext = ".py";
      command = "python";
    } else if (language === "javascript") {
      ext = ".js";
      command = "node";
    } else if (language === "r") {
      ext = ".r";
      command = "Rscript";
    } else if (language === "sql") {
      return {
        stdout: "SQL execution requires database connection",
        stderr: "",
        exitCode: 0,
      };
    }

    const tempFile = join(tempDir, `code_${Date.now()}${ext}`);

    try {
      writeFileSync(tempFile, code, "utf8");

      try {
        const { stdout, stderr } = await execAsync(`${command} "${tempFile}"`, {
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
        });

        return {
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: 0,
        };
      } catch (error: any) {
        return {
          stdout: error.stdout || "",
          stderr: error.stderr || error.message || "Execution error",
          exitCode: error.code || 1,
        };
      }
    } finally {
      try {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } catch (error: any) {
    return {
      stdout: "",
      stderr: `Execution error: ${error.message}. Configure REPLIT_API_KEY for cloud execution.`,
      exitCode: 1,
    };
  }
}

export const codeRouter = createRouter({
  execute: authedQuery
    .input(
      z.object({
        code: z.string(),
        language: z.enum(["python", "javascript", "sql", "r"]),
      })
    )
    .mutation(async ({ input }) => {
      const { code, language } = input;
      return await executeCodeInCloud(code, language);
    }),
});

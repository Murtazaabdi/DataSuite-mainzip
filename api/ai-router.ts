import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { aiConversations, aiMessages, aiUsage } from "@db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const aiRouter = createRouter({
  // Get all conversations for the current user
  listConversations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const conversations = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, ctx.user.id))
      .orderBy(sql`${aiConversations.updatedAt} DESC`);
    return conversations;
  }),

  // Get a single conversation with messages
  getConversation: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conversation = await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.id, input.id),
            eq(aiConversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const messages = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, input.id))
        .orderBy(aiMessages.createdAt);

      return { conversation: conversation[0], messages };
    }),

  // Create a new conversation
  createConversation: authedQuery
    .input(z.object({ title: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(aiConversations).values({
        userId: ctx.user.id,
        title: input.title,
      });
      return { id: Number(result[0].insertId) };
    }),

  // Send a message and get AI response
  sendMessage: authedQuery
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify conversation belongs to user
      const conversation = await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.id, input.conversationId),
            eq(aiConversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conversation.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check usage limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const usage = await db
        .select({ count: sql<number>`SUM(${aiUsage.messageCount})` })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, ctx.user.id),
            gte(aiUsage.createdAt, today)
          )
        );

      const dailyCount = usage[0]?.count ?? 0;
      const userTier = ctx.user.tier;

      // Tier limits
      const tierLimits: Record<string, number> = {
        free: 50,
        analyst: 500,
        data_scientist: 5000,
        enterprise: 999999,
      };

      if (dailyCount >= tierLimits[userTier]) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Daily AI usage limit reached for ${userTier} tier.`,
        });
      }

      // Save user message
      await db.insert(aiMessages).values({
        conversationId: input.conversationId,
        role: "user",
        content: input.content,
      });

      // Get conversation history for context
      const history = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, input.conversationId))
        .orderBy(aiMessages.createdAt)
        .limit(20);

      // Generate AI response using Kimi's built-in capability
      const systemPrompt = `You are DS-PaaS AI Analyst, an expert data science assistant. You help users with:
- Data analysis and visualization recommendations
- SQL query optimization and writing
- Python/R code for data science
- Statistical analysis guidance
- Dashboard design suggestions
- Data pipeline architecture

Be concise, professional, and provide actionable insights. Use markdown formatting for code blocks and tables.`;

      const messagesForAI = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ];

      // Call Kimi API (using the internal API)
      let aiResponse = "";
      try {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.KIMI_API_KEY || ""}`,
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: messagesForAI,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          aiResponse = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response at this time. Please try again.";
        } else {
          // Fallback response when API is not available
          aiResponse = generateFallbackResponse(input.content);
        }
      } catch {
        // Fallback response
        aiResponse = generateFallbackResponse(input.content);
      }

      // Save AI response
      await db.insert(aiMessages).values({
        conversationId: input.conversationId,
        role: "assistant",
        content: aiResponse,
      });

      // Log usage
      await db.insert(aiUsage).values({
        userId: ctx.user.id,
        model: "kimi-moonshot",
        tokensInput: input.content.length,
        tokensOutput: aiResponse.length,
        messageCount: 1,
      });

      // Update conversation timestamp
      await db
        .update(aiConversations)
        .set({ updatedAt: new Date() })
        .where(eq(aiConversations.id, input.conversationId));

      return { response: aiResponse };
    }),

  // Delete a conversation
  deleteConversation: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(aiMessages)
        .where(eq(aiMessages.conversationId, input.id));
      await db
        .delete(aiConversations)
        .where(
          and(
            eq(aiConversations.id, input.id),
            eq(aiConversations.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Get AI usage stats
  getUsage: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [dailyUsage, totalUsage] = await Promise.all([
      db
        .select({ count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)` })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, ctx.user.id),
            gte(aiUsage.createdAt, today)
          )
        ),
      db
        .select({ count: sql<number>`COALESCE(SUM(${aiUsage.messageCount}), 0)` })
        .from(aiUsage)
        .where(eq(aiUsage.userId, ctx.user.id)),
    ]);

    const tierLimits: Record<string, number> = {
      free: 50,
      analyst: 500,
      data_scientist: 5000,
      enterprise: 999999,
    };

    return {
      daily: dailyUsage[0]?.count ?? 0,
      total: totalUsage[0]?.count ?? 0,
      limit: tierLimits[ctx.user.tier] ?? 50,
      tier: ctx.user.tier,
    };
  }),
});

// Fallback response generator when AI API is unavailable
function generateFallbackResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("sql") || msg.includes("query") || msg.includes("database")) {
    return `I'd be happy to help you with SQL! Here's an example query structure:

\`\`\`sql
SELECT 
  column_name,
  COUNT(*) as record_count,
  AVG(numeric_column) as average_value
FROM your_table
WHERE date_column >= '2024-01-01'
GROUP BY column_name
ORDER BY record_count DESC
LIMIT 100;
\`\`\`

**Key SQL tips:**
- Use **parameterized queries** to prevent SQL injection
- Add **indexes** on frequently filtered columns
- Use **EXPLAIN** to analyze query performance
- Consider **CTEs** (WITH clauses) for complex queries

Would you like me to help you write a specific query or optimize an existing one?`;
  }

  if (msg.includes("python") || msg.includes("code") || msg.includes("pandas")) {
    return `Here's a Python data analysis snippet:

\`\`\`python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load and explore data
df = pd.read_csv('your_data.csv')
print(df.describe())
print(df.info())

# Quick analysis
summary = df.groupby('category').agg({
    'revenue': ['sum', 'mean', 'count'],
    'date': 'max'
}).reset_index()

# Visualization
plt.figure(figsize=(10, 6))
df['category'].value_counts().plot(kind='bar')
plt.title('Distribution by Category')
plt.tight_layout()
plt.show()
\`\`\`

**Best practices:**
- Use **vectorized operations** instead of loops
- Handle **missing data** with \`fillna()\` or \`dropna()\`
- Use \`astype()\` for memory-efficient data types
- Cache intermediate results to avoid recomputation

Need help with a specific analysis?`;
  }

  if (msg.includes("dashboard") || msg.includes("chart") || msg.includes("visualization")) {
    return `For dashboard design, I recommend this structure:

**1. KPI Cards (Top Row)**
- Total Revenue, Active Users, Conversion Rate, Avg Order Value

**2. Trend Charts (Middle)**
- Line chart for time-series data
- Bar chart for category comparisons
- Area chart for cumulative metrics

**3. Detail Tables (Bottom)**
- Top 10 performers
- Recent transactions
- Alert flags

**Dashboard best practices:**
- Use consistent color coding (green=good, red=bad, yellow=warning)
- Add date range filters globally
- Ensure charts are responsive
- Use drill-down for detailed exploration

Would you like me to help design a specific dashboard layout?`;
  }

  return `Thank you for your question! I'm the DS-PaaS AI Analyst, here to help you with:

- **Data Analysis** — Statistical methods, hypothesis testing, ML recommendations
- **SQL Queries** — Query optimization, schema design, complex joins
- **Python/R Code** — Pandas, NumPy, scikit-learn, data visualization
- **Dashboard Design** — Layout suggestions, chart selection, UX patterns
- **Data Engineering** — Pipeline architecture, ETL processes, data modeling

**What would you like to work on today?** Feel free to share specific questions, data schemas, or code snippets you'd like help with.`;
}

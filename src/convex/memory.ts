// memory.ts — queries/mutations backing the Memory Inspector: the real
// activity log written by hindsight_client.ts, the labeled local fallback
// memory store, and simple system state.

import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

const sourceValidator = v.object({
  text: v.string(),
  type: v.string(),
  date: v.string(),
  kind: v.string(),
});

// ------------------------------------------------------- activity log

export const logActivity = internalMutation({
  args: {
    kind: v.union(v.literal("RETAIN"), v.literal("RECALL"), v.literal("REFLECT")),
    bank: v.union(v.literal("experience"), v.literal("world")),
    query: v.optional(v.string()),
    summary: v.string(),
    sources: v.array(sourceValidator),
    origin: v.string(),
    mode: v.union(v.literal("live"), v.literal("fallback")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("memoryActivity", {
      kind: args.kind,
      bank: args.bank,
      query: args.query,
      summary: args.summary,
      sources: args.sources,
      origin: args.origin,
      mode: args.mode,
      createdAt: Date.now(),
    });
  },
});

export const listActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 40, 100);
    return await ctx.db
      .query("memoryActivity")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

// ----------------------------------------------------- fallback memory

export const upsertFallback = internalMutation({
  args: {
    bank: v.union(v.literal("experience"), v.literal("world")),
    sourceId: v.string(),
    text: v.string(),
    context: v.string(),
    occurredAt: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fallbackMemory")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        text: args.text,
        context: args.context,
        occurredAt: args.occurredAt,
        tags: args.tags,
      });
    } else {
      await ctx.db.insert("fallbackMemory", {
        bank: args.bank,
        sourceId: args.sourceId,
        text: args.text,
        context: args.context,
        occurredAt: args.occurredAt,
        tags: args.tags,
      });
    }
  },
});

export const countFallback = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("fallbackMemory").collect();
    let experience = 0;
    let world = 0;
    for (const r of rows) {
      if (r.bank === "experience") experience += 1;
      else if (r.bank === "world") world += 1;
    }
    return { experience, world };
  },
});

/**
 * Lightweight keyword-overlap search over the local fallback store.
 * Only used when the self-hosted Hindsight server is unreachable.
 */
export const searchFallback = internalQuery({
  args: { bank: v.union(v.literal("experience"), v.literal("world")), query: v.string() },
  handler: async (ctx, args) => {
    const stop = new Set([
      "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "is",
      "are", "was", "were", "we", "our", "us", "it", "what", "when", "how",
      "why", "did", "do", "does", "with", "by", "at", "from", "last", "this",
    ]);
    const terms = args.query
      .toLowerCase()
      .replace(/[^a-z0-9%\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stop.has(t));

    const rows = await ctx.db
      .query("fallbackMemory")
      .withIndex("by_bank", (q) => q.eq("bank", args.bank))
      .collect();

    const scored = rows.map((r) => {
      const hay = (r.text + " " + r.tags.join(" ")).toLowerCase();
      let score = 0;
      for (const t of terms) if (hay.includes(t)) score += 1;
      // Small recency nudge so recent history wins ties.
      const recency = Date.parse(r.occurredAt) / 1e13;
      return { row: r, score: score + recency };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => ({
        text: s.row.text,
        occurredAt: s.row.occurredAt,
        context: s.row.context,
      }));
  },
});

// -------------------------------------------------------- system state

export const getState = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("systemState")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return row?.value ?? null;
  },
});

export const setState = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemState")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("systemState", { key: args.key, value: args.value });
    }
  },
});

export const setStateAction = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemState")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("systemState", { key: args.key, value: args.value });
    }
  },
});

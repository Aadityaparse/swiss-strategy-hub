// decisions.ts — internal accessors for decision records (Situation →
// Options → Chosen action → Reason → Expected → Actual → Impact → Lesson).

import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const byRef = internalQuery({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("decisions")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .first();
  },
});

export const byId = internalQuery({
  args: { id: v.id("decisions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const insert = internalMutation({
  args: {
    ref: v.string(),
    title: v.string(),
    monthIndex: v.number(),
    date: v.string(),
    situation: v.string(),
    options: v.array(v.string()),
    chosen: v.string(),
    reason: v.string(),
    expected: v.string(),
    actual: v.string(),
    impact: v.string(),
    lesson: v.string(),
    status: v.union(
      v.literal("successful"),
      v.literal("unsuccessful"),
      v.literal("ambiguous"),
      v.literal("pending"),
    ),
    retained: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("decisions", {
      ref: args.ref,
      title: args.title,
      monthIndex: args.monthIndex,
      date: args.date,
      situation: args.situation,
      options: args.options,
      chosen: args.chosen,
      reason: args.reason,
      expected: args.expected,
      actual: args.actual,
      impact: args.impact,
      lesson: args.lesson,
      status: args.status,
      retained: args.retained,
      createdAt: Date.now(),
    });
  },
});

export const markRetained = internalMutation({
  args: {
    id: v.id("decisions"),
    hindsightDocId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      retained: true,
      hindsightDocId: args.hindsightDocId,
    });
  },
});

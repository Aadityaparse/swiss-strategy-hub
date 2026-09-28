// api.ts — public API surface (queries + mutations, isolate runtime).
// Node-runtime actions (Hindsight, agent, ingest) live in actions.ts.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { computeFinancials } from "./financials";
import {
  COMPANY,
  COMPETITORS,
  COMPETITOR_EVENTS,
  TIMELINE_EVENTS,
} from "./mockdata";
import { generateCompetitorHypotheses } from "./hypotheses";
import { EXPERIENCE_BANK, WORLD_BANK } from "./banks";

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const financials = computeFinancials();
    const decisions = await ctx.db.query("decisions").collect();
    const fallbackRows = await ctx.db.query("fallbackMemory").collect();
    const decisionsSorted = [...decisions].sort(
      (a, b) => a.monthIndex - b.monthIndex || a.date.localeCompare(b.date),
    );
    return {
      company: COMPANY,
      kpis: financials.months,
      totals: financials.totals,
      latest: financials.latest,
      growthLatestPct: financials.growthLatestPct,
      anomalies: financials.anomalies,
      timeline: TIMELINE_EVENTS,
      decisions: decisionsSorted,
      competitors: COMPETITORS,
      competitorEvents: COMPETITOR_EVENTS,
      hypotheses: generateCompetitorHypotheses(),
      fallbackCounts: {
        experience: fallbackRows.filter((r) => r.bank === "experience").length,
        world: fallbackRows.filter((r) => r.bank === "world").length,
      },
    };
  },
});

export const financials = query({
  args: {},
  handler: async () => {
    return computeFinancials();
  },
});

export const competitors = query({
  args: {},
  handler: async () => {
    return {
      competitors: COMPETITORS,
      events: COMPETITOR_EVENTS,
      hypotheses: generateCompetitorHypotheses(),
    };
  },
});

export const decisions = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("decisions").collect();
    return rows.sort(
      (a, b) => a.monthIndex - b.monthIndex || a.date.localeCompare(b.date),
    );
  },
});

export const listChat = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt")
      .order("asc")
      .take(100);
  },
});

export const clearChat = mutation({
  args: {},
  handler: async (ctx) => {
    const msgs = await ctx.db.query("chatMessages").collect();
    for (const m of msgs) await ctx.db.delete(m._id);
  },
});

export const memorySummary = query({
  args: {},
  handler: async (ctx) => {
    const activity = await ctx.db
      .query("memoryActivity")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
    const liveOps = activity.filter((a) => a.mode === "live").length;
    return {
      activityCount: activity.length,
      liveOps,
      fallbackOps: activity.length - liveOps,
      banks: { experience: EXPERIENCE_BANK, world: WORLD_BANK },
    };
  },
});

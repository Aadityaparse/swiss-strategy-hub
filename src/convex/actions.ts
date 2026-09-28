// actions.ts — Node-runtime actions ("use node"): everything that talks to
// Hindsight, runs the agent orchestration, or performs ingestion.
// Queries and mutations live in api.ts.

"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  DEFAULT_SIM_PARAMS,
  describeScenario,
  runSimulation,
  type SimulationParams,
} from "./simulation";
import { ALL_DECISIONS } from "./mockdata";
import {
  checkHindsightHealth,
  recallMemory,
  retainMemory,
  seedMemoryBanks,
} from "./hindsight_client";
import { EXPERIENCE_BANK, WORLD_BANK } from "./banks";
import { askCopilot, buildStrategyBrief } from "./agent";

// ------------------------------------------------------------- health

export const health = action({
  args: {},
  handler: async () => {
    const alive = await checkHindsightHealth();
    return {
      hindsight: alive ? ("connected" as const) : ("offline" as const),
      baseUrl: process.env.HINDSIGHT_BASE_URL || "http://localhost:8888",
      experienceBank: EXPERIENCE_BANK,
      worldBank: WORLD_BANK,
      serverTime: new Date().toISOString(),
    };
  },
});

// -------------------------------------------------------------- ingest

/**
 * Ingest the demo organization into memory: seeds both Hindsight banks and
 * records the demo decisions. Safe to run repeatedly (document_id upserts).
 */
export const ingest = action({
  args: {},
  handler: async (ctx) => {
    const alive = await checkHindsightHealth();
    for (const d of ALL_DECISIONS) {
      const existing = await ctx.runQuery(internal.decisions.byRef, { ref: d.ref });
      if (!existing) {
        await ctx.runMutation(internal.decisions.insert, {
          ref: d.ref,
          title: d.title,
          monthIndex: d.monthIndex,
          date: d.date,
          situation: d.situation,
          options: d.options,
          chosen: d.chosen,
          reason: d.reason,
          expected: d.expected,
          actual: d.actual,
          impact: d.impact,
          lesson: d.lesson,
          status: d.status,
          retained: false,
        });
      }
    }
    const seeded = await seedMemoryBanks(ctx, "ingest action");
    return {
      hindsight: alive ? "connected" : "offline",
      experienceMode: seeded.experience.mode,
      worldMode: seeded.world.mode,
      retainedItems: seeded.experience.sources.length + seeded.world.sources.length,
    };
  },
});

// ------------------------------------------------- decisions / memory

/** Retain a decision (with its outcome) into Hindsight experience memory. */
export const retainDecision = action({
  args: {
    decisionId: v.id("decisions"),
    outcomeNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.runQuery(internal.decisions.byId, { id: args.decisionId });
    if (!decision) throw new Error("Decision not found");

    const content = [
      `Decision ${decision.ref} — ${decision.title} (recorded ${decision.date}).`,
      `Situation: ${decision.situation}`,
      `Options considered: ${decision.options.join(" | ")}`,
      `Chosen action: ${decision.chosen}`,
      `Reason: ${decision.reason}`,
      `Expected outcome: ${decision.expected}`,
      args.outcomeNote
        ? `Actual outcome: ${args.outcomeNote}`
        : `Actual outcome: ${decision.actual || "not yet recorded"}`,
      decision.impact ? `Financial impact: ${decision.impact}` : "",
      decision.lesson ? `Lesson: ${decision.lesson}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const result = await retainMemory(ctx, {
      bank: "experience",
      origin: "decision memory retain",
      items: [
        {
          content,
          timestamp: decision.date,
          context: "decision record",
          documentId: `decision-${decision._id}`,
          tags: ["decision", decision.status],
          sourceId: `decision-${decision._id}`,
          occurredAt: decision.date,
        },
      ],
    });

    await ctx.runMutation(internal.decisions.markRetained, {
      id: args.decisionId,
      hindsightDocId: `decision-${decision._id}`,
    });

    return { mode: result.mode };
  },
});

// ---------------------------------------------------------------- chat

export const ask = action({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    const question = args.question.trim();
    if (!question) throw new Error("Empty question");
    if (question.length > 2000) throw new Error("Question too long (max 2000 chars)");

    await ctx.runMutation(internal.chat.insert, {
      role: "user" as const,
      content: question,
    });

    const result = await askCopilot(ctx, question);

    await ctx.runMutation(internal.chat.insert, {
      role: "assistant" as const,
      content: result.answer,
      evidence: result.evidence,
      operations: result.operations,
    });

    return result;
  },
});

// ----------------------------------------------------------- simulate

export const simulate = action({
  args: {
    priceDeltaPct: v.optional(v.number()),
    discountPct: v.optional(v.number()),
    marketingDeltaPct: v.optional(v.number()),
    volumeDeltaPct: v.optional(v.number()),
    hiringDeltaPct: v.optional(v.number()),
    recall: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const params: SimulationParams = {
      priceDeltaPct: args.priceDeltaPct ?? DEFAULT_SIM_PARAMS.priceDeltaPct,
      discountPct: args.discountPct ?? DEFAULT_SIM_PARAMS.discountPct,
      marketingDeltaPct: args.marketingDeltaPct ?? DEFAULT_SIM_PARAMS.marketingDeltaPct,
      volumeDeltaPct: args.volumeDeltaPct ?? DEFAULT_SIM_PARAMS.volumeDeltaPct,
      hiringDeltaPct: args.hiringDeltaPct ?? DEFAULT_SIM_PARAMS.hiringDeltaPct,
    };
    const sim = runSimulation(params);
    const scenario = describeScenario(params);

    // Retrieve historically similar experiences from Hindsight.
    let historical: Awaited<ReturnType<typeof recallMemory>> | null = null;
    if (args.recall !== false) {
      const queryParts: string[] = [];
      if (params.priceDeltaPct !== 0)
        queryParts.push(
          `${Math.abs(params.priceDeltaPct)}% price ${params.priceDeltaPct < 0 ? "reduction" : "increase"} on Product A`,
        );
      if (params.discountPct !== 0)
        queryParts.push(`${params.discountPct}% promotional discount campaign`);
      if (params.marketingDeltaPct !== 0) queryParts.push("marketing budget change");
      if (params.hiringDeltaPct !== 0) queryParts.push("hiring and payroll expansion");
      if (queryParts.length === 0) queryParts.push("pricing experiments and their outcomes");
      historical = await recallMemory(ctx, {
        bank: "experience",
        query: queryParts.join(", "),
        origin: "strategy canvas simulation",
      });
    }

    return {
      params,
      scenario,
      simulation: sim,
      historicalEvidence: historical?.sources ?? [],
      historicalMode: historical?.mode ?? ("fallback" as const),
    };
  },
});

// ------------------------------------------------------- strategy brief

export const buildBrief = action({
  args: {},
  handler: async (ctx) => {
    const { brief, mode } = await buildStrategyBrief(ctx);
    return { brief, mode };
  },
});

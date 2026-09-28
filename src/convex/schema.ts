import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // ---- Hindsight Strategy Co-Pilot ----

    // Actual memory operations performed by the backend (drives Memory Inspector).
    memoryActivity: defineTable({
      kind: v.union(
        v.literal("RETAIN"),
        v.literal("RECALL"),
        v.literal("REFLECT"),
      ),
      bank: v.union(v.literal("experience"), v.literal("world")),
      query: v.optional(v.string()),
      summary: v.string(),
      // Evidence returned by / returned into memory: { text, type, date, kind }
      sources: v.array(
        v.object({
          text: v.string(),
          type: v.string(),
          date: v.string(),
          kind: v.string(),
        }),
      ),
      origin: v.string(),
      mode: v.union(v.literal("live"), v.literal("fallback")),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Decision records: Situation -> Options -> Action -> Outcome -> Lesson
    decisions: defineTable({
      ref: v.string(), // e.g. "D-201"
      title: v.string(),
      monthIndex: v.number(), // 1..6 within the demo window; 0 = historical
      date: v.string(), // ISO date of decision
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
      hindsightDocId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_ref", ["ref"])
      .index("by_monthIndex", ["monthIndex"])
      .index("by_retained", ["retained"]),

    // Local fallback memory store (used only when the self-hosted Hindsight
    // server is unreachable). Seeded from the same demo records that would be
    // retained into Hindsight. Clearly labeled "fallback" everywhere in the UI.
    fallbackMemory: defineTable({
      bank: v.union(v.literal("experience"), v.literal("world")),
      sourceId: v.string(),
      text: v.string(),
      context: v.string(),
      occurredAt: v.string(), // ISO date the event happened
      tags: v.array(v.string()),
    })
      .index("by_bank", ["bank"])
      .index("by_sourceId", ["sourceId"]),

    chatMessages: defineTable({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      evidence: v.optional(
        v.array(
          v.object({
            kind: v.string(), // Historical Fact | Current Data | Simulation | AI Interpretation | Hypothesis | Assumption | Memory
            label: v.string(),
            detail: v.string(),
          }),
        ),
      ),
      operations: v.optional(v.array(v.string())), // e.g. ["RECALL:experience", "SIMULATE"]
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    systemState: defineTable({
      key: v.string(),
      value: v.string(),
    }).index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;

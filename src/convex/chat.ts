// chat.ts — internal mutations for the Executive AI chat log.

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const insert = internalMutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    evidence: v.optional(
      v.array(
        v.object({
          kind: v.string(),
          label: v.string(),
          detail: v.string(),
        }),
      ),
    ),
    operations: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      role: args.role,
      content: args.content,
      evidence: args.evidence,
      operations: args.operations,
      createdAt: Date.now(),
    });
  },
});

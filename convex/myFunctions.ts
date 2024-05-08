import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createLLMLog = mutation({
  args: {
    input: v.string(),
    output: v.string(),
    latency: v.number(),
    model: v.string(),
  },
  handler: async (ctx, { input, output, latency, model }) => {
    await ctx.db.insert("llmLogs", {
      input,
      output,
      latency,
      model,
    });
  },
});

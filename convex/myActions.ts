"use node";

import OpenAI from "openai";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { LLM_PROMPT } from "./convexUtils";

const apiKey = process.env.OPENAI_API_KEY!;
const openai = new OpenAI({ apiKey });

export const processInputInfo = action({
  args: {
    input: v.string(),
  },
  handler: async (ctx, { input }) => {
    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: LLM_PROMPT },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
    });
    const end = Date.now();

    const messageContent = response.choices[0].message?.content ?? "";

    await ctx.runMutation(api.myFunctions.createLLMLog, {
      input,
      output: messageContent,
      latency: end - start,
      model: "gpt-4-turbo",
    });

    return messageContent;
  },
});

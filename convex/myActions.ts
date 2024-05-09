"use node";

// import OpenAI from "openai";
import Groq from "groq-sdk";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { LLM_PROMPT } from "./convexUtils";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const MODEL_NAME = "llama3-70b-8192";

export const processInputInfo = action({
  args: {
    input: v.string(),
  },
  handler: async (ctx, { input }) => {
    const start = Date.now();
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
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
      model: MODEL_NAME,
    });

    return messageContent;
  },
});

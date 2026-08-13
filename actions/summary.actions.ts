"use server";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GoogleGenAI, Type } from "@google/genai";
import { getServerSession } from "next-auth";

export interface ActionItem {
  task: string;
  assignee: string | null;
  deadline: string | null;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  transcript?: string;
  createdAt?: string;
}

const summaryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Concise executive overview summarizing the meeting.",
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Main discussion points covered during the meeting.",
    },
    decisions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Explicit decisions agreed upon by participants.",
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING, description: "Specific actionable task." },
          assignee: {
            type: Type.STRING,
            nullable: true,
            description: "Person assigned to the task if explicitly identified, otherwise null. Do NOT invent names.",
          },
          deadline: {
            type: Type.STRING,
            nullable: true,
            description: "Deadline or due date if explicitly stated, otherwise null. Do NOT invent dates.",
          },
        },
        required: ["task"],
      },
      description: "List of action items resulting from the discussion.",
    },
  },
  required: ["summary", "keyPoints", "decisions", "actionItems"],
};

/**
 * Splits a massive transcript into manageable text chunks if needed.
 */
function chunkTranscript(text: string, maxChunkLength = 100000): string[] {
  if (text.length <= maxChunkLength) return [text];

  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + "\n" + line).length > maxChunkLength) {
      if (currentChunk.trim()) chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + line;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk);

  return chunks;
}

/**
 * Generates an LLM summary using Google Gemini 2.5 Flash with structured JSON output,
 * handles token/transcript size bounds, and stores the result in Prisma.
 */
export async function generateMeetingSummary(
  meetingId: string,
  rawTranscript: string
): Promise<SummaryResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: You must be logged in to generate meeting summaries.");
  }

  if (!meetingId) {
    throw new Error("Invalid meeting ID.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const transcript = rawTranscript && rawTranscript.trim().length > 0
    ? rawTranscript.trim()
    : `Meeting ${meetingId} concluded without a raw speech transcript. Generate a placeholder summary.`;

  const ai = new GoogleGenAI({ apiKey });

  // Handle large transcripts via chunking map-reduce strategy
  const transcriptChunks = chunkTranscript(transcript);
  let processedTranscript = transcript;

  if (transcriptChunks.length > 1) {
    console.log(`Processing long transcript in ${transcriptChunks.length} chunks...`);
    const intermediateSummaries: string[] = [];

    for (let i = 0; i < transcriptChunks.length; i++) {
      const chunkResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Summarize section ${i + 1} of ${transcriptChunks.length} of this meeting transcript:\n\n${transcriptChunks[i]}`,
      });
      if (chunkResponse.text) {
        intermediateSummaries.push(chunkResponse.text);
      }
    }

    processedTranscript = intermediateSummaries.join("\n\n---\n\n");
  }

  const prompt = `Analyze the following meeting transcript and extract structured insights.

CRITICAL CONSTRAINTS:
1. Provide a concise, clear high-level executive summary.
2. List key discussion points.
3. List key decisions made.
4. List action items with 'task', 'assignee', and 'deadline'.
5. Do NOT invent assignees or deadlines. If the transcript does not explicitly identify an assignee or deadline for a task, set 'assignee' or 'deadline' to null.

Meeting Transcript:
${processedTranscript}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: summaryResponseSchema as any,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response returned by Gemini API");
    }

    const parsed: SummaryResult = JSON.parse(responseText);

    // Save/upsert to PostgreSQL via Prisma
    const saved = await prisma.meetingSummary.upsert({
      where: { meetingId },
      update: {
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        decisions: parsed.decisions,
        actionItems: parsed.actionItems as any,
        transcript,
        createdById: session.user.id,
      },
      create: {
        meetingId,
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        decisions: parsed.decisions,
        actionItems: parsed.actionItems as any,
        transcript,
        createdById: session.user.id,
      },
    });

    return {
      summary: saved.summary,
      keyPoints: saved.keyPoints,
      decisions: saved.decisions,
      actionItems: saved.actionItems as any,
      transcript: saved.transcript,
      createdAt: saved.createdAt.toISOString(),
    };
  } catch (err: any) {
    console.error("Gemini Meeting Summarization Error:", err);
    throw new Error(err.message || "Failed to generate meeting summary using Gemini AI");
  }
}

/**
 * Retrieves an existing meeting summary by meetingId from PostgreSQL.
 */
export async function getMeetingSummary(meetingId: string): Promise<SummaryResult | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized: User not logged in.");
  }

  const record = await prisma.meetingSummary.findUnique({
    where: { meetingId },
  });

  if (!record) return null;

  return {
    summary: record.summary,
    keyPoints: record.keyPoints,
    decisions: record.decisions,
    actionItems: record.actionItems as any,
    transcript: record.transcript,
    createdAt: record.createdAt.toISOString(),
  };
}

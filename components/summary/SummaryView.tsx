"use client";

import React, { useState } from "react";
import { SummaryResult } from "@/actions/summary.actions";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  ListTodo,
  Calendar,
  UserCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";

interface SummaryViewProps {
  meetingId: string;
  data: SummaryResult;
  fromMeeting?: boolean;
}

export default function SummaryView({ meetingId, data, fromMeeting }: SummaryViewProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const textToCopy = `MEETING SUMMARY (${meetingId})
    
Summary:
${data.summary}

Key Points:
${data.keyPoints.map((p) => `• ${p}`).join("\n")}

Decisions:
${data.decisions.map((d) => `✓ ${d}`).join("\n")}

Action Items:
${data.actionItems
  .map(
    (a) =>
      `• ${a.task}${a.assignee ? ` (Assigned: ${a.assignee})` : ""}${
        a.deadline ? ` [Due: ${a.deadline}]` : ""
      }`
  )
  .join("\n")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white app-gradient-bg py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link href={fromMeeting ? `/meeting/${meetingId}` : "/"}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-white/15 bg-white/5 hover:bg-white/15 text-white"
              >
                <ArrowLeft size={16} className="mr-1" />
                {fromMeeting ? "Back to Meeting" : "Back to Home"}
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
                <Sparkles className="text-indigo-400 shrink-0" size={24} />
                Meeting Summary
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Meeting ID: <span className="font-mono text-indigo-300">{meetingId}</span>
              </p>
            </div>
          </div>

          <Button
            onClick={handleCopySummary}
            variant="outline"
            className="rounded-xl border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center gap-2"
          >
            <Share2 size={16} />
            {copied ? "Copied to Clipboard!" : "Share Summary"}
          </Button>
        </div>

        {/* Executive Overview */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            <Sparkles size={18} />
            Executive Summary
          </div>
          <p className="text-zinc-200 text-base sm:text-lg leading-relaxed">
            {data.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Discussion Points */}
          <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm uppercase tracking-wider">
              <FileText size={18} />
              Key Points
            </div>
            {data.keyPoints && data.keyPoints.length > 0 ? (
              <ul className="space-y-2.5">
                {data.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-zinc-300 text-sm">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm italic">No specific key points recorded.</p>
            )}
          </div>

          {/* Decisions Made */}
          <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
              <CheckCircle2 size={18} />
              Decisions Made
            </div>
            {data.decisions && data.decisions.length > 0 ? (
              <ul className="space-y-2.5">
                {data.decisions.map((decision, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-zinc-300 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm italic">No explicit decisions recorded.</p>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm uppercase tracking-wider">
            <ListTodo size={18} />
            Action Items
          </div>

          {data.actionItems && data.actionItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 text-xs uppercase font-semibold">
                    <th className="pb-3 pr-4">Task</th>
                    <th className="pb-3 px-4">Assignee</th>
                    <th className="pb-3 pl-4">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.actionItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-white">{item.task}</td>
                      <td className="py-3.5 px-4">
                        {item.assignee ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <UserCheck size={12} />
                            {item.assignee}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4">
                        {item.deadline ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Calendar size={12} />
                            {item.deadline}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">No deadline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm italic">No action items identified.</p>
          )}
        </div>

        {/* Collapsible Raw Transcript Drawer */}
        {data.transcript && (
          <div className="rounded-3xl glass-panel border border-white/10 overflow-hidden">
            <button
              onClick={() => setShowTranscript((prev) => !prev)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 font-semibold text-sm text-zinc-300">
                <FileText size={18} className="text-zinc-400" />
                Raw Speech Transcript
              </div>
              {showTranscript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showTranscript && (
              <div className="p-6 pt-0 border-t border-white/10 bg-black/40">
                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto p-4 rounded-2xl bg-zinc-950/80 border border-white/5">
                  {data.transcript}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

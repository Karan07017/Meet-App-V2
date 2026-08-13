import React from "react";
import { getMeetingSummary } from "@/actions/summary.actions";
import SummaryView from "@/components/summary/SummaryView";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export default async function MeetingSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ fromMeeting?: string }>;
}) {
  const meetingId = (await params).id;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const fromMeeting = resolvedSearchParams.fromMeeting === 'true';
  const summaryData = await getMeetingSummary(meetingId);

  if (!summaryData) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 text-white app-gradient-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl glass-panel p-8 text-center space-y-5 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold">No Summary Available</h1>
            <p className="text-sm text-zinc-400 mt-1">
              No summary has been generated for meeting{" "}
              <span className="font-mono text-indigo-300">{meetingId}</span> yet.
            </p>
          </div>
          <div className="pt-2">
            <Link href={fromMeeting ? `/meeting/${meetingId}` : "/"}>
              <Button className="w-full rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:brightness-110">
                <ArrowLeft size={18} className="mr-2" />
                {fromMeeting ? "Return to Meeting" : "Back to Home"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <SummaryView meetingId={meetingId} data={summaryData} fromMeeting={fromMeeting} />;
}

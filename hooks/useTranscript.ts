"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface TranscriptChunk {
  timestamp: string;
  speaker: string;
  text: string;
}

export function useTranscript() {
  const { data: session } = useSession();
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const speakerName = session?.user?.name || "Participant";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser environment.");
      setIsSupported(false);
      return;
    }

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
    } catch (e) {
      console.error("Failed to instantiate SpeechRecognition:", e);
      setIsSupported(false);
      return;
    }

    recognition.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      if (event.results && event.results[resultIndex]) {
        const transcriptText = event.results[resultIndex][0].transcript.trim();

        if (transcriptText) {
          const timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          setChunks((prev) => [
            ...prev,
            {
              timestamp,
              speaker: speakerName,
              text: transcriptText,
            },
          ]);
        }
      }
    };

    recognition.onerror = (err: any) => {
      if (err.error !== "no-speech" && err.error !== "aborted") {
        console.warn("SpeechRecognition notice:", err.error);
      }
    };

    recognition.onend = () => {
      // Restart continuous listening if still active
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.start();
        } catch {
          // Ignore restart errors
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (startErr) {
      console.warn("SpeechRecognition start error:", startErr);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors on unmount
        }
      }
    };
  }, [speakerName]);

  const getFormattedTranscript = useCallback(() => {
    if (chunks.length === 0) return "";
    return chunks.map((c) => `[${c.timestamp}] ${c.speaker}: "${c.text}"`).join("\n");
  }, [chunks]);

  const clearTranscript = useCallback(() => {
    setChunks([]);
  }, []);

  return {
    chunks,
    isListening,
    isSupported,
    getFormattedTranscript,
    clearTranscript,
  };
}

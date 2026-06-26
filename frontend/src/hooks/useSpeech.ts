"use client";

import { useCallback, useRef } from "react";

/** Browser TTS for English pronunciation. */
export function useSpeech() {
  const speakingRef = useRef(false);

  const speak = useCallback((text: string, lang = "en-US") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    speakingRef.current = true;
    utterance.onend = () => {
      speakingRef.current = false;
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
  }, []);

  return { speak, stop, isSpeaking: speakingRef.current };
}

/* Browser speech helpers: recognition (input), synthesis (voice), wake word. */

type SpeechRecognitionAlternativeLike = { transcript: string; confidence: number };
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};

export type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionLike;

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export type DictationHandlers = {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string | undefined;
};

/** One-shot dictation: listens until the speaker finishes a phrase. */
export function startDictation(handlers: DictationHandlers): (() => void) | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = handlers.lang ?? "en-US";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (!result) continue;
      const alt = result[0];
      if (!alt) continue;
      if (result.isFinal) {
        const text = alt.transcript.trim();
        if (text) handlers.onFinal(text);
      } else {
        interim += alt.transcript;
      }
    }
    if (interim) handlers.onPartial(interim.trim());
  };
  rec.onerror = (event) => handlers.onError?.(event.error);
  rec.onend = () => handlers.onEnd?.();

  try {
    rec.start();
  } catch {
    return null;
  }
  return () => {
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/** Cheap local fuzzy match so "hey jarvis"/"hi jarvis"/"hey jarvus" all trigger. */
export function matchesWakeWord(
  transcript: string,
  wakeWord: string,
  sensitivity: number,
): { hit: boolean; remainder: string } {
  const heard = normalize(transcript);
  const phrase = normalize(wakeWord);
  if (!heard || !phrase) return { hit: false, remainder: "" };

  const index = heard.indexOf(phrase);
  if (index >= 0) {
    return { hit: true, remainder: heard.slice(index + phrase.length).trim() };
  }

  // Fuzzier path: require the last word of the phrase (e.g. "jarvis") to appear
  // with a close-enough edit distance, scaled by sensitivity.
  const words = phrase.split(" ");
  const key = words[words.length - 1] ?? phrase;
  const tolerance = Math.max(0, Math.round(key.length * 0.34 * sensitivity));
  const heardWords = heard.split(" ");
  for (let i = 0; i < heardWords.length; i += 1) {
    const word = heardWords[i];
    if (!word) continue;
    if (editDistance(word, key) <= tolerance) {
      return { hit: true, remainder: heardWords.slice(i + 1).join(" ").trim() };
    }
  }
  return { hit: false, remainder: "" };
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let last = prev[0] ?? 0;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min((prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + 1, last + cost);
      last = temp;
    }
  }
  return prev[b.length] ?? 0;
}

/* ---------- Speech synthesis ---------- */

export function listVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function speak(
  text: string,
  options: { voiceName?: string | null; rate?: number; pitch?: number },
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/<<MEMORY:[^>]*>>/g, "").replace(/[*_`#]/g, "").trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voice = options.voiceName
    ? listVoices().find((v) => v.name === options.voiceName)
    : undefined;
  if (voice) utterance.voice = voice;
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 0.9;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

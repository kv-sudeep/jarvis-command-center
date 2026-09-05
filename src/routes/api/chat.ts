import { createFileRoute } from "@tanstack/react-router";

type Turn = { role: "user" | "assistant"; content: string };

type ChatBody = {
  messages?: Turn[];
  memories?: string[];
  context?: Record<string, string>;
  personality?: string;
  verbosity?: string;
  language?: string;
};

const PERSONALITY: Record<string, string> = {
  cinematic:
    "Speak like the J.A.R.V.I.S. AI from a science-fiction film: calm, composed, dryly witty, addressing the user as 'Sir' or 'Ma'am' occasionally.",
  professional: "Speak in a precise, businesslike, courteous register.",
  friendly: "Speak warmly and casually, like a helpful friend.",
  technical:
    "Speak like a senior engineer: exact terminology, no filler, mention trade-offs.",
  concise: "Answer in as few words as possible. No preamble.",
  humorous: "Be playful and light, with a joke where it fits, but stay useful.",
  formal: "Speak with highly formal, deferential diction.",
};

const VERBOSITY: Record<string, string> = {
  short: "Keep replies to one or two sentences unless explicitly asked for detail.",
  balanced: "Keep replies compact: a few sentences, or short bullets when listing.",
  detailed: "Give thorough, well-structured explanations with reasoning and examples.",
};

function buildSystemPrompt(body: ChatBody) {
  const persona = PERSONALITY[body.personality ?? "cinematic"] ?? PERSONALITY['cinematic'];
  const length = VERBOSITY[body.verbosity ?? "balanced"] ?? VERBOSITY['balanced'];
  const lang =
    !body.language || body.language === "auto"
      ? "Detect the user's language automatically and always reply in that same language. If the user mixes languages in one sentence, mirror that mix naturally."
      : `Always reply in ${body.language}, unless the user explicitly switches language.`;

  const memoryBlock =
    body.memories && body.memories.length > 0
      ? `Things you remember about this user (long-term memory):\n${body.memories.map((m) => `- ${m}`).join("\n")}`
      : "You currently have no stored long-term memories about this user.";

  const contextBlock =
    body.context && Object.keys(body.context).length > 0
      ? `Live short-term context (current session state):\n${Object.entries(body.context)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")}`
      : "No live session context available.";

  return [
    "You are J.A.R.V.I.S., the conversational intelligence layer of a futuristic AI command centre running in the user's browser.",
    persona,
    length,
    lang,
    memoryBlock,
    contextBlock,
    "Conversation rules:",
    "- Understand intent, not keywords. Handle incomplete sentences, slang, corrections, and follow-ups.",
    "- Resolve references like 'it', 'that project', 'the previous problem' from the conversation and the live context. Never ask the user to repeat context you already have.",
    "- If a request is genuinely ambiguous or risky, ask one short clarifying question instead of guessing.",
    "- If the user corrects you more than once on the same topic, switch to clarification mode: state your understanding in one line and ask what is wrong.",
    "- Explain your reasoning briefly when asked why you did something, without exposing hidden chain-of-thought.",
    "- You run inside a web dashboard. You cannot control the user's operating system, files, cameras or devices. When asked to do so, say plainly what is simulated on the HUD and offer what you can genuinely do (answer, plan, draft, calculate, research from your knowledge, remember).",
    "Memory protocol:",
    "- When the user asks you to remember something, or states a durable preference/fact worth keeping, append on the VERY LAST line exactly: <<MEMORY:scope|the fact in one short sentence>> where scope is one of temporary, session, project, long_term.",
    "- Emit at most one memory directive per reply, and never mention the directive syntax to the user.",
    "Never use markdown headers; plain sentences or short dashes only, because your reply may be spoken aloud.",
  ].join("\n\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response("messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured on this project.", { status: 500 });
        }

        const input = messages.slice(-24).map((m) => ({
          role: m.role,
          content: [
            {
              type: m.role === "assistant" ? "output_text" : "input_text",
              text: m.content,
            },
          ],
        }));

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            instructions: buildSystemPrompt(body),
            input,
            stream: true,
            store: false,
            reasoning: { effort: "low", summary: "auto" },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return new Response(detail || "AI request failed", {
            status: upstream.status || 502,
          });
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              buffer += decoder.decode(chunk, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const payload = trimmed.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                  const event = JSON.parse(payload) as { type?: string; delta?: string };
                  if (event.type === "response.output_text.delta" && event.delta) {
                    controller.enqueue(encoder.encode(event.delta));
                  }
                } catch {
                  /* ignore partial frames */
                }
              }
            },
          }),
        );

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});

# JARVIS Build Roadmap

## Done (earlier turns)
- HUD one-screen dashboard, voice suite, memory, streaming AI chat.

## This turn: user's plan (web JARVIS + desktop steps)
1. [x] Connect ElevenLabs (real voice) — key saved as ELEVENLABS_API_KEY
2. [x] Connect Gmail (read-only + approved send), Google Calendar, Telegram, WhatsApp Business
3. [ ] Real human voice (ElevenLabs) for spoken replies in the app
4. [ ] Morning update at 8 AM (02:30 UTC): calendar + email → AI brief; shown in app + sent to Telegram
5. [ ] Telegram chat: bot replies to messages (webhook + AI)
6. [ ] WhatsApp chat: receiver + AI replies (text, within 24h window)
7. [ ] Desktop (OpenJarvis) simple steps document for the user's own computer
8. [ ] Tests: TTS route, gateway reads (calendar/mail), webhook handlers, build log green

## Blocked / needs user
- WhatsApp first message must come from the user's phone (WhatsApp Business rules).
- Morning schedule first real run is tomorrow 8 AM; component reads verified today.

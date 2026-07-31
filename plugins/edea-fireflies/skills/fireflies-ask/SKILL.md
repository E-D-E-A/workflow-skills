---
name: fireflies-ask
description: Answer questions about recorded meetings straight from the Fireflies transcript
  — what was decided, what was said about a subject, which action items came out, a quick
  summary in chat — without writing anything anywhere. Use when the user asks what happened,
  what was said or what was decided in a meeting or call; asks what they missed; asks who
  said something; wants a quick recap in chat rather than a Confluence page; or asks which
  meeting a subject came up in.
---

# Answer questions about a recorded meeting

**Read `../../FIREFLIES.md` first** — it holds how to find and read a meeting, and why
speaker labels can't be trusted.

## Ground rules

- **Chat only.** This skill writes nothing to Confluence, Linear or anywhere else. If the
  user then wants the meeting filed, that's `fireflies-file`.
- **Answer in the language the question was asked in.**
- **Answer from the meeting, not from knowledge.** If the transcript doesn't contain it, say
  it didn't come up in that meeting — that's a real, useful answer. Say what you're basing an
  answer on when it helps: the transcript carries timestamps, so "around 32:00 the discussion
  turned to…" lets the user jump to the recording.
- **The what, never the who.** When asked who said something, explain that Fireflies'
  speaker labels misattribute (FIREFLIES.md) and answer with what was said instead. Name a
  person in an answer only for attendance, from the meeting metadata.

## Working across meetings

"Which meeting did we discuss X in?" — search with `fireflies_search`, answer with the
matching meetings' titles and dates, and offer to dig into whichever one they pick. For a
question about one meeting that search can't settle, show the candidates and ask.

## Long answers

A question like "summarize the meeting for me" gets the same treatment a page would — read
the whole transcript first (the read-everything rule in FIREFLIES.md), then answer compactly:
what it was about, what was decided, what's open, what happens next. Keep it a chat answer,
not a page draft.

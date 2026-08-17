---
name: fireflies-ask
description: Answer questions about recorded meetings — from the meeting's page in the
  Confluence Brain when it's been filed there, falling back to the Fireflies transcript when
  it hasn't or the page dropped the detail — what was decided, what was said about a subject,
  which action items came out, a quick summary in chat — without writing anything anywhere.
  Use when the user asks what happened,
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
- **The Brain first, the transcript for what the page dropped.** Meetings get filed into
  Confluence — each becomes a Meeting notes page under a space's Meetings tree — so when the
  Confluence tools are available, look there first and answer from the page, naming it as
  the source. Go to the Fireflies transcript only when the meeting has no page yet, or the
  question needs something the summary dropped — the exact wording, a number, a timestamp —
  and say that's why you went to the recording. If a meeting turns out not to be filed,
  mention that `fireflies-file` can fix that, once the question is answered.
- **The what, never the who.** When asked who said something, explain that Fireflies'
  speaker labels misattribute (FIREFLIES.md) and answer with what was said instead. Name a
  person in an answer only for attendance, from the meeting metadata.
- **Point sideways when the Brain knows more.** If the subject also has a Decision or Spec
  page — say the page recording where the question finally landed after this meeting — add
  a pointer after the answer: the page's title plus one clause saying what it is. Never
  blend it into what the meeting itself said.

## Working across meetings

"Which meeting did we discuss X in?" — search the Meetings trees in Confluence first, since
filed pages are faster to scan and carry the summary; use `fireflies_search` to cover
meetings that aren't filed yet. Answer with the matching meetings' titles and dates, and
offer to dig into whichever one they pick. For a question about one meeting that search
can't settle, show the candidates and ask.

## Long answers

A question like "summarize the meeting for me" gets the same treatment a page would — read
the whole transcript first (the read-everything rule in FIREFLIES.md), then answer compactly:
what it was about, what was decided, what's open, what happens next. Keep it a chat answer,
not a page draft.

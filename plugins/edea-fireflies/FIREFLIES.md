# Fireflies — shared reference

The facts both skills in this plugin lean on. Read this before either.

## What Fireflies is here

Fireflies is the notetaker bot that joins our meetings, records them, and produces a
transcript and an automatic summary. One account covers the team: the bot joins whenever the
account holder is in the call, so a meeting doesn't need everyone to have a seat.

## Getting connected

The plugin ships the official Fireflies MCP server (`https://api.fireflies.ai/mcp`). The
first use opens a browser sign-in to the Fireflies account; after that it just works. No
credentials live in this repo.

`fireflies-file` also needs the Atlassian connector, which ships with `edea-confluence`.

## Finding a meeting

- **From a link** — `https://app.fireflies.ai/view/<ID>`. The ID is the last path segment;
  strip anything before `::` and everything from `?` on. Links from Fireflies recap emails
  carry both and still work.
- **Without a link** — "yesterday's call", "the last meeting" — search with
  `fireflies_search` / `fireflies_get_transcripts`, then show the candidates (title + date)
  and ask which one is meant. Confirm before doing anything with it.

## Reading a meeting

Use both sources — they cover different things:

- `fireflies_get_summary` — the automatic summary: keywords, overview, action items.
- `fireflies_get_transcript` — every sentence, timestamped. This is the ground truth.

A transcript of a long meeting overflows the tool result and is saved to a file instead.
**Read that file in sequential chunks until all of it has been read** — a summary written
from a partial read silently drops whatever was in the unread part. If some part genuinely
can't be read, say which part and carry on honestly.

## Speaker labels lie

Verified on our own meetings: Fireflies' who-is-speaking labels swap people mid-conversation.
*What* was said is reliable; *who* said it is not. So:

- Repeat a speaker attribution as fact **never** — not in a page, not in a chat answer.
- Attendance is different: the participant list in the meeting's metadata comes from the
  calendar invite, not from voices, and is fine to use.
- When someone asks "who said X?", explain this limit and give the what without the who.

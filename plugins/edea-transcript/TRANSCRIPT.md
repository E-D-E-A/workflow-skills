# EDEA Transcript — shared reference

The facts both skills in this plugin lean on. Read this before either.

This file has no frontmatter and no description, so it never fires on its own. It's reference,
not a skill.

## What EDEA Transcript is

EDEA Transcript is our own meeting transcriber. It records online calls and room meetings in
the browser, and takes phone recordings by upload. For each meeting it gives a transcript
where every line has a speaker and a time. A person names any voice it couldn't name, on the
web app's review screen. The web app files nothing; filing happens in Claude, with
`transcript-file`.

## Getting connected

Two connectors, each signed in to once per person:

- **The EDEA Transcript connector** — how the skills read meetings. It isn't shipped in this
  plugin, because the plugin is public and carries no backend address. An admin adds it for
  the team in Claude's organization settings, or a developer adds it by its address in
  Claude Code. The first use opens a sign-in with the staff Google account.
- **Atlassian's connector** — how the skills read and write the Brain. It ships with
  `edea-confluence`, and both skills here build on that plugin's rules. If `edea-confluence`
  isn't installed, stop and ask the user to install it (`/plugin install edea-confluence@edea`).

If the EDEA Transcript connector's tools aren't available, say so and stop. Never rebuild a
meeting from memory or from a pasted fragment.

## The connector's tools

| Tool | What it gives |
| --- | --- |
| `list_meetings` | Recent meetings, with status and date |
| `get_meeting` | One meeting: its tracks, its voices with their names and where each name came from, a review-screen link for each unnamed voice, and the meeting's own link in the web app |
| `get_transcript` | Every line, with its speaker and time |
| `name_voice` | Saves a name a person gave a voice |
| `record_filing` | Saves the links of the pages just created and marks the meeting filed |

A meeting's status is one of `recording`, `uploading`, `processing`, `ready`, `filed` or
`failed`. Only a `ready` or `filed` meeting has a transcript to read.

## Finding a meeting

- **From a link** to the meeting in the web app — the meeting id is in the link.
- **Without a link** — "my last meeting", "yesterday's call" — call `list_meetings`, show the
  candidates (title, date, duration, status) and ask which one is meant. Confirm before doing
  anything with it.
- **Not `ready` yet** — say what state it's in and stop. A `failed` meeting is retried from
  the web app, not from here.

## Read all of it

Read the whole transcript, from the first line to the last, before drafting anything. A long
meeting's transcript can overflow the tool result and be saved to a file instead: **read that
file in sequential chunks until all of it has been read.** If the tool returns the transcript
in parts, ask for every part. Work written from a partial read silently drops whatever was in
the unread part, and that is exactly where a changed decision tends to sit.

If the meeting also carries a summary, read it too, but treat the transcript as the ground
truth. A point in the summary that the transcript doesn't support is left out. A point in the
transcript that the summary missed is kept.

If some part can't be read, say which part (by time) and carry on honestly.

## Names

Names here are reliable by design. Each name has a source: the recorder's own microphone,
a team member's voice profile, or a person. The system never guesses one. So:

- **The transcript page carries every line's speaker.** That's what it is for.
- **A voice that is still unnamed** blocks filing until it's handled. Offer two ways: the
  review screen, through the voice's link from `get_meeting`, where the person can listen to
  a clip; or a name the person types now, saved with `name_voice`. If nobody knows the voice,
  it stays `Unnamed voice 1`, `Unnamed voice 2` and so on. Never take a name from what was
  said in the meeting, even when someone is addressed by name.
- **The notes page body still names nobody**, by the house rule for Meeting notes. Names
  appear once, in the participants row of the Meeting details table.
- **Action-item owners come from the person filing**, never from who spoke.

## The words can be wrong

The transcript is machine speech-to-text. Numbers, names of things and short English terms
inside Hebrew speech are where it slips most. When a single line carries weight — a figure,
a date, a product or vendor name that would change a Brain page — quote it with its time,
and ask the person to confirm it before it goes anywhere. Offer the meeting's link so they
can listen to that moment.

## Quoting the meeting

Wherever a skill points at the meeting as evidence — in chat or in a proposal — it gives the
time and the quoted words: `[00:42:10] "…"`. In chat the speaker may be named, since names
here are reliable. On a Brain page, quotes and names stay out; the page points at the meeting
notes instead.

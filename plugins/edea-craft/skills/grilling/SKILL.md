---
name: grilling
description: Interview the user relentlessly, one question at a time, to stress-test a plan, decision, or idea before any work starts — and to fill the gaps a Linear issue or Confluence page needs before it can be written. Use when the user says grill me, wants their thinking pulled apart, wants to pressure-test an idea, or when another skill is missing information it can't guess.
---

# Grilling

Interview the user relentlessly about the thing in front of you until you reach a **shared
understanding** — the point where you could both describe the plan the same way without
checking with each other.

## How to run it

**One question at a time.** Ask, wait for the answer, then ask the next. Several questions at
once is bewildering and gets you shallow answers to all of them.

**Recommend an answer with every question.** Don't ask an open question and leave the user to
generate the whole answer. Say which way you'd go and why, so the user can just agree, correct
you, or pick from the options you named. "Is this ENG or BIZ? I'd say BIZ, because the next
step is a customer call" is a good question. "Which team?" is not.

**Look facts up, ask only for decisions.** If something can be found — in the filesystem, in
Linear, in Confluence, on the web, with a tool — go and find it instead of asking. The user's
time is for the calls only they can make. Never ask for the name of a team, a status, or a
label you could have listed.

**Walk the tree in dependency order.** Some decisions unlock others. Resolve the one that
everything else hangs off first, then work down. If an answer makes a later branch irrelevant,
drop that branch rather than asking anyway.

**Keep going past the comfortable part.** The useful questions are usually the ones that feel
awkward to ask — what happens if this doesn't work, who actually decides, what does done
really mean, what are we choosing not to do. Stop when you have a shared understanding, not
when the user seems satisfied.

## Don't start work

Grilling produces understanding, not artifacts. Don't write the issue, the page, or the code
until the user confirms you've reached a shared understanding — then hand off to whichever
skill does the writing.

## Where this fits

The `linear-issue` and `confluence-write` skills each have a small gate of their own: stop and
ask when something is missing. This is the deeper version, for when the whole idea is fuzzy
rather than one field being blank. Reach for it when the answer to "what does done look like?"
is a shrug.

Those two are E.D.E.A's tools. Grilling itself needs none of them — it works on any plan, in
any repo, and hands off to whatever writes things down there.

---

Adapted from [`grilling`](https://github.com/mattpocock/skills) by Matt Pocock, MIT licensed.
See `ATTRIBUTION.md`.

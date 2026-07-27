# Attribution

Some skills in this repo are adapted from other people's public work. This file records what
came from where.

## mattpocock/skills

<https://github.com/mattpocock/skills> — "Skills for Real Engineers", by Matt Pocock. MIT
licensed.

Both live in `.claude/skills/` — they're about building this marketplace, so they're never
published.

| Ours | Where | Theirs | What changed |
| --- | --- | --- | --- |
| `grilling` | `.claude/skills/` | `productivity/grilling` | Rewritten in house voice and aimed at one job: working out what a new plugin or skill is for before it's written. Kept the method — one question at a time, recommend an answer, look facts up rather than asking. |
| `skill-writing` | `.claude/skills/` | `productivity/writing-great-skills` | Substantially rewritten. Kept the underlying ideas — predictability, the description does the firing, steps vs reference, checkable completion, pruning no-ops, positive phrasing, consistent vocabulary. Dropped the coined vocabulary, which conflicts with our plain-language rule. Added our own process: which plugin a skill belongs to, the four house rules, docs page, version bump, `claude plugin validate`, and the public-repo limit. |

We deliberately did not adopt the rest of that repo. Most of it is engineering-craft work tied
to a product codebase — code review, TDD, domain modelling, merge conflicts, triage — which is
out of scope here (see "Scope" in `CLAUDE.md`), and the writing and teaching skills are
personal workflow rather than shared tooling.

### MIT License

```
MIT License

Copyright (c) Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR OTHER DEALINGS IN THE SOFTWARE.
```

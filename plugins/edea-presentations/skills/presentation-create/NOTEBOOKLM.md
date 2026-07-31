# Generating the deck in NotebookLM

How `presentation-create` turns a finished brief into a real PPTX, using the
[`notebooklm-py`](https://github.com/teng-lin/notebooklm-py) CLI.

## What this rides on

`notebooklm-py` is a community CLI (MIT-licensed, not ours and not Google's) that drives
NotebookLM through **undocumented Google APIs**. It can stop working whenever Google
changes something. So:

- If a command errors in a way this file doesn't predict, check `notebooklm --help` and
  `notebooklm generate --help` — flags may have moved since this was written.
- If it's genuinely broken, hand the user the copy-ready brief so they can paste it into
  NotebookLM themselves, and tell them a developer needs to look at the CLI.

## Once per machine

```bash
uv tool install "notebooklm-py[browser]"   # pipx works too
notebooklm login                            # opens a browser for Google sign-in
```

A developer usually runs this on each teammate's machine; after that it just works.

**Temporary — until `notebooklm-py` 0.8.0 is on PyPI.** Google renamed NotebookLM to
Gemini Notebook in July 2026, and the released 0.7.3 doesn't recognise the new
`notebook.google.com` address — `notebooklm login` hangs on "Waiting for login" even after
a successful sign-in. Until 0.8.0 ships (check with `pip index versions notebooklm-py`),
install from the project's main branch instead:

```bash
uv tool install "notebooklm-py[browser] @ git+https://github.com/teng-lin/notebooklm-py.git"
```

Delete this note once 0.8.0 is out and the plain install works again.

## Preflight — every run

```bash
notebooklm auth check --test --json
```

Proceed only when it reports `"status": "ok"` **and** `"checks.token_fetch": true`.

- Command not found → the CLI isn't installed here. Fallback: hand over the brief, point
  at the setup above.
- Auth failing → try `notebooklm auth refresh`, then a fresh `notebooklm login`.

## Pipeline

1. **Create the notebook and capture its id:**

   ```bash
   notebooklm create "<Deck title>" --json
   ```

   Pass `-n <notebook_id>` on every command below rather than relying on `use`.

2. **Add sources.** The deck is generated *from the sources*, so what goes in bounds the
   quality. Save the brief as a Markdown file and add it, then add the user's real
   material — files, pages, links:

   ```bash
   notebooklm source add ./brief.md -n <id> --json
   notebooklm source add <file-or-url> -n <id> --json
   notebooklm source wait <source_id> -n <id>
   ```

   Wait for **each** source — generating against an unprocessed source fails.

3. **Generate.** Short instruction inline, or the full prompt (written per `DECKCRAFT.md`,
   RTL direction included) via `--prompt-file`:

   ```bash
   notebooklm generate slide-deck "<instruction>" -n <id> --json
   notebooklm generate slide-deck --prompt-file ./prompt.txt -n <id> --json
   ```

   **Pass `--format`, `--length`, and `--language` explicitly** — each carries what the
   user confirmed on the run sheet in the skill's Step 4. Language especially: the deck's
   language is pinned by the flag, not by the prompt, and it defaults to English — a fully
   Hebrew prompt still produces an English deck without `--language he`, silently.

   `--format presenter` for light slides someone talks over, `detailed` for a deck that
   reads on its own; `--length short` for a compact version.

4. **Wait without blocking.** Generation takes 15–45 minutes. Tell the user it's running
   and roughly how long, then wait in the background:

   ```bash
   notebooklm artifact wait <artifact_id> -n <id> --timeout 2700
   ```

   Exit code 2 means the timeout passed — check `notebooklm artifact list -n <id> --json`
   before assuming failure. Exit code 1 means the generation itself failed.

5. **Download and deliver:**

   ```bash
   notebooklm download slide-deck ./<name>.pptx --format pptx -n <id>
   ```

   Drop `--format pptx` for a PDF. Give the user the file.

6. **Revise by slide, not by regenerating:**

   ```bash
   notebooklm generate revise-slide "<the change>" --artifact <artifact_id> --slide <N> -n <id>
   ```

   `--slide` is **zero-indexed** — the slide the user calls "slide 3" is `--slide 2`.
   Re-download after.

## Keep the notebook

The notebook is the editable source of the deck — keep it, so the next revision doesn't
start from nothing. Delete one only when the user explicitly asks, confirm before running
(`notebooklm delete -n <id>` prompts unless `--yes` is passed), and offer keeping it as
the reversible alternative first.

// Green Tests, Nothing Works: The Excuse Contest — one-line entry (round 2).
//
// The line is validated here (valid UTF-8, exactly one line, not blank,
// 1-140 characters counted as Unicode code points) and then written to
// /output/entry.txt. Any validation failure aborts before anything is
// written and exits non-zero.
//
// This entrypoint uses node:fs only and runs under plain `node main.ts`
// — no other runtime globals anywhere, because the grader runs plain
// node and any other runtime's globals are undefined there. After writing,
// the file is forced to mode 0644 so the grader's output checker,
// which reads as a different identity, can read it even under a
// strict umask, and the read-back check verifies content and mode.

import { chmodSync, readFileSync, statSync, writeFileSync } from "node:fs";

const ENTRY =
  "512 tests green, out at noon; 12:03, ticket #2208: 'Whose $9,300 is this in my account?' Staging had exactly one user.";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 140;

function fail(message: string): never {
  console.error(`entry rejected: ${message}`);
  process.exit(1);
}

// Count characters as Unicode code points, not UTF-16 code units,
// so an astral character counts as one.
const charCount = [...ENTRY].length;

if (ENTRY.trim().length === 0) {
  fail("entry is blank");
}
if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
  fail("entry must be exactly one line");
}
if (charCount < 1 || charCount > MAX_CHARS) {
  fail(`entry is ${charCount} characters, must be 1-${MAX_CHARS}`);
}

// Self-check: the line must carry a ticket number and a dollar amount,
// and must end on the cold staging-database fact — the punchline is
// that final sentence, not an explanation after it.
if (!/ticket #\d+/.test(ENTRY)) {
  fail("entry must include a ticket number");
}
if (!/\$\d[\d,]*/.test(ENTRY)) {
  fail("entry must include a dollar amount");
}
if (!ENTRY.endsWith("Staging had exactly one user.")) {
  fail("entry must end on the staging single-user fact");
}

// UTF-8 round-trip: encoding then decoding must reproduce the line.
const encoded = new TextEncoder().encode(ENTRY);
if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== ENTRY) {
  fail("entry is not valid UTF-8");
}

writeFileSync(OUTPUT_PATH, encoded);

// The grader's output checker reads this file as a different
// identity, so the file must be world-readable regardless of the
// umask in effect when the entrypoint runs.
chmodSync(OUTPUT_PATH, 0o644);

// Read-back check: the file on disk must decode as UTF-8 and match
// the validated line exactly, otherwise the run fails loudly instead
// of silently shipping a truncated or corrupted entry. The byte
// length is checked too, so a truncation that happens to preserve a
// valid UTF-8 prefix is still caught.
const writtenBytes = readFileSync(OUTPUT_PATH);
if (writtenBytes.length !== encoded.length) {
  console.error(
    `entry rejected: read-back byte length ${writtenBytes.length}, expected ${encoded.length}`,
  );
  process.exit(1);
}
const written = new TextDecoder("utf-8", { fatal: true }).decode(writtenBytes);
if (written !== ENTRY) {
  console.error(
    `entry rejected: read-back mismatch (wrote ${[...written].length} characters, expected ${charCount})`,
  );
  process.exit(1);
}

// Permission check: the output file must be exactly 0644 so the
// grader's output checker (a different identity) can read it. If the
// bits are wrong, abort loudly rather than shipping an unreadable file.
const mode = statSync(OUTPUT_PATH).mode & 0o777;
if (mode !== 0o644) {
  console.error(
    `entry rejected: output file mode is ${mode.toString(8)}, expected 644`,
  );
  process.exit(1);
}

console.log(`wrote ${charCount} characters to ${OUTPUT_PATH}`);

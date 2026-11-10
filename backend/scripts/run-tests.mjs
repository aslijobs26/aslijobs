#!/usr/bin/env node
// Cross-platform backend test runner.
//
// Windows rejects command lines longer than ~8k characters, so the suite can no
// longer be passed to `tsx --test` inline from package.json. The file list lives
// in test-manifest.json; this script validates it, splits it into batches and
// runs each batch with the same `tsx --test` runner the suite always used.
//
//   node scripts/run-tests.mjs                 run the whole suite
//   node scripts/run-tests.mjs --batch 2       run one batch
//   node scripts/run-tests.mjs --list          print batches and files
//   node scripts/run-tests.mjs --check         validate the manifest only
//   node scripts/run-tests.mjs <file> [...]    run selected manifest files
//
// Options: --batch-size N (default 40).

import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "test-manifest.json");
const TEST_FILE_SUFFIX = ".test.ts";
const DEFAULT_BATCH_SIZE = 40;
// Spawned without a shell, Windows allows 32,767 characters per command line.
const MAX_COMMAND_CHARS = 30_000;
const SUMMARY_KEYS = ["tests", "suites", "pass", "fail", "cancelled", "skipped", "todo"];

function fail(message) {
  console.error(`[run-tests] ${message}`);
  process.exit(1);
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function parseArgs(argv) {
  const options = { batch: null, batchSize: DEFAULT_BATCH_SIZE, list: false, check: false, files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const [flag, inlineValue] = arg.startsWith("--") ? arg.split("=", 2) : [arg, undefined];
    const readNumber = () => {
      const raw = inlineValue ?? argv[++i];
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 1) {
        fail(`${flag} expects a positive integer, received "${raw ?? ""}".`);
      }
      return value;
    };
    if (flag === "--batch") options.batch = readNumber();
    else if (flag === "--batch-size") options.batchSize = readNumber();
    else if (flag === "--list") options.list = true;
    else if (flag === "--check") options.check = true;
    else if (flag.startsWith("--")) fail(`Unknown option ${flag}.`);
    else options.files.push(toPosix(path.normalize(arg)));
  }
  return options;
}

function findTestFilesOnDisk(directory) {
  const found = [];
  for (const entry of readdirSync(path.join(ROOT, directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) found.push(...findTestFilesOnDisk(relative));
    else if (entry.name.endsWith(TEST_FILE_SUFFIX)) found.push(relative);
  }
  return found;
}

// Only `dir/*.test.ts` style patterns are supported; they keep Node 20 support
// without a glob dependency and match how the suite has always been listed.
function expandEntry(entry) {
  if (!entry.includes("*")) {
    if (!existsSync(path.join(ROOT, entry)) || !statSync(path.join(ROOT, entry)).isFile()) {
      fail(`Manifest entry does not exist: ${entry}`);
    }
    return [entry];
  }
  const directory = path.posix.dirname(entry);
  const pattern = path.posix.basename(entry);
  if (directory.includes("*") || pattern.split("*").length !== 2) {
    fail(`Unsupported pattern "${entry}". Use a single "*" in the file name, e.g. dir/*.test.ts.`);
  }
  const [prefix, suffix] = pattern.split("*");
  if (!existsSync(path.join(ROOT, directory))) {
    fail(`Manifest pattern directory does not exist: ${entry}`);
  }
  const matches = readdirSync(path.join(ROOT, directory))
    .filter((name) => name.startsWith(prefix) && name.endsWith(suffix))
    .sort()
    .map((name) => `${directory}/${name}`);
  if (matches.length === 0) fail(`Manifest pattern matched no files: ${entry}`);
  return matches;
}

function loadSuite() {
  if (!existsSync(MANIFEST_PATH)) fail(`Missing ${path.basename(MANIFEST_PATH)}.`);
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const include = Array.isArray(manifest.include) ? manifest.include : [];
  const exclude = Array.isArray(manifest.exclude) ? manifest.exclude : [];
  if (include.length === 0) fail("Manifest include list is empty.");

  const files = [];
  const seen = new Map();
  for (const entry of include) {
    for (const file of expandEntry(entry)) {
      if (seen.has(file)) {
        fail(`Test file listed more than once: ${file} (via "${seen.get(file)}" and "${entry}").`);
      }
      seen.set(file, entry);
      files.push(file);
    }
  }

  const excluded = new Map();
  for (const item of exclude) {
    if (!item?.path || !item?.reason) fail("Every exclude entry needs a path and a reason.");
    if (seen.has(item.path)) fail(`Test file is both included and excluded: ${item.path}`);
    excluded.set(item.path, item.reason);
  }

  const unlisted = findTestFilesOnDisk("src").filter(
    (file) => !seen.has(file) && !excluded.has(file),
  );
  if (unlisted.length > 0) {
    fail(
      `Test files missing from test-manifest.json (add them to include, or to exclude with a reason):\n  ${unlisted.join("\n  ")}`,
    );
  }
  return { files, excluded };
}

function makeBatches(files, batchSize) {
  const batches = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }
  return batches;
}

const ANSI_COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function parseSummary(output) {
  const clean = output.replace(ANSI_COLOR, "");
  const summary = {};
  for (const key of SUMMARY_KEYS) {
    const matches = [...clean.matchAll(new RegExp(`^[ℹ#] ${key} (\\d+)\\s*$`, "gm"))];
    if (matches.length > 0) summary[key] = Number(matches.at(-1)[1]);
  }
  return summary;
}

function runBatch(tsxCli, files) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    if (process.stdout.isTTY && env.FORCE_COLOR === undefined) env.FORCE_COLOR = "1";
    const child = spawn(
      process.execPath,
      [tsxCli, "--test", "--test-reporter=spec", ...files],
      { cwd: ROOT, env, stdio: ["inherit", "pipe", "pipe"] },
    );
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    const forward = (signal) => child.kill(signal);
    process.once("SIGINT", forward);
    process.once("SIGTERM", forward);
    child.on("close", (code, signal) => {
      process.off("SIGINT", forward);
      process.off("SIGTERM", forward);
      resolve({ code: code ?? 1, signal, summary: parseSummary(output) });
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { files, excluded } = loadSuite();
  const batches = makeBatches(files, options.batchSize);

  if (options.check) {
    console.log(
      `[run-tests] Manifest OK: ${files.length} test files in ${batches.length} batches` +
        (excluded.size > 0 ? `, ${excluded.size} excluded.` : "."),
    );
    return;
  }

  if (options.list) {
    batches.forEach((batch, index) => {
      console.log(`Batch ${index + 1}/${batches.length} (${batch.length} files)`);
      for (const file of batch) console.log(`  ${file}`);
    });
    for (const [file, reason] of excluded) console.log(`Excluded: ${file} (${reason})`);
    return;
  }

  let selected = batches.map((batch, index) => ({ label: `Batch ${index + 1}/${batches.length}`, files: batch }));
  if (options.batch !== null) {
    if (options.batch > batches.length) {
      fail(`Batch ${options.batch} does not exist; the suite has ${batches.length} batches.`);
    }
    selected = [selected[options.batch - 1]];
  }
  if (options.files.length > 0) {
    const known = new Set(files);
    const unknown = options.files.filter((file) => !known.has(file));
    if (unknown.length > 0) fail(`Not in test-manifest.json: ${unknown.join(", ")}`);
    selected = [{ label: "Selected files", files: options.files }];
  }

  const tsxCli = createRequire(import.meta.url).resolve("tsx/cli");
  const totals = Object.fromEntries(SUMMARY_KEYS.map((key) => [key, 0]));
  const problems = [];
  const startedAt = Date.now();

  for (const batch of selected) {
    const commandChars = [process.execPath, tsxCli, "--test", ...batch.files].join(" ").length;
    if (commandChars > MAX_COMMAND_CHARS) {
      fail(`${batch.label} command is ${commandChars} characters; lower --batch-size.`);
    }
    console.log(`\n[run-tests] ${batch.label}: ${batch.files.length} files`);
    const result = await runBatch(tsxCli, batch.files);
    if (result.summary.tests === undefined) {
      problems.push(`${batch.label}: no test summary was reported (exit ${result.code}${result.signal ? `, ${result.signal}` : ""}).`);
    } else if (result.code !== 0 || (result.summary.fail ?? 0) > 0) {
      problems.push(`${batch.label}: exit ${result.code}, ${result.summary.fail ?? 0} failed.`);
    }
    for (const key of SUMMARY_KEYS) totals[key] += result.summary[key] ?? 0;
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const fileCount = selected.reduce((sum, batch) => sum + batch.files.length, 0);
  console.log(
    `\n[run-tests] ${fileCount} files in ${selected.length} batch(es), ${seconds}s` +
      `\n[run-tests] tests ${totals.tests} | suites ${totals.suites} | pass ${totals.pass} | fail ${totals.fail}` +
      ` | cancelled ${totals.cancelled} | skipped ${totals.skipped} | todo ${totals.todo}`,
  );
  if (problems.length > 0 || totals.cancelled > 0) {
    for (const problem of problems) console.error(`[run-tests] ${problem}`);
    if (totals.cancelled > 0) console.error(`[run-tests] ${totals.cancelled} test(s) were cancelled.`);
    process.exit(1);
  }
}

main().catch((error) => fail(error instanceof Error ? error.stack ?? error.message : String(error)));

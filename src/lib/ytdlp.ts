import { execFile, spawn, type ChildProcessByStdio } from "child_process";
import type { Readable } from "stream";
import { promisify } from "util";
import { helpers } from "ytdlp-nodejs";

/** A spawned yt-dlp process: stdout and stderr are piped, stdin is ignored. */
export type YtdlpProcess = ChildProcessByStdio<null, Readable, Readable>;

const execFileAsync = promisify(execFile);

/**
 * Resolves the standalone yt-dlp binary shipped with `ytdlp-nodejs`.
 *
 * `ytdlp-nodejs` downloads a self-contained yt-dlp executable into
 * `node_modules/ytdlp-nodejs/bin/` during `npm install`. Using that binary
 * instead of a globally installed `yt-dlp` from PATH is what makes the API
 * routes work on Vercel, whose serverless functions have no Python runtime
 * and no globally installed tools.
 */
export function getYtdlpBinaryPath(): string {
  const binaryPath = helpers.findYtdlpBinary();
  if (binaryPath) {
    return binaryPath;
  }

  throw new Error(
    "yt-dlp binary not found in node_modules/ytdlp-nodejs/bin. " +
      "Run `npm install` so ytdlp-nodejs can download its standalone binary."
  );
}

/**
 * Arguments shared by every yt-dlp invocation.
 *
 * `--remote-components ejs:github` allows yt-dlp to fetch the external
 * JavaScript (EJS) challenge solver scripts from the yt-dlp-ejs GitHub
 * repository. YouTube increasingly serves JS challenges, so without the EJS
 * solver (bundled in official executables or enabled via this flag) format
 * extraction is limited or fails entirely.
 */
export function getYtdlpBaseArgs(): string[] {
  return ["--no-playlist", "--no-warnings", "--remote-components", "ejs:github"];
}

export interface YtdlpExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Runs yt-dlp and resolves with its captured output.
 */
export async function runYtdlp(args: string[]): Promise<YtdlpExecResult> {
  return execFileAsync(getYtdlpBinaryPath(), args, {
    maxBuffer: 10 * 1024 * 1024,
  });
}

/**
 * Spawns yt-dlp for streaming use (e.g. piping stdout into the HTTP response).
 */
export function spawnYtdlp(args: string[]): YtdlpProcess {
  return spawn(getYtdlpBinaryPath(), args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

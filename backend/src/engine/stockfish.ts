import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { existsSync } from "fs";
import type { EngineEvaluation, EngineLine } from "../types.js";

interface AnalyzeOptions {
  depth: number;
  multiPv: number;
}

interface ParsedInfoLine {
  multipv: number;
  cp: number | null;
  mate: number | null;
  pv: string[];
}

function parseInfoLine(line: string): ParsedInfoLine | null {
  const tokens = line.split(" ");
  const scoreIdx = tokens.indexOf("score");
  const pvIdx = tokens.indexOf("pv");

  if (scoreIdx === -1 || pvIdx === -1) {
    return null;
  }

  const multipvIdx = tokens.indexOf("multipv");
  const multipv = multipvIdx !== -1 ? Number(tokens[multipvIdx + 1] ?? "1") : 1;

  const scoreType = tokens[scoreIdx + 1] ?? "cp";
  const scoreValue = Number(tokens[scoreIdx + 2] ?? "0");

  return {
    multipv,
    cp: scoreType === "cp" ? scoreValue : null,
    mate: scoreType === "mate" ? scoreValue : null,
    pv: tokens.slice(pvIdx + 1).filter(Boolean)
  };
}

class StockfishEngine {
  private process: ChildProcessWithoutNullStreams | null = null;

  private initialized = false;

  private initPromise: Promise<void> | null = null;

  private initError: string | null = null;

  private queue: Promise<EngineEvaluation> = Promise.resolve({
    bestMove: null,
    lines: [{ multipv: 1, cp: 0, mate: null, pv: [] }]
  });

  private send(command: string): void {
    if (!this.process) {
      return;
    }
    this.process.stdin.write(`${command}\n`);
  }

  private getBinaryCommand(): string {
    const configured = process.env.STOCKFISH_PATH?.trim();
    if (configured && configured.length > 0) {
      return configured;
    }

    const ubuntuPackagePath = "/usr/games/stockfish";
    if (existsSync(ubuntuPackagePath)) {
      return ubuntuPackagePath;
    }

    return "stockfish";
  }

  getStatus(): { ready: boolean; error: string | null } {
    return {
      ready: this.initialized,
      error: this.initError
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initError) {
      throw new Error(this.initError);
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      const command = this.getBinaryCommand();
      try {
        this.process = spawn(command);
      } catch (error) {
        this.initError =
          `Unable to start Stockfish (${command}): ${(error as Error).message}. Install a stockfish binary or set STOCKFISH_PATH.`;
        reject(new Error(this.initError));
        return;
      }

      const proc = this.process;
      if (!proc) {
        this.initError = "Unable to start Stockfish: process handle is null.";
        reject(new Error(this.initError));
        return;
      }

      const onError = (error: Error): void => {
        this.initError =
          `Stockfish process error (${command}): ${error.message}. Install a stockfish binary or set STOCKFISH_PATH.`;
        cleanup();
        reject(new Error(this.initError));
      };

      const onData = (chunk: Buffer): void => {
        const text = chunk.toString("utf8");
        if (text.includes("uciok")) {
          this.initialized = true;
          this.initError = null;
          cleanup();
          resolve();
        }
      };

      const cleanup = (): void => {
        proc.stdout.off("data", onData);
        proc.off("error", onError);
      };

      proc.on("error", onError);
      proc.stdout.on("data", onData);
      this.send("uci");
    });

    await this.initPromise;
  }

  private async analyzeInternal(fen: string, options: AnalyzeOptions): Promise<EngineEvaluation> {
    await this.ensureInitialized();

    if (!this.process || !this.initialized) {
      throw new Error("Stockfish is not ready for analysis.");
    }

    const proc = this.process;
    const depth = Math.max(8, Math.min(24, options.depth));
    const multiPv = Math.max(1, Math.min(3, options.multiPv));

    return new Promise<EngineEvaluation>((resolve) => {
      const parsed = new Map<number, ParsedInfoLine>();
      let bestMove: string | null = null;

      const cleanup = (): void => {
        proc.stdout.off("data", onData);
      };

      const onData = (chunk: Buffer): void => {
        const text = chunk.toString("utf8");
        const lines = text.split("\n").map((line) => line.trim());

        for (const line of lines) {
          if (!line) {
            continue;
          }

          if (line.startsWith("info ") && line.includes(" pv ")) {
            const parsedLine = parseInfoLine(line);
            if (parsedLine) {
              parsed.set(parsedLine.multipv, parsedLine);
            }
          }

          if (line.startsWith("bestmove")) {
            const parts = line.split(" ");
            bestMove = parts[1] ?? null;
            cleanup();

            const engineLines: EngineLine[] = Array.from(parsed.values())
              .sort((a, b) => a.multipv - b.multipv)
              .slice(0, multiPv)
              .map((entry) => ({
                multipv: entry.multipv,
                cp: entry.cp,
                mate: entry.mate,
                pv: entry.pv
              }));

            resolve({
              bestMove,
              lines:
                engineLines.length > 0
                  ? engineLines
                  : [{ multipv: 1, cp: 0, mate: null, pv: [] }]
            });
          }
        }
      };

      proc.stdout.on("data", onData);
      this.send(`setoption name MultiPV value ${multiPv}`);
      this.send("ucinewgame");
      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  analyze(fen: string, options: AnalyzeOptions): Promise<EngineEvaluation> {
    const next = this.queue
      .catch(() => ({ bestMove: null, lines: [{ multipv: 1, cp: 0, mate: null, pv: [] }] }))
      .then(() => this.analyzeInternal(fen, options));

    this.queue = next;
    return next;
  }
}

export const stockfishEngine = new StockfishEngine();

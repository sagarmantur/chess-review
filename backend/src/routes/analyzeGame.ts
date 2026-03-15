import { Chess } from "chess.js";
import { Router } from "express";
import type { Request, Response } from "express";
import { stockfishEngine } from "../engine/stockfish.js";
import { calculateAccuracy } from "../utils/accuracyCalculator.js";
import { buildMoveExplanation, classifyMove } from "../utils/moveClassifier.js";
import { detectOpening, isBookMove } from "../utils/openingBook.js";
import type { EngineLine, MoveAnalysis } from "../types.js";

interface AnalyzeBody {
  pgn?: string;
  depth?: number;
  multiPv?: number;
}

const router = Router();

function engineScoreToCp(cp: number | null, mate: number | null): number {
  if (mate !== null) {
    const sign = mate > 0 ? 1 : -1;
    return sign * (10000 - Math.min(Math.abs(mate), 99) * 100);
  }
  return cp ?? 0;
}

function firstLine(lines: EngineLine[]): EngineLine {
  return (
    lines[0] ?? {
      multipv: 1,
      cp: 0,
      mate: null,
      pv: []
    }
  );
}

function uciToSan(chess: Chess, uci: string | null): string | null {
  if (!uci || uci.length < 4) {
    return null;
  }

  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci[4] as "q" | "r" | "b" | "n" | undefined;

  try {
    const clone = new Chess(chess.fen());
    const move = clone.move({ from, to, promotion });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

router.post("/game", async (req: Request, res: Response) => {
  const { pgn, depth = 14, multiPv = 3 } = req.body as AnalyzeBody;

  if (!pgn) {
    return res.status(400).json({ error: "Missing PGN" });
  }

  const parser = new Chess();
  try {
    parser.loadPgn(pgn);
  } catch {
    return res.status(400).json({ error: "Invalid PGN" });
  }

  const verboseMoves = parser.history({ verbose: true });
  const analysisMoves: MoveAnalysis[] = [];
  const replay = new Chess();
  const sanHistory: string[] = [];
  const evalGraph: Array<{ move: number; eval: number }> = [{ move: 0, eval: 0 }];

  try {
    for (let i = 0; i < verboseMoves.length; i += 1) {
      const move = verboseMoves[i];
      if (!move) {
        continue;
      }

      const beforeFen = replay.fen();
      const before = await stockfishEngine.analyze(beforeFen, { depth, multiPv });

      const bestMoveUci = before.bestMove;
      const bestMoveSan = uciToSan(replay, bestMoveUci);

      const playedUci = `${move.from}${move.to}${move.promotion ?? ""}`;
      const played = replay.move(move.san);
      if (!played) {
        continue;
      }

      sanHistory.push(played.san);
      const afterFen = replay.fen();

      const after = await stockfishEngine.analyze(afterFen, { depth, multiPv });
      const beforePrimary = firstLine(before.lines);
      const afterPrimary = firstLine(after.lines);

      const evalBefore = engineScoreToCp(beforePrimary.cp, beforePrimary.mate);
      const evalAfter = -engineScoreToCp(afterPrimary.cp, afterPrimary.mate);

      let bestEvalAfter = evalAfter;
      let bestMateAfter: number | null = null;

      if (bestMoveUci) {
        const bestReplay = new Chess(beforeFen);
        const maybeBestSan = uciToSan(bestReplay, bestMoveUci);
        if (maybeBestSan) {
          bestReplay.move(maybeBestSan);
          const bestReply = await stockfishEngine.analyze(bestReplay.fen(), {
            depth,
            multiPv: 1
          });
          const bestLine = firstLine(bestReply.lines);
          bestEvalAfter = -engineScoreToCp(bestLine.cp, bestLine.mate);
          bestMateAfter = bestLine.mate;
        }
      }

      const centipawnLoss = Math.max(0, bestEvalAfter - evalAfter);
      const classificationResult = classifyMove({
        centipawnLoss,
        playedMoveUci: playedUci,
        bestMoveUci,
        isBook: isBookMove(sanHistory),
        bestMate: bestMateAfter,
        actualMate: afterPrimary.mate
      });

      const explanation = buildMoveExplanation(
        classificationResult.classification,
        centipawnLoss,
        bestMoveSan
      );

      analysisMoves.push({
        ply: i + 1,
        moveNumber: Math.floor(i / 2) + 1,
        color: move.color,
        san: played.san,
        uci: playedUci,
        fenBefore: beforeFen,
        fenAfter: afterFen,
        evalBefore,
        evalAfter,
        bestEvalAfter,
        centipawnLoss,
        classification: classificationResult.classification,
        bestMoveUci,
        bestMoveSan,
        explanation,
        topLines: before.lines.slice(0, 3),
        isBook: isBookMove(sanHistory)
      });

      evalGraph.push({
        move: i + 1,
        eval: Number((evalAfter / 100).toFixed(2))
      });
    }
  } catch (error) {
    const status = stockfishEngine.getStatus();
    return res.status(503).json({
      error:
        error instanceof Error
          ? error.message
          : "Stockfish analysis failed.",
      engineReady: status.ready,
      engineError: status.error
    });
  }

  const accuracy = calculateAccuracy(analysisMoves);
  const openingName = detectOpening(sanHistory);

  const summary = {
    openingName,
    whiteAccuracy: accuracy.white,
    blackAccuracy: accuracy.black,
    counts: analysisMoves.reduce<Record<string, number>>((acc, move) => {
      acc[move.classification] = (acc[move.classification] ?? 0) + 1;
      return acc;
    }, {})
  };

  return res.json({
    moves: analysisMoves,
    summary,
    evaluationGraph: evalGraph,
    pgn,
    engine: "stockfish"
  });
});

export default router;

import type { AccuracyResult, MoveAnalysis } from "../types.js";

function qualityFromLoss(cpLoss: number): number {
  const safeLoss = Math.max(0, cpLoss);
  const value = 100 * Math.exp(-safeLoss / 140);
  return Math.max(0, Math.min(100, value));
}

export function calculateAccuracy(moves: MoveAnalysis[]): AccuracyResult {
  const whiteScores: number[] = [];
  const blackScores: number[] = [];

  for (const move of moves) {
    const score = qualityFromLoss(move.centipawnLoss);
    if (move.color === "w") {
      whiteScores.push(score);
    } else {
      blackScores.push(score);
    }
  }

  const average = (arr: number[]): number => {
    if (!arr.length) {
      return 100;
    }
    return Number((arr.reduce((sum, x) => sum + x, 0) / arr.length).toFixed(1));
  };

  return {
    white: average(whiteScores),
    black: average(blackScores)
  };
}

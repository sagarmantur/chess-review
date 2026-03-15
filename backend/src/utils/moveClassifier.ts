import type { MoveClassification } from "../types.js";

interface ClassifyInput {
  centipawnLoss: number;
  playedMoveUci: string;
  bestMoveUci: string | null;
  isBook: boolean;
  bestMate: number | null;
  actualMate: number | null;
}

const META: Record<MoveClassification, { color: string; icon: string }> = {
  Brilliant: { color: "#31d0aa", icon: "!!" },
  Great: { color: "#4ac6ff", icon: "!" },
  Best: { color: "#5dd39e", icon: "*" },
  Excellent: { color: "#86efac", icon: "+" },
  Good: { color: "#c4f5a1", icon: "=" },
  Inaccuracy: { color: "#f9c74f", icon: "?!" },
  Mistake: { color: "#f9844a", icon: "?" },
  Blunder: { color: "#f94144", icon: "??" },
  Miss: { color: "#ff7b72", icon: "MISS" },
  "Book move": { color: "#7dd3fc", icon: "BK" }
};

export function classifyMove(input: ClassifyInput): {
  classification: MoveClassification;
  color: string;
  icon: string;
} {
  const {
    centipawnLoss,
    playedMoveUci,
    bestMoveUci,
    isBook,
    bestMate,
    actualMate
  } = input;

  if (isBook) {
    return { classification: "Book move", ...META["Book move"] };
  }

  if (bestMate !== null && actualMate === null) {
    return { classification: "Blunder", ...META.Blunder };
  }

  const normalizedLoss = Math.max(0, centipawnLoss);

  if (bestMoveUci && playedMoveUci === bestMoveUci && normalizedLoss < 20) {
    return { classification: "Best", ...META.Best };
  }

  if (normalizedLoss < 10) {
    return { classification: "Excellent", ...META.Excellent };
  }

  if (normalizedLoss < 20) {
    return { classification: "Great", ...META.Great };
  }

  if (normalizedLoss < 50) {
    return { classification: "Good", ...META.Good };
  }

  if (normalizedLoss < 100) {
    return { classification: "Inaccuracy", ...META.Inaccuracy };
  }

  if (normalizedLoss < 200) {
    return { classification: "Mistake", ...META.Mistake };
  }

  if (normalizedLoss > 350 && normalizedLoss < 600) {
    return { classification: "Miss", ...META.Miss };
  }

  return { classification: "Blunder", ...META.Blunder };
}

export function buildMoveExplanation(
  classification: MoveClassification,
  centipawnLoss: number,
  bestMoveSan: string | null
): string {
  if (classification === "Book move") {
    return "This is a known opening move from established theory.";
  }

  if (classification === "Best") {
    return "You found the engine's top move for this position.";
  }

  if (classification === "Great") {
    return "Strong choice with nearly perfect precision.";
  }

  if (classification === "Blunder") {
    return `This move drops around ${(centipawnLoss / 100).toFixed(1)} pawns. ${bestMoveSan ? `The best continuation was ${bestMoveSan}.` : ""}`.trim();
  }

  if (classification === "Mistake") {
    return `This move significantly worsens the position. ${bestMoveSan ? `A better move was ${bestMoveSan}.` : ""}`.trim();
  }

  if (classification === "Miss") {
    return `You missed a tactical chance here. ${bestMoveSan ? `Try ${bestMoveSan} next time.` : ""}`.trim();
  }

  return bestMoveSan
    ? `Playable move, but ${bestMoveSan} was more accurate according to the engine.`
    : "Playable move with room for improvement.";
}

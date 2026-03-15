export type MoveClassification =
  | "Brilliant"
  | "Great"
  | "Best"
  | "Excellent"
  | "Good"
  | "Inaccuracy"
  | "Mistake"
  | "Blunder"
  | "Miss"
  | "Book move";

export interface EngineLine {
  multipv: number;
  cp: number | null;
  mate: number | null;
  pv: string[];
}

export interface EngineEvaluation {
  bestMove: string | null;
  lines: EngineLine[];
}

export interface MoveAnalysis {
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number;
  evalAfter: number;
  bestEvalAfter: number;
  centipawnLoss: number;
  classification: MoveClassification;
  bestMoveUci: string | null;
  bestMoveSan: string | null;
  explanation: string;
  topLines: EngineLine[];
  isBook: boolean;
}

export interface AccuracyResult {
  white: number;
  black: number;
}

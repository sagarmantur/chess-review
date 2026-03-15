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

export interface ReviewSummary {
  openingName: string;
  whiteAccuracy: number;
  blackAccuracy: number;
  counts: Record<string, number>;
}

export interface ReviewResponse {
  moves: MoveAnalysis[];
  summary: ReviewSummary;
  evaluationGraph: Array<{ move: number; eval: number }>;
  pgn: string;
}

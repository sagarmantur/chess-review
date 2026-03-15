import { Chess } from "chess.js";
import { create } from "zustand";
import type { MoveAnalysis, ReviewResponse, ReviewSummary } from "../types/review";

interface ReviewStore {
  game: Chess;
  orientation: "white" | "black";
  moveHistory: string[];
  currentPly: number;
  pgnText: string;
  analysis: MoveAnalysis[];
  evaluationGraph: Array<{ move: number; eval: number }>;
  summary: ReviewSummary | null;
  loading: boolean;
  error: string | null;
  setPgnText: (pgn: string) => void;
  loadPgn: (pgn: string) => void;
  setReviewData: (data: ReviewResponse) => void;
  setCurrentPly: (ply: number) => void;
  next: () => void;
  prev: () => void;
  flipBoard: () => void;
  resetToStart: () => void;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function replayFen(history: string[], ply: number): string {
  const replay = new Chess();
  for (let i = 0; i < Math.max(0, Math.min(ply, history.length)); i += 1) {
    replay.move(history[i]!);
  }
  return replay.fen();
}

export const useReviewStore = create<ReviewStore>((set: any, get: any) => ({
  game: new Chess(),
  orientation: "white",
  moveHistory: [],
  currentPly: 0,
  pgnText: "",
  analysis: [],
  evaluationGraph: [{ move: 0, eval: 0 }],
  summary: null,
  loading: false,
  error: null,

  setPgnText: (pgnText: string) => set({ pgnText }),

  loadPgn: (pgn: string) => {
    const game = new Chess();
    game.loadPgn(pgn);
    const moveHistory = game.history();
    const fresh = new Chess();

    set({
      pgnText: pgn,
      game: fresh,
      moveHistory,
      currentPly: 0,
      error: null
    });
  },

  setReviewData: (data: ReviewResponse) => {
    const parsed = new Chess();
    parsed.loadPgn(data.pgn);

    set({
      analysis: data.moves,
      summary: data.summary,
      evaluationGraph: data.evaluationGraph,
      moveHistory: parsed.history(),
      currentPly: 0,
      game: new Chess()
    });
  },

  setCurrentPly: (ply: number) => {
    const { moveHistory } = get();
    const nextPly = Math.max(0, Math.min(ply, moveHistory.length));
    const game = new Chess(replayFen(moveHistory, nextPly));
    set({ currentPly: nextPly, game });
  },

  next: () => {
    const { currentPly, moveHistory } = get();
    get().setCurrentPly(Math.min(currentPly + 1, moveHistory.length));
  },

  prev: () => {
    const { currentPly } = get();
    get().setCurrentPly(Math.max(currentPly - 1, 0));
  },

  flipBoard: () => {
    set((state: ReviewStore) => ({
      orientation: state.orientation === "white" ? "black" : "white"
    }));
  },

  resetToStart: () => {
    set({
      game: new Chess(),
      currentPly: 0,
      moveHistory: [],
      analysis: [],
      summary: null,
      evaluationGraph: [{ move: 0, eval: 0 }]
    });
  },

  makeMove: (from: string, to: string, promotion?: string) => {
    const game = new Chess(get().game.fen());

    try {
      const move = game.move({
        from,
        to,
        promotion: promotion as "q" | "r" | "b" | "n" | undefined
      });

      if (!move) {
        return false;
      }

      const history = game.history();
      set({
        game,
        moveHistory: history,
        currentPly: history.length,
        pgnText: game.pgn()
      });

      return true;
    } catch {
      return false;
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error })
}));

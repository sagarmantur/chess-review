import type { CSSProperties } from "react";
import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
  fen: string;
  orientation: "white" | "black";
  lastMove: [string, string] | null;
  arrows: Array<[string, string, string?]>;
  onPieceDrop?: (sourceSquare: string, targetSquare: string) => boolean;
}

export function ChessBoard({
  fen,
  orientation,
  lastMove,
  arrows,
  onPieceDrop
}: ChessBoardProps) {
  const customSquareStyles: Record<string, CSSProperties> = {};

  if (lastMove) {
    customSquareStyles[lastMove[0]] = {
      backgroundColor: "rgba(245, 158, 11, 0.45)"
    };
    customSquareStyles[lastMove[1]] = {
      backgroundColor: "rgba(245, 158, 11, 0.45)"
    };
  }

  return (
    <div className="animate-fadeSlide rounded-2xl border border-slate-700 bg-slate-900/70 p-3 shadow-2xl">
      <Chessboard
        id="game-review-board"
        position={fen}
        boardOrientation={orientation}
        onPieceDrop={onPieceDrop}
        customSquareStyles={customSquareStyles}
        customDarkSquareStyle={{ backgroundColor: "#779556" }}
        customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
        customArrows={arrows}
        animationDuration={260}
      />
    </div>
  );
}

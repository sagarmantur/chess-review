# Chess Review Web Application

A full-stack chess game review app inspired by the feature set of Chess.com Game Review (without copying proprietary code).

## What Is Implemented

- React + TypeScript frontend with modern dark review UI
- Chessboard with drag/drop, animations, last-move highlights, board flip, and best-move arrows
- PGN paste/upload + move navigation (start, prev, next, end, jump to move)
- Backend analysis API using Stockfish via UCI (with safe fallback if Stockfish binary is unavailable)
- Move-by-move review data:
	- Classification: Brilliant, Great, Best, Excellent, Good, Inaccuracy, Mistake, Blunder, Miss, Book move
	- Engine eval before/after
	- Best move suggestion
	- Top engine lines (Multi-PV)
	- Explanation text
- Accuracy score for White and Black
- Game summary with opening detection and per-classification counts
- Evaluation graph (Recharts)
- Review controls:
	- Start Review
	- Next Mistake
	- Show Best Move
	- Practice This Move

## Project Structure

frontend/

- src/components/ChessBoard.tsx
- src/components/MoveList.tsx
- src/components/EvaluationBar.tsx
- src/components/ReviewPanel.tsx
- src/components/EngineLines.tsx
- src/components/EvaluationGraph.tsx
- src/store/reviewStore.ts
- src/services/reviewApi.ts
- src/types/review.ts

backend/

- src/engine/stockfish.ts
- src/routes/analyzeGame.ts
- src/utils/moveClassifier.ts
- src/utils/accuracyCalculator.ts
- src/utils/openingBook.ts
- src/server.ts

examples/

- sample-review-game.pgn

## Setup

### 1) Install frontend dependencies

```bash
cd frontend
npm install
```

### 2) Install backend dependencies

```bash
cd ../backend
npm install
```

### 3) Run backend

```bash
npm run dev
```

Backend runs on http://localhost:8787

### 4) Run frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

## Notes on Stockfish

- The backend requires a real `stockfish` binary for analysis.
- If Stockfish is unavailable, the API returns an explicit `503` with engine error details.
- Install Stockfish system-wide (or set `STOCKFISH_PATH`) before running analysis.

## API

`POST /api/analyze/game`

Body:

```json
{
	"pgn": "...",
	"depth": 14,
	"multiPv": 3
}
```

Response includes:

- `moves[]` with per-move analysis and classification
- `summary` with opening, accuracy, counts
- `evaluationGraph[]`

## Classification Heuristics

Implemented in `backend/src/utils/moveClassifier.ts`:

- 0.00-0.20 pawn loss: Best/Excellent/Great range
- 0.20-0.50: Good
- 0.50-1.00: Inaccuracy
- 1.00-2.00: Mistake
- >2.00: Blunder
- Special handling for book moves and missed mates

Thresholds are configurable in code and intentionally readable for easy tuning.

## Performance Notes

- Engine analysis is queued on backend to avoid overlap/races
- Multi-PV is limited to 3
- UI updates are state-driven through Zustand

## Next Extensions

- Web Worker + WASM Stockfish in browser
- Opening explorer DB
- Persist game reviews (SQLite/MongoDB)
- Cloud engine endpoint
- Shareable review links
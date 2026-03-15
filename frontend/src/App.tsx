import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { analyzeGame } from "./services/reviewApi";
import { useReviewStore } from "./store/reviewStore";
import { ChessBoard } from "./components/ChessBoard";
import { MoveList } from "./components/MoveList";
import { ReviewPanel } from "./components/ReviewPanel";
import { EngineLines } from "./components/EngineLines";
import { EvaluationBar } from "./components/EvaluationBar";
import { EvaluationGraph } from "./components/EvaluationGraph";
import type { MoveAnalysis } from "./types/review";

const SAMPLE_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.03.14"]
[Round "-"]
[White "WhitePlayer"]
[Black "BlackPlayer"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6
8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7
14. Bc2 b4 15. Ne2 Re8 16. Ng3 Bf8 17. b3 g6 18. Bb2 Bg7 19. Qd2 exd4
20. Nxd4 c5 21. Nb5 d5 22. exd5 Rxe1+ 23. Qxe1 Nxd5 24. Bxg7 Kxg7
25. Nd6 Bc6 26. Be4 N7f6 27. Bxd5 Bxd5 28. Qe5 Ra6 29. Ne8+ Kf8
30. Nxf6 Rxf6 31. Rd1 Rd6 32. Rxd5 Rxd5 33. Qxd5 1-0`;

type TabKey = "moves" | "analysis" | "review" | "lines";

function parseArrow(uci: string | null): [string, string, string?] | null {
  if (!uci || uci.length < 4) {
    return null;
  }
  return [uci.slice(0, 2), uci.slice(2, 4), "#60a5fa"];
}

function App() {
  const {
    game,
    orientation,
    moveHistory,
    currentPly,
    pgnText,
    analysis,
    summary,
    evaluationGraph,
    loading,
    error,
    setPgnText,
    loadPgn,
    setReviewData,
    setCurrentPly,
    next,
    prev,
    flipBoard,
    makeMove,
    setLoading,
    setError
  } = useReviewStore();

  const [activeTab, setActiveTab] = useState<TabKey>("moves");
  const [showBestMove, setShowBestMove] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState<string>("");

  const currentMove =
    analysis.find((move: MoveAnalysis) => move.ply === currentPly) ?? null;

  const lastMove = useMemo<[string, string] | null>(() => {
    if (currentPly === 0 || currentPly > moveHistory.length) {
      return null;
    }

    const replay = new Chess();
    for (let i = 0; i < currentPly; i += 1) {
      replay.move(moveHistory[i]!);
    }

    const verbose = replay.history({ verbose: true });
    const finalMove = verbose[verbose.length - 1];
    if (!finalMove) {
      return null;
    }

    return [finalMove.from, finalMove.to];
  }, [currentPly, moveHistory]);

  const boardArrows = useMemo(() => {
    if (!showBestMove || !currentMove) {
      return [];
    }
    const arrow = parseArrow(currentMove.bestMoveUci);
    return arrow ? [arrow] : [];
  }, [currentMove, showBestMove]);

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!pgnText.trim()) {
        throw new Error("Please paste or load a PGN first.");
      }

      loadPgn(pgnText);
      const response = await analyzeGame(pgnText, 14, 3);
      setReviewData(response);
      setPracticeMessage("");
    } catch (analysisError) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyze this game.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onUploadPgn = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setPgnText(text);
  };

  const jumpToNextMistake = () => {
    const badMove = analysis.find(
      (move: MoveAnalysis) =>
        move.ply > currentPly &&
        ["Inaccuracy", "Mistake", "Blunder", "Miss"].includes(
          move.classification
        )
    );

    if (badMove) {
      setCurrentPly(badMove.ply);
      setActiveTab("review");
    }
  };

  const onPracticeMove = () => {
    if (!currentMove) {
      return;
    }

    setPracticeMode(true);
    setPracticeMessage("Play the engine best move on the board.");
    setShowBestMove(false);
    setCurrentPly(Math.max(0, currentPly - 1));
  };

  const onDrop = (from: string, to: string) => {
    const moved = makeMove(from, to, "q");

    if (practiceMode && currentMove?.bestMoveUci) {
      const playedUci = `${from}${to}`;
      if (playedUci === currentMove.bestMoveUci.slice(0, 4)) {
        setPracticeMessage("Correct. You found the best move.");
      } else {
        setPracticeMessage(
          `Not best. Engine suggests ${currentMove.bestMoveSan ?? currentMove.bestMoveUci}.`
        );
      }
      setPracticeMode(false);
    }

    return moved;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#243b53_0%,#111827_40%,#020617_100%)] px-4 py-6 font-body text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              Chess Review Studio
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Game Review and Engine Analysis
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPgnText(SAMPLE_PGN)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Load Example PGN
            </button>
            <button
              type="button"
              onClick={flipBoard}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Flip Board
            </button>
          </div>
        </header>

        <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Paste PGN
          </label>
          <textarea
            value={pgnText}
            onChange={(e) => setPgnText(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 font-mono text-xs text-slate-200 outline-none focus:border-emerald-400"
            placeholder="Paste PGN here..."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
              Upload PGN
              <input
                type="file"
                accept=".pgn,.txt"
                onChange={onUploadPgn}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={runAnalysis}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
            >
              {loading ? "Analyzing..." : "Start Review"}
            </button>
            <button
              type="button"
              onClick={jumpToNextMistake}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Next Mistake
            </button>
            <button
              type="button"
              onClick={() => setShowBestMove((v) => !v)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Show Best Move
            </button>
            <button
              type="button"
              onClick={onPracticeMove}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Practice This Move
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          {practiceMessage && (
            <p className="mt-2 text-sm text-emerald-300">{practiceMessage}</p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(420px,1fr)_360px]">
          <section className="flex gap-3">
            <EvaluationBar evalCp={currentMove?.evalAfter ?? 0} />
            <div className="flex-1">
              <ChessBoard
                fen={game.fen()}
                orientation={orientation}
                lastMove={lastMove}
                arrows={boardArrows}
                onPieceDrop={onDrop}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPly(0)}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-700"
                >
                  |&lt;
                </button>
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-700"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-700"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPly(moveHistory.length)}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-700"
                >
                  &gt;|
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
            <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
              {(
                [
                  ["moves", "Moves"],
                  ["analysis", "Analysis"],
                  ["review", "Review"],
                  ["lines", "Lines"]
                ] as Array<[TabKey, string]>
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-2 py-2 ${
                    activeTab === tab
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "moves" && (
              <MoveList
                moves={analysis}
                currentPly={currentPly}
                onSelectPly={setCurrentPly}
              />
            )}

            {activeTab === "analysis" && (
              <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-200">
                <p>
                  Opening: <strong>{summary?.openingName ?? "N/A"}</strong>
                </p>
                <p>
                  White Accuracy: <strong>{summary?.whiteAccuracy ?? 0}%</strong>
                </p>
                <p>
                  Black Accuracy: <strong>{summary?.blackAccuracy ?? 0}%</strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(summary?.counts ?? {}).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-slate-800 p-2 text-xs">
                      <span className="text-slate-400">{key}</span>
                      <p className="text-base text-slate-100">{Number(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "review" && <ReviewPanel move={currentMove} />}
            {activeTab === "lines" && (
              <EngineLines lines={currentMove?.topLines ?? []} />
            )}
          </section>
        </div>

        <div className="mt-4">
          <EvaluationGraph points={evaluationGraph} />
        </div>
      </div>
    </div>
  );
}

export default App;

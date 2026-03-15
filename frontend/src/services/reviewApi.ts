import type { ReviewResponse } from "../types/review";

const configuredBase = import.meta.env.VITE_BACKEND_URL?.toString().trim();
const API_BASE = configuredBase ? configuredBase.replace(/\/$/, "") : "";

export async function analyzeGame(
  pgn: string,
  depth = 14,
  multiPv = 3
): Promise<ReviewResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/analyze/game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pgn, depth, multiPv })
    });
  } catch {
    throw new Error(
      "Network error: could not reach analysis API. Make sure backend is running and frontend proxy is active."
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to analyze game");
  }

  return (await response.json()) as ReviewResponse;
}

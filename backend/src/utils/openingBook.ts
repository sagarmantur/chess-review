const OPENINGS: Array<{ name: string; sanLine: string[] }> = [
  { name: "Ruy Lopez", sanLine: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
  { name: "Italian Game", sanLine: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
  { name: "Sicilian Defense", sanLine: ["e4", "c5"] },
  { name: "French Defense", sanLine: ["e4", "e6"] },
  { name: "Caro-Kann Defense", sanLine: ["e4", "c6"] },
  { name: "Queen's Gambit", sanLine: ["d4", "d5", "c4"] },
  { name: "King's Indian Defense", sanLine: ["d4", "Nf6", "c4", "g6"] },
  { name: "English Opening", sanLine: ["c4"] }
];

export function isBookMove(historySan: string[]): boolean {
  return OPENINGS.some((opening) => {
    if (historySan.length > opening.sanLine.length) {
      return false;
    }

    return historySan.every((san, idx) => opening.sanLine[idx] === san);
  });
}

export function detectOpening(historySan: string[]): string {
  const bestMatch = OPENINGS
    .filter((opening) =>
      opening.sanLine.every((san, idx) => historySan[idx] === san)
    )
    .sort((a, b) => b.sanLine.length - a.sanLine.length)[0];

  return bestMatch?.name ?? "Unknown Opening";
}

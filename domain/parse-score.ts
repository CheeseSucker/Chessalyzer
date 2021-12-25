export function parseScore(score: any) {
    if (score.unit === "mate") return 100000 * score.value;
    if (score.unit === "cp") return score.value;
    throw new Error("Unknown score unit: " + score.unit);
}

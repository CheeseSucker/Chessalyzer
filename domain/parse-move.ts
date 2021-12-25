import Chess, { ChessInstance, ShortMove, Square } from "chess.js";

export function parseMove(move : string, chess : ChessInstance, newFen : string): string | ShortMove {
    const components = {
        from: move.substr(0, 2) as Square,
        to: move.substr(2, 2) as Square,
    };

    if (chess.get(components.from).type === chess.KING) {
        if (move === "e1h1" || move === "e8h8") {
            return "O-O";
        }
        if (move === "e1a1" || move === "e8a8") {
            return "O-O-O";
        }
    }

    if (chess.get(components.from).type === chess.PAWN) {
        if (move[1] === '2' && move[3] === '1') {
            // Black promotion
            const c2 : ChessInstance= new (Chess as any)(newFen);
            return { ...components, promotion: c2.get(components.to).type as any }
        }

        if (move[1] === '7' && move[3] === '8') {
            // White promotion
            const c2 : ChessInstance = new (Chess as any)(newFen);
            return { ...components, promotion: c2.get(components.to).type as any }
        }

    }

    return components;
}

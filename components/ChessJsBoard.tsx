import React from "react";
import { Chessboard } from "./Chessboard";
import Chess, { Move } from "chess.js";
import _ from "lodash";

export function ChessJsBoard({chess} : {chess : Chess.ChessInstance}) {
    const lastMove : Move | undefined = _.last(chess.history({ verbose: true }));

    return (
        <Chessboard
            fen={chess.fen()}
            viewOnly={true}
            turnColor={chess.turn() === chess.WHITE ? "white" : "black"}
            check={chess.in_check()}
            lastMove={lastMove ? [lastMove.from, lastMove.to] : undefined}
        />
    );
}

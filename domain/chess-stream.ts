import Chess, { ChessInstance, ShortMove } from "chess.js";
import { ReplaySubject } from "rxjs";
import { parseMove } from "./parse-move";

type ChessMoveEvent = { fen: string, move?: string | ShortMove };

export function chessStream(gameStream: ReplaySubject<ChessMoveEvent>): ReplaySubject<ChessMoveEvent> {
    const chess : ChessInstance = new (Chess as any)();

    let isUpToDate = false;
    let firstMove = null;

    let i = 0;
    const replaySubject = new ReplaySubject<ChessMoveEvent>();
    gameStream.subscribe(
        (e:any) => {
            console.log(e);

            if ((i++) === 0) {
                firstMove = e.lastMove;
                chess.load(e.fen);
                replaySubject.next(
                    {
                        fen: chess.fen(),
                        move: undefined,
                    }
                );
            } else if (!isUpToDate) {
                if (e.lm === firstMove) {
                    isUpToDate = true;
                }
                return;
            }

            if (e.lm) {
                const newFen = e.fen + " - - 1 1";
                const parsedMove = parseMove(e.lm, chess, newFen);
                if (!chess.move(parsedMove)) {
                    console.error("Invalid move!", parsedMove);
                    throw new Error("Invalid move");
                }

                replaySubject.next(
                    {
                        fen: chess.fen(),
                        move: parsedMove,
                    }
                );
            }
        }
    );

    return replaySubject;
}

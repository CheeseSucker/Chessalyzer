import React from "react";
import { concatMap } from "rxjs";
import Chess from "chess.js";
import { Chessboard } from "../components/Chessboard";
import { ChessJsBoard } from "../components/ChessJsBoard";
import { streamGame } from "../domain/stream-ongoing-game";
import { chessStream } from "../domain/chess-stream";

export class GameStream extends React.Component {
    constructor(p, c) {
        super(p, c);
        this.state = {fen: undefined };
        this.chess = new Chess();
    }

    async componentDidMount() {
        let {abort, subject} = streamGame(this.props.gameId);
        let stream = chessStream(subject);

        this.abort = abort;
        this.subject = stream
            .pipe(concatMap(async (e, i) => {
                if (i === 0) {
                    this.chess.load(e.fen);
                    this.setState({ fen: e.fen });
                } else {
                    this.chess.move(e.move);
                    this.setState({ fen: e.fen });
                }
            })).subscribe();
    }

    componentWillUnmount() {
        try {
            this.abort && this.abort();
        } catch (e) {
            console.error(e);
        }
        try {
            this.subject && this.subject.unsubscribe();
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        return <div style={{"display": "flex"}}>
            <Chessboard fen={this.state.fen} viewOnly={true}/>
            <ChessJsBoard chess={this.chess}/>
        </div>
    }

}

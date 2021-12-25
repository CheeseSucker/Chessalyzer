import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

import Head from 'next/head'
import styles from '../styles/Home.module.css';

import { Chessground } from 'chessground';
import React, { useState } from "react";

import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

import { concatMap, Observable } from "rxjs";
import Chess from "chess.js";
import ndjsonStream from "can-ndjson-stream";
import _ from "lodash";

export default function Home() {
   const [gameId, setGameId] = useState();

  return (
    <div className={styles.container}>
      <Head>
        <title>Chessalyzer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Chessalyzer {gameId || "No game id"}
        </h1>

          <Channels onClick={setGameId} />
          {gameId && <GameStream gameId={gameId} key={gameId} />}
      </main>
    </div>
  )
}


function Channels({ onClick }) {
    const { data, error } = useSWR('/api/lichess-channels', fetcher)

    if (error) return <div>failed to load</div>
    if (!data) return <div>loading...</div>

    return (
        <p>
            {_.orderBy(Object.keys(data.channels)).map(name =>
                <button key={name} onClick={() => onClick(data.channels[name].gameId)}>
                    {name}: {data.channels[name].user.name}
                </button>
            )}
        </p>
    );
}


class Chessboard extends React.Component {
    static idCounter = 0;
    constructor(p, c) {
        super(p, c);
        this.boardId = Chessboard.idCounter++;
    }

    componentDidMount() {
        const config = this.props;
        this.ground = Chessground(document.getElementById("board-"+this.boardId), config);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.ground.set(this.props);
        console.log(this.ground);
    }

    render() {
        return <div id={"board-"+this.boardId} style={{"margin":"1em"}} />
    }
}

class GameStream extends React.Component {
    constructor(p, c) {
        super(p, c);
        this.state = {fen: undefined, fen2: undefined};
    }

    async componentDidMount() {
        this.abortController = new AbortController();
        try {
            const f = await fetch("https://lichess.org/api/stream/game/" + this.props.gameId, {signal: this.abortController.signal});
            const observable = new Observable(async subscriber => {
                console.log(f.body, typeof (f.body));
                const reader = (await ndjsonStream(f.body)).getReader();
                while (true) {
                    const e = await reader.read();
                    if (e.done) break;
                    subscriber.next(e.value);
                }
                subscriber.complete();
            });

            const chess = new Chess();
            let isUpToDate = false;
            let firstMove = null;
            this.subscriber = observable
                //.pipe(skip(1))
                .pipe(concatMap(async (e, i) => {
                    //return;
                    console.log("started", i);
                    console.log(e);

                    if (i === 0) {
                        firstMove = e.lastMove;
                        chess.load(e.fen);
                        this.setState({fen: e.fen, fen2: chess.fen()});
                        console.log("Last move: ", e.lastMove);
                        console.log(chess.ascii());
                    } else if (!isUpToDate) {
                        if (e.lm === firstMove) {
                            isUpToDate = true;
                        }
                        return;
                    }

                    if (e.lm) {
                        console.log("Last move: ", e.lm);
                        const newFen = e.fen + " - - 1 1";
                        const parsedMove = parseMove(e.lm, chess, newFen);
                        if (!chess.move(parsedMove)) {
                            console.log("Move: ", parsedMove);
                            console.error("Invalid move!");
                            //throw new Error("Invalid move");
                        }

                        this.setState({fen: e.fen, fen2: chess.fen(), history: chess.history()});
                    }

                    console.log("done", i);
                })).subscribe();
        } catch (e) {
            console.error("e", e)
            if (e.constructor.name === "AbortError") {
                return;
            } else {
                throw e;
            }
        }
    }

    componentWillUnmount() {
        try {
            this.abortController && this.abortController.abort();
        } catch (e) { console.error(e); }
        try {
            this.subscriber && this.subscriber.unsubscribe();
        } catch (e) { console.error(e); }
    }

    render() {
        return <div style={{"display":"flex"}}>
            <Chessboard fen={this.state.fen} />
            <Chessboard fen={this.state.fen2} />
        </div>
    }

}


function parseScore(score) {
    if (score.unit === "mate") return 100000 * score.value;
    if (score.unit === "cp") return score.value;
    throw new Error("Unknown score unit: " + score.unit);
}

function parseMove(move, chess, newFen) {
    const components = {
        from: move.substr(0, 2),
        to: move.substr(2, 2),
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
            const c2 = new Chess(newFen);
            return { ...components, promotion: c2.get(components.to).type }
        }

        if (move[1] === '7' && move[3] === '8') {
            // White promotion
            const c2 = new Chess(newFen);
            return { ...components, promotion: c2.get(components.to).type }
        }

    }

    return components;
}

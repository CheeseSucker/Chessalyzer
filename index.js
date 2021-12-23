import fetch from "node-fetch";

import ndjson from "ndjson";
import _ from "lodash";
import { Chess } from "chess.js";
import { Engine } from "node-uci";
import { concatMap, last, Observable, skip } from "rxjs";

const stockfishPath14 = 'C:\\Users\\hkn\\Downloads\\stockfish_14.1_win_x64_avx2\\stockfish_14.1_win_x64_avx2\\stockfish_14.1_win_x64_avx2.exe';
const engine = new Engine(stockfishPath14);

async function countGoodMoves(engine, chess) {
    const moves = chess.moves();

    if (moves.length <= 0) return 0;
    const scores = {};

    let goodMoves = 0;
    for (let i of [1,2,3]) {
        for (const move of moves) {
            process.stdout.write(move + ' ');

            if (!chess.move(move)) throw new Error("Invalid move: " + move);
            await engine.position(chess.fen());

            const result = await engine.go({movetime: 500});
            scores[move] = -(await getScore(result));

            chess.undo();
        }
        console.log("");
    }


    const bestScore = _.max(Object.values(scores));
    console.log("Best score", bestScore);

    for (const move of _.orderBy(moves, move => -scores[move])) {
        const diff = scores[move] - bestScore;
        console.log(move, ":", diff)

        if ((Math.abs(bestScore) > 10000 && Math.sign(scores[move]) === Math.sign(bestScore)) || diff >= -10) {
            goodMoves += 1;
        }
    }

    return goodMoves;
}

async function calculateSharpness(engine) {
    await engine.setoption("Clear Hash", "");

    const result = await engine.go({ movetime: 1000 });
    // console.log("\n\nDetailed result:\n", util.inspect(result, { depth: null }));
    const scores = evaluateResults(result);
    const depths = _.orderBy(Object.keys(scores).map(x => +x));
    let score = 0;
    for (const i of _.range(depths.length)) {
        if (i >= depths.length - 1) continue;

        const a = +depths[i];
        const b = +depths[i + 1];

        score += Math.abs(scores[b] - scores[a]) * (b - a) * Math.log(b + 1);
    }

    return score;
}

function getScore(result) {
    const lastEntry = _.last(result.info.filter(x => x.score));
    if (!lastEntry) {
        console.log("No score: ", result);
        return 0;
    }
    return parseScore(lastEntry.score);
}


function evaluateResults(result) {
    let niceResult = {};
    for (const info of result.info) {
        if (!info.score || !info.depth) continue;
        niceResult[info.depth] = parseScore(info.score);
    }
    return niceResult;
}

function parseScore(score) {
    if (score.unit === "mate") return 100000 * score.value;
    if (score.unit === "cp") return score.value;
    throw new Error("Unknown score unit: " + score.unit);
}

function parseMove(move) {
    return {
      from: move.substr(0, 2),
        to: move.substr(2, 2),
    };
}

async function t(id) {
    const f = await fetch("https://lichess.org/api/stream/game/" + id);
    const observable = new Observable(subscriber => {
        f.body.pipe(ndjson.parse())
            .on("data", e => {
                //console.log(e);
              subscriber.next(e);
            })
            .on("end", () => subscriber.complete());
    });

    try {
        await engine.init();
        await engine.isready();

        return new Promise(resolve => {
            const chess = new Chess();
            let isUpToDate = false;
            let firstMove = null;
            observable
                //.pipe(skip(1))
                .pipe(concatMap(async (e, i) => {
                    //return;
                    console.log("started", i);
                    console.log(e);

                    if (i === 0) {
                        firstMove = e.lastMove;
                        chess.load(e.fen);
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
                        if (!chess.move(parseMove(e.lm))) {
                            console.error("Invalid move!");
                            throw new Error("Invalid move");
                        }
                        console.log(chess.ascii());
                        console.log(chess.history())
                    }

                    await engine.position(chess.fen());
                    console.log("Sharpness: ", await calculateSharpness(engine));

                    const score = await getScore(await engine.go({ movetime: 5000 }));
                    console.log("Score", score);

                    console.log("Good moves: ", await countGoodMoves(engine, chess) , "/" , chess.moves().length);

                    console.log("done", i);
                })).subscribe({ end: async () => { await engine.quit(); resolve(); }});
        });
    } finally {
        //;
    }
}

const channels = await (await fetch("https://lichess.org/api/tv/channels")).json();
await t(channels.Classical.gameId);

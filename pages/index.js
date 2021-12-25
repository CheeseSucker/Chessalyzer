import Head from 'next/head'
import styles from '../styles/Home.module.css';

import React, { useState } from "react";

import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import { Channels } from "../components/Channels";
import { GameStream } from "./GameStream";

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

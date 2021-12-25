import { Chessground } from "chessground";
import React from "react";
import { Api } from "chessground/api";
import { Config } from "chessground/config";

export class Chessboard extends React.Component<Config> {
    private static idCounter = 0;
    private readonly boardId: number;
    private ground: Api;

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
    }

    render() {
        return <div id={"board-"+this.boardId} style={{"margin":"1em"}} />
    }
}

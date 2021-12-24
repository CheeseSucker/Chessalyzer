import fetch from "node-fetch";


export default async function handler(req, res) {
    const channels = await (await fetch("https://lichess.org/api/tv/channels")).json();

    res.status(200).json({ channels })
}

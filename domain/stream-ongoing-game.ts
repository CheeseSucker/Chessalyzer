import ndjsonStream from "can-ndjson-stream";
import { ReplaySubject } from "rxjs";

export function streamGame(gameId: string) {
    const abortController = new AbortController();
    const subject = new ReplaySubject();

    fetch(
        "https://lichess.org/api/stream/game/" + gameId,
        {signal: abortController.signal}
    )
        .then(response => ndjsonStream(response.body))
        .then(async stream => {
            const reader = stream.getReader();
            while (true) {
                const e = await reader.read();
                if (e.done) break;
                subject.next(e.value);
            }
        })
        .catch(e => {
            console.error(e);
            subject.complete();
        });

    return { subject: subject, abort: () => abortController.abort() };
}

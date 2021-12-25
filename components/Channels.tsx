import useSWR from "swr";
import _ from "lodash";
import React from "react";

const fetcher = (url) => fetch(url).then((res) => res.json())

export function Channels({ onClick }) {
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

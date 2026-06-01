import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = './data';

export async function fetchList() {
    const list = await fetch('/data/_list.json').then(res => res.json());
    
    const levelPromises = list.map(async (name) => {
        try {
            // Method B Fallback Logic:
            // 1. Try loading the exact case from the list array (e.g., Robi.json)
            let res = await fetch(`/data/${name}.json`);
            
            // 2. If it 404s, seamlessly try loading the lowercase file variant (e.g., robi.json)
            if (!res.ok) {
                res = await fetch(`/data/${name.toLowerCase()}.json`);
            }
            
            if (!res.ok) throw new Error(name);
            
            const data = await res.json();
            
            // Normalize layout structure to protect downstream components
            if (data && !data.author) {
                data.author = data.uploader || (data.creators && data.creators[0]) || "Unknown";
            }
            
            // Critical Leaderboard Safety: Ensure records array exists so .forEach loop doesn't crash
            if (data && !data.records) {
                data.records = [];
            }
            
            return [data, null];
        } catch (err) {
            return [null, name];
        }
    });
    
    return Promise.all(levelPromises);
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err || !level) {
            if (err) errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        if (Array.isArray(level.records)) {
            level.records.forEach((record) => {
                const user = Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === record.user.toLowerCase(),
                ) || record.user;
                scoreMap[user] ??= {
                    verified: [],
                    completed: [],
                    progressed: [],
                };
                const { completed, progressed } = scoreMap[user];
                if (record.percent === 100) {
                    completed.push({
                        rank: rank + 1,
                        level: level.name,
                        score: score(rank + 1, 100, level.percentToQualify),
                        link: record.link,
                    });
                    return;
                }

                progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            });
        }
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}
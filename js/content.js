import { round, score } from './score.js';

/**
 * Path to directory containing lists and all levels
 */
const dir = './data';

// Inside /js/content.js
export async function fetchList(listType = 'classic') {
    // 1. Determine the master index file to read
    const listFileName = listType === 'platformer' ? 'platformer-list.json' : '_classic-list.json';
    const list = await fetch(`/data/${listFileName}`).then(res => res.json());
    
    // 2. Identify the subfolder where the level JSONs are saved
    const folder = listType === 'platformer' ? 'platformer' : 'classic';
    
    const levelPromises = list.map(async (name) => {
        try {
            // Try loading from the designated subfolder (e.g., /data/classic/Robi.json)
            let res = await fetch(`/data/${folder}/${name}.json`);
            
            // Fallback to lowercase version in that same subfolder if needed
            if (!res.ok) {
                res = await fetch(`/data/${folder}/${name.toLowerCase()}.json`);
            }
            
            if (!res.ok) throw new Error(name);
            
            const data = await res.json();
            
            if (data && !data.author) {
                data.author = data.uploader || (data.creators && data.creators[0]) || "Unknown";
            }
            
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

// Updated to pass listType parameter into the scoring pipeline
export async function fetchLeaderboard(listType = 'classic') {
    // Pass the active list selection down into the fetcher
    const list = await fetchList(listType);

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
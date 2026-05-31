import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- AUTOMATIC PATH RESOLUTION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.resolve(__dirname, './data/_changelog.json'); 
const LIST_PATH = path.resolve(__dirname, './data/_list.json'); 

const [,, levelIdArg, targetPlacementArg] = process.argv;

if (!levelIdArg || !targetPlacementArg) {
    console.error('\x1b[31m%s\x1b[0m', 'Usage: node move-level.js <level_id_or_name> <target_placement>');
    process.exit(1);
}

const LEVEL_INPUT = levelIdArg.trim();
const LEVEL_ID = parseInt(LEVEL_INPUT, 10);
const TARGET_PLACEMENT = parseInt(targetPlacementArg, 10);
const TODAY_DATE = new Date().toISOString().split('T')[0];

function autoMoveDetailed() {
    if (!fs.existsSync(CHANGELOG_PATH) || !fs.existsSync(LIST_PATH)) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: Files not found!');
        process.exit(1);
    }

    const changelog = JSON.parse(fs.readFileSync(CHANGELOG_PATH, 'utf-8'));
    const listData = JSON.parse(fs.readFileSync(LIST_PATH, 'utf-8'));

    // Find the moving level
    const targetIdx = listData.findIndex(item => {
        if (!item) return false;
        if (typeof item === 'string') return item.toLowerCase() === LEVEL_INPUT.toLowerCase() || item.toLowerCase().includes(LEVEL_INPUT.toLowerCase());
        if (item.id && !isNaN(LEVEL_ID)) return item.id === LEVEL_ID;
        if (Array.isArray(item) && item[0]) {
            if (item[0].id && !isNaN(LEVEL_ID)) return item[0].id === LEVEL_ID;
            if (item[0].name) return item[0].name.toLowerCase() === LEVEL_INPUT.toLowerCase();
        }
        return false;
    });

    if (targetIdx === -1) {
        console.error('\x1b[31m%s\x1b[0m', `Error: Level "${LEVEL_INPUT}" not found.`);
        process.exit(1);
    }

    const oldPlacement = targetIdx + 1;
    if (oldPlacement === TARGET_PLACEMENT) {
        console.log('\x1b[33m%s\x1b[0m', `Already at rank #${TARGET_PLACEMENT}. No changes.`);
        process.exit(0);
    }

    // Get moving level details
    let movingLevelName = "Acu"; 
    let finalMovingId = !isNaN(LEVEL_ID) ? LEVEL_ID : 0;
    if (typeof listData[targetIdx] === 'string') {
        movingLevelName = listData[targetIdx].replace('.json', '');
        movingLevelName = movingLevelName.charAt(0).toUpperCase() + movingLevelName.slice(1);
    } else if (Array.isArray(listData[targetIdx]) && listData[targetIdx][0]) {
        movingLevelName = listData[targetIdx][0].name || "Acu";
        finalMovingId = listData[targetIdx][0].id || finalMovingId;
    }

    const isMovingUp = TARGET_PLACEMENT < oldPlacement;
    const newLogsToInsert = [];

    // 1. Log the level that is actually moving
    newLogsToInsert.push({
        id: finalMovingId,
        date: TODAY_DATE,
        type: "moved",
        oldPlacement: oldPlacement,
        placement: TARGET_PLACEMENT,
        notes: `Moved`
    });

    // 2. DETAILED LOOP: Find EVERY level that gets skipped or shifted by this move
    const startIdx = Math.min(oldPlacement, TARGET_PLACEMENT) - 1;
    const endIdx = Math.max(oldPlacement, TARGET_PLACEMENT) - 1;

    for (let i = startIdx; i <= endIdx; i++) {
        if (i === targetIdx) continue; // Skip the moving level itself

        const affectedLevel = listData[i];
        let affectedId = 0;
        let affectedName = "this demon";

        if (typeof affectedLevel === 'string') {
            affectedName = affectedLevel.replace('.json', '');
            affectedName = affectedName.charAt(0).toUpperCase() + affectedName.slice(1);
        } else if (Array.isArray(affectedLevel) && affectedLevel[0]) {
            affectedId = affectedLevel[0].id || 0;
            affectedName = affectedLevel[0].name || "this demon";
        }

        const currentRank = i + 1;
        // If moving up, bypassed levels shift down by 1. If moving down, they shift up by 1.
        const newRank = isMovingUp ? currentRank + 1 : currentRank - 1;

        // Generate custom note text depending on whether it was the exact target or just caught in the middle
        let noteText = `${movingLevelName} moved ${isMovingUp ? 'up' : 'down'} past this demon`;
        if (currentRank !== TARGET_PLACEMENT) {
            noteText = `Pushed ${isMovingUp ? 'down' : 'up'} due to ${movingLevelName} shifting to #${TARGET_PLACEMENT}`;
        }

        newLogsToInsert.push({
            id: affectedId,
            date: TODAY_DATE,
            type: "moved",
            oldPlacement: currentRank,
            placement: newRank,
            notes: noteText
        });
    }

    // Save everything to file
    const updatedChangelog = [...newLogsToInsert, ...changelog];
    fs.writeFileSync(CHANGELOG_PATH, JSON.stringify(updatedChangelog, null, 4), 'utf-8');

    console.log('\x1b[32m%s\x1b[0m', `✔ Success! Generated ${newLogsToInsert.length} detailed history updates into _changelog.json.`);
}

autoMoveDetailed();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- AUTOMATIC PATH RESOLUTION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.resolve(__dirname, '../data/_changelog.json'); 
const LIST_PATH = path.resolve(__dirname, '../data/_list.json'); 
const DATA_DIR = path.resolve(__dirname, '../data');

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
    let movingLevelFileName = "";
    let movingLevelName = "Acu"; 
    let finalMovingId = !isNaN(LEVEL_ID) ? LEVEL_ID : 0;
    
    if (typeof listData[targetIdx] === 'string') {
        movingLevelFileName = listData[targetIdx];
        movingLevelName = listData[targetIdx].replace('.json', '').replace(/_/g, ' ');
    } else if (Array.isArray(listData[targetIdx]) && listData[targetIdx][0]) {
        movingLevelFileName = listData[targetIdx][0].filename || listData[targetIdx][0].name;
        movingLevelName = listData[targetIdx][0].name || "Acu";
        finalMovingId = listData[targetIdx][0].id || finalMovingId;
    }

    const isMovingUp = TARGET_PLACEMENT < oldPlacement;
    const newLogsToInsert = [];

    // Helper to safely write back to individual level JSON files
    function addHistoryToIndividualFile(fileNameOrId, logEntry) {
        if (!fileNameOrId) return;
        
        // Normalize filename string
        let cleanFileName = typeof fileNameOrId === 'string' ? fileNameOrId : String(fileNameOrId);
        if (!cleanFileName.endsWith('.json')) {
            cleanFileName += '.json';
        }

        const individualFilePath = path.join(DATA_DIR, cleanFileName);
        
        if (fs.existsSync(individualFilePath)) {
            try {
                const fileData = JSON.parse(fs.readFileSync(individualFilePath, 'utf-8'));
                if (!fileData.history) {
                    fileData.history = [];
                }
                // Prepend the new history log to the top of the history array
                fileData.history.unshift(logEntry);
                fs.writeFileSync(individualFilePath, JSON.stringify(fileData, null, 4), 'utf-8');
            } catch (err) {
                console.error(`\x1b[33mWarning:\x1b[0m Failed to update individual file: ${cleanFileName}`);
            }
        }
    }

    // 1. Log the level that is actually moving
    const movingLevelLog = {
        id: finalMovingId,
        date: TODAY_DATE,
        type: "moved",
        oldPlacement: oldPlacement,
        placement: TARGET_PLACEMENT,
        notes: `Moved`
    };
    newLogsToInsert.push(movingLevelLog);
    addHistoryToIndividualFile(movingLevelFileName, movingLevelLog);

    // 2. DETAILED LOOP: Find EVERY level that gets skipped or shifted by this move
    const startIdx = Math.min(oldPlacement, TARGET_PLACEMENT) - 1;
    const endIdx = Math.max(oldPlacement, TARGET_PLACEMENT) - 1;

    for (let i = startIdx; i <= endIdx; i++) {
        if (i === targetIdx) continue; // Skip the moving level itself

        const affectedLevel = listData[i];
        let affectedId = 0;
        let affectedFileName = "";

        if (typeof affectedLevel === 'string') {
            affectedFileName = affectedLevel;
        } else if (Array.isArray(affectedLevel) && affectedLevel[0]) {
            affectedId = affectedLevel[0].id || 0;
            affectedFileName = affectedLevel[0].filename || affectedLevel[0].name;
        }

        const currentRank = i + 1;
        // If moving up, bypassed levels shift down by 1. If moving down, they shift up by 1.
        const newRank = isMovingUp ? currentRank + 1 : currentRank - 1;

        // Custom note text applied directly to the bypassed levels
        const noteText = `${movingLevelName} was moved ${isMovingUp ? 'up' : 'down'} past this demon`;

        const affectedLevelLog = {
            id: affectedId,
            date: TODAY_DATE,
            type: "moved",
            oldPlacement: currentRank,
            placement: newRank,
            notes: noteText
        };

        newLogsToInsert.push(affectedLevelLog);
        addHistoryToIndividualFile(affectedFileName, affectedLevelLog);
    }

    // --- PHYSICALLY MOVE LEVEL INSIDE ARRAY ---
    const [extractedLevel] = listData.splice(targetIdx, 1); 
    listData.splice(TARGET_PLACEMENT - 1, 0, extractedLevel); 

    // --- SAVE REARRANGED LIST AND UPDATED CHANGELOG ---
    const updatedChangelog = [...newLogsToInsert, ...changelog];
    fs.writeFileSync(CHANGELOG_PATH, JSON.stringify(updatedChangelog, null, 4), 'utf-8');
    fs.writeFileSync(LIST_PATH, JSON.stringify(listData, null, 4), 'utf-8');

    console.log('\x1b[32m%s\x1b[0m', `✔ Success! ${movingLevelName} shifted to #${TARGET_PLACEMENT}.`);
    console.log('\x1b[32m%s\x1b[0m', `✔ Generated ${newLogsToInsert.length} history updates across global changelog and individual JSON files.`);
}

autoMoveDetailed();
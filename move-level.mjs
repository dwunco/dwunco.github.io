import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- AUTOMATIC PATH RESOLUTION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const listPath = path.join(dataDir, '_list.json');

// --- MIRRORED ARGUMENT HANDLING ---
const fileNameArg        = process.argv[2]; // e.g., Theory_of_Everything_2
const targetPlacementArg = parseInt(process.argv[3], 10); // e.g., 103
const customDate         = process.argv[4];

if (!fileNameArg || isNaN(targetPlacementArg)) {
    console.error('❌ Error: Usage: node move-level.mjs <file_name_in_list> <target_placement> [optional_date]');
    process.exit(1);
}

// Standardize incoming date strictly to YYYY-MM-DD format
let finalLogDate = customDate || new Date().toISOString().split('T')[0];
finalLogDate = finalLogDate.replace(/\//g, '-');

function autoMoveDetailed() {
    if (!fs.existsSync(listPath)) {
        console.error(`❌ Error: Cannot find _list.json at ${listPath}`);
        process.exit(1);
    }

    let masterList = JSON.parse(fs.readFileSync(listPath, 'utf8'));

    // Find the current location of the level via case-insensitive filename check
    const targetIdx = masterList.findIndex(name => name.toLowerCase() === fileNameArg.toLowerCase());

    if (targetIdx === -1) {
        console.error(`❌ Error: Level filename "${fileNameArg}" not found in _list.json.`);
        process.exit(1);
    }

    const oldPlacement = targetIdx + 1;
    if (oldPlacement === targetPlacementArg) {
        console.log(`⚠️ Already at rank #${targetPlacementArg}. No changes made.`);
        process.exit(0);
    }

    // Determine safe array boundaries for insertion point
    let targetIndex = Math.max(0, targetPlacementArg - 1);
    if (targetIndex > masterList.length - 1) {
        targetIndex = masterList.length - 1;
    }

    // Read the moving file directly to discover its real display name (e.g., "Theory of Everything 2")
    let movingLevelDisplayName = fileNameArg.replace(/_/g, ' ');
    const movingFilePath = path.join(dataDir, `${masterList[targetIdx]}.json`);
    if (fs.existsSync(movingFilePath)) {
        try {
            const movingData = JSON.parse(fs.readFileSync(movingFilePath, 'utf8'));
            if (movingData.name) movingLevelDisplayName = movingData.name;
        } catch (e) {}
    }

    const isMovingUp = targetPlacementArg < oldPlacement;
    console.log(`📝 Splice Shifting. Generating history cascading updates...\n`);

    // 1. Log the target level's individual move entry
    if (fs.existsSync(movingFilePath)) {
        try {
            const movingData = JSON.parse(fs.readFileSync(movingFilePath, 'utf8'));
            if (!movingData.history) movingData.history = [];
            
            movingData.history.unshift({
                "date": finalLogDate,
                "type": "moved",
                "oldPlacement": oldPlacement,
                "placement": targetIndex + 1,
                "notes": `Moved`
            });
            fs.writeFileSync(movingFilePath, JSON.stringify(movingData, null, 4));
        } catch (e) {
            console.error(`⚠️ Failed to update moving level log:`, e.message);
        }
    }

    // 2. DETAILED LOOP: Find and write custom histories to EVERY bypassed level file
    const startIdx = Math.min(targetIdx, targetIndex);
    const endIdx = Math.max(targetIdx, targetIndex);

    for (let i = startIdx; i <= endIdx; i++) {
        if (i === targetIdx) continue; // Skip logging the moving level inside this specific loop

        const existingFileName = masterList[i];
        const filePath = path.join(dataDir, `${existingFileName}.json`);

        if (fs.existsSync(filePath)) {
            try {
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (!fileData.history) fileData.history = [];

                const currentRank = i + 1;
                const newRank = isMovingUp ? currentRank + 1 : currentRank - 1;

                // Sets precise notes depending on direction: "X was moved up/down past this demon"
                const directionText = isMovingUp ? "up" : "down";

                fileData.history.unshift({
                    "date": finalLogDate,
                    "type": "moved",
                    "oldPlacement": currentRank,
                    "placement": newRank,
                    "notes": `${movingLevelDisplayName} was moved ${directionText} past this demon`
                });

                fs.writeFileSync(filePath, JSON.stringify(fileData, null, 4));
                console.log(`🔄 Cascaded update to ${existingFileName}.json (Moved #${currentRank} -> #${newRank})`);
            } catch (e) {
                console.error(`⚠️ Failed to cascade update to ${existingFileName}.json:`, e.message);
            }
        }
    }

    // --- PHYSICALLY REARRANGE THE ARRAY ---
    const [extractedLevel] = masterList.splice(targetIdx, 1);
    masterList.splice(targetIndex, 0, extractedLevel);

    // --- SAVE CHANGES ---
    fs.writeFileSync(listPath, JSON.stringify(masterList, null, 4));

    console.log(`\n✅ Successfully shifted ${movingLevelDisplayName} to position #${targetIndex + 1}`);
}

autoMoveDetailed();
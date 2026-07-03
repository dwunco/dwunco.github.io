import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to your local data resources
const DATA_DIR = path.join(__dirname, 'data');
const LIST_JSON_PATH = path.join(DATA_DIR, '_classic-list.json');

function main() {
    // Read command line arguments: node update-ranks.mjs "The Nightmare" "Bronze"
    const targetName = process.argv[2];
    const rankValue = process.argv[3];

    if (!targetName || !rankValue) {
        console.error('❌ Error: Missing arguments.');
        console.log('Usage: node update-ranks.mjs "<level_name>" "<rank_name>"');
        process.exit(1);
    }

    if (!fs.existsSync(LIST_JSON_PATH)) {
        console.error(`❌ Error: Could not find your master list file at: ${LIST_JSON_PATH}`);
        process.exit(1);
    }

    console.log(`⏳ Reading local _classic-list.json file...`);
    const masterList = JSON.parse(fs.readFileSync(LIST_JSON_PATH, 'utf8'));

    // Find the index position of our target level in your master array string list
    // Supports matching both raw string arrays ["The_Nightmare", "vVvVv"] or full objects
    const targetIndex = masterList.findIndex(item => {
        const name = typeof item === 'string' ? item : (item.name || '');
        // Clean underscores and spaces to make matching bulletproof
        return name.replace(/_/g, ' ').toLowerCase() === targetName.replace(/_/g, ' ').toLowerCase();
    });

    if (targetIndex === -1) {
        console.error(`❌ Error: Could not find any level named "${targetName}" inside _classic-list.json.`);
        process.exit(1);
    }

    console.log(`🎯 Found "${targetName}" at position #${targetIndex + 1}. Starting forward update loop downwards...`);

    let updatedCount = 0;

    // Loop FORWARDS (i++) from targetIndex down towards the end of the list (easier levels)
    for (let i = targetIndex; i < masterList.length; i++) {
        const item = masterList[i];
        const filename = typeof item === 'string' ? item : (item.filename || item.name);
        
        if (!filename) continue;

        const jsonPath = path.join(DATA_DIR, filename.endsWith('.json') ? filename : `${filename}.json`);

        if (!fs.existsSync(jsonPath)) {
            console.warn(`⚠️ Warning: File not found at: ${jsonPath}. Skipping...`);
            continue;
        }

        // Parse individual level file
        const fileContent = fs.readFileSync(jsonPath, 'utf8');
        const levelData = JSON.parse(fileContent);

        // STOP CONDITION: Stop immediately if a level already has a custom assigned rank
        if (levelData.rank !== undefined) {
            console.log(`🛑 Stopped loop: "${levelData.name}" already has an assigned rank value ("${levelData.rank}").`);
            break;
        }

        // Reconstruct object keys manually to inject "rank" precisely between password and tags
        const orderedLevel = {};
        let rankInjected = false;

        for (const key of Object.keys(levelData)) {
            orderedLevel[key] = levelData[key];
            if (key === 'password') {
                orderedLevel['rank'] = rankValue;
                rankInjected = true;
            }
        }

        // Fallback: if level doesn't have a password field, place rank near the top instead
        if (!rankInjected) {
            orderedLevel['rank'] = rankValue;
        }

        // Write the clean, formatted object back to disk
        fs.writeFileSync(jsonPath, JSON.stringify(orderedLevel, null, 4), 'utf8');
        console.log(`   ✅ [#${i + 1}] Updated: "${levelData.name}" -> Rank: ${rankValue}`);
        updatedCount++;
    }

    console.log(`\n🎉 Process complete! Successfully injected rank values into ${updatedCount} files.`);
}

try {
    main();
} catch (err) {
    console.error('💥 An unexpected script failure occurred:', err);
}
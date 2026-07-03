import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Argument mapping based on your specified order
const levelName     = process.argv[2];
const listType      = process.argv[3] ? process.argv[3].toLowerCase().trim() : "classic";
const placement     = parseInt(process.argv[4], 10);
const levelId       = parseInt(process.argv[5], 10) || 0;
const fileName      = process.argv[6];
const uploader      = process.argv[7] || "Unknown";
const creatorsRaw   = process.argv[8] || "";
const verifier      = process.argv[9] || "Unknown";
const ytUrl         = process.argv[10] || "";
const listPercent   = parseInt(process.argv[11], 10) || 100;
const password      = process.argv[12] || "Free Copy";
const tagsRaw       = process.argv[13] || ""; // Format: "[tag1, tag2]" or "tag1, tag2"
const customRank    = process.argv[14] || ""; // Optional rank property for level data structures
const customDate    = process.argv[15];

// Validation check
if (!levelName || !fileName || isNaN(placement)) {
    console.error('❌ Error: Missing required arguments. (Usage: node add-level.mjs "Name" "classic/platformer" placement id "file_name" ...)');
    process.exit(1);
}

// Clean and array-parse creators list
const creatorsArray = creatorsRaw.split(',').map(c => c.trim()).filter(c => c !== "");

// Clean and array-parse tags string (stripping out enclosing bracket wrappers if passed)
const cleanTags = tagsRaw.replace(/[\[\]]/g, '');
const tagsArray = cleanTags.split(',').map(t => t.trim()).filter(t => t !== "");

// Standardize incoming date strictly to YYYY-MM-DD format
let finalLogDate = customDate || new Date().toISOString().split('T')[0];
finalLogDate = finalLogDate.replace(/\//g, '-'); 

const dataDir = path.join(__dirname, 'data');

// Fix: Determine the targeted subdirectory name based on listType
const subFolder = listType === 'platformer' ? 'platformer' : 'classic';
const targetSubfolderPath = path.join(dataDir, subFolder);

// Ensure the subfolder (classic or platformer) exists before saving files to it
if (!fs.existsSync(targetSubfolderPath)) {
    fs.mkdirSync(targetSubfolderPath, { recursive: true });
}

// Choose tracking file target based on listType argument
const listFileName = listType === 'platformer' ? 'platformer-list.json' : '_classic-list.json';
const listPath = path.join(dataDir, listFileName);
let masterList = [];

if (fs.existsSync(listPath)) {
    masterList = JSON.parse(fs.readFileSync(listPath, 'utf8'));
}

// Strip out the level name if it already exists in the destination roster to prevent collisions
masterList = masterList.filter(name => name.toLowerCase() !== fileName.toLowerCase());

// Respect target placement parameter safely
let targetIndex = Math.max(0, placement - 1);
if (targetIndex > masterList.length) {
    targetIndex = masterList.length; 
}

// Grab affected files below the splice index
const shiftedLevels = masterList.slice(targetIndex);

// Splice the level key safely into the file array
masterList.splice(targetIndex, 0, fileName);
fs.writeFileSync(listPath, JSON.stringify(masterList, null, 4));

console.log(`\n📝 Spliced level into ${listFileName}. Generating history cascading updates...\n`);

// Update history arrays across every single shifted level file downstream
shiftedLevels.forEach((existingFileName) => {
    // Fix: Look inside the specific subfolder for file updates (data/classic/ or data/platformer/)
    const filePath = path.join(targetSubfolderPath, `${existingFileName}.json`);
    
    if (fs.existsSync(filePath)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            const newRank = masterList.indexOf(existingFileName) + 1;
            const oldRank = newRank - 1;

            if (!fileData.history) fileData.history = [];

            // Add the "added above" displacement alert notice
            fileData.history.unshift({
                "date": finalLogDate,
                "type": "moved",
                "oldPlacement": oldRank,
                "placement": newRank,
                "notes": `${levelName} was added above`
            });

            fs.writeFileSync(filePath, JSON.stringify(fileData, null, 4));
            console.log(`   🔄 Cascaded displacement update to ${subFolder}/${existingFileName}.json (Moved #${oldRank} -> #${newRank})`);
        } catch (e) {
            console.error(`   ⚠️ Failed to cascade update to ${subFolder}/${existingFileName}.json:`, e.message);
        }
    }
});

// Prepare individual level payload data layout
const newLevelData = {
    "name": levelName,
    "id": levelId,
    "author": uploader,
    "creators": creatorsArray,
    "verifier": verifier,
    "verification": ytUrl,
    "percentToQualify": listPercent,
    "password": password,
    "records": [],
    "tags": tagsArray, // Injected tags array parameter
    "history": [
        {
            "date": finalLogDate,
            "type": "added",
            "placement": targetIndex + 1,
            "notes": `${levelName} added to the list`
        }
    ]
};

// If a custom rank label parameter (e.g. Bronze, Gold, Diamond) was specified, add it to the level data root
if (customRank && customRank.trim() !== "") {
    newLevelData.rank = customRank.trim();
}

// Fix: Write the new level data file directly into the correct subfolder
const levelFilePath = path.join(targetSubfolderPath, `${fileName}.json`);
fs.writeFileSync(levelFilePath, JSON.stringify(newLevelData, null, 4));

console.log(`\n✅ Successfully generated ${subFolder}/${fileName}.json at ranking position #${targetIndex + 1} (${listType.toUpperCase()})`);
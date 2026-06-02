import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const levelName     = process.argv[2];
const placement     = parseInt(process.argv[3], 10);
const levelId       = parseInt(process.argv[4], 10) || 0;
const fileName      = process.argv[5];
const uploader      = process.argv[6] || "Unknown";
const creatorsRaw   = process.argv[7] || "";
const verifier      = process.argv[8] || "Unknown";
const ytUrl         = process.argv[9] || "";
const listPercent   = parseInt(process.argv[10], 10) || 100;
const password      = process.argv[11] || "Free Copy";
const customDate    = process.argv[12];

if (!levelName || isNaN(placement) || !fileName) {
    console.error('❌ Error: Missing required arguments.');
    process.exit(1);
}

const creatorsArray = creatorsRaw.split(',').map(c => c.trim()).filter(c => c !== "");

// Standardize incoming date strictly to YYYY-MM-DD format
let finalLogDate = customDate || new Date().toISOString().split('T')[0];
finalLogDate = finalLogDate.replace(/\//g, '-'); 

const dataDir = path.join(__dirname, 'data');
const listPath = path.join(dataDir, '_list.json');
let masterList = [];

if (fs.existsSync(listPath)) {
    masterList = JSON.parse(fs.readFileSync(listPath, 'utf8'));
}

// Strip out the level if it already exists in the list to avoid duplication
masterList = masterList.filter(name => name.toLowerCase() !== fileName.toLowerCase());

// Directly respect the user's explicit placement request
let targetIndex = Math.max(0, placement - 1);
if (targetIndex > masterList.length) {
    targetIndex = masterList.length; // Prevent array fragmentation gaps
}

// Grab all levels sitting at or below our target insertion point
const shiftedLevels = masterList.slice(targetIndex);

// Inject the new file name straight into the true index position inside _list.json
masterList.splice(targetIndex, 0, fileName);
fs.writeFileSync(listPath, JSON.stringify(masterList, null, 4));

console.log(`📝 Splice Complete. Generating history cascading updates...\n`);

// Update the history array inside EVERY affected level file
shiftedLevels.forEach((existingFileName) => {
    const filePath = path.join(dataDir, `${existingFileName}.json`);
    
    if (fs.existsSync(filePath)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            const newRank = masterList.indexOf(existingFileName) + 1;
            const oldRank = newRank - 1;

            if (!fileData.history) fileData.history = [];

            // Add the "added above" notice to the history of the level that got pushed down
            fileData.history.unshift({
                "date": finalLogDate,
                "type": "moved",
                "oldPlacement": oldRank,
                "placement": newRank,
                "notes": `${levelName} was added above`
            });

            fs.writeFileSync(filePath, JSON.stringify(fileData, null, 4));
            console.log(`🔄 Cascaded update to ${existingFileName}.json (Moved #${oldRank} -> #${newRank})`);
        } catch (e) {
            console.error(`⚠️ Failed to cascade update to ${existingFileName}.json:`, e.message);
        }
    }
});

// Generate the new level's individual JSON file
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
    "history": [
        {
            "date": finalLogDate,
            "type": "added",
            "placement": targetIndex + 1,
            "notes": `${levelName} added to the list`
        }
    ]
};

const levelFilePath = path.join(dataDir, `${fileName}.json`);
fs.writeFileSync(levelFilePath, JSON.stringify(newLevelData, null, 4));
console.log(`\n✅ Successfully generated ${levelFilePath} at ranking position #${targetIndex + 1}`);
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIST_PATH = path.join(DATA_DIR, '_list.json');

// 1. Capture terminal arguments cleanly
const [
    ,, 
    levelName, 
    placementStr, 
    levelId, 
    fileName, 
    uploader, 
    rawCreators, 
    verifier, 
    ytUrl, 
    listPercent, 
    password
] = process.argv;

// Basic validation check
if (!levelName || !placementStr || !fileName) {
    console.error("❌ Missing arguments! Make sure you fill out all fields.");
    process.exit(1);
}

const placement = parseInt(placementStr, 10);
const insertIndex = placement - 1; // 1-indexed rank to 0-indexed array index
const currentDate = new Date().toISOString().split('T')[0];

try {
    // 2. Read master list
    if (!fs.existsSync(LIST_PATH)) {
        fs.writeFileSync(LIST_PATH, JSON.stringify([], null, 4));
    }
    const list = JSON.parse(fs.readFileSync(LIST_PATH, 'utf-8'));

    // 3. Process the creator string into an array automatically
    const creatorsArray = rawCreators ? rawCreators.split(',').map(c => c.trim()) : [];

    // 4. Create the new level file data structure
    const newLevelData = {
        name: levelName,
        id: parseInt(levelId, 10) || null,
        uploader: uploader || "",
        creators: creatorsArray,
        verifier: verifier || "",
        ytUrl: ytUrl || "",
        listPercent: parseInt(listPercent, 10) || 100,
        password: password || "",
        history: [
            {
                date: currentDate,
                type: "added",
                placement: placement,
                notes: `${levelName} added to the list`
            }
        ]
    };

    // 5. CASCADE UPDATE: Shift ranks for all affected levels BELOW the new one
    console.log(`🔄 Shifting history for levels pushed down by the new addition...`);
    for (let i = insertIndex; i < list.length; i++) {
        const affectedFilename = list[i];
        const affectedFilePath = path.join(DATA_DIR, `${affectedFilename}.json`);

        if (fs.existsSync(affectedFilePath)) {
            const affectedData = JSON.parse(fs.readFileSync(affectedFilePath, 'utf-8'));
            const oldRank = i + 1;
            const newRank = oldRank + 1;

            affectedData.history ??= [];
            affectedData.history.push({
                date: currentDate,
                type: "moved",
                oldPlacement: oldRank,
                placement: newRank,
                notes: `${levelName} was added above`
            });

            fs.writeFileSync(affectedFilePath, JSON.stringify(affectedData, null, 4), 'utf-8');
        }
    }

    // 6. Splice new level file name into master list and save
    list.splice(insertIndex, 0, fileName);
    fs.writeFileSync(LIST_PATH, JSON.stringify(list, null, 4), 'utf-8');

    // 7. Write the brand new level file to disk
    const newLevelFilePath = path.join(DATA_DIR, `${fileName}.json`);
    fs.writeFileSync(newLevelFilePath, JSON.stringify(newLevelData, null, 4), 'utf-8');

    console.log(`\n==================================================`);
    console.log(`✅ Successfully added "${levelName}" at Rank #${placement}!`);
    console.log(`📝 Shifted ranks and updated logs for all subsequent levels.`);
    console.log(`==================================================`);

} catch (err) {
    console.error("❌ Failed to add level:", err);
}
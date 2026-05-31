const fs = require('fs');
const path = require('path');

// 1. Grab all inputs from the command line
const [
    name, 
    placement, 
    id, 
    filename, 
    author, 
    creatorsRaw, 
    verifier, 
    verification, 
    percentToQualify, 
    password
] = process.argv.slice(2);

// Check for the core required arguments to safely run the script
if (!name || !placement || !id || !filename) {
    console.error("\x1b[31m%s\x1b[0m", "Error: Missing core arguments!");
    console.log("\nUsage:");
    console.log('node add-level.js "Level Name" <placement> <id> <filename-without-json> "Author" "Creator1,Creator2" "Verifier" "Verification-URL" <percent> "Password"');
    process.exit(1);
}

// 2. Define your folder structures and file paths
const LIST_PATH = './data/_list.json';
const CHANGELOG_PATH = './data/_changelog.json';
const LEVELS_FOLDER = './data'; 

const rank = parseInt(placement);
const targetFileName = `${filename.toLowerCase()}.json`;

try {
    // ---- STEP 1: UPDATE THE CENTRAL INDEX FILE ----
    console.log(`Reading central list from ${LIST_PATH}...`);
    const listData = JSON.parse(fs.readFileSync(LIST_PATH, 'utf8'));
    
    listData.splice(rank - 1, 0, filename.toLowerCase());
    
    fs.writeFileSync(LIST_PATH, JSON.stringify(listData, null, 4));
    console.log(`\x1b[32m✔ Central list updated. Inserted at #${rank}.\x1b[0m`);

    // ---- STEP 2: CREATE THE INDIVIDUAL DETAILED LEVEL JSON ----
    const newLevelFilePath = path.join(LEVELS_FOLDER, targetFileName);
    
    const creatorsArray = creatorsRaw 
        ? creatorsRaw.split(',').map(c => c.trim()) 
        : [author || "Unknown"];

    const levelData = {
        "id": parseInt(id),
        "name": name,
        "author": author || "Unknown",
        "creators": creatorsArray,
        "verifier": verifier || "Unknown",
        "verification": verification || "https://www.youtube.com/watch?v=",
        "percentToQualify": percentToQualify ? parseInt(percentToQualify) : 100,
        "password": password || "Free to Copy",
        "records": []
    };

    if (!fs.existsSync(newLevelFilePath)) {
        fs.writeFileSync(newLevelFilePath, JSON.stringify(levelData, null, 4));
        console.log(`\x1b[32m✔ Created new level file with all parameters: ${newLevelFilePath}\x1b[0m`);
    } else {
        console.log(`\x1b[33m⚠ File ${targetFileName} already exists. Skipping file creation to protect records.\x1b[0m`);
    }

    // ---- STEP 3: AUTOMATICALLY GENERATE CHANGELOG ENTRY ----
    console.log(`Updating changelog history at ${CHANGELOG_PATH}...`);
    const changelogData = JSON.parse(fs.readFileSync(CHANGELOG_PATH, 'utf8'));
    
    const newLogEntry = {
        "id": parseInt(id),
        "date": new Date().toISOString().split('T')[0],
        "type": "added",
        "placement": rank,
        "name": name,
        "notes": `${name} has been added at #${rank}!`
    };

    changelogData.unshift(newLogEntry);
    fs.writeFileSync(CHANGELOG_PATH, JSON.stringify(changelogData, null, 4));
    console.log(`\x1b[32m✔ Changelog entry added successfully!\x1b[0m`);
    
    console.log(`\x1b[42m\x1b[30m%s\x1b[0m`, ` Success! ${name} is live at #${rank}. `);

} catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "An error occurred while modifying files:");
    console.error(error);
}
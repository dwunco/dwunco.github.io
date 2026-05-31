import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- PATH CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FOLDER = path.resolve(__dirname, './data');

function migrateAllLevelFiles() {
    // 1. Verify the data folder exists
    if (!fs.existsSync(DATA_FOLDER)) {
        console.error('\x1b[31m%s\x1b[0m', `Error: Data folder not found at ${DATA_FOLDER}`);
        process.exit(1);
    }

    // 2. Read all files inside the data folder
    const files = fs.readdirSync(DATA_FOLDER);
    let updatedCount = 0;

    console.log('Starting migration for all standard level JSON files...');

    for (const file of files) {
        // Targets EVERY .json file except those starting with an underscore
        if (file.endsWith('.json') && !file.startsWith('_')) {
            const filePath = path.join(DATA_FOLDER, file);
            
            try {
                const fileRaw = fs.readFileSync(filePath, 'utf-8');
                const levelData = JSON.parse(fileRaw);

                // Check if history property already exists to prevent duplicates
                if (levelData.history === undefined) {
                    
                    const orderedObject = {};
                    let injected = false;

                    // Rebuild the object key-by-key to place 'history' cleanly right below 'records'
                    for (const key of Object.keys(levelData)) {
                        orderedObject[key] = levelData[key];
                        if (key === 'records') {
                            orderedObject['history'] = [];
                            injected = true;
                        }
                    }
                    
                    // Fallback: If the file didn't have a "records" key, append history at the end
                    if (!injected) {
                        orderedObject['history'] = [];
                    }
                    
                    // Save the file back with clean formatting and perfect comma separation
                    fs.writeFileSync(filePath, JSON.stringify(orderedObject, null, 4), 'utf-8');
                    updatedCount++;
                }
            } catch (err) {
                console.error('\x1b[31m%s\x1b[0m', `Failed to process file: ${file}. Error: ${err.message}`);
            }
        }
    }

    console.log('\x1b[32m%s\x1b[0m', `\n✔ Success! Added "history": [] to ${updatedCount} files.`);
}

migrateAllLevelFiles();
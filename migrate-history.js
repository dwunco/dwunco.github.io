import fs from 'fs';
import path from 'path';

// Define paths to your data directories
const CHANGELOG_PATH = path.join(process.cwd(), 'data', '_changelog.json');
const DATA_DIR = path.join(process.cwd(), 'data');

async function migrateHistory() {
    try {
        // 1. Verify and read the master changelog file
        if (!fs.existsSync(CHANGELOG_PATH)) {
            console.error(`❌ Error: Could not find master changelog at ${CHANGELOG_PATH}`);
            return;
        }
        
        const rawChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
        const changelog = JSON.parse(rawChangelog);

        if (!Array.isArray(changelog)) {
            console.error('❌ Error: Master changelog format must be an array of log objects.');
            return;
        }

        console.log(`📦 Loaded ${changelog.length} total history records from master changelog.`);

        // 2. Group logs by level ID and strip redundant fields (id, name)
        const historyMap = {};
        changelog.forEach(log => {
            if (!log || !log.id) return;

            const levelId = log.id.toString();
            if (!historyMap[levelId]) {
                historyMap[levelId] = [];
            }

            // Create a clean log object removing redundant id and name attributes
            const { id, name, ...cleanLog } = log;
            historyMap[levelId].push(cleanLog);
        });

        // 3. Scan the data directory for individual level files
        const files = fs.readdirSync(DATA_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json') && file !== '_changelog.json' && file !== '_list.json');

        console.log(`📂 Found ${jsonFiles.length} individual level files to process.`);
        let updatedCount = 0;

        // 4. Inject history records into matching level files
        jsonFiles.forEach(file => {
            const filePath = path.join(DATA_DIR, file);
            const rawLevelData = fs.readFileSync(filePath, 'utf-8');
            let levelData;

            try {
                levelData = JSON.parse(rawLevelData);
            } catch (e) {
                console.warn(`⚠️ Skipping ${file}: Invalid JSON syntax.`);
                return;
            }

            if (!levelData || !levelData.id) {
                console.warn(`⚠️ Skipping ${file}: Missing root level ID.`);
                return;
            }

            const targetId = levelData.id.toString();
            
            // Grab matched history records or default to an empty array if none exist
            const isolatedHistory = historyMap[targetId] || [];

            // Update or initialize the localized history array
            levelData.history = isolatedHistory;

            // Write the updated file back to disk with proper formatting spacing
            fs.writeFileSync(filePath, JSON.stringify(levelData, null, 4), 'utf-8');
            updatedCount++;
        });

        console.log(`\n==================================================`);
        console.log(`✅ Success! Successfully injected history into ${updatedCount} levels.`);
        console.log(`==================================================`);

    } catch (error) {
        console.error('❌ An error occurred during migration:', error);
    }
}

// Execute the migration script
migrateHistory();
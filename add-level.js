import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIST_PATH = path.join(DATA_DIR, '_list.json');

/**
 * Automatically adds a level, updates the list, and shifts histories down.
 * @param {Object} levelConfig - The raw details of the new level
 * @param {number} placement - The 1-indexed rank where this level is being inserted
 */
async function insertLevel(levelConfig, placement) {
    try {
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        // 1. Read and parse the current _list.json
        if (!fs.existsSync(LIST_PATH)) {
            console.error('❌ Error: _list.json not found.');
            return;
        }
        const list = JSON.parse(fs.readFileSync(LIST_PATH, 'utf-8'));

        // Convert 1-based rank to 0-based array index
        const insertIndex = placement - 1; 
        const filename = levelConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const newFilePath = path.join(DATA_DIR, `${filename}.json`);

        if (fs.existsSync(newFilePath)) {
            console.error(`❌ Error: A level file named ${filename}.json already exists!`);
            return;
        }

        // 2. Build the new level object with its initial "added" history entry
        const newLevelData = {
            ...levelConfig,
            history: [
                {
                    date: currentDate,
                    type: "added",
                    oldPlacement: null,
                    placement: placement,
                    notes: `Added to the list at #${placement}.`
                }
            ]
        };

        // 3. Scan and shift existing levels that are pushed down
        console.log(`🔄 Shifting levels below #${placement}...`);
        
        // Loop through the levels that come after the insertion point in the list
        for (let i = insertIndex; i < list.length; i++) {
            const affectedPath = list[i];
            const affectedFilePath = path.join(DATA_DIR, `${affectedPath}.json`);

            if (fs.existsSync(affectedFilePath)) {
                const affectedData = JSON.parse(fs.readFileSync(affectedFilePath, 'utf-8'));
                const oldRank = i + 1;
                const newRank = oldRank + 1;

                // Initialize history array if missing
                affectedData.history ??= [];

                // Push the "moved-down" notification log
                affectedData.history.push({
                    date: currentDate,
                    type: "moved",
                    oldPlacement: oldRank,
                    placement: newRank,
                    notes: `${newLevelData.name} was added above.`
                });

                // Save the shifted level file back to disk
                fs.writeFileSync(affectedFilePath, JSON.stringify(affectedData, null, 4), 'utf-8');
            }
        }

        // 4. Write the brand new level file
        fs.writeFileSync(newFilePath, JSON.stringify(newLevelData, null, 4), 'utf-8');
        console.log(`📝 Created ${filename}.json at #${placement}.`);

        // 5. Update and save _list.json
        list.splice(insertIndex, 0, filename);
        fs.writeFileSync(LIST_PATH, JSON.stringify(list, null, 4), 'utf-8');
        console.log(`✅ Successfully updated _list.json!`);

    } catch (error) {
        console.error('❌ Insertion failed:', error);
    }
}
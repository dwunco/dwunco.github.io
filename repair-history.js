import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIST_PATH = path.join(DATA_DIR, '_classic-list.json');

async function backfillShiftHistory() {
    try {
        // 1. Verify and read the master list file
        if (!fs.existsSync(LIST_PATH)) {
            console.error('❌ Error: _classic-list.json not found in the data directory.');
            return;
        }
        const list = JSON.parse(fs.readFileSync(LIST_PATH, 'utf-8'));

        const levels = [];
        const additionEvents = [];

        // 2. Load all individual level files and extract their "birth" (added) logs
        console.log("📂 Reading level files and gathering addition timeline...");
        list.forEach((filename) => {
            const filePath = path.join(DATA_DIR, `${filename}.json`);
            if (!fs.existsSync(filePath)) return;

            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            levels.push({ filename, filePath, data });

            // Find the original log entry that documents when this level was first added
            const addedLog = data.history?.find(log => log.type === 'added');
            if (addedLog && addedLog.date) {
                additionEvents.push({
                    date: addedLog.date,
                    name: data.name,
                    placement: addedLog.placement || 1
                });
            }
        });

        console.log(`📊 Found ${additionEvents.length} historical addition events to simulate.`);

        let totalInjectedLogs = 0;

        // 3. Simulate the timeline for each level to calculate who was pushed down
        levels.forEach(({ data, filePath }) => {
            const addedLog = data.history?.find(log => log.type === 'added');
            if (!addedLog) return;

            const birthTime = new Date(addedLog.date).getTime();
            let currentSimulatedRank = addedLog.placement || 1;
            
            // Ensure the history array exists
            data.history ??= [];

            // Look at every level added across the site's history
            additionEvents.forEach(event => {
                const eventTime = new Date(event.date).getTime();
                
                // Skip events that happened BEFORE this level was born, or if it's the same level
                if (eventTime <= birthTime || event.name === data.name) return;

                // If another level was added at or above this level's current rank, it got shifted down
                if (event.placement <= currentSimulatedRank) {
                    currentSimulatedRank += 1;

                    const noteText = `${event.name} was added above.`;
                    
                    // Check if this shift log is already written down to prevent duplicate entries
                    const alreadyExists = data.history.some(log => log.notes === noteText);

                    if (!alreadyExists) {
                        data.history.push({
                            date: event.date,
                            type: "moved",
                            oldPlacement: currentSimulatedRank - 1,
                            placement: currentSimulatedRank,
                            notes: noteText
                        });
                        totalInjectedLogs++;
                    }
                }
            });

            // 4. Save the level file back to disk with the new updates
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
        });

        console.log(`\n==================================================`);
        console.log(`✅ Sync Complete! Injected ${totalInjectedLogs} missing shift logs across files.`);
        console.log(`==================================================`);

    } catch (err) {
        console.error("❌ Backfill sync failed:", err);
    }
}

// Execute the script
backfillShiftHistory();
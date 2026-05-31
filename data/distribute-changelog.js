import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- PATH CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FOLDER = path.resolve(__dirname, './data');
const MASTER_CHANGELOG_PATH = path.resolve(__dirname, './data/_changelog.json');
const LIST_PATH = path.resolve(__dirname, './data/_list.json');

function distributeChangelog() {
    // 1. Verify required source files exist
    if (!fs.existsSync(MASTER_CHANGELOG_PATH) || !fs.existsSync(LIST_PATH)) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: Master _changelog.json or _list.json not found!');
        process.exit(1);
    }

    console.log('Reading master data...');
    const masterChangelog = JSON.parse(fs.readFileSync(MASTER_CHANGELOG_PATH, 'utf-8'));
    const listData = JSON.parse(fs.readFileSync(LIST_PATH, 'utf-8'));

    // 2. Map IDs to filenames so we know which ID belongs to which file
    // Assumes your individual filenames match the string names in your _list.json
    const idToFileMap = new Map();
    
    for (const item of listData) {
        if (!item) continue;
        
        let filename = '';
        let levelId = null;

        if (typeof item === 'string') {
            filename = item; // e.g., "firewall.json"
        } else if (Array.isArray(item) && item[0]) {
            if (item[0].id) levelId = item[0].id;
            if (item[0].name) filename = `${item[0].name.toLowerCase().replace(/\s+/g, '-')}.json`;
        }

        // Try reading the file directly to cross-reference the internal ID field
        const potentialPath = path.join(DATA_FOLDER, filename);
        if (filename && fs.existsSync(potentialPath)) {
            try {
                const rawLevel = JSON.parse(fs.readFileSync(potentialPath, 'utf-8'));
                if (rawLevel.id) {
                    idToFileMap.set(rawLevel.id, filename);
                }
            } catch (e) {
                // Skip if file reading fails
            }
        }
        if (levelId && filename) {
            idToFileMap.set(levelId, filename);
        }
    }

    // 3. Group changelog entries by Level ID
    const logsByLevelId = {};
    for (const log of masterChangelog) {
        if (!log.id) continue;
        if (!logsByLevelId[log.id]) {
            logsByLevelId[log.id] = [];
        }
        
        // Pointercrate standard structural adaptation:
        // We strip out the redundant 'id' property of *this* level,
        // but we preserve it or look for actors if necessary.
        const pointercrateLog = {
            date: log.date,
            type: log.type || "moved",
            oldPlacement: log.oldPlacement || null,
            placement: log.placement || null,
            notes: log.notes || ""
        };

        logsByLevelId[log.id].push(pointercrateLog);
    }

    // 4. Distribute and save logs into individual files
    let updatedFilesCount = 0;
    let totalLogsDistributed = 0;

    console.log('\x1b[34m%s\x1b[0m', '\nDistributing entries...');

    for (const [levelId, logs] of Object.entries(logsByLevelId)) {
        const targetFilename = idToFileMap.get(Number(levelId));
        
        if (!targetFilename) {
            console.warn('\x1b[33m%s\x1b[0m', `Warning: Could not match level ID ${levelId} to a physical JSON file.`);
            continue;
        }

        const targetFilePath = path.join(DATA_FOLDER, targetFilename);

        if (fs.existsSync(targetFilePath)) {
            try {
                const currentData = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'));
                
                // Initialize history field if missing
                if (!currentData.history) {
                    currentData.history = [];
                }

                // Append the distributed logs
                // Note: Preserves any logs already in there, while maintaining chronological order
                currentData.history = [...currentData.history, ...logs];

                // Remove duplicate logs if migration is run multiple times
                const uniqueLogs = [];
                const seenLogKeys = new Set();
                for (const logItem of currentData.history) {
                    const uniqueKey = `${logItem.date}-${logItem.placement}-${logItem.notes}`;
                    if (!seenLogKeys.has(uniqueKey)) {
                        seenLogKeys.add(uniqueKey);
                        uniqueLogs.push(logItem);
                    }
                }
                currentData.history = uniqueLogs;

                // Save back down to the target level file
                fs.writeFileSync(targetFilePath, JSON.stringify(currentData, null, 4), 'utf-8');
                
                updatedFilesCount++;
                totalLogsDistributed += logs.length;
                console.log(` -> Injected ${logs.length} logs into ${targetFilename}`);

            } catch (err) {
                console.error('\x1b[31m%s\x1b[0m', `Failed to update ${targetFilename}: ${err.message}`);
            }
        }
    }

    console.log('\x1b[32m%s\x1b[0m', `\n✔ Migration Complete! Successfully distributed ${totalLogsDistributed} logs across ${updatedFilesCount} level files.`);
}

distributeChangelog();
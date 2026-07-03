import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const targetDir = path.join(dataDir, 'classic');

// 1. Ensure the 'classic' folder exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Created folder: ${targetDir}`);
}

try {
    // 2. Read all contents inside the data directory
    const items = fs.readdirSync(dataDir);
    let movedCount = 0;

    items.forEach((item) => {
        const sourcePath = path.join(dataDir, item);
        const destPath = path.join(targetDir, item);

        // 3. Get item stats to ensure we are only moving files (skipping folders like 'classic' itself)
        const stat = fs.statSync(sourcePath);

        if (stat.isFile()) {
            // 4. Skip files that start with '_' (e.g., _classic-list.json, _editors.json)
            if (item.startsWith('_')) {
                console.log(`⏭️ Skipped tracking file: ${item}`);
                return;
            }

            // 5. Move the file into the classic directory
            fs.renameSync(sourcePath, destPath);
            console.log(`🚚 Moved: ${item} -> classic/${item}`);
            movedCount++;
        }
    });

    console.log(`\n✅ Done! Successfully moved ${movedCount} level files into the 'data/classic/' folder.`);

} catch (error) {
    console.error(`❌ Error organizing files:`, error.message);
}
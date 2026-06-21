import { fetchList } from "../content.js";

export default {
    template: `
        <main v-if="loading" class="page-packs">
            <div class="spinner">
                <p style="font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif; font-weight: 700; opacity: 0.6; margin: 0;">Loading Custom Packs...</p>
            </div>
        </main>
        
        <main v-else class="page-packs" style="grid-column: 2; display: flex; flex-direction: column; padding: 40px 0; height: auto; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
            
            <div style="margin-bottom: 30px; border-bottom: 1px solid rgba(128,128,128,0.15); padding-bottom: 20px; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                <h1 style="font-size: 2.2rem; margin: 0 0 6px 0; font-weight: 800; letter-spacing: -0.5px; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">Level Packs</h1>
                <p style="margin: 0; font-size: 1rem; opacity: 0.6; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">Complete custom challenges to earn community badges</p>
            </div>

            <div class="packs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; width: 100%; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                <div v-for="pack in sortedPacks" :key="pack.name" 
                     style="background-color: var(--color-background-hover); border: 1px solid rgba(128,128,128,0.15); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;"
                     class="pack-card">
                    
                    <div style="font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                            <h2 style="font-size: 1.25rem; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 8px; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                                {{ pack.name }}
                            </h2>
                            <span :style="{ 
                                backgroundColor: getDifficultyColor(pack.difficulty) + '15',
                                border: '1px solid ' + getDifficultyColor(pack.difficulty),
                                color: getDifficultyColor(pack.difficulty)
                            }" style="padding: 4px 10px; border-radius: 5px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                                Rank {{ pack.difficulty }}
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                            <div v-for="levelId in pack.levels" :key="levelId" 
                                 style="background-color: var(--color-background); border: 1px solid rgba(128,128,128,0.1); border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                                    <span :style="{ color: getDifficultyColor(pack.difficulty) }" style="font-size: 0.75rem; flex-shrink: 0;">◆</span>
                                    <span style="font-size: 0.9rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                                        {{ getLevelData(levelId).name }}
                                    </span>
                                </div>
                                <span style="font-size: 0.85rem; font-weight: bold; color: var(--color-primary); padding-left: 10px; flex-shrink: 0; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                                    {{ getLevelData(levelId).rank }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style="border-top: 1px solid rgba(128,128,128,0.15); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; opacity: 0.6; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                        <span style="text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; font-size: 0.75rem; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">Requirements</span>
                        <span style="font-weight: 700; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">
                            <span style="font-size: 0.95rem; font-family: 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif;">{{ pack.levels ? pack.levels.length : 0 }}</span> Levels
                        </span>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        packs: [],
        masterList: [],
        loading: true
    }),
    computed: {
        sortedPacks() {
            if (!this.packs) return [];
            return [...this.packs].sort((a, b) => {
                const diffA = parseInt(a.difficulty, 10) || 0;
                const diffB = parseInt(b.difficulty, 10) || 0;
                return diffA - diffB;
            });
        }
    },
    async mounted() {
        try {
            this.masterList = await fetchList();
            const res = await fetch("/data/packs.json");
            if (res.ok) {
                this.packs = await res.json();
            }
        } catch (e) {
            console.error("Could not parse or establish packs array definitions:", e);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        getLevelData(id) {
            if (!this.masterList) return { name: "Loading...", rank: "" };
            
            const index = this.masterList.findIndex(([level]) => level && String(level.id) === String(id));
            
            if (index !== -1 && this.masterList[index][0]) {
                return {
                    name: this.masterList[index][0].name,
                    rank: `#${index + 1}`
                };
            }
            
            return { name: `Unknown Level (#${id})`, rank: "—" };
        },
        getDifficultyColor(diff) {
            const num = parseInt(diff, 10) || 1;
            if (num <= 1) return "#25c059"; // Vibrant Green
            if (num === 2) return "#ffb700"; // Rich Gold
            if (num === 3) return "#ff6f00"; // Deep Orange
            return "#ff3333"; // Crimson Red
        }
    }
};
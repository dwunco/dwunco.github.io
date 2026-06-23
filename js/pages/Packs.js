import { fetchList } from "../content.js";

export default {
    template: `
        <main v-if="loading" class="page-packs">
            <div class="spinner">
                <p class="pack-loading-text">Loading Custom Packs...</p>
            </div>
        </main>
        
        <main v-else class="page-packs-main" style="max-width: 100%; padding: 40px 20px;">
            
            <div class="packs-header-block">
                <h1>Level Packs</h1>
                <p>Complete custom challenges to earn community badges</p>
            </div>

            <div class="packs-split-layout">
                
                <div class="packs-split-left">
                    <div v-for="(tier, idx) in tiers" :key="tier" class="tier-column">
                        <div class="tier-column-header" :style="{ borderTopColor: getTierColor(tier) }">
                            <h3 class="tier-column-title" :style="{ color: getTierColor(tier) }">{{ tier }}</h3>
                            <span class="tier-pack-count">{{ getPacksByTier(tier, idx).length }}</span>
                        </div>
                        
                        <div class="tier-column-scrollable">
                            <div v-if="getPacksByTier(tier, idx).length === 0" class="empty-tier-text">
                                No packs assigned
                            </div>
                            <div v-for="pack in getPacksByTier(tier, idx)" 
                                 :key="pack.name" 
                                 :class="['pack-card-container interactive-card', { 'active-selected-pack': selectedPack && selectedPack.name === pack.name }]"
                                 @click="selectPack(pack)">
                                <div class="pack-card-header" style="margin: 0;">
                                    <h2 style="font-size: 1rem; font-weight: 700; margin: 0;">📦 {{ pack.name }}</h2>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; opacity: 0.6; font-weight: 700;">
                                    <span>Maps:</span>
                                    <span>{{ pack.levels ? pack.levels.length : 0 }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="packs-split-right">
                    <div v-if="selectedPack" style="display: flex; flex-direction: column; height: 100%;">
                        <div class="pack-modal-header" style="margin-bottom: 20px; padding-bottom: 12px;">
                            <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0;">📦 {{ selectedPack.name }}</h2>
                        </div>
                        
                        <div class="pack-levels-list" style="overflow-y: auto; flex-grow: 1; padding-right: 4px;">
                            <div v-for="levelId in selectedPack.levels" :key="levelId" class="pack-level-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                <div class="pack-level-left-side">
                                    <span :style="{ color: getTierColor(getLevelData(levelId).customRank) }" class="pack-level-rank-prefix">
                                        {{ getLevelData(levelId).customRank }}
                                    </span>
                                    <span class="pack-level-name-text">
                                        {{ getLevelData(levelId).name }}
                                    </span>
                                </div>
                                
                                <span class="pack-level-list-rank-text">
                                    {{ getLevelData(levelId).listRank }}
                                </span>
                            </div>
                        </div>
                        
                        <div class="pack-modal-footer" style="margin-top: auto; padding-top: 16px;">
                            <span>Total Tracked Maps: <strong>{{ selectedPack.levels ? selectedPack.levels.length : 0 }}</strong></span>
                        </div>
                    </div>

                    <div v-else class="pack-empty-panel-placeholder">
                        <span>📦</span>
                        <p>Select a custom level pack from the left to view required list clears</p>
                    </div>
                </div>

            </div>
        </main>
    `,
    data: () => ({
        packs: [],
        masterList: [],
        loading: true,
        selectedPack: null,
        tiers: [
            "beginner",
            "bronze",
            "silver",
            "gold",
            "amber",
            "platinum",
            "sapphire",
            "diamond"
        ]
    }),
    async mounted() {
        try {
            this.masterList = await fetchList();
            const res = await fetch("/data/packs.json");
            if (res.ok) {
                this.packs = await res.json();
            }
        } catch (e) {
            console.error("Could not parse packs definitions:", e);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        getPacksByTier(tierName, index) {
            if (!this.packs) return [];
            return this.packs.filter(pack => {
                const rawDiff = String(pack.difficulty || "").toLowerCase().trim();
                return rawDiff === tierName || rawDiff === String(index + 1);
            });
        },
        selectPack(pack) {
            this.selectedPack = pack;
        },
        getLevelData(id) {
            if (!this.masterList) return { name: "Loading...", listRank: "", customRank: "" };
            
            const index = this.masterList.findIndex(([level]) => level && String(level.id) === String(id));
            
            if (index !== -1 && this.masterList[index][0]) {
                const levelObj = this.masterList[index][0];
                return {
                    name: levelObj.name,
                    listRank: `#${index + 1}`,
                    customRank: levelObj.ran || "—" 
                };
            }
            
            return { name: `Unknown Level (#${id})`, listRank: "—", customRank: "—" };
        },
        getTierColor(tierName) {
            if (!tierName) return "var(--color-primary)";
            
            const tier = tierName.toLowerCase().trim();
            if (tier.includes("beginner")) return "#a3a3a3"; 
            if (tier.includes("bronze"))   return "#cd7f32"; 
            if (tier.includes("silver"))   return "#b5c2c7"; 
            if (tier.includes("gold"))     return "#ffb700"; 
            if (tier.includes("amber"))    return "#ff7b00"; 
            if (tier.includes("platinum")) return "#3de0be"; 
            if (tier.includes("sapphire")) return "#2b7fff"; 
            if (tier.includes("diamond"))  return "#aadeff"; 
            
            return "var(--color-primary)"; 
        }
    }
};
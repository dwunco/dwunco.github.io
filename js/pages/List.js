import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

const TAGS_POOL = {
    "UPDATE": ["1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2.0", "2.1", "2.2"],
    "LENGTH": ["Tiny", "Short", "Medium", "Long", "XL", "XXL", "XXL+"],
    "GAMEPLAY": ["Timings", "Clicksync", "Chokepoints", "High CPS", "Flow", "Memory", "Gimmicky", "Learny", "Fast-Paced", "Slow-Paced", "Overall"],
    "GAMEMODES": ["Cube", "Ship", "Ball", "UFO", "Wave", "Robot", "Spider", "Swing", "Mirror", "Duals"],
    "MISCELLANEOUS": ["NONG"]
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="list-search" style="padding: 15px; border-bottom: 1px solid var(--border-color, #333); background: rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                        <input 
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Search levels..." 
                            class="search-input"
                        />
                        <button @click.prevent="openModal" class="filter-btn">
                            Filters ▼
                        </button>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <span class="type-label-md" style="opacity: 0.9; font-weight: bold; color: var(--apply-color, #ff7300); display: flex; align-items: center; gap: 4px;">🕒 Time Machine:</span>
                        <input 
                            type="date" 
                            v-model="timeMachineDate" 
                            style="background: #111; color: #fff; border: 1px solid #333; padding: 4px 8px; border-radius: 4px; font-family: inherit; font-size: 0.85rem; cursor: pointer;"
                        />
                        <button v-if="timeMachineDate" @click="timeMachineDate = ''" style="background: transparent; color: #888; border: none; cursor: pointer; font-size: 0.85rem;">Reset</button>
                    </div>
                </div>

                <table class="list" v-if="list">
                    <template v-for="([level, err], i) in filteredList">
                        
                        <tr v-if="level && level.historicalRank === 1 && !filter && !filterNewOnly && !filterCreator && !filterVerifier && !filterUploader && filterTags.length === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Main List</td>
                        </tr>

                        <tr v-if="level && level.historicalRank === 76 && !filter && !filterNewOnly && !filterCreator && !filterVerifier && !filterUploader && filterTags.length === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Extended List</td>
                        </tr>

                        <tr v-if="level && level.historicalRank === 151 && !filter && !filterNewOnly && !filterCreator && !filterVerifier && !filterUploader && filterTags.length === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Extended+ List</td>
                        </tr>

                        <tr>
                            <td class="rank" style="width: 60px; min-width: 60px; max-width: 60px; text-align: left;">
                                <p v-if="level && level.historicalRank <= 250" class="type-label-lg">
                                    #{{ level.historicalRank }}
                                </p>
                                <p v-else-if="!level && getMasterRank(err) <= 250" class="type-label-lg">
                                    #{{ getMasterRank(err) }}
                                </p>
                                <p v-else class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="level" :class="{ 'active': selected === getMasterIndex(level, err), 'error': !level }" style="width: auto;">
                                <button @click="setSelectedByLevel(level, err)" style="overflow: visible; width: 100%; text-align: left;">
                                    <div style="display: flex; align-items: center; white-space: nowrap; overflow: visible; padding: 2px 0;">
                                        <span class="type-label-lg" style="line-height: 1.2; display: inline-block;">
                                            {{ level && level.name ? level.name : (err ? err.toUpperCase() : 'BROKEN_FILE_' + (i + 1)) }}
                                        </span>
                                        <span v-if="level && isNewLevel(level.history)" style="color: #ff4d4d; font-weight: bold; margin-left: 8px; font-size: 0.85rem; letter-spacing: 0.5px; flex-shrink: 0;">NEW!</span>
                                    </div>
                                </button>
                            </td>
                        </tr>
                    </template>
                </table>
            </div>
            
            <div class="level-container">
                <div class="level" v-if="level || currentErrorFilename">
                    <h1>{{ level && level.name ? level.name : (currentErrorFilename ? currentErrorFilename.toUpperCase() : 'UNREADABLE TIMELINE ENTRY') }}</h1>
                    
                    <LevelAuthors 
                        :author="level && isBlacklisted(level.author) ? '-' : (level ? level.author : '-')" 
                        :creators="level && level.creators ? level.creators.filter(c => !isBlacklisted(c)) : []" 
                        :verifier="level && isBlacklisted(level.verifier) ? '-' : (level ? level.verifier : '-')">
                    </LevelAuthors>

                    <iframe v-if="video" class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <div v-else style="background: #111; border: 1px dashed #333; height: 315px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 15px;">
                        <p style="color: #555; font-style: italic;">No showcase video linked (JSON missing/unreadable)</p>
                    </div>

                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ (level && level.historicalRank && level.percentToQualify) ? score(level.historicalRank, 100, level.percentToQualify) : '-' }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level ? level.id : '-' }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level ? level.password || 'Free to Copy' : '-' }}</p>
                        </li>
                    </ul>

                    <div class="level-tags-container">
                        <span class="tags-title">Tags:</span>
                        <template v-if="level && level.tags && level.tags.length > 0">
                            <button 
                                v-for="tag in level.tags" 
                                :key="tag"
                                @click="toggleTagDirect(tag)"
                                class="tag-btn"
                                :class="{ 'is-active': filterTags.includes(tag) }">
                                {{ tag }}
                            </button>
                        </template>
                        <span v-else class="tags-empty-state">None assigned</span>
                    </div>
                    <h2>Records</h2>
                    <p v-if="level && level.historicalRank && level.historicalRank <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="level && level.historicalRank && level.historicalRank <= 250"><strong>100%</strong> or better to qualify</p>
                    <p v-else-if="!level && getMasterRank(currentErrorFilename) <= 75"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in filteredRecords" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="'/assets/phone-landscape' + (store.dark ? '-dark' : '') + '.svg'" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}FPS</p>
                            </td>
                        </tr>
                    </table>

                    <div class="changelog-panel" style="margin-top: 30px; border-top: 2px solid var(--border-color, #333); padding-top: 20px;">
                        <h2>Changelog History</h2>
                        <div v-if="levelHistory.length > 0" style="display: flex; flex-direction: column; margin-top: 15px;">
                            <div v-for="log in levelHistory" :key="log.date + log.type + log.notes" 
                                :style="{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderLeft: '4px solid ' + getLogColor(log.type, log),
                                    padding: '10px 15px',
                                    borderRadius: '0 4px 4px 0',
                                    marginBottom: '12px',
                                    position: 'relative'
                                }">
                                
                                <div style="position: absolute; top: 10px; right: 15px; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1;">
                                    <span style="font-size: 0.85rem; color: #888;">{{ log.date }}</span>
                                    <span v-if="log.rankLabel" style="font-size: 0.85rem; color: #aaa; font-family: monospace; letter-spacing: 0.5px; margin-top: 2px;">
                                        {{ log.rankLabel }}
                                    </span>
                                </div>

                                <p style="margin: 0; font-size: 0.95rem; line-height: 1.25; color: #ddd; padding-right: 90px;">
                                    <span :style="{
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        fontSize: '0.85rem',
                                        color: getLogColor(log.type, log),
                                        display: 'block',
                                        marginBottom: '4px'
                                    }">[{{ getLogTypeLabel(log) }}]</span>
                                    {{ log.notes }}
                                </p>

                            </div>
                        </div>
                        <p v-else style="color: #666; font-style: italic; margin-top: 15px;">No structural changes recorded for this level.</p>
                    </div>

                </div>
                <div class="level" v-else style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益┬)ノ彡┻━┻</p>
                </div>
            </div>

            <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
                <div class="modal-window">
                    
                    <div class="modal-header">
                        <h2>List Search Settings</h2>
                        <button class="modal-close-btn" @click="showModal = false">✕</button>
                    </div>

                    <div class="modal-body">
                        
                        <div class="modal-column">
                            <h3>Filters</h3>
                            
                            <label class="advanced-filter-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; margin-bottom: 12px;">
                                <input type="checkbox" v-model="modalLocal.filterNewOnly" style="cursor: pointer;" />
                                <span class="type-label-md">
                                    Show Only <span style="color: #ff4d4d; font-weight: bold;">NEW!</span> Levels
                                </span>
                            </label>

                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <input v-model="modalLocal.filterCreator" type="text" placeholder="Filter by Creator..." class="advanced-filter-input" />
                                <input v-model="modalLocal.filterVerifier" type="text" placeholder="Filter by Verifier..." class="advanced-filter-input" />
                                <input v-model="modalLocal.filterUploader" type="text" placeholder="Filter by Uploader..." class="advanced-filter-input" />
                            </div>
                        </div>

                        <div class="modal-column" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="margin: 0;">Tags</h3>
                                
                                <div style="display: flex; background: rgba(255,255,255,0.08); padding: 2px; border-radius: 6px; gap: 2px;">
                                    <button 
                                        @click="modalLocal.tagMode = 'all'"
                                        style="font-size: 0.75rem; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;"
                                        :style="{ 
                                            background: modalLocal.tagMode === 'all' ? 'var(--apply-color, #ff7300)' : 'transparent',
                                            color: modalLocal.tagMode === 'all' ? '#fff' : '#888',
                                            fontWeight: modalLocal.tagMode === 'all' ? 'bold' : 'normal'
                                        }">
                                        Match All
                                    </button>
                                    <button 
                                        @click="modalLocal.tagMode = 'any'"
                                        style="font-size: 0.75rem; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;"
                                        :style="{ 
                                            background: modalLocal.tagMode === 'any' ? 'var(--apply-color, #ff7300)' : 'transparent',
                                            color: modalLocal.tagMode === 'any' ? '#fff' : '#888',
                                            fontWeight: modalLocal.tagMode === 'any' ? 'bold' : 'normal'
                                        }">
                                        Match Any
                                    </button>
                                </div>
                            </div>

                            <div v-for="(tags, category) in tagsPool" :key="category" style="margin-bottom: 16px;">
                                <span class="type-title-sm" style="display: block; margin-bottom: 6px; font-weight: bold; font-size: 0.85rem; opacity: 0.7;">
                                    {{ category }}
                                </span>
                                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    <button 
                                         v-for="tag in tags" 
                                        :key="tag"
                                        @click="toggleModalTag(tag)"
                                        class="tag-btn"
                                        :class="{ 'is-active': modalLocal.filterTags.includes(tag) }">
                                        {{ tag }} <span v-if="modalLocal.filterTags.includes(tag)">×</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="modal-footer">
                        <button class="modal-btn-apply" @click="applyFilters">Apply</button>
                        <button class="modal-btn-cancel" @click="showModal = false">Cancel</button>
                        <button class="modal-btn-reset" @click="resetModalFilters">Reset all</button>
                    </div>

                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="'/assets/' + roleIconMap[editor.role] + (store.dark ? '-dark' : '') + '.svg'" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>Achieved the record without using hacks</p>
                    <p>Achieved the record on the level that is listed on the site - please check the level ID before you submit a record</p>
                    <p>Do not use secret routes or bug routes</p>
                    <p>Do not use easy modes, only a record of the unmodified level qualifies</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        tagsPool: TAGS_POOL,
        
        blacklist: [
            "cookiedarookie"
        ],
        
        searchQuery: "", 
        timeMachineDate: "", 
        filter: "",
        showModal: false, 
        
        filterNewOnly: false,
        filterVerifier: "",
        filterUploader: "",
        filterCreator: "",
        filterTags: [],
        tagMode: "all", 

        modalLocal: {
            filterNewOnly: false,
            filterVerifier: "",
            filterUploader: "",
            filterCreator: "",
            filterTags: [],
            tagMode: "all"
        }
    }),
    computed: {
        level() {
            if (!this.list || this.selected >= this.list.length) return null;
            
            // Get the immutable fallback reference from the primary static master file array
            const masterPair = this.list[this.selected];
            const originalLevelObj = masterPair ? masterPair[0] : null;
            if (!originalLevelObj) return null;

            // Find the active time machine processed level entry sharing the matching level unique ID
            const activeTimeMatch = this.filteredList.find(([l]) => l && l.id === originalLevelObj.id);
            
            if (activeTimeMatch && activeTimeMatch[0]) {
                return {
                    ...originalLevelObj,
                    historicalRank: activeTimeMatch[0].historicalRank
                };
            }
            return originalLevelObj;
        },
        currentErrorFilename() {
            if (!this.list || this.selected >= this.list.length) return null;
            return this.list[this.selected]?.[1];
        },
        filteredRecords() {
            if (!this.level || !this.level.records) return [];
            return this.level.records.filter(record => !this.isBlacklisted(record.user));
        },
        video() {
            if (!this.level) return null;
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }
            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
                );
        },
        levelHistory() {
            if (!this.level || !this.level.history || !Array.isArray(this.level.history)) {
                return [];
            }
        
            const processedHistory = this.level.history.map(log => {
                let rankLabel = "";
        
                if (log.type === 'added' && log.placement) {
                    rankLabel = `— #${log.placement}`;
                } else if (log.type === 'moved' && log.oldPlacement && log.placement) {
                    const delta = log.oldPlacement - log.placement;
                    const indicator = delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`;
                    rankLabel = `${indicator} #${log.placement}`;
                } else if (log.type === 'moved' && log.oldPlacement && !log.placement) {
                    rankLabel = `↓ Legacy`;
                }
        
                return {
                    ...log,
                    rankLabel
                };
            });
        
            return processedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        filteredList() {
            if (!this.list) return [];
            
            let timeFilteredList = [];
    
            // --- TIME MACHINE CALCULATION ENGINE ---
            if (this.timeMachineDate) {
                // Set target time to the very end of the selected day (23:59:59.999) 
                // so it encompasses all changes made throughout that entire date.
                const targetTime = new Date(this.timeMachineDate);
                targetTime.setHours(23, 59, 59, 999);
                const targetTimestamp = targetTime.getTime();
    
                this.list.forEach(([level, err]) => {
                    if (!level) {
                        timeFilteredList.push([level, err]);
                        return;
                    }
    
                    const history = level.history || [];

                    // 1. Map item to include its raw array position index from the file
                    const sortedHistory = history
                        .map((log, index) => ({ ...log, originalIndex: index }))
                        .sort((a, b) => {
                            const timeA = new Date(a.date).getTime();
                            const timeB = new Date(b.date).getTime();
                            
                            // 2. Tiebreaker: If dates are identical, make sure the one closer to the 
                            // top of the file (smaller index) comes LAST in the sorted array
                            if (timeA === timeB) {
                                return b.originalIndex - a.originalIndex; 
                            }
                            return timeA - timeB;
                        }); 
    
                    const addedLog = sortedHistory.find(log => log.type === 'added');
                    if (addedLog) {
                        const addedTime = new Date(addedLog.date).getTime();
                        if (addedTime > targetTimestamp) return; 
                    }
    
                    const validPastLogs = sortedHistory.filter(log => new Date(log.date).getTime() <= targetTimestamp);
                    let historicalPlacement = null;
    
                    // Loop through all valid actions up to that date.
                    // Consecutive changes on the same day will continually overwrite the placement,
                    // leaving you with the absolute LAST placement set.
                    for (const log of validPastLogs) {
                        if (log.placement) {
                            historicalPlacement = parseInt(log.placement, 10);
                        }
                    }
    
                    if (historicalPlacement === null) {
                        historicalPlacement = this.list.findIndex(([l]) => l && l.id === level.id) + 1;
                    }
    
                    timeFilteredList.push([{
                        ...level,
                        historicalRank: historicalPlacement
                    }, err]);
                });
    
                timeFilteredList.sort((a, b) => {
                    const rankA = a[0] ? a[0].historicalRank : 9999;
                    const rankB = b[0] ? b[0].historicalRank : 9999;
                    return rankA - rankB;
                });
    
            } else {
                timeFilteredList = this.list.map(([level, err], idx) => {
                    if (level) {
                        return [{ ...level, historicalRank: idx + 1 }, err];
                    }
                    return [level, err];
                });
            }
    
            // --- SEARCH INPUT & ADVANCED MODAL FILTERS ---
            return timeFilteredList.filter(([level, err]) => {
                if (!level) {
                    return !this.searchQuery && !this.filterNewOnly && !this.filterVerifier && !this.filterUploader && !this.filterCreator && this.filterTags.length === 0;
                }
    
                if (this.searchQuery) {
                    const cleanFilter = this.searchQuery.toLowerCase().trim();
                    if (!level.name || !level.name.toLowerCase().includes(cleanFilter)) return false;
                }
    
                if (this.filterNewOnly) {
                    if (!this.isNewLevel(level.history)) return false;
                }
    
                if (this.filterVerifier) {
                    const cleanVerifier = this.filterVerifier.toLowerCase().trim();
                    if (!level.verifier || !level.verifier.toLowerCase().includes(cleanVerifier)) return false;
                }
    
                if (this.filterUploader) {
                    const cleanUploader = this.filterUploader.toLowerCase().trim();
                    if (!level.author || !level.author.toLowerCase().includes(cleanUploader)) return false;
                }
    
                if (this.filterCreator) {
                    const cleanCreator = this.filterCreator.toLowerCase().trim();
                    if (!level.creators || !level.creators.some(c => c.toLowerCase().includes(cleanCreator))) return false;
                }
    
                if (this.filterTags.length > 0) {
                    if (!level.tags || !Array.isArray(level.tags)) return false;
                    
                    if (this.tagMode === 'all') {
                        const hasAllTags = this.filterTags.every(tag => 
                            level.tags.some(t => t.toLowerCase() === tag.toLowerCase())
                        );
                        if (!hasAllTags) return false;
                    } else {
                        const hasAnyTag = this.filterTags.some(tag => 
                            level.tags.some(t => t.toLowerCase() === tag.toLowerCase())
                        );
                        if (!hasAnyTag) return false;
                    }
                }
    
                return true;
            });
        }

    },
    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();

        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }

            if (this.$route.params.id) {
                this.selectLevelById(this.$route.params.id);
            }
        }

        this.loading = false;
    },
    watch: {
        '$route.params.id'(newId) {
            if (newId) {
                this.selectLevelById(newId);
            }
        }
    },
    methods: {
        embed,
        score,
        isBlacklisted(username) {
            if (!username) return false;
            return this.blacklist.some(b => b.toLowerCase().trim() === username.toLowerCase().trim());
        },
        selectLevelById(id) {
            if (!this.list) return;
            const index = this.list.findIndex(([level, err]) => {
                const currentId = level ? level.id : err;
                return String(currentId) === String(id);
            });
            if (index !== -1) {
                this.selected = index;
            }
        },
        getMasterIndex(level, err) {
            if (!level) {
                return this.list.findIndex(([_, e]) => e === err);
            }
            return this.list.findIndex(([l]) => l && l.id === level.id);
        },
        getMasterRank(err) {
            if (!err) return 9999;
            return this.list.findIndex(([_, e]) => e === err) + 1;
        },
        setSelectedByLevel(level, err) {
            const index = this.getMasterIndex(level, err);
            if (index !== -1) {
                this.selected = index;
                this.$router.push('/level/' + (level ? level.id : err));
            }
        },
        getLogTypeLabel(log) {
            let label = log.type || 'moved';
            if (label === 'moved' && log.oldPlacement && log.placement) {
                label = log.placement > log.oldPlacement ? 'moved-down' : 'moved-up';
            }
            return label.replace(/-/g, ' ');
        },
        getLogColor(type, log = null) {
            let activeType = type;
            
            if (type === 'moved' && log && log.oldPlacement && log.placement) {
                activeType = log.placement > log.oldPlacement ? 'moved-down' : 'moved-up';
            }

            switch (activeType) {
                case 'added':
                case 'list%':
                    return '#ffc107';
                case 'moved-up':
                    return '#00b54b';
                case 'moved-down':
                    return '#ff4d4d';
                default:
                    return '#888888';
            }
        },
        isNewLevel(historyArray) {
            if (!historyArray || !Array.isArray(historyArray)) return false;
            
            const addedLog = historyArray.find(log => log.type === 'added');
            if (!addedLog || !addedLog.date) return false;

            const addedDate = new Date(addedLog.date);
            const currentDate = new Date();
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

            return (currentDate - addedDate) < sevenDaysInMs;
        },
        openModal() {
            this.modalLocal.filterNewOnly = this.filterNewOnly;
            this.modalLocal.filterCreator = this.filterCreator;
            this.modalLocal.filterVerifier = this.filterVerifier;
            this.modalLocal.filterUploader = this.filterUploader;
            this.modalLocal.filterTags = [...this.filterTags];
            this.modalLocal.tagMode = this.tagMode;
            this.showModal = true;
        },
        applyFilters() {
            this.filterNewOnly = this.modalLocal.filterNewOnly;
            this.filterCreator = this.modalLocal.filterCreator;
            this.filterVerifier = this.modalLocal.filterVerifier;
            this.filterUploader = this.modalLocal.filterUploader;
            this.filterTags = [...this.modalLocal.filterTags];
            this.tagMode = this.modalLocal.tagMode;
            this.showModal = false;
        },
        toggleModalTag(tag) {
            const index = this.modalLocal.filterTags.indexOf(tag);
            if (index === -1) {
                this.modalLocal.filterTags.push(tag);
            } else {
                this.modalLocal.filterTags.splice(index, 1);
            }
        },
        toggleTagDirect(tag) {
            const index = this.filterTags.indexOf(tag);
            if (index === -1) {
                this.filterTags.push(tag);
            } else {
                this.filterTags.splice(index, 1);
            }
        },
        resetModalFilters() {
            this.modalLocal.filterNewOnly = false;
            this.modalLocal.filterCreator = "";
            this.modalLocal.filterVerifier = "";
            this.modalLocal.filterUploader = "";
            this.modalLocal.filterTags = [];
            this.modalLocal.tagMode = "all";
        }
    }
};
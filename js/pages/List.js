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

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="list-search" style="padding: 15px; border-bottom: 1px solid var(--border-color, #333); background: rgba(0,0,0,0.15);">
                    <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                        <input 
                            v-model="filter" 
                            type="text" 
                            placeholder="Search levels..." 
                            style="flex-grow: 1; min-width: 0; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color, #444); color: var(--text-color, #fff); border-radius: 6px; outline: none; font-size: 0.95rem;"
                        />
                        <button 
                            @click="advancedOpen = !advancedOpen"
                            :style="{
                                padding: '10px 16px',
                                background: advancedOpen ? '#ff4d4d' : 'rgba(255,255,255,0.1)',
                                border: '1px solid ' + (advancedOpen ? '#ff4d4d' : 'var(--border-color, #444)'),
                                color: '#fff',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: '0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }">
                            <span class="type-label-md" style="font-weight: bold;">Filters {{ advancedOpen ? '▲' : '▼' }}</span>
                        </button>
                    </div>

                    <div v-if="advancedOpen" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border-color, #444); display: flex; flex-direction: column; gap: 10px;">
                        
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
                            <input type="checkbox" v-model="filterNewOnly" style="cursor: pointer;" />
                            <span class="type-label-md" style="color: var(--text-color-muted, #ccc);">
                                Show Only <span style="color: #ff4d4d; font-weight: bold;">NEW!</span> Levels
                            </span>
                        </label>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <input 
                                v-model="filterCreator" 
                                type="text" 
                                placeholder="Filter by Creator..." 
                                style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color, #333); color: var(--text-color, #fff); border-radius: 4px; outline: none; font-size: 0.85rem;"
                            />
                            <input 
                                v-model="filterVerifier" 
                                type="text" 
                                placeholder="Filter by Verifier..." 
                                style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color, #333); color: var(--text-color, #fff); border-radius: 4px; outline: none; font-size: 0.85rem;"
                            />
                            <input 
                                v-model="filterUploader" 
                                type="text" 
                                placeholder="Filter by Uploader..." 
                                style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color, #333); color: var(--text-color, #fff); border-radius: 4px; outline: none; font-size: 0.85rem;"
                            />
                        </div>

                        <div style="margin-top: 4px;">
                            <span class="type-title-sm" style="display: block; margin-bottom: 6px; color: var(--text-color-muted, #888); font-weight: bold; letter-spacing: 0.5px;">Active Tag Filters:</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                <span v-if="filterTags.length === 0" class="type-label-md" style="color: var(--text-color-muted, #555); font-style: italic;">No tags selected</span>
                                <button 
                                    v-for="tag in filterTags" 
                                    :key="tag"
                                    @click="toggleTag(tag)"
                                    style="background: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center;">
                                    <span class="type-label-sm" style="font-weight: bold; color: #fff;">{{ tag }} ×</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <table class="list" v-if="list">
                    <template v-for="([level, err], i) in filteredList">
                        
                        <tr v-if="i === 0 && !filter && !filterNewOnly && !filterCreator && !filterVerifier && !filterUploader && filterTags.length === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Main List</td>
                        </tr>

                        <tr v-slot v-if="i === 75 && !filter && !filterNewOnly && !filterCreator && !filterVerifier && !filterUploader && filterTags.length === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Extended List</td>
                        </tr>

                        <tr v-if="i === 150 && !filter && !filterNewOnly && !filterCreator && !filterVerifier && !filterUploader && filterTags.length === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Extended+ List</td>
                        </tr>

                        <tr>
                            <td class="rank" style="width: 60px; min-width: 60px; max-width: 60px; text-align: left;">
                                <p v-if="list.indexOf(filteredList[i]) + 1 <= 250" class="type-label-lg">
                                    #{{ list.indexOf(filteredList[i]) + 1 }}
                                </p>
                                <p v-else class="type-label-lg">Legacy</p>
                            </td>
                            <td class="level" :class="{ 'active': selected == list.indexOf(filteredList[i]), 'error': !level }" style="width: auto;">
                                <button @click="selected = list.indexOf(filteredList[i]); $router.push('/level/' + (level ? level.id : err))" style="overflow: visible; width: 100%; text-align: left;">
                                    <div style="display: flex; align-items: center; white-space: nowrap; overflow: visible; padding: 2px 0;">
                                        <span class="type-label-lg" style="line-height: 1.2; display: inline-block;">{{ level ? level.name : 'Error (' + err + '.json)' }}</span>
                                        <span v-if="level && isNewLevel(level.history)" style="color: #ff4d4d; font-weight: bold; margin-left: 8px; font-size: 0.85rem; letter-spacing: 0.5px; flex-shrink: 0;">NEW!</span>
                                    </div>
                                </button>
                            </td>
                        </tr>
                    </template>
                </table>
            </div>
            
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>

                    <div class="level-tags" style="margin: -10px 0 25px 0; padding: 10px 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                        <span class="type-title-sm" style="color: var(--text-color-muted, #888); font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Tags:</span>
                        <template v-if="level.tags && level.tags.length > 0">
                            <button 
                                v-for="tag in level.tags" 
                                :key="tag"
                                @click="toggleTag(tag)"
                                :style="{
                                    background: filterTags.includes(tag) ? '#ff4d4d' : 'rgba(255,255,255,0.06)',
                                    color: '#fff',
                                    border: '1px solid ' + (filterTags.includes(tag) ? '#ff4d4d' : 'var(--border-color, #333)'),
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    transition: 'all 0.15s ease'
                                }">
                                <span class="type-label-md" style="font-weight: bold; color: #fff;">{{ tag }}</span>
                            </button>
                        </template>
                        <span v-else class="type-label-md" style="color: var(--text-color-muted, #555); font-style: italic;">None assigned</span>
                    </div>

                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected + 1 <= 250"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
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
        filter: "",
        advancedOpen: false,
        filterNewOnly: false,
        filterVerifier: "",
        filterUploader: "",
        filterCreator: "",
        filterTags: []
    }),
    computed: {
        level() {
            return this.list && this.list[this.selected]?.[0];
        },
        video() {
            if (!this.level?.showcase) {
                return embed(this.level?.verification);
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
            
            return this.list.filter(([level, err]) => {
                if (!level) {
                    return !this.filter && !this.filterNewOnly && !this.filterVerifier && !this.filterUploader && !this.filterCreator && this.filterTags.length === 0;
                }

                if (this.filter) {
                    const cleanFilter = this.filter.toLowerCase().trim();
                    if (!level.name.toLowerCase().includes(cleanFilter)) return false;
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
                    const hasAllTags = this.filterTags.every(tag => 
                        level.tags.some(t => t.toLowerCase() === tag.toLowerCase())
                    );
                    if (!hasAllTags) return false;
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
        toggleTag(tag) {
            const index = this.filterTags.indexOf(tag);
            if (index === -1) {
                this.filterTags.push(tag);
            } else {
                this.filterTags.splice(index, 1);
            }
        }
    }
};
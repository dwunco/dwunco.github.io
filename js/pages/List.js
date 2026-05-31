import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchChangelog } from "../content.js";

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
                <table class="list" v-if="list">
                    <template v-for="([level, err], i) in list">
                        
                        <tr v-if="i === 0" class="list-header-row">
                            <td colspan="2" class="list-header-label">Main List</td>
                        </tr>

                        <tr v-slot v-if="i === 75" class="list-header-row">
                            <td colspan="2" class="list-header-label">Extended List</td>
                        </tr>

                        <tr v-if="i === 150" class="list-header-row">
                            <td colspan="2" class="list-header-label">Extended+ List</td>
                        </tr>

                        <tr>
                            <td class="rank">
                                <p v-if="i + 1 <= 250" class="type-label-lg">#{{ i + 1 }}</p>
                                <p v-else class="type-label-lg">Legacy</p>
                            </td>
                            <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ level ? level.name : 'Error (' + err + '.json)' }}</span>
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

                    <div class="changelog-panel" style="margin-top: 30px; border-top: 2px solid #333; padding-top: 20px;">
                        <h2>Changelog History</h2>
                        <div v-if="levelHistory.length > 0" style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
                            <div v-for="log in levelHistory" :key="log.date + log.type + log.notes" 
                                 :style="{
                                     background: 'rgba(255,255,255,0.03)',
                                     borderLeft: '4px solid ' + getLogColor(log.type),
                                     padding: '10px 15px',
                                     borderRadius: '0 4px 4px 0'
                                 }">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0px;">
                                    <span :style="{
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        fontSize: '0.85rem',
                                        color: getLogColor(log.type)
                                    }">[{{ log.type }}]</span>
                                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0px;">
                                        <span style="font-size: 0.85rem; color: #888;">{{ log.date }}</span>
                                        <span v-if="log.rankLabel" style="font-size: 0.85rem; color: #aaa; font-family: monospace; letter-spacing: 0.5px;">
                                            {{ log.rankLabel }}
                                        </span>
                                    </div>
                                </div>
                                <p style="margin: 0; font-size: 0.95rem; line-height: 1.2; color: #ddd;">{{ log.notes }}</p>
                            </div>
                        </div>
                        <p v-else style="color: #666; font-style: italic; margin-top: 15px;">No structural changes recorded for this level.</p>
                    </div>

                </div>
                <div class="level" v-else style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
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
        changelog: [], 
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
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
            if (!this.level || !this.level.id || !this.changelog || !Array.isArray(this.changelog)) return [];
            
            const currentRank = this.selected + 1;
            
            // 1. Find the oldest addition date timestamp safely
            const addedLogs = this.changelog.filter(log => log && log.id === this.level.id && log.type === 'added');
            const levelAddedTime = addedLogs.length 
                ? Math.min(...addedLogs.map(log => new Date(log.date).getTime())) 
                : null;

            // 2. Generate timeline of global additions cleanly using standard spread to avoid altering the source data array
            const globalAdditions = [...this.changelog]
                .filter(log => log && log.type === 'added' && log.placement)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // 3. Filter out pre-birth history logs and format map
            const history = this.changelog
                .filter(log => {
                    if (!log) return false;
                    const logTime = new Date(log.date).getTime();

                    if (log.id === this.level.id) return true;

                    if (log.type === 'added' && log.placement && currentRank >= log.placement) {
                        if (levelAddedTime && logTime < levelAddedTime) return false;
                        if (levelAddedTime && logTime === levelAddedTime && log.placement <= currentRank) return false;
                        return true;
                    }

                    return false;
                })
                .map(log => {
                    if (log.id === this.level.id) {
                        let rankLabel = "";
                        if (log.type === 'added' && log.placement) {
                            rankLabel = `— #${log.placement}`;
                        }
                        return { ...log, rankLabel };
                    }

                    // Calculate old rank placements cleanly
                    const shiftsAfterUs = globalAdditions.filter(addition => {
                        const additionTime = new Date(addition.date).getTime();
                        const logTime = new Date(log.date).getTime();
                        return additionTime > logTime && currentRank >= addition.placement;
                    }).length;

                    const historicalRank = currentRank - shiftsAfterUs;

                    let levelName = log.name;
                    if (!levelName && this.list) {
                        const targetInList = this.list.find(([l]) => l && l.id === log.id);
                        levelName = targetInList ? targetInList[0].name : "A new level";
                    }

                    return {
                        date: log.date,
                        type: 'moved-down',
                        placement: log.placement,
                        notes: `${levelName || "A level"} was added above`,
                        rankLabel: `↓1 #${historicalRank}`
                    };
                });

            // 4. Final chronologically reverse sort
            return history.sort((a, b) => {
                const diff = new Date(b.date) - new Date(a.date);
                if (diff !== 0) return diff;
                return (a.placement || 999) - (b.placement || 999);
            });
        }
    },
    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.changelog = await fetchChangelog(); 

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
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        getLogColor(type) {
            switch (type) {
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
        }
    },
};
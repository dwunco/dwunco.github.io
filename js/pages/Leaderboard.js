import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        
        // Add usernames here to completely wipe them off the global rankings dynamically
        blacklist: [
            "cookiedarookie"
        ],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in filteredLeaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player" v-if="entry">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }}</h3>
                        
                        <h2 v-if="combinedList.length > 0">Records ({{ combinedList.length }})</h2>
                        <table class="table">
                            <tr v-for="score in combinedList" :class="{ 'verifier-highlight': score.isVerification }">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.level }} <span v-if="score.isVerification" class="badge">(Verifier)</span>
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <h2 v-if="entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        filteredLeaderboard() {
            if (!this.leaderboard) return [];
            // Dynamically filters out users matching the blacklist (case-insensitive check)
            return this.leaderboard.filter(entry => !this.isBlacklisted(entry.user));
        },
        entry() {
            return this.filteredLeaderboard[this.selected];
        },
        combinedList() {
            if (!this.entry) return [];

            // Label where each record originated
            const verifications = this.entry.verified ? this.entry.verified.map(score => ({ ...score, isVerification: true })) : [];
            const completions = this.entry.completed ? this.entry.completed.map(score => ({ ...score, isVerification: false })) : [];

            // Merge and sort in ascending order based on the level rank assignment (#1, #2, #3...)
            return [...verifications, ...completions].sort((a, b) => a.rank - b.rank);
        }
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        this.loading = false;
    },
    methods: {
        localize,
        isBlacklisted(username) {
            if (!username) return false;
            return this.blacklist.some(b => b.toLowerCase().trim() === username.toLowerCase().trim());
        }
    },
};
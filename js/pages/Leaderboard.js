import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        currentListType: 'classic', // Default selected list state
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        
        // Add usernames here to completely wipe them off the global rankings dynamically
        blacklist: [
            ""
        ],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div style="display: flex; gap: 8px; padding: 15px 15px 0 15px; margin-bottom: -15px; max-width: 400px;">
                <button 
                    @click="setListType('classic')" 
                    style="flex: 1; padding: 10px; border-radius: 6px; font-weight: 700; font-family: 'Lexend Deca', sans-serif; cursor: pointer; border: none; transition: background-color 0.2s, color 0.2s;"
                    :style="{
                        background: currentListType === 'classic' ? '#0072ff' : 'var(--color-surface-elevated)',
                        color: currentListType === 'classic' ? 'var(--color-on-primary)' : 'var(--color-on-background)',
                        opacity: currentListType === 'classic' ? '1' : '0.7'
                    }"
                >
                    Classic
                </button>
                <button 
                    @click="setListType('platformer')" 
                    style="flex: 1; padding: 10px; border-radius: 6px; font-weight: 700; font-family: 'Lexend Deca', sans-serif; cursor: pointer; border: none; transition: background-color 0.2s, color 0.2s;"
                    :style="{
                        background: currentListType === 'platformer' ? '#0072ff' : 'var(--color-surface-elevated)',
                        color: currentListType === 'platformer' ? 'var(--color-on-primary)' : 'var(--color-on-background)',
                        opacity: currentListType === 'platformer' ? '1' : '0.7'
                    }"
                >
                    Platformer
                </button>
            </div>

            <div class="page-leaderboard" style="margin-top: 25px;">
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
                        <tr style="height: 100px; pointer-events: none; background: transparent;">
                            <td colspan="3" style="border: none; background: transparent;"></td>
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
                            <tr style="height: 80px; pointer-events: none; background: transparent;">
                                <td colspan="3" style="border: none; background: transparent;"></td>
                            </tr>
                        </table>

                        <h2 v-if="entry.progressed && entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
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
                            <tr style="height: 80px; pointer-events: none; background: transparent;">
                                <td colspan="3" style="border: none; background: transparent;"></td>
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
        await this.loadLeaderboardData();
    },
    methods: {
        localize,
        isBlacklisted(username) {
            if (!username) return false;
            return this.blacklist.some(b => b.toLowerCase().trim() === username.toLowerCase().trim());
        },
        async loadLeaderboardData() {
            this.loading = true;
            try {
                // If your fetchLeaderboard logic inside content.js accepts a source argument, 
                // we feed it 'classic' or 'platformer'. If not, it falls back gracefully to standard lists.
                const [leaderboard, err] = await fetchLeaderboard(this.currentListType);
                this.leaderboard = leaderboard || [];
                this.err = err || [];
            } catch (e) {
                this.err = [e.message];
            }
            this.loading = false;
        },
        async setListType(type) {
            if (this.currentListType === type) return;
            this.currentListType = type;
            
            // Snaps selection index position tracking back to rank #1 player spot on change
            this.selected = 0;
            
            // Triggers real-time dataset re-fetch configuration sequence 
            await this.loadLeaderboardData();
        }
    },
};
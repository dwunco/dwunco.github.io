import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

const Welcome = {
    template: `
        <div class="welcome-container-span">
            <section style="margin-bottom: 2.5rem; text-align: center;">
                <h1 class="type-title-xl" style="font-size: 2.8rem; margin-bottom: 0.75rem; font-weight: 700;">Welcome to the Epic 8 Demonlist</h1>
                <p class="type-body-md" style="opacity: 0.8; font-size: 1.2rem;">The official archive tracking every single demon clear across our cohort.</p>
            </section>

            <hr style="border: 0; height: 1px; background: var(--color-on-background); opacity: 0.15; margin-bottom: 2.5rem;" />

            <section style="margin-bottom: 3rem;">
                <h2 class="type-title-lg" style="font-size: 1.8rem; margin-bottom: 1.5rem;">📜 List Guidelines & Progression Rules</h2>
                
                <div class="welcome-card-rule" style="border-left: 5px solid #ffbc00;">
                    <h3 class="type-label-lg" style="color: #ffbc00; margin-bottom: 0.5rem; font-size: 1.15rem;">⚡ Top 75 Progress Points</h3>
                    <p class="type-body-md" style="line-height: 1.6; margin: 0;">Elite levels award partial point scores for high-percentage practice runs. Progress floor boundaries are calibrated strictly around key level choke-points (e.g., <em>Sakupen Hell</em> unlocks at 32%, <em>Bloodbath</em> at 52%, and <em>Nine Circles</em> unlocks at 61% right before the mini-wave phase).</p>
                </div>

                <div class="welcome-card-rule" style="border-left: 5px solid #ff4545;">
                    <h3 class="type-label-lg" style="color: #ff4545; margin-bottom: 0.5rem; font-size: 1.15rem;">🔒 100% Lock Bracket</h3>
                    <p class="type-body-md" style="line-height: 1.6; margin: 0;">Any levels sitting inside the rank #76 to #150 zone require an absolute 100% full completion record. Low-effort progress logs are ignored to maintain list prestige.</p>
                </div>

                <div class="welcome-card-rule" style="border-left: 5px solid #00d2ff;">
                    <h3 class="type-label-lg" style="color: #00d2ff; margin-bottom: 0.5rem; font-size: 1.15rem;">💎 Extended+ Tier</h3>
                    <p class="type-body-md" style="line-height: 1.6; margin: 0;">Our list has outgrown simple demons! Levels ranked #151 or lower (such as <em>Platinum Adventure</em>) are shifted into the legacy <strong>Extended+ Tier</strong>. They keep a static 0.400 points base that decays slowly so that clearing entry demons remains rewarding for everyone.</p>
                </div>
            </section>

            <div style="text-align: center;">
                <router-link to="/list">
                    <button class="welcome-btn-enter">Enter the Demonlist ➔</button>
                </router-link>
            </div>
        </div>
    `
};

export default [
    { path: '/', component: Welcome },
    { path: '/list', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
];

export default [
    { path: '/', component: Welcome },      // Welcome tab is the default landing page
    { path: '/list', component: List },        // The Demonlist grid moves to this path
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
];

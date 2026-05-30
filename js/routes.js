import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

// We code the Welcome layout directly into the router array so it cannot crash
const Welcome = {
    template: `
        <main class="page-welcome" style="padding: 40px; max-width: 800px; margin: 0 auto; min-height: 100vh; font-family: 'Lexend Deca', sans-serif;">
            <section style="margin-bottom: 40px; text-align: center;">
                <h1 class="type-title-xl" style="font-size: 2.8rem; margin-bottom: 12px; font-weight: 700;">Welcome to the Epic 8 Demonlist</h1>
                <p class="type-body-md" style="opacity: 0.8; font-size: 1.2rem;">The official archive tracking every single demon beaten across our cohort.</p>
            </section>

            <hr style="border: 0; height: 1px; background: currentColor; opacity: 0.2; margin-bottom: 40px;" />

            <section style="display: flex; flex-direction: column; gap: 20px;">
                <h2 class="type-title-lg" style="font-size: 1.8rem; margin-bottom: 10px;">📜 List Guidelines & Progression Rules</h2>
                
                <div style="padding: 20px; background: rgba(128,128,128,0.08); border-radius: 12px; border-left: 5px solid #ffbc00;">
                    <h3 class="type-label-lg" style="color: #ffbc00; margin-bottom: 8px; font-size: 1.1rem;">⚡ Top 75 Progress Points</h3>
                    <p class="type-body-md" style="opacity: 0.9; line-height: 1.6;">Elite levels award partial point scores for high-percentage practice runs. Progress floor boundaries are calibrated strictly around key level choke-points (e.g., <em>Sakupen Hell</em> unlocks at 32%, <em>Bloodbath</em> at 52%, and <em>Nine Circles</em> at 61%).</p>
                </div>

                <div style="padding: 20px; background: rgba(128,128,128,0.08); border-radius: 12px; border-left: 5px solid #ff4545;">
                    <h3 class="type-label-lg" style="color: #ff4545; margin-bottom: 8px; font-size: 1.1rem;">🔒 100% Lock Bracket</h3>
                    <p class="type-body-md" style="opacity: 0.9; line-height: 1.6;">Any levels sitting at rank #76 or below require a full 100% completion to be eligible for point rewards. Low-effort progress logs are ignored to maintain a clean database file structure.</p>
                </div>

                <div style="padding: 20px; background: rgba(128,128,128,0.08); border-radius: 12px; border-left: 5px solid #00d2ff;">
                    <h3 class="type-label-lg" style="color: #00d2ff; margin-bottom: 8px; font-size: 1.1rem;">💎 Extended+ Tier</h3>
                    <p class="type-body-md" style="opacity: 0.9; line-height: 1.6;">All entry-level and legacy demons ranked #151 or lower (such as <em>Platinum Adventure</em>) award a static 0.400 baseline that slowly decays. Every single clear counts toward your profile rank!</p>
                </div>
            </section>
        </main>
    `
};

export default [
    { path: '/', component: Welcome },      // Welcome tab is the default landing page
    { path: '/list', component: List },        // The Demonlist grid moves to this path
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
];

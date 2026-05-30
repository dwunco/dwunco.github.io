export default {
    template: `
        <main class="page-welcome" style="padding: 40px; max-width: 800px; margin: 0 auto; font-family: 'Lexend Deca', sans-serif;">
            <section style="margin-bottom: 40px; text-align: center;">
                <h1 style="font-size: 2.5rem; margin-bottom: 10px;">Welcome to the Epic 8 Demonlist</h1>
                <p style="opacity: 0.8; font-size: 1.1rem;">The official archive tracking every single demon beaten across our cohort.</p>
            </section>

            <hr style="border: 0; height: 1px; background: rgba(128,128,128,0.2); margin-bottom: 40px;" />

            <section>
                <h2 style="font-size: 1.8rem; margin-bottom: 20px;">📜 List Guidelines & Progression Rules</h2>
                <ul style="list-style-type: none; padding: 0; display: flex; flex-direction: column; gap: 15px;">
                    <li style="padding: 15px; background: rgba(128,128,128,0.05); border-radius: 8px;">
                        <strong>⚡ Top 75 Progress Points:</strong> Elite levels award partial point scores for high-percentage practice runs. Progress floor limits are calibrated strictly around key level choke-points (e.g., <em>Sakupen Hell</em> unlocks at 32%, <em>Bloodbath</em> at 52%, and <em>Nine Circles</em> at 61%).
                    </li>
                    <li style="padding: 15px; background: rgba(128,128,128,0.05); border-radius: 8px;">
                        <strong>🔒 100% Lock Bracket:</strong> Any levels sitting at rank #76 or below require a full 100% completion to be eligible for point rewards.
                    </li>
                    <li style="padding: 15px; background: rgba(128,128,128,0.05); border-radius: 8px;">
                        <strong>💎 Extended+ Tier:</strong> All entry-level and legacy demons ranked #151 or lower (such as <em>Platinum Adventure</em>) award a static 0.400 baseline that slowly decays. Every single clear counts toward your profile rank!
                    </li>
                </ul>
            </section>
        </main>
    `
};

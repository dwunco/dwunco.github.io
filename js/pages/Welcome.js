import { store } from "../main.js";

export default {
    data: () => ({ store }),
    template: `
        <main class="page-welcome" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center; padding: 20px;">
            <div style="max-width: 600px;">
                <h1 class="type-title-xl" style="margin-bottom: 20px; font-size: 3rem;">Epic 8 Demonlist</h1>
                <p class="type-body-md" style="opacity: 0.8; margin-bottom: 40px; line-height: 1.6;">
                    Welcome to the Epic 8 Demonlist! Explore the rankings, check the leaderboards or submit your latest completions.
                </p>
                
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <router-link to="/list" class="nav__cta type-label-lg" style="text-decoration: none; padding: 15px 30px;">
                        View the List
                    </router-link>
                    <router-link to="/leaderboard" class="nav__cta type-label-lg" style="text-decoration: none; padding: 15px 30px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                        Leaderboard
                    </router-link>
                </div>
            </div>
        </main>
    `
};
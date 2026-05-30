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
        
        <!-- LAYER 1: STANDALONE EXPANSIBLE WELCOME HUB -->
        <main v-else-if="showWelcome" class="page-welcome" style="display: block; padding: 40px; max-width: 850px; margin: 0 auto; font-family: 'Lexend Deca', sans-serif; min-height: 100vh;">
            <section style="margin-bottom: 40px; text-align: center;">
                <h1 class="type-title-xl" style="font-size: 2.8rem; margin-bottom: 12px; font-weight: 700;">Welcome to the Epic 8 Demonlist</h1>
                <p class="type-body-md" style="opacity: 0.8; font-size: 1.2rem;">The official archive tracking every single demon clear across our cohort.</p>
            </section>

            <hr style="border: 0; height: 1px; background: currentColor; opacity: 0.15; margin-bottom: 40px;" />

            <section style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 45px; text-align: left;">
                <h2 class="type-title-lg" style="font-size: 1.8rem; margin-bottom: 10px;">📜 List Guidelines & Progression Curve</h2>
                
                <div style="padding: 20px; background: rgba(128,128,128,0.08); border-radius: 12px; border-left: 5px solid #ffbc00;">
                    <h3 class="type-label-lg" style="color: #ffbc00; margin-bottom: 8px; font-size: 1.15rem;">⚡ Top 75 Progress Points</h3>
                    <p class="type-body-md" style="opacity: 0.9; line-height: 1.6; margin: 0;">Elite levels award partial ranking score fractions for high-percentage practice runs. Progress floor boundaries are manually optimized case-by-case around the truest mechanical choke-points to remain fair to the player's run time (e.g., <em>Sakupen Hell</em> unlocks at 32%, <em>Bloodbath</em> at 52%, and <em>Nine Circles</em> unlocks at 61% right at the beginning of the mini-wave phase).</p>
                </div>

                <div style="padding: 20px; background: rgba(128,128,128,0.08); border-radius: 12px; border-left: 5px solid #ff4545;">
                    <h3 class="type-label-lg" style="color: #ff4545; margin-bottom: 8px; font-size: 1.15rem;">🔒 100% Lock Bracket</h3>
                    <p class="type-body-md" style="opacity: 0.9; line-height: 1.6; margin: 0;">Any custom level entries currently sitting inside the rank #76 to #250 zone require an absolute 100% full completion record. Low-effort progress logs are ignored to maintain a clean database file structure.</p>
                </div>

                <div style="padding: 20px; background: rgba(128,128,128,0.08); border-radius: 12px; border-left: 5px solid #00d2ff;">
                    <h3 class="type-label-lg" style="color: #00d2ff; margin-bottom: 8px; font-size: 1.15rem;">💎 Extended+ Bracket</h3>
                    <p class="type-body-md" style="opacity: 0.9; line-height: 1.6; margin: 0;">Our list has outgrown simple demons! Levels ranked #151 or lower (like <em>Platinum Adventure</em> or <em>The Nightmare</em>) are automatically shifted into the legacy <strong>Extended+ Tier</strong>. They keep a static 0.400 points base that decays incredibly slowly so that clearing entry demons remains active, rewarding, and viable for everyone in the group.</p>
                </div>
            </section>

            <div style="text-align: center;">
                <button @click="showWelcome = false" class="nav__cta type-label-lg" style="background-color: var(--color-primary); color: var(--color-on-primary); padding: 15px 45px; font-size: 1.2rem; cursor: pointer; border: none; border-radius: 8px; font-weight: bold; transition: filter 0.2s ease;">
                    Enter the Demonlist ➔
                </button>
            </div>
        </main>

        <!-- LAYER 2: ORIGINAL ACTIVE DEMONLIST CODE GRID -->
        <main v-else class="page-list">
            <div class="list-container">
                <div style="padding: 10px 0; margin-bottom: 10px;">
                    <button @click="showWelcome = true" style="background: none; border: none; color: currentColor; cursor: pointer; opacity: 0.6; display: flex; align-items: center; gap: 5px;" class="type-label-md">
                        ➔ Back to Welcome Hub
                    </button>
                </div>
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
                                    <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
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
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
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
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Achieved the record without using hacks
                    </p>
                    <p>

export default {
    props: ['id'],
    data() {
        return {
            level: null,
            error: false,
            loading: true
        };
    },
    template: `
        <main class="page-level" style="padding: 60px 20px; max-width: 900px; margin: 0 auto;">
            <div class="level-container">
                <router-link to="/" class="btn type-label-lg" style="margin-bottom: 30px; display: inline-block; text-decoration: none;">
                    ← Back to List
                </router-link>
                
                <div v-if="loading" class="type-title-md">
                    Loading level data...
                </div>
                
                <div v-else-if="error" class="type-title-md" style="color: #ff4444;">
                    Level data could not be found. Check if the JSON file exists!
                </div>
                
                <div v-else>
                    <h1 class="type-title-xl" style="margin-bottom: 10px;">{{ level.name || id }}</h1>
                    <p class="type-body-md" style="opacity: 0.6; margin-bottom: 40px;">
                        Creator: <strong>{{ level.creator || 'Unknown' }}</strong> &nbsp;|&nbsp; 
                        Verifier: <strong>{{ level.verifier || 'Unknown' }}</strong>
                    </p>

                    <section class="section-card" style="background: var(--color-surface-subtle); padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid var(--color-border-subtle);">
                        <h3 class="type-title-md" style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <span>🏆</span> Records ({{ level.records ? level.records.length : 0 }})
                        </h3>
                        <ul style="list-style: none; padding: 0;">
                            <li v-for="rec in level.records" style="padding: 12px 0; border-bottom: 1px solid var(--color-border-subtle); display: flex; justify-content: space-between; align-items: center;">
                                <span class="type-body-md">
                                    <strong>{{ rec.player }}</strong> - {{ rec.progress }}%
                                </span>
                                <a :href="rec.link" target="_blank" class="type-label-lg" style="color: #4caf50; text-decoration: none;">Watch Video</a>
                            </li>
                            <li v-if="!level.records || level.records.length === 0" class="type-body-md" style="opacity: 0.5; padding: 10px 0;">
                                No records submitted yet!
                            </li>
                        </ul>
                    </section>

                    <section class="section-card" style="background: var(--color-surface-subtle); padding: 25px; border-radius: 8px; border: 1px solid var(--color-border-subtle);">
                        <h3 class="type-title-md" style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <span>📜</span> Historical Log
                        </h3>
                        <ul style="list-style: none; padding: 0;">
                            <li v-for="event in level.history" style="padding: 12px 0; border-bottom: 1px solid var(--color-border-subtle); line-height: 1.4;">
                                <div class="type-body-md">
                                    <span style="opacity: 0.4; font-family: monospace; margin-right: 10px;">[{{ event.date || 'DATE N/A' }}]</span>
                                    <span>{{ event.note }}</span>
                                </div>
                            </li>
                            <li v-if="!level.history || level.history.length === 0" class="type-body-md" style="opacity: 0.5; padding: 10px 0;">
                                No history logged for this level.
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    `,
    async mounted() {
        try {
            // This pulls directly from your data folder using the ID passed via the URL route
            const response = await fetch(`./data/${this.id}.json`);
            if (!response.ok) throw new Error("File not found");
            this.level = await response.json();
        } catch (e) {
            console.error(e);
            this.error = true;
        } finally {
            this.loading = false;
        }
    }
};
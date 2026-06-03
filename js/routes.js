// 1. Import your existing page components at the top...
import List from './pages/List.js'; // (or whatever your homepage component is called)
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

// 2. IMPORT THE NEW LEVEL PAGE HERE:
import Level from './pages/Level.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },

    // 3. ADD THIS DYNAMIC ROUTE TO THE ARRAY:
    { 
        path: '/level/:id', 
        component: Level, 
        props: true 
    },
];
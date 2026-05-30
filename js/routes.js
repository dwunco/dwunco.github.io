import Welcome from './pages/Welcome.js'; // Imports your new homepage view
import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';

export default [
    { path: '/', component: Welcome }, // Welcome tab is now the default landing page
    { path: '/list', component: List },   // The main Demonlist moves to this path
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
];

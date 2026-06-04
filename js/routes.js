import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';
import Welcome from './pages/Welcome.js';

export default [
    // 1. When someone lands on the base site (/#/), instantly redirect them to the welcome route
    { path: '/', redirect: '/welcome' },
    
    // 2. This loads your welcome page component when the URL is /#/welcome
    { path: '/welcome', component: Welcome },
    
    // Your other pages stay right here
    { path: '/list', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
    { path: '/level/:id', component: List }
];
/**
 * Numbers of decimal digits to round to
 */
const scale = 3;

// Your exact custom point breakdown matching ranks 1 through 75+
const POINT_LIST = [
    1000, 900, 800, 700, 600, 540, 480, 420, 360, 300, // #1 to #10
    280,  260, 240, 220, 200, 190, 180, 170, 160, 150, // #11 to #20
    140,  130, 120, 110, 100, 90,  80,  70,  60,  50,  // #21 to #30
    48,   46,  44,  42,  40,  38,  36,  34,  32,  30,  // #31 to #40
    28,   26,  24,  22,  20,  19,  18,  17,  16,  15,  // #41 to #50
    14,   13,  12,  11,  10,  9,   8,   7,   6,   5    // #51 to #60
];

/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number}
 */
export function score(rank, percent, minPercent) {
    if (rank > 150) {
        return 0;
    }
    if (rank > 75 && percent < 100) {
        return 0;
    }

    // Convert 1-based rank to a 0-based array index safely
    let lookupIndex = rank;
    if (rank > 0) {
        lookupIndex = rank - 1;
    }

    // Grab points from your custom sequence, baseline to 0 if out of range
    let baseScore = 0;
    if (lookupIndex >= 0 && lookupIndex < POINT_LIST.length) {
        baseScore = POINT_LIST[lookupIndex];
    }

    // Scale the points based on the player's percentage progress
    let score = baseScore * ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));

    score = Math.max(0, score);

    // Apply template's standard penalty for non-100% runs
    if (percent != 100) {
        return round(score - score / 3);
    }

    return Math.max(round(score), 0);
}

export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}

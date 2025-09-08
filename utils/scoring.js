/**
 * Calculates the winner of a best-of-3 sets padel match.
 * @param {Array<Object>} sets - An array of set scores, e.g., [{a: 6, b: 4}, {a: 2, b: 6}, {a: 7, b: 6}]
 * @returns {{score: string, winner: 'A'|'B'|null}} An object containing the formatted score string and the winner.
 */
function calculateWinner(sets) {
    let setsWonA = 0;
    let setsWonB = 0;
    const scoreArr = [];

    for (const set of sets) {
        if (set.a !== '' && set.b !== '' && set.a !== null && set.b !== null) {
            const scoreA = parseInt(set.a, 10);
            const scoreB = parseInt(set.b, 10);

            if (isNaN(scoreA) || isNaN(scoreB)) continue;

            scoreArr.push(`${scoreA}-${scoreB}`);

            // Padel set win condition: must win by 2 games after reaching 6, or win a tie-break (7-6).
            if ((scoreA >= 6 && scoreA >= scoreB + 2) || (scoreA === 7 && scoreB === 6)) {
                setsWonA++;
            } else if ((scoreB >= 6 && scoreB >= scoreA + 2) || (scoreB === 7 && scoreA === 6)) {
                setsWonB++;
            }
        }
    }

    const score = scoreArr.join(', ');
    let winner = null;

    // The winner of the match is the first to win 2 sets.
    if (setsWonA >= 2) {
        winner = 'A';
    } else if (setsWonB >= 2) {
        winner = 'B';
    }

    return { score, winner };
}

module.exports = {
    calculateWinner,
};
/**
 * Calculates the parent and child phases for a given phase in an elimination bracket.
 * The phase naming convention is assumed to be:
 * - Final: 'F'
 * - Semi-finals: 'A', 'B'
 * - Quarter-finals: 'A-1', 'A-2', 'B-1', 'B-2'
 * - And so on.
 * @param {string} phase The current phase string.
 * @returns {{parent: string|null, children: Array<string>|null, teamSlot: 'A'|'B'|null}}
 */
function getBracketNavigation(phase) {
    if (!phase) {
        return { parent: null, children: null, teamSlot: null };
    }

    const trimmedPhase = phase.trim();
    let parent = null;
    let children = null;
    let teamSlot = null;

    if (trimmedPhase === 'F') {
        parent = null; // Final has no parent
        children = ['A', 'B'];
        teamSlot = null;
    } else if (trimmedPhase === 'A' || trimmedPhase === 'B') {
        parent = 'F';
        children = [`${trimmedPhase}-1`, `${trimmedPhase}-2`];
        teamSlot = trimmedPhase; // In the final, winner of 'A' goes to slot 'A'
    } else {
        const parts = trimmedPhase.split('-');
        if (parts.length > 1) {
            parent = parts.slice(0, -1).join('-');
            children = [`${trimmedPhase}-1`, `${trimmedPhase}-2`];
            const lastPart = parseInt(parts[parts.length - 1], 10);
            teamSlot = (lastPart % 2 !== 0) ? 'A' : 'B';
        }
    }

    return { parent, children, teamSlot };
}

/**
 * function to get the oppositive team slot
 * @param {string} teamSlot The current team slot ('A' or 'B').
 * @returns {string|null} The opposite team slot or null if invalid.
 */
function getOppositeTeamSlot(teamSlot) {
    if (teamSlot === 'A') {
        return 'B';
    } else if (teamSlot === 'B') {
        return 'A';
    }
    return 'A';
}

module.exports = {
    getBracketNavigation,
    getOppositeTeamSlot,
};
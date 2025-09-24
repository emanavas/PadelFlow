const { getMatchScoreById } = require('../models/tournamentModel');

function getPhaseLabel(phase, t) {
    if (!phase) return '-';

    if (phase === 'F')
        return '<h3 class="badge bg-success mb-3">' + t('round_final') + '</h3>';
    if (phase === 'A' || phase === 'B')
        return '<h3 class="badge bg-primary mb-3">' + t('round_semifinal') + '</h3>';

    var match = phase.match(/^([AB])-([0-9]+)(?:-([0-9]+))?(?:-([0-9]+))?(?:-([0-9]+))?(?:-([0-9]+))?$/);
    if (match) {
        var depth = match.slice(2).filter(Boolean).length;
        var label = '';

        if (depth === 1)
            label = t('round_quarterfinal');
        else if (depth === 2)
            label = t('round_of_16');
        else if (depth === 3)
            label = t('round_of_32');
        else if (depth === 4)
            label = t('round_of_64');
        else if (depth === 5)
            label = t('round_of_128');
        else
            label = phase;

        return '<span class="badge bg-info mb-3">' + label + '</span>';
    }
    return '<span class="badge bg-secondary mb-3">' + phase + '</span>';
}


function getWinnerPlayersFromMatch(match) {
    if (!match || !match.team_winner || !match.players) {
        return [];
    }
    return match.team_winner === 'A' ? match.players.teamA : match.players.teamB;
}

function formatMatchesForBracket(matches, t, userId) {
    if (!matches || matches.length === 0) {
        return {};
    }

    var getRoundLevel = function(phase) {
        if (phase === 'F') return 0; // Final
        if (phase === 'A' || phase === 'B') return 1; // Semifinales
        var parts = phase.split('-');
        if (parts.length === 2) return 2; // Cuartos
        if (parts.length === 3) return 3; // Octavos
        if (parts.length === 4) return 4; // Dieciseisavos
        return -1;
    };

    var comparePhases = function(phaseA, phaseB) {
        var partsA = phaseA.split('-');
        var partsB = phaseB.split('-');
        var len = Math.max(partsA.length, partsB.length);
        for (var i = 0; i < len; i++) {
            var pA = isNaN(partsA[i]) ? partsA[i] : parseInt(partsA[i], 10);
            var pB = isNaN(partsB[i]) ? partsB[i] : parseInt(partsB[i], 10);
            if (pA === undefined) return -1;
            if (pB === undefined) return 1;
            if (pA < pB) return -1;
            if (pA > pB) return 1;
        }
        return 0;
    };

    var createPhaseArray = function(matches) {
        return matches.reduce(function(acc, match) {
            var level = getRoundLevel(match.phase);
            if (!acc[level]) {
                acc[level] = [];
            }
            match.phaseLabel = getPhaseLabel(match.phase, t);
            acc[level].push(match);
            return acc;
        }, {});
    };

    var phaseA = matches.filter(function(match) { return match.phase.startsWith('A'); });
    var phaseB = matches.filter(function(match) { return match.phase.startsWith('B'); });
    var phaseF = matches.filter(function(match) { return match.phase.startsWith('F'); });

    phaseA.sort(function(a, b) { return comparePhases(a.phase, b.phase); });
    phaseB.sort(function(a, b) { return comparePhases(b.phase, a.phase); });

    var roundsA = createPhaseArray(phaseA);
    var roundsB = createPhaseArray(phaseB);
    // crear nuevo array ordenado por longitud de elementos que tienen cada ronda combinando A y B
    var mixedRounds = createPhaseArray(phaseA.concat(phaseB, phaseF));

    // Ordenar mixedRounds por la longitud de sus claves (número de elementos en cada ronda) de mayor a menor
    mixedRounds = Object.entries(mixedRounds).sort((a, b) => b[1].length - a[1].length);
    // eliminar las claves y dejar solo los arrays de matches
    var mixedRoundsOrdered = mixedRounds.map(entry => entry[1]);



    // etiquetas
    phaseA.forEach(function(match) {
        match.phaseLabel = getPhaseLabel(match.phase, t);
    });
    phaseB.forEach(function(match) {
        match.phaseLabel = getPhaseLabel(match.phase, t);
    });
    phaseF.forEach(function(match) {
        match.phaseLabel = getPhaseLabel(match.phase, t);
    });


    return {
        roundsA: roundsA,
        final: phaseF, // Usamos el array directamente
        roundsB: roundsB,
        mixedRounds: mixedRounds,
        mixedRoundsOrdered: mixedRoundsOrdered
    };
}


module.exports = {
    presentTournament:  function (tournament, matches, registeredPlayers, courts, t, userId) {
        // If t is not provided, use a dummy function that returns the key
        t = t || function(key) { return key; };

        // Create courtMap from courts array
        const courtMap = new Map();
        courts.forEach(court => {
            courtMap.set(court.id, court.name);
        });

        matches.forEach(function(match) {
            if (match.court_id) {
                match.courtName = courtMap.get(match.court_id) || 'Pista no encontrada';
            }
            if (match.start_timestamp) {
                match.startTime = new Date(match.start_timestamp).toLocaleString('default', {
                                                        month: 'short' , day: 'numeric' , hour: '2-digit' ,
                                                        minute: '2-digit' })
            }
            // Check if the current user is in this match
            const teamAPlayerIds = match.players?.teamA?.map(p => p.id) || [];
            const teamBPlayerIds = match.players?.teamB?.map(p => p.id) || [];
            if (userId && (teamAPlayerIds.includes(userId) || teamBPlayerIds.includes(userId))) {
                match.isUserMatch = true;
            } else {
                match.isUserMatch = false;
            }
        });

        var viewModel = {
            tournament: tournament,
            matches: matches,
            registeredPlayers: registeredPlayers,
            courts: courts,
            view: {
                isElimination: tournament.type === 'Elimination',
                isPending: tournament.status === 'pending',
                isActive: tournament.status === 'active',
                isCompleted: tournament.status === 'completed',
            }
        };

        if (viewModel.view.isElimination) {
            viewModel.bracketData = formatMatchesForBracket(matches, t, userId);
            
            if (viewModel.bracketData && viewModel.bracketData.roundsA) {
                viewModel.roundsA = Object.keys(viewModel.bracketData.roundsA);
            } else {
                viewModel.roundsA = [];
            }

            if (viewModel.bracketData && viewModel.bracketData.roundsB) {
                viewModel.roundsB = Object.keys(viewModel.bracketData.roundsB);
            } else {
                viewModel.roundsB = [];
            }
        }
        
        if (viewModel.matches && !viewModel.view.isElimination) {
            matches.forEach(function(match) {
                match.phaseLabel = getPhaseLabel(match.phase, t);
            });
        }

        return viewModel;
    },

    presentWallshowData: function (tournament, matches, courts, t) {
        t = t || function(key) { return key; };

        const courtMap = new Map();
        courts.forEach(court => {
            courtMap.set(court.id, { ...court, currentMatch: null, upcomingMatches: [] });
        });

        const now = new Date();

        // First, assign courtName and startTime to all matches
        matches.forEach(match => {
            if (match.court_id) {
                match.courtName = courtMap.get(match.court_id)?.name || 'Pista no encontrada';
            }
            if (match.start_timestamp) {
                match.startTime = new Date(match.start_timestamp).toLocaleString('default', {
                                                        month: 'short' , day: 'numeric' , hour: '2-digit' ,
                                                        minute: '2-digit' });
                match.startDateTime = new Date(match.start_timestamp); // For sorting
            }
        });

        // Sort matches by start time
        matches.sort((a, b) => a.startDateTime - b.startDateTime);

        // Assign matches to courts
        matches.forEach(match => {
            const courtData = courtMap.get(match.court_id);
            if (courtData) {
                if (!match.score && match.startDateTime <= now && !courtData.currentMatch) {
                    // Match is ongoing and no current match assigned to this court yet
                    courtData.currentMatch = match;
                } else if (!match.score && match.startDateTime > now) {
                    // Match is upcoming
                    courtData.upcomingMatches.push(match);
                }
                // If match has score, it's already finished, so we don't display it as current or upcoming
            } else {
                console.warn(`Court data not found for match ${match.id} with court_id ${match.court_id}`);
            }
        });

        // Determine the "current round in play"
        let currentRoundInPlay = 'No hay ronda en juego';
        const pendingMatches = matches.filter(match => !match.score);
        if (pendingMatches.length > 0) {
            // Find the earliest phase among pending matches
            const earliestPhaseMatch = pendingMatches.reduce((prev, current) => {
                if (!prev.phase) return current;
                // Assuming phase 'F' < 'A'/'B' < 'A-1'/'B-1' etc.
                // This needs a more robust phase comparison if phases are not simple strings
                return prev.phase.localeCompare(current.phase) > 0 ? current : prev;
            }, {});
            if (earliestPhaseMatch.phase) {
                currentRoundInPlay = getPhaseLabel(earliestPhaseMatch.phase, t);
            }
        }


        return {
            tournament: tournament,
            courtsData: Array.from(courtMap.values()),
            currentRoundInPlay: currentRoundInPlay
        };
    }
};
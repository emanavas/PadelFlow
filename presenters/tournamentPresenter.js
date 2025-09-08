const { getMatchScoreById } = require('../models/tournamentModel');

function getPhaseLabel(phase, t) {
    if (!phase) return '-';

    if (phase === 'F')
        return '<h3 class="badge bg-success">' + t('round_final') + '</h3>';
    if (phase === 'A' || phase === 'B')
        return '<h3 class="badge bg-primary">' + t('round_semifinal') + '</h3>';

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

        return '<span class="badge bg-info">' + label + '</span>';
    }
    return '<span class="badge bg-secondary">' + phase + '</span>';
}


function getWinnerPlayersFromMatch(match) {
    if (!match || !match.team_winner || !match.players) {
        return [];
    }
    return match.team_winner === 'A' ? match.players.teamA : match.players.teamB;
}

function formatMatchesForBracket(matches, t) {
    if (!matches || matches.length === 0) {
        return {};
    }

    var getRoundLevel = function(phase) {
        if (phase === 'F') return 0; // Final
        if (phase === 'A' || phase === 'B') return 0; // Semifinales
        var parts = phase.split('-');
        if (parts.length === 2) return 1; // Cuartos
        if (parts.length === 3) return 2; // Octavos
        if (parts.length === 4) return 3; // Dieciseisavos
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
    var mixedRounds = createPhaseArray(phaseA.concat(phaseB));  


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
        mixedRounds: mixedRounds
    };
}


module.exports = {
    presentTournament:  function (tournament, matches, registeredPlayers, courts, t) {
        // If t is not provided, use a dummy function that returns the key
        t = t || function(key) { return key; };

        var courtMap = new Map(courts.map(function(c) { return [c.id, c.name]; }));

        matches.forEach(function(match) {
            if (match.court_id) {
                match.courtName = courtMap.get(match.court_id) || 'Pista no encontrada';
            }
            if (match.start_timestamp) {
                match.startTime = new Date(match.start_timestamp).toLocaleString('default', {
                                                        month: 'short' , day: 'numeric' , hour: '2-digit' ,
                                                        minute: '2-digit' })
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
            viewModel.bracketData = formatMatchesForBracket(matches, t);
            
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
    }
};
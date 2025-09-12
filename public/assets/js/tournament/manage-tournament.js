document.addEventListener('DOMContentLoaded', function () {

    // --- Modal de Puntuación ---
    var scoreModal = document.getElementById('scoreModal');
    if (scoreModal) {
        scoreModal.addEventListener('show.bs.modal', function (event) {
            var button = event.relatedTarget;
            var matchId = button.getAttribute('data-match-id');
            var matchIdx = button.getAttribute('data-match-idx');
            document.getElementById('modalMatchId').value = matchId;
            if (matchIdx) {
                document.getElementById('modalMatchNumber').textContent = matchIdx;
            }
            // Limpiar inputs
            ['set1_teamA', 'set1_teamB', 'set2_teamA', 'set2_teamB', 'set3_teamA', 'set3_teamB'].forEach(function (id) {
                const input = document.getElementById(id);
                if (input) {
                    input.value = '';
                }
            });
        });
    }

    const scoreForm = document.getElementById('scoreForm');
    if (scoreForm) {
        scoreForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(scoreForm);
            const match_id = formData.get('match_id');

            const scoreData = {
                score_teamA_set1: formData.get('set1_teamA') || null,
                score_teamB_set1: formData.get('set1_teamB') || null,
                score_teamA_set2: formData.get('set2_teamA') || null,
                score_teamB_set2: formData.get('set2_teamB') || null,
                score_teamA_set3: formData.get('set3_teamA') || null,
                score_teamB_set3: formData.get('set3_teamB') || null,
            };

            try {
                const response = await fetch('/club/matches/register_score', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        match_id,
                        scoreData
                    }),
                });

                if (response.ok) {
                    const modal = bootstrap.Modal.getInstance(scoreModal);
                    modal.hide();
                    location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.message || 'No se pudo guardar el resultado.'}`);
                }
            } catch (error) {
                console.error('Error al enviar el formulario:', error);
                alert('Ocurrió un error de red. Por favor, inténtalo de nuevo.');
            }
        });
    }

    // --- Modal de Mensaje ---
    var mensajeModal = document.getElementById('mensajeModal');
    if (mensajeModal) {
        var modal = new bootstrap.Modal(mensajeModal);
        modal.show();
    }

    // --- Grupo de dos jugadores ---
    const groupModal = document.getElementById('groupModal');
    if (groupModal) {
        const groupPlayerSearch = document.getElementById('groupPlayerSearch');
        const groupPlayerList = document.getElementById('groupPlayerList');
        const selectedPlayers = document.getElementById('selectedPlayers');
        const saveGroupBtn = document.getElementById('saveGroupBtn');
        const tournamentId = groupModal.dataset.tournamentId;
        let groupSelected = [];

        async function loadGroupPlayers(query = '') {
            let url = `/club/tournaments/${tournamentId}/search_players?limit=20`;
            if (query) url += `&q=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            const players = await res.json();
            groupPlayerList.innerHTML = '';
            if (players.length === 0) {
                groupPlayerList.innerHTML = '<div class="list-group-item text-muted">No hay jugadores disponibles.</div>';
                return;
            }
            players.forEach(player => {
                if (groupSelected.find(p => p.id === player.id)) return;
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = player.name;
                item.onclick = function () {
                    if (groupSelected.length < 2) {
                        groupSelected.push(player);
                        renderSelectedPlayers();
                        loadGroupPlayers(groupPlayerSearch.value);
                    }
                };
                groupPlayerList.appendChild(item);
            });
        }

        function renderSelectedPlayers() {
            selectedPlayers.innerHTML = '';
            groupSelected.forEach((player, idx) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.textContent = player.name;
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-sm btn-danger';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.onclick = function () {
                    groupSelected.splice(idx, 1);
                    renderSelectedPlayers();
                    loadGroupPlayers(groupPlayerSearch.value);
                };
                li.appendChild(removeBtn);
                selectedPlayers.appendChild(li);
            });
            saveGroupBtn.disabled = groupSelected.length !== 2;
        }

        if (groupPlayerSearch) {
            groupPlayerSearch.addEventListener('input', function () {
                loadGroupPlayers(groupPlayerSearch.value);
            });
        }

        groupModal.addEventListener('show.bs.modal', function () {
            groupPlayerSearch.value = '';
            groupSelected = [];
            renderSelectedPlayers();
            loadGroupPlayers();
        });

        const groupForm = document.getElementById('groupForm');
        groupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (groupSelected.length !== 2) return;
            const playerIds = groupSelected.map(p => p.id);
            const res = await fetch(`/club/tournaments/${tournamentId}/add_group`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerIds })
            });
            if (res.ok) {
                var modal = bootstrap.Modal.getInstance(groupModal);
                modal.hide();
                location.reload();
            } else {
                alert('Error al crear el grupo.');
            }
        });
    }

    // --- Búsqueda de Jugadores (General) ---
    const playerSearch = document.getElementById('playerSearch');
    if (playerSearch) {
        const playerList = document.getElementById('playerList');
        const tournamentId = playerSearch.dataset.tournamentId;

        async function loadPlayers(query = '') {
            let url = `/club/tournaments/${tournamentId}/search_players?limit=20`;
            if (query) url += `&q=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            const players = await res.json();
            playerList.innerHTML = '';
            if (players.length === 0) {
                playerList.innerHTML = '<div class="list-group-item text-muted">No hay jugadores disponibles.</div>';
                return;
            }
            players.forEach(player => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.textContent = player.name;
                item.onclick = function () {
                    addPlayerToTournament(player.id);
                };
                playerList.appendChild(item);
            });
        }

        async function addPlayerToTournament(playerId) {
            const res = await fetch(`/club/tournaments/${tournamentId}/add_player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId })
            });
            if (res.ok) {
                loadPlayers(playerSearch.value);
                location.reload();
            } else {
                alert('Error al añadir el jugador.');
            }
        }

        playerSearch.addEventListener('input', function () {
            loadPlayers(playerSearch.value);
        });

        loadPlayers();
    }

    // --- Búsqueda en Lista de Inscritos ---
    const searchRegistered = document.getElementById('searchRegistered');
    if (searchRegistered) {
        searchRegistered.addEventListener('keyup', function () {
            const filter = searchRegistered.value.toLowerCase();
            const listItems = document.querySelectorAll('#ungroupedPlayersList .list-group-item');
            listItems.forEach(item => {
                const text = item.textContent || item.innerText;
                if (text.toLowerCase().indexOf(filter) > -1) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});
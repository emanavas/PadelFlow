document.addEventListener('DOMContentLoaded', () => {
        const playersList = document.getElementById('playersList');
        const noPlayersMessage = document.getElementById('noPlayersMessage');

        // Create Player
        const createPlayerForm = document.getElementById('createPlayerForm');
        createPlayerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(createPlayerForm);
          const name = formData.get('name');
          const email = formData.get('email');
          const password = formData.get('password');

          try {
            const response = await fetch('/club/players/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name, email, password }),
            });

            if (response.ok) {
              location.reload();
            } else {
              const errorData = await response.json();
              alert(`Error al crear jugador: ${errorData.message}`);
            }
          } catch (error) {
            console.error('Error:', error);
            alert('Error de red al crear jugador.');
          }
        });

        // Edit Player - Populate Modal
        const editPlayerModal = document.getElementById('editPlayerModal');
        editPlayerModal.addEventListener('show.bs.modal', (event) => {
          const button = event.relatedTarget;
          const playerId = button.getAttribute('data-player-id');
          const playerName = button.getAttribute('data-player-name');
          const playerEmail = button.getAttribute('data-player-email');

          document.getElementById('editPlayerId').value = playerId;
          document.getElementById('editPlayerName').value = playerName;
          document.getElementById('editPlayerEmail').value = playerEmail;
        });

        // Edit Player - Submit Form
        const editPlayerForm = document.getElementById('editPlayerForm');
        editPlayerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(editPlayerForm);
          const playerId = formData.get('id');
          const name = formData.get('name');
          // Email is readonly, not sent for update in this form

          try {
            const response = await fetch(`/club/players/edit/${playerId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name }),
            });

            if (response.ok) {
              location.reload();
            } else {
              const errorData = await response.json();
              alert(`Error al actualizar jugador: ${errorData.message}`);
            }
          } catch (error) {
            console.error('Error:', error);
            alert('Error de red al actualizar jugador.');
          }
        });

        // Delete Player - Populate Modal
        const deletePlayerModal = document.getElementById('deletePlayerModal');
        deletePlayerModal.addEventListener('show.bs.modal', (event) => {
          const button = event.relatedTarget;
          const playerId = button.getAttribute('data-player-id');
          const playerName = button.getAttribute('data-player-name');

          document.getElementById('deletePlayerName').textContent = playerName;
          const deleteForm = document.getElementById('deletePlayerForm');
          deleteForm.action = `/club/players/delete/${playerId}`;
        });

        // Delete Player - Submit Form
        const deletePlayerForm = document.getElementById('deletePlayerForm');
        deletePlayerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const playerId = form.action.split('/').pop();

            try {
              const response = await fetch(`/club/players/delete/${playerId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                location.reload();
              } else {
                const errorData = await response.json();
                alert(`Error al eliminar jugador: ${errorData.message}`);
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error de red al eliminar jugador.');
            }
        });
      });
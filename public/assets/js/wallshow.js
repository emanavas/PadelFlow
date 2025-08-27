// Wallshow público (simulación de actualizaciones en tiempo real)
    const SAMPLE_MATCHES = [
      { id: 'm1', court: 'Pista 1', players: 'A & B vs C & D', score: '6-4 3-2', status: 'En juego' },
      { id: 'm2', court: 'Pista 2', players: 'E & F vs G & H', score: '2-6 1-0', status: 'En juego' },
      { id: 'm3', court: 'Pista 3', players: 'I & J vs K & L', score: 'Pendiente', status: 'Pendiente' }
    ];

    function randScore() {
      return Math.floor(Math.random() * 7) + '-' + Math.floor(Math.random() * 7);
    }

    function renderGrid(data) {
      const grid = document.getElementById('liveGrid');
      grid.innerHTML = '';
      data.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        col.innerHTML = `
          <div class="p-3 wall-card rounded">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="mb-1">${item.court}</h5>
              <span class="badge bg-success">${item.status}</span>
            </div>
            <p class="text-muted mb-1">${item.players}</p>
            <h3 class="mb-0">${item.score}</h3>
          </div>
        `;
        grid.appendChild(col);
      });
    }

    function simulateUpdates() {
      // Cada 3s actualizar aleatoriamente un partido
      setInterval(() => {
        const idx = Math.floor(Math.random() * SAMPLE_MATCHES.length);
        const match = SAMPLE_MATCHES[idx];
        if (Math.random() > 0.3) {
          match.score = randScore() + ' ' + randScore();
          match.status = 'En juego';
        } else {
          match.status = 'Finalizado';
          match.score = randScore() + ' ' + randScore();
        }
        renderGrid(SAMPLE_MATCHES);
      }, 3000);
    }

    document.addEventListener('DOMContentLoaded', () => {
      renderGrid(SAMPLE_MATCHES);
      simulateUpdates();
    });

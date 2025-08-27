// Módulo para admin.html: gestión local simulada (localStorage)
    const STORAGE_KEY = 'pm_admin_events_v1';

    function uid() {
      return 'evt_' + Math.random().toString(36).slice(2, 9);
    }

    function loadEvents() {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }

    function saveEvents(list) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function renderEvents() {
      const container = document.getElementById('eventsList');
      container.innerHTML = '';
      const events = loadEvents();
      if (events.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">No hay eventos. Crea uno nuevo.</div></div>';
        return;
      }
      events.forEach(ev => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title mb-0">${ev.name}</h5>
                <small class="text-muted">${ev.typeLabel}</small>
              </div>
              <p class="card-text text-muted mt-2">${ev.desc || ''}</p>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <small class="text-muted">Plazas: ${ev.slots}</small>
                <div>
                  <button class="btn btn-sm btn-outline-primary me-2" data-action="edit" data-id="${ev.id}"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-sm btn-danger" data-action="delete" data-id="${ev.id}"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        `;
        container.appendChild(col);
      });
    }

    function addActivity(msg) {
      const log = document.getElementById('activityLog');
      if (!log) return;
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      log.prepend(li);
    }

    function typeLabelFromValue(v) {
      const map = {
        'round-robin': 'Round Robin',
        'elimination': 'Eliminación',
        'liga': 'Liga',
        'americana-clasica': 'Americana Clásica',
        'americana-rotacion': 'Americana Rotación',
        'americana-canaria': 'Americana Canaria'
      };
      return map[v] || v;
    }

    document.addEventListener('DOMContentLoaded', () => {
      const eventForm = document.getElementById('eventForm');
      const eventModalEl = document.getElementById('eventModal');
      const eventModal = new bootstrap.Modal(eventModalEl);
      const openWallshowBtn = document.getElementById('openWallshowBtn');

      // Inicializar render
      renderEvents();

      // Crear evento
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!eventForm.checkValidity()) {
          eventForm.classList.add('was-validated');
          return;
        }
        const events = loadEvents();
        const id = uid();
        const ev = {
          id,
          name: document.getElementById('eventName').value,
          type: document.getElementById('eventType').value,
          typeLabel: typeLabelFromValue(document.getElementById('eventType').value),
          start: document.getElementById('eventStart').value,
          slots: parseInt(document.getElementById('eventSlots').value, 10) || 16,
          desc: document.getElementById('eventDesc').value
        };
        events.unshift(ev);
        saveEvents(events);
        renderEvents();
        addActivity(`Evento creado: ${ev.name}`);
        eventForm.reset();
        eventForm.classList.remove('was-validated');
        eventModal.hide();
      });

      // Delegación de botones en lista de eventos
      document.getElementById('eventsList').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'delete') {
          const events = loadEvents();
          const idx = events.findIndex(x => x.id === id);
          if (idx > -1) {
            const removed = events.splice(idx, 1)[0];
            saveEvents(events);
            renderEvents();
            addActivity(`Evento eliminado: ${removed.name}`);
          }
        } else if (action === 'edit') {
          const events = loadEvents();
          const ev = events.find(x => x.id === id);
          if (!ev) return;
          // Cargar datos en modal para editar (simple implementación: editar como nuevo)
          document.getElementById('eventName').value = ev.name;
          document.getElementById('eventType').value = ev.type;
          document.getElementById('eventStart').value = ev.start;
          document.getElementById('eventSlots').value = ev.slots;
          document.getElementById('eventDesc').value = ev.desc;
          // Al guardar, creará uno nuevo (para edición completa se puede implementar actualizar)
          eventModal.show();
        }
      });

      // Abrir wallshow
      openWallshowBtn.addEventListener('click', () => {
        window.open('wallshow.html', '_blank');
      });

      // Seeding demo events si no hay ninguno
      if (loadEvents().length === 0) {
        const seed = [
          { id: uid(), name: 'Torneo Verano 2025', type: 'round-robin', typeLabel: 'Round Robin', start: '', slots: 10, desc: 'Categoría mixta' },
          { id: uid(), name: 'Liga Mensual Club', type: 'liga', typeLabel: 'Liga', start: '', slots: 24, desc: 'Divisiones por nivel' }
        ];
        saveEvents(seed);
        renderEvents();
        addActivity('Eventos semilla añadidos');
      }
    });

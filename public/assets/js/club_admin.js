// Módulo para club_admin.js: Interacciones del dashboard del club

document.addEventListener('DOMContentLoaded', () => {
    const quickEventForm = document.getElementById('quickEventForm');
    const modalQuickEventEl = document.getElementById('modalQuickEvent');
    const modalQuickEvent = new bootstrap.Modal(modalQuickEventEl);

    // Handle quick event form submission
    if (quickEventForm) {
        quickEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!quickEventForm.checkValidity()) {
                quickEventForm.classList.add('was-validated');
                return;
            }

            const formData = {
                name: document.getElementById('qName').value,
                type: document.getElementById('qType').value,
                start: document.getElementById('qStart').value,
                slots: parseInt(document.getElementById('qSlots').value, 10) || 16,
                status: document.getElementById('qStatus').value,
                description: document.getElementById('qDesc').value
            };

            try {
                const response = await fetch('/club/tournaments/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Torneo creado exitosamente!');
                    modalQuickEvent.hide();
                    quickEventForm.reset();
                    quickEventForm.classList.remove('was-validated');
                    // Optionally, refresh dashboard data or redirect
                    window.location.reload(); 
                } else {
                    const errorData = await response.json();
                    alert(`Error al crear torneo: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Error submitting quick event form:', error);
                alert('Error de red o del servidor al crear torneo.');
            }
        });
    }

    // Sidebar toggle logic (from original dashboard.js)
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const adminShell = document.querySelector('.admin-shell');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const hideSidebarBtn = document.getElementById('hideSidebarBtn');

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            adminShell.classList.toggle('sidebar-toggled');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            adminShell.classList.remove('sidebar-toggled');
        });
    }

    if (hideSidebarBtn) {
        hideSidebarBtn.addEventListener('click', () => {
            adminShell.classList.remove('sidebar-toggled');
        });
    }

    // Placeholder for chart rendering (will need actual data from backend)
    const registrationsCtx = document.getElementById('registrationsChart');
    if (registrationsCtx) {
        new Chart(registrationsCtx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], // Example labels
                datasets: [{
                    label: 'Inscripciones',
                    data: [10, 15, 8, 20, 12, 25], // Example data
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    const viewsRequestsCtx = document.getElementById('viewsRequestsChart');
    if (viewsRequestsCtx) {
        new Chart(viewsRequestsCtx, {
            type: 'line',
            data: {
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], // Example labels
                datasets: [{
                    label: 'Visualizaciones Wallshow',
                    data: [50, 75, 60, 90], // Example data
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
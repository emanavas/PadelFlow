document.addEventListener('DOMContentLoaded', function () {
    // Viewers Chart
    const viewersChartCanvas = document.getElementById('viewersChart');
    if (viewersChartCanvas) {
        try {
            const viewersData = JSON.parse(viewersChartCanvas.dataset.viewers);
            new Chart(viewersChartCanvas, {
                type: 'line',
                data: {
                    labels: viewersData.labels,
                    datasets: [{
                        label: 'Espectadores',
                        data: viewersData.data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error parsing chart data:', e);
            viewersChartCanvas.parentElement.innerHTML = '<p class="text-danger text-center">Error al cargar los datos de la gráfica.</p>';
        }
    }

    // Registrations Chart
    const registrationsChartCanvas = document.getElementById('registrationsChart');
    if (registrationsChartCanvas) {
        try {
            // FAKE DATA FOR NOW
            const registrationsData = {
                labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
                data: [12, 19, 3, 5, 2, 3]
            };
            new Chart(registrationsChartCanvas, {
                type: 'bar',
                data: {
                    labels: registrationsData.labels,
                    datasets: [{
                        label: 'Inscripciones',
                        data: registrationsData.data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error parsing chart data:', e);
            registrationsChartCanvas.parentElement.innerHTML = '<p class="text-danger text-center">Error al cargar los datos de la gráfica.</p>';
        }
    }

    // Views/Requests Chart
    const viewsRequestsChartCanvas = document.getElementById('viewsRequestsChart');
    if (viewsRequestsChartCanvas) {
        try {
            // FAKE DATA FOR NOW
            const viewsRequestsData = {
                labels: ['Torneo A', 'Torneo B', 'Torneo C', 'Torneo D', 'Torneo E'],
                views: [150, 250, 180, 300, 220],
                requests: [500, 600, 550, 700, 650]
            };
            new Chart(viewsRequestsChartCanvas, {
                type: 'line',
                data: {
                    labels: viewsRequestsData.labels,
                    datasets: [{
                        label: 'Visualizaciones',
                        data: viewsRequestsData.views,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Solicitudes',
                        data: viewsRequestsData.requests,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error parsing chart data:', e);
            viewsRequestsChartCanvas.parentElement.innerHTML = '<p class="text-danger text-center">Error al cargar los datos de la gráfica.</p>';
        }
    }
});

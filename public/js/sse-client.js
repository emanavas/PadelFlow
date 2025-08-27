document.addEventListener('DOMContentLoaded', () => {
    const tournamentId = '1'; // Replace with actual tournament ID from your page context
    const eventSource = new EventSource(`/api/events/${tournamentId}`);

    eventSource.onopen = () => {
        console.log('SSE connection opened.');
    };

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received SSE message:', data);

        if (data.type === 'scoreUpdate') {
            // Example: Update a score display on the page
            const scoreElement = document.getElementById(`score-${data.matchId}`);
            if (scoreElement) {
                scoreElement.textContent = data.newScore;
                console.log(`Updated score for match ${data.matchId} to ${data.newScore}`);
            }
        } else if (data.type === 'scoreSuggestion') {
            // Example: Handle score suggestion (e.g., display in admin panel)
            console.log(`Score suggestion for match ${data.matchId}: ${data.suggestedScore}`);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
    };

    // Example of sending a score suggestion (for public/live_dashboard.ejs)
    // This would typically be triggered by a user action (e.g., button click)
    window.sendScoreSuggestion = (matchId, suggestedScore) => {
        fetch(`/api/tournaments/${tournamentId}/suggest-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ matchId, suggestedScore }),
        })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error sending score suggestion:', error));
    };

    // Example of sending a score update (for admin/manage_tournament.ejs)
    // This would typically be triggered by an admin action
    window.sendScoreUpdate = (matchId, newScore) => {
        fetch(`/api/tournaments/${tournamentId}/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ matchId, newScore }),
        })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error sending score update:', error));
    };
});

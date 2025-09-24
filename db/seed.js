const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const clubModel = require('../models/clubModel');
const tournamentModel = require('../models/tournamentModel');
const courtModel = require('../models/courtModel');
const matchModel = require('../models/matchModel');

async function seedDatabase() {
    try {
        console.log('Seeding database with initial development data...');

        // 1. Crear Club de Demostración
        console.log('Creating demo club...');
        const clubResult = await clubModel.createClub('PadelFlow Demo Club', '123 Demo Street', 'Demo City', 'club@demo.com', '123456789');
        const clubId = clubResult.lastID;
        console.log(`Demo club created with ID: ${clubId}`);

        // 2. Crear Usuario Administrador del Club
        console.log('create platform admin user...')
        const platformAdminPassword = await bcrypt.hash('adminpassword', 10);
        await userModel.createUser('Platform Admin', 'admin@padelflow.com', platformAdminPassword, 'platform_admin');
        console.log('Platform admin user created: admin@padelflow.com / adminpassword');

        console.log('Creating club admin user...');
        const adminPassword = await bcrypt.hash('adminpassword', 10);
        await userModel.createUser('Admin Club', 'user1@padelflow.com', adminPassword, 'club_admin', clubId);
        console.log('Club admin user created: user1@padelflow.com / adminpassword');

        // 3. Crear 64 Jugadores
        console.log('Creating 64 players...');
        const playerPromises = [];
        const playerPassword = await bcrypt.hash('password123', 10);
        for (let i = 1; i <= 64; i++) {
            const playerName = `Jugador ${i}`;
            const playerEmail = `jugador${i}@example.com`;
            playerPromises.push(userModel.createUser(playerName, playerEmail, playerPassword, 'player', null));
        }
        await Promise.all(playerPromises);
        console.log('64 players created successfully.');

        // 4. create 5 courts to club
        console.log('Creating 3 demo courts...');
        for (let i = 1; i <= 3; i++) {
            await courtModel.createCourt(clubId,`Demo Court ${i}` );
        }
        console.log('5 demo courts created successfully.');

        // 5. create tournament
        console.log('Creating demo tournament...');
        const tournamentData = {
            club_id: clubId,
            name: 'Demo Tournament',
            description: 'This is a demo tournament',
            type: 'Elimination',
            start_date: '2023-10-01T10:00',
            end_date: '2023-10-01T12:00',
            max_players: 64,
            settings: { 
                "match_duration": 90,
            }
        };
        const tournamentResult = await tournamentModel.createTournament(tournamentData);
        const tournamentId = tournamentResult.id;
        console.log('Demo tournament created successfully.');

        // 6. Create and assign players to matches for the tournament
        console.log('Creating matches and assigning players...');
        const players = await userModel.getUsersNotInTournament(tournamentId);
        const courts = await courtModel.getCourtsByClub(clubId);


        // 7. include all players in tournament
        console.log('Including all players in the tournament...');
        for (const player of players) {
            await tournamentModel.addPlayerToTournament(tournamentId, player.id);
        }

        // 8. assign courts to tournament
        console.log('Assigning courts to the tournament...');
        // get list of courts from the club into array
        const courtIds = courts.map(court => court.id);
        await tournamentModel.associateCourtsWithTournament(tournamentId, courtIds);


        console.log('Database seeding completed successfully!');

    } catch (err) {
        console.error('Error seeding the database:', err);
        throw err; // Lanzar el error para que el proceso de arranque principal falle si el sembrado falla.
    }
}

module.exports = { seedDatabase };

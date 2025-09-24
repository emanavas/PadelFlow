const userModel = require('../models/userModel');
const { initDatabase } = require('../db/database');

describe('userModel', () => {
    beforeAll(async () => {
        await initDatabase(); // Ensure the database is initialized
    });

    test('should create and find a user by email', async () => {
        const email = 'test@example.com';
        const password = 'password123';
        const name = 'Test User';
        const role = 'player';

        await userModel.createUser(name, email, password, role, null);
        const user = await userModel.findUserByEmail(email);

        expect(user).toBeDefined();
        expect(user.email).toBe(email);
        expect(user.name).toBe(name);
        expect(user.role).toBe(role);
    });

    // Add more tests for other userModel functions here
});

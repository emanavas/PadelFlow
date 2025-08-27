-- Clubs table
CREATE TABLE IF NOT EXISTS Clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    email TEXT,
    phone TEXT,
    is_freemium INTEGER DEFAULT 1
);

-- Courts table (linked to Clubs)
CREATE TABLE IF NOT EXISTS Courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'available',
    FOREIGN KEY (club_id) REFERENCES Clubs(id)
);

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT,
    club_id INTEGER,
    FOREIGN KEY (club_id) REFERENCES Clubs(id)
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS Tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    start_date TEXT,
    end_date TEXT,
    club_id INTEGER,
    FOREIGN KEY (club_id) REFERENCES Clubs(id)
);

-- Players table
CREATE TABLE IF NOT EXISTS Players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tournament_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Matches table (linked to Players, Tournaments, and Courts)
CREATE TABLE IF NOT EXISTS Matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER,
    player2_id INTEGER,
    player3_id INTEGER,
    player4_id INTEGER,
    score TEXT,
    tournament_id INTEGER,
    court_id INTEGER,
    scheduled_time TEXT,
    FOREIGN KEY (player1_id) REFERENCES Players(id),
    FOREIGN KEY (player2_id) REFERENCES Players(id),
    FOREIGN KEY (player3_id) REFERENCES Players(id),
    FOREIGN KEY (player4_id) REFERENCES Players(id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id),
    FOREIGN KEY (court_id) REFERENCES Courts(id)
);
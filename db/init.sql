-- Tabla para la gestión de clubes y su información de contacto.
CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    is_freemium INTEGER default 1 NOT NULL -- 1 para freemium, 0 para premium 
);

-- Tabla para todos los usuarios del sistema, ya sean administradores o jugadores.
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- Por ejemplo: 'admin_platform', 'admin_club', 'manager_club'
    club_id INTEGER,
    FOREIGN KEY(club_id) REFERENCES clubs(id)
);

-- Tabla para las pistas de pádel gestionadas por cada club.
CREATE TABLE IF NOT EXISTS courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL, -- Estado de la pista: 'free', 'busy'
    is_active BOOLEAN DEFAULT TRUE,
    is_covered BOOLEAN DEFAULT FALSE,
    club_id INTEGER NOT NULL,
    FOREIGN KEY(club_id) REFERENCES clubs(id)
);

-- Tabla para los torneos organizados por los clubes.
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- Tipo de torneo: 'elimination', 'round_robin', etc.
    status TEXT DEFAULT 'pending',
    start_date TIMESTAMP,
    setting TEXT DEFAULT '{"match_duration": 90}',
    end_date TIMESTAMP,
    club_id INTEGER NOT NULL,
    FOREIGN KEY(club_id) REFERENCES clubs(id)
);

-- Tabla para los partidos que se juegan dentro de un torneo.
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase TEXT,
    score_teamA_set1 INTEGER,
    score_teamA_set2 INTEGER,
    score_teamA_set3 INTEGER,
    score_teamB_set1 INTEGER,
    score_teamB_set2 INTEGER,
    score_teamB_set3 INTEGER,
    team_winner TEXT, -- Referencia al equipo ganador (ej. 'A' or 'B')
    start_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP,
    tournament_id INTEGER NOT NULL,
    court_id INTEGER NOT NULL,
    FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY(court_id) REFERENCES courts(id) ON DELETE CASCADE
);

-- Tabla para los jugadores que pueden participar en los partidos.
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    ranking INTEGER DEFAULT 1000 -- permite establecer un ranking inicial
);

-- Tabla intermedia (many-to-many) para relacionar jugadores con partidos.
-- Esto permite que múltiples jugadores participen en múltiples partidos.
CREATE TABLE IF NOT EXISTS match_players (
    player_id INTEGER NOT NULL,
    match_id INTEGER NOT NULL,
    team TEXT NOT NULL, -- Equipo del jugador en el partido (ej. 'A', 'B')
    winner_from TEXT, 
    PRIMARY KEY (player_id, match_id),
    FOREIGN KEY (winner_from) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Tabla intermedia para registrar jugadores en un torneo (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS tournament_players (
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    players_team_id INTEGER, -- combinacion de ambos id del jugador si tienen vinculo 
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Tabla intermedia (many-to-many) para relacionar torneos con pistas.
CREATE TABLE IF NOT EXISTS tournament_courts (
    tournament_id INTEGER NOT NULL,
    court_id INTEGER NOT NULL,
    PRIMARY KEY (tournament_id, court_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
);
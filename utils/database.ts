import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync('flight_cache.db');
    
    // Tạo bảng flights
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS flights (
        _id TEXT PRIMARY KEY,
        flightNumber TEXT NOT NULL,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        departure TEXT NOT NULL,
        arrival TEXT NOT NULL,
        price REAL NOT NULL,
        stops INTEGER DEFAULT 0,
        airline TEXT NOT NULL,
        availableCabins TEXT,
        seatsAvailable TEXT,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // Tạo bảng bookings
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookings (
        _id TEXT PRIMARY KEY,
        bookingCode TEXT,
        userId TEXT NOT NULL,
        flightIds TEXT NOT NULL,
        tripType TEXT NOT NULL,
        travellerCounts TEXT NOT NULL,
        travellers TEXT,
        contactDetails TEXT,
        status TEXT NOT NULL,
        payment TEXT,
        cabinClass TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // Tạo bảng users
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        _id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        dob TEXT,
        gender TEXT,
        points INTEGER,
        membershipTier TEXT,
        role TEXT,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // Tạo bảng search_results (cache kết quả tìm kiếm)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS search_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_key TEXT UNIQUE NOT NULL,
        flights TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // Tạo bảng airports
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS airports (
        _id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // Tạo bảng notifications
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notifications (
        _id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT,
        read BOOLEAN DEFAULT 0,
        createdAt TEXT,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // Tạo index để tăng tốc độ truy vấn
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_flights_expires ON flights(expires_at);
      CREATE INDEX IF NOT EXISTS idx_bookings_expires ON bookings(expires_at);
      CREATE INDEX IF NOT EXISTS idx_users_expires ON users(expires_at);
      CREATE INDEX IF NOT EXISTS idx_search_results_expires ON search_results(expires_at);
      CREATE INDEX IF NOT EXISTS idx_search_results_key ON search_results(search_key);
      CREATE INDEX IF NOT EXISTS idx_airports_expires ON airports(expires_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
    `);

    return db;
  } catch (error) {
    throw error;
  }
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initDatabase();
  }
  return db;
};

export const clearExpiredCache = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    const now = Date.now();
    
    await database.execAsync(`
      DELETE FROM flights WHERE expires_at < ${now};
      DELETE FROM bookings WHERE expires_at < ${now};
      DELETE FROM users WHERE expires_at < ${now};
      DELETE FROM search_results WHERE expires_at < ${now};
      DELETE FROM airports WHERE expires_at < ${now};
      DELETE FROM notifications WHERE expires_at < ${now};
    `);
  } catch (error) {
    // Error clearing expired cache
  }
};

export const clearAllCache = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    
    await database.execAsync(`
      DELETE FROM flights;
      DELETE FROM bookings;
      DELETE FROM users;
      DELETE FROM search_results;
      DELETE FROM airports;
      DELETE FROM notifications;
    `);
  } catch (error) {
    // Error clearing all cache
  }
};


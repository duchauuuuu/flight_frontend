import { getDatabase, clearExpiredCache } from './database';
import { Flight } from '../types/flight';
import { Booking } from '../types/booking';
import { User } from '../types/user';

// Cache TTL (Time To Live) - 5 phút
const CACHE_TTL = 5 * 60 * 1000;

// Tạo search key từ các tham số tìm kiếm
export const createSearchKey = (params: {
  from?: string;
  to?: string;
  date?: string;
  cabinClass?: string;
  passengers?: number;
}): string => {
  return JSON.stringify({
    from: params.from || '',
    to: params.to || '',
    date: params.date || '',
    cabinClass: params.cabinClass || '',
    passengers: params.passengers || 0,
  });
};

// ============ FLIGHTS CACHE ============

export const cacheFlights = async (flights: Flight[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL;

    // Xóa cache cũ trước
    await db.execAsync(`DELETE FROM flights;`);

    // Insert từng flight
    for (const flight of flights) {
      if (!flight._id) continue;

      await db.runAsync(
        `INSERT OR REPLACE INTO flights (
          _id, flightNumber, from_location, to_location, 
          departure, arrival, price, stops, airline, 
          availableCabins, seatsAvailable, cached_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          flight._id,
          flight.flightNumber,
          flight.from,
          flight.to,
          typeof flight.departure === 'string' ? flight.departure : flight.departure.toISOString(),
          typeof flight.arrival === 'string' ? flight.arrival : flight.arrival.toISOString(),
          flight.price,
          flight.stops || 0,
          flight.airline,
          JSON.stringify(flight.availableCabins || []),
          JSON.stringify(flight.seatsAvailable || {}),
          now,
          expiresAt,
        ]
      );
    }
  } catch (error) {
    // Error caching flights
  }
};

export const getCachedFlights = async (): Promise<Flight[] | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    // Xóa cache hết hạn trước
    await clearExpiredCache();

    const result = await db.getAllAsync<{
      _id: string;
      flightNumber: string;
      from_location: string;
      to_location: string;
      departure: string;
      arrival: string;
      price: number;
      stops: number;
      airline: string;
      availableCabins: string;
      seatsAvailable: string;
      expires_at: number;
    }>(`SELECT * FROM flights WHERE expires_at > ${now}`);

    if (result.length === 0) {
      return null;
    }

    const flights: Flight[] = result.map((row) => ({
      _id: row._id,
      flightNumber: row.flightNumber,
      from: row.from_location,
      to: row.to_location,
      departure: row.departure,
      arrival: row.arrival,
      price: row.price,
      stops: row.stops,
      airline: row.airline,
      availableCabins: JSON.parse(row.availableCabins || '[]'),
      seatsAvailable: JSON.parse(row.seatsAvailable || '{}'),
    } as any));

    return flights;
  } catch (error) {
    return null;
  }
};

export const getCachedFlight = async (flightId: string): Promise<Flight | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    const result = await db.getFirstAsync<{
      _id: string;
      flightNumber: string;
      from_location: string;
      to_location: string;
      departure: string;
      arrival: string;
      price: number;
      stops: number;
      airline: string;
      availableCabins: string;
      seatsAvailable: string;
    }>(`SELECT * FROM flights WHERE _id = ? AND expires_at > ?`, [flightId, now]);

    if (!result) {
      return null;
    }

    return {
      _id: result._id,
      flightNumber: result.flightNumber,
      from: result.from_location,
      to: result.to_location,
      departure: result.departure,
      arrival: result.arrival,
      price: result.price,
      stops: result.stops,
      airline: result.airline,
      availableCabins: JSON.parse(result.availableCabins || '[]'),
      seatsAvailable: JSON.parse(result.seatsAvailable || '{}'),
    };
  } catch (error) {
    return null;
  }
};

// ============ BOOKINGS CACHE ============

export const cacheBookings = async (bookings: Booking[], userId?: string): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL;

    // Nếu có userId, chỉ xóa cache của user đó
    if (userId) {
      await db.execAsync(`DELETE FROM bookings WHERE userId = '${userId}';`);
    } else {
      await db.execAsync(`DELETE FROM bookings;`);
    }

    // Insert từng booking
    for (const booking of bookings) {
      if (!booking._id) continue;

      await db.runAsync(
        `INSERT OR REPLACE INTO bookings (
          _id, bookingCode, userId, flightIds, tripType,
          travellerCounts, travellers, contactDetails, status,
          payment, cabinClass, cached_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking._id,
          booking.bookingCode || '',
          booking.userId,
          JSON.stringify(booking.flightIds || []),
          booking.tripType,
          JSON.stringify(booking.travellerCounts || {}),
          JSON.stringify(booking.travellers || []),
          JSON.stringify(booking.contactDetails || {}),
          booking.status,
          JSON.stringify(booking.payment || {}),
          booking.cabinClass || '',
          now,
          expiresAt,
        ]
      );
    }
  } catch (error) {
    // Error caching bookings
  }
};

export const getCachedBookings = async (userId?: string): Promise<Booking[] | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    await clearExpiredCache();

    let query = `SELECT * FROM bookings WHERE expires_at > ${now}`;
    const params: any[] = [];

    if (userId) {
      query += ` AND userId = ?`;
      params.push(userId);
    }

    const result = await db.getAllAsync<{
      _id: string;
      bookingCode: string;
      userId: string;
      flightIds: string;
      tripType: string;
      travellerCounts: string;
      travellers: string;
      contactDetails: string;
      status: string;
      payment: string;
      cabinClass: string;
    }>(query, params);

    if (result.length === 0) {
      return null;
    }

    const bookings: Booking[] = result.map((row) => ({
      _id: row._id,
      bookingCode: row.bookingCode || undefined,
      userId: row.userId,
      flightIds: JSON.parse(row.flightIds || '[]'),
      tripType: row.tripType,
      travellerCounts: JSON.parse(row.travellerCounts || '{}'),
      travellers: JSON.parse(row.travellers || '[]'),
      contactDetails: JSON.parse(row.contactDetails || '{}'),
      status: row.status,
      payment: JSON.parse(row.payment || '{}'),
      cabinClass: row.cabinClass,
    } as any));

    return bookings;
  } catch (error) {
    return null;
  }
};

// ============ USERS CACHE ============

export const cacheUsers = async (users: User[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL;

    await db.execAsync(`DELETE FROM users;`);

    for (const user of users) {
      if (!user._id) continue;

      await db.runAsync(
        `INSERT OR REPLACE INTO users (
          _id, name, email, phone, dob, gender,
          points, membershipTier, role, cached_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user._id,
          user.name,
          user.email,
          user.phone || '',
          user.dob || '',
          user.gender || '',
          user.points || 0,
          user.membershipTier || '',
          user.role || '',
          now,
          expiresAt,
        ]
      );
    }
  } catch (error) {
    // Error caching users
  }
};

export const getCachedUsers = async (): Promise<User[] | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    await clearExpiredCache();

    const result = await db.getAllAsync<{
      _id: string;
      name: string;
      email: string;
      phone: string;
      dob: string;
      gender: string;
      points: number;
      membershipTier: string;
      role: string;
    }>(`SELECT * FROM users WHERE expires_at > ${now}`);

    if (result.length === 0) {
      return null;
    }

    const users: User[] = result.map((row) => ({
      _id: row._id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      dob: row.dob || undefined,
      gender: row.gender || undefined,
      points: row.points || undefined,
      membershipTier: row.membershipTier || undefined,
      role: row.role || undefined,
    }));

    return users;
  } catch (error) {
    return null;
  }
};

// ============ SEARCH RESULTS CACHE ============

export const cacheSearchResults = async (searchKey: string, flights: Flight[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL;

    await db.runAsync(
      `INSERT OR REPLACE INTO search_results (search_key, flights, cached_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      [searchKey, JSON.stringify(flights), now, expiresAt]
    );
  } catch (error) {
    // Error caching search results
  }
};

export const getCachedSearchResults = async (searchKey: string): Promise<Flight[] | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    await clearExpiredCache();

    const result = await db.getFirstAsync<{
      flights: string;
    }>(`SELECT flights FROM search_results WHERE search_key = ? AND expires_at > ?`, [searchKey, now]);

    if (!result) {
      return null;
    }

    const flights: Flight[] = JSON.parse(result.flights);
    return flights;
  } catch (error) {
    return null;
  }
};

// ============ SINGLE USER CACHE ============

export const getCachedUser = async (userId: string): Promise<User | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    await clearExpiredCache();

    const result = await db.getFirstAsync<{
      _id: string;
      name: string;
      email: string;
      phone: string;
      dob: string;
      gender: string;
      points: number;
      membershipTier: string;
      role: string;
    }>(`SELECT * FROM users WHERE _id = ? AND expires_at > ?`, [userId, now]);

    if (!result) {
      return null;
    }

    return {
      _id: result._id,
      name: result.name,
      email: result.email,
      phone: result.phone || undefined,
      dob: result.dob || undefined,
      gender: result.gender || undefined,
      points: result.points || undefined,
      membershipTier: result.membershipTier || undefined,
      role: result.role || undefined,
    };
  } catch (error) {
    return null;
  }
};

// ============ AIRPORTS CACHE ============

export interface Airport {
  _id?: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

export const cacheAirports = async (airports: Airport[]): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL;

    // Xóa cache cũ
    await db.execAsync(`DELETE FROM airports;`);

    for (const airport of airports) {
      const id = airport._id || airport.code;
      await db.runAsync(
        `INSERT OR REPLACE INTO airports (_id, code, name, city, country, cached_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, airport.code, airport.name, airport.city, airport.country, now, expiresAt]
      );
    }
  } catch (error) {
    // Error caching airports
  }
};

export const getCachedAirports = async (): Promise<Airport[] | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    await clearExpiredCache();

    const result = await db.getAllAsync<{
      _id: string;
      code: string;
      name: string;
      city: string;
      country: string;
    }>(`SELECT * FROM airports WHERE expires_at > ${now}`);

    if (result.length === 0) {
      return null;
    }

    const airports: Airport[] = result.map((row) => ({
      _id: row._id,
      code: row.code,
      name: row.name,
      city: row.city,
      country: row.country,
    }));

    return airports;
  } catch (error) {
    return null;
  }
};

// ============ NOTIFICATIONS CACHE ============

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

export const cacheNotifications = async (notifications: Notification[], userId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL;

    // Xóa cache cũ của user
    await db.execAsync(`DELETE FROM notifications WHERE userId = '${userId}';`);

    for (const notif of notifications) {
      if (!notif._id) continue;

      await db.runAsync(
        `INSERT OR REPLACE INTO notifications (_id, userId, title, message, type, read, createdAt, cached_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notif._id,
          userId,
          notif.title,
          notif.message,
          notif.type || '',
          notif.read ? 1 : 0,
          notif.createdAt || '',
          now,
          expiresAt,
        ]
      );
    }
  } catch (error) {
    // Error caching notifications
  }
};

export const getCachedNotifications = async (userId: string): Promise<Notification[] | null> => {
  try {
    const db = await getDatabase();
    const now = Date.now();

    await clearExpiredCache();

    const result = await db.getAllAsync<{
      _id: string;
      userId: string;
      title: string;
      message: string;
      type: string;
      read: number;
      createdAt: string;
    }>(`SELECT * FROM notifications WHERE userId = ? AND expires_at > ? ORDER BY createdAt DESC`, [userId, now]);

    if (result.length === 0) {
      return null;
    }

    const notifications: Notification[] = result.map((row) => ({
      _id: row._id,
      userId: row.userId,
      title: row.title,
      message: row.message,
      type: row.type || undefined,
      read: row.read === 1,
      createdAt: row.createdAt || undefined,
    }));

    return notifications;
  } catch (error) {
    return null;
  }
};


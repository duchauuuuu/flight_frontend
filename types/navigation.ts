export type RootTabParamList = {
  Search: undefined;
  MyTickets: { refresh?: number } | undefined;
  Notifications: { markAsRead?: number } | undefined;
  Account: undefined;
};

export type AccountStackParamList = {
  AccountMain: undefined;
  Profile: undefined;
  Login: undefined;
  Register: undefined;
  AdminDashboard: undefined;
  AdminFlights: undefined;
  AdminBookings: undefined;
  AdminUsers: undefined;
  AdminEditUser: { userId: string };
  AdminAddUser: undefined;
  AdminAddFlight?: { flightId?: string };
  AdminEditFlight?: { flightId: string };
};

import { Flight } from './flight';

import { FlightSegment } from './flight-segment';

export type SearchStackParamList = {
  SearchMain: undefined;
  Airports: { type: 'departure' | 'arrival' };
  DatePicker: { type: 'departure' | 'return' };
  ResultsLoading: 
    | { from: string; to: string; date: string; passengers: number; seatClass: string }
    | { tripType: 'multicity'; flights: FlightSegment[]; passengers: number; seatClass: string };
  Results: { from: string; to: string; date: string; passengers: number; seatClass: string; flights?: Flight[] };
  Booking: { flight: any; passengers?: number; pricing?: { base: number; taxesAndFees?: number; total: number } };
  PaymentSuccess: undefined;
};


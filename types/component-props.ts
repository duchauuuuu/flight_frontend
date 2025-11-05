import { Airport } from './airport';

export interface FlightBookingCardProps {
  airportData?: { airportType?: string; airport?: Airport } | null;
}


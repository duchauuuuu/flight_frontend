export interface Flight {
  _id?: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: Date | string;
  arrival: Date | string;
  price: number;
  stops: number;
  airline: string;
  availableCabins: string[];
  seatsAvailable: Record<string, number>;
}


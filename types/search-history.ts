export interface SearchHistoryItem {
  _id: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  departDate: string;
  returnDate?: string;
  tripType: string;
  passengers: number;
  seatClass: string;
}


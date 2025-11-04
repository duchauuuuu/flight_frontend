export interface Traveller {
  type: string;
  name: string;
}

export interface ContactDetails {
  email: string;
  phone: string;
}

export interface Payment {
  method: string;
  amount: number;
  paidAt: string | Date;
}

export interface Booking {
  _id?: string;
  bookingCode?: string;
  userId: string;
  flightIds: Array<string | any>; // có thể được populate từ BE
  tripType: string;
  travellerCounts: {
    adults: number;
    children: number;
    infants: number;
  };
  travellers?: Traveller[];
  contactDetails?: ContactDetails;
  status: string;
  payment?: Payment;
  cabinClass: string;
}


export interface Traveller {
  type: string;
  firstName: string;
  lastName: string;
  gender: string;
  seat?: string;
  cabinClass: string;
  cabinBags?: string;
  checkedBags?: string;
}

export interface ContactDetails {
  email: string;
  phone: string;
}

export interface Payment {
  method: string;
  amount: number;
  paidAt: Date;
}

export interface Booking {
  _id?: string;
  userId: string;
  flightIds: string[];
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


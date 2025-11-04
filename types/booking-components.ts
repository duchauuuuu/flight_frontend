export type PaymentMethod = 'MoMo' | 'VNPay' | 'Thẻ';

export interface TotalPriceText {
  base: number;
  taxFee: number;
  baggageFee: number;
  total: number;
}

export interface PaymentStepProps {
  styles: any;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  selectedBank: string;
  setSelectedBank: (b: string) => void;
  cardNumber: string;
  setCardNumber: (s: string) => void;
  cardExpiry: string;
  setCardExpiry: (s: string) => void;
  cardCvv: string;
  setCardCvv: (s: string) => void;
  totalPriceText: TotalPriceText;
}

export interface PassengerInfo {
  id: number;
  name: string;
}

export interface BaggageStepProps {
  styles: any;
  passengersInfo: PassengerInfo[];
  baggageSelections: number[];
  setBaggageSelections: (updater: any) => void;
}

export interface PassengersStepProps {
  styles: any;
  adultExpanded: boolean;
  setAdultExpanded: (v: boolean | ((p: boolean) => boolean)) => void;
  passengersInfo: PassengerInfo[];
  setPassengersInfo: (updater: any) => void;
  baggageSelections: number[];
  setBaggageSelections: (updater: any) => void;
  onEditPassenger: (index: number, currentName: string) => void;
}


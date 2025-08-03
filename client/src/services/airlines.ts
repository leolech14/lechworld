import { apiClient } from '@/lib/api-client';

export interface Airline {
  id: number;
  code: string;
  name: string;
  programName: string;
  transferEnabled: boolean;
  minTransferAmount: number | null;
  transferFeeType: string | null;
  transferFeeAmount: number | null;
  transferFeePoints: number | null;
  transferDelayHours: number;
  expirationMonths: number | null;
  extendableOnActivity: boolean;
  googleWalletSupported: boolean;
  createdAt: string;
}

export async function getAirlines(): Promise<Airline[]> {
  const response = await apiClient.get('/api/programs/airlines');

  if (!response.ok) {
    throw new Error('Failed to fetch airlines');
  }

  const data = await response.json();
  return data.airlines;
}

export async function calculateTransferCost(
  fromAirlineId: number,
  toAirlineId: number,
  amount: number,
  memberStatus?: string
) {
  const params = new URLSearchParams({
    fromAirlineId: fromAirlineId.toString(),
    toAirlineId: toAirlineId.toString(),
    amount: amount.toString(),
  });
  
  if (memberStatus) {
    params.append('memberStatus', memberStatus);
  }

  const response = await apiClient.get(`/api/programs/transfer-cost?${params}`);

  if (!response.ok) {
    throw new Error('Failed to calculate transfer cost');
  }

  return response.json();
}
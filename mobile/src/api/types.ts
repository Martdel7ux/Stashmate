export type GoalStatus = 'Active' | 'Paused' | 'Completed' | 'Cancelled';
export type TransactionStatus = 'Pending' | 'Success' | 'Failed';

/** Backend serializes enums as integers; map them to readable unions. */
export const GOAL_STATUS: GoalStatus[] = ['Active', 'Paused', 'Completed', 'Cancelled'];
export const TX_STATUS: TransactionStatus[] = ['Pending', 'Success', 'Failed'];

export interface AuthResponse {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number | null;
  debitAmount: number;
  debitDay: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  totalSaved: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  goalId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  goCardlessPaymentId: string | null;
  attemptNumber: number;
  createdAt: string;
}

export interface Wallet {
  swanAccountId: string | null;
  balance: number;
  currency: string;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number | null;
  debitAmount: number;
  debitDay: number;
  startDate: string;
  endDate: string;
}

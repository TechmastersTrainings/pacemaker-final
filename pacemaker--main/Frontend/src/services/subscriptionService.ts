import apiClient from '@/lib/apiClient';

export type PlanType = 'Basic' | 'Medium' | 'High' | 'Enterprise';
export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled' | 'Trial' | 'ACTIVE' | 'DISABLED';
export type PaymentMethod = 'Razorpay' | 'Card' | 'UPI';

export interface Subscriber {
  id?: number;
  userId?: string;
  name?: string;
  userName?: string;
  email?: string;
  avatar?: string;
  plan: string;
  status: string;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  autoRenew?: boolean;
  amount?: number;
  paymentMethod?: string;
  active?: boolean;
  registeredDate?: string;
  isOfflinePayment?: boolean;
  last4?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'failed' | 'refunded';
  invoiceUrl: string;
  paymentMethod: PaymentMethod;
  last4?: string;
}

export const PLAN_PRICES: Record<string, number> = {
  Basic: 999,
  Medium: 1999,
  High: 4999,
  Enterprise: 15000
};

export const PLAN_FEATURES: Record<string, string[]> = {
  Basic: ['Access to Question Bank', 'Basic Performance Analytics'],
  Medium: ['Access to Question Bank', 'All Video Lectures', 'Advanced Analytics'],
  High: ['QBank + Videos', 'Live Classes', 'Mentorship Sessions'],
  Enterprise: ['Everything in High', 'AI Study Planner', 'Mock Interview & Counseling']
};

export const subscriptionService = {
  // Admin Operations
  async getAllSubscriptions(): Promise<Subscriber[]> {
    const { data } = await apiClient.get<Subscriber[]>('/admin/subscriptions');
    return data;
  },

  async enableSubscription(id: number): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(`/admin/subscriptions/${id}/enable`);
    return data;
  },

  async disableSubscription(id: number): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(`/admin/subscriptions/${id}/disable`);
    return data;
  },

  // User Operations
  async getUserSubscription(): Promise<Subscriber> {
    const { data } = await apiClient.get<Subscriber>('/user/subscription');
    return data;
  },

  async createSubscription(payload: any): Promise<any> {
    const { data } = await apiClient.post('/subscriptions/create', payload);
    return data;
  },

  async verifyPayment(payload: any): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/subscriptions/verify', payload);
    return data;
  }
};

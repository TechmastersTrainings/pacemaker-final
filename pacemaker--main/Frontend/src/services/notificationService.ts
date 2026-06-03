import axios from 'axios';

// NotificationController is at /api/notifications (not /api/v1/notifications)
const notifClient = axios.create({
  baseURL: 'http://localhost:8080/api/notifications',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

notifClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface WelcomeEmailDto {
  email: string;
  name: string;
}

export interface PaymentConfirmationDto {
  email: string;
  name: string;
  amount: number;
  planName: string;
  transactionId: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

export interface NotificationHistory {
  id: number;
  type: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: string;
}

export const notificationService = {
  async sendWelcomeEmail(dto: WelcomeEmailDto): Promise<EmailResponse> {
    const { data } = await notifClient.post<EmailResponse>('/welcome', dto);
    return data;
  },

  async sendPaymentConfirmation(dto: PaymentConfirmationDto): Promise<EmailResponse> {
    const { data } = await notifClient.post<EmailResponse>('/payment-confirmation', dto);
    return data;
  },

  async getNotificationHistory(): Promise<NotificationHistory[]> {
    const { data } = await notifClient.get<NotificationHistory[]>('/history');
    return data;
  }
};

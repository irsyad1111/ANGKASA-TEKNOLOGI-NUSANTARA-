import { Timestamp } from 'firebase/firestore';

export interface Business {
  id: string;
  name: string;
  description?: string;
  ownerUid: string;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  businessId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: Timestamp;
  ownerUid: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  ownerUid: string;
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  position?: string;
  ownerUid: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'leave';
  ownerUid: string;
}

export interface UserRole {
  id: string;
  businessId: string;
  userUid: string;
  userEmail: string;
  role: 'superadmin' | 'manager';
}

export interface AppSettings {
  id: string;
  appName: string;
  primaryColor: string;
  logoColor: string;
  updatedAt: any;
  updatedBy: string;
}

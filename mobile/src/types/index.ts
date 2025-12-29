// Type Definitions for Roster Mobile App

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  role: string;
  compliance: ComplianceStatus;
}

export interface ComplianceStatus {
  status: 'compliant' | 'warning' | 'violation';
  issues: string[];
}

export interface MarketplaceListing {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  role: string;
  compensation?: number;
  postedBy?: string;
  postedAt?: string;
}

export interface TimeOffRequest {
  id: string;
  type: 'vacation' | 'sick' | 'personal';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface AccrualBalance {
  type: string;
  accrued: number;
  used: number;
  remaining: number;
  year: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'shift' | 'timeoff' | 'marketplace' | 'compliance' | 'general';
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface Preference {
  id: string;
  userId: string;
  key: string;
  value: any;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Schedule: undefined;
  Marketplace: undefined;
  TimeOff: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type ScheduleStackParamList = {
  ScheduleList: undefined;
  ShiftDetail: { shift: Shift };
};

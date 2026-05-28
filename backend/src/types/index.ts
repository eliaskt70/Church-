export interface User {
  id: string;
  phone: string | null;
  name: string | null;
  email: string | null;
  google_id: string | null;
  account_type: 'beneficiary' | 'provider';
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  category: ServiceCategory;
  location: string | null;
  radius_km: number | null;
  photos: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory =
  | 'home_maintenance'
  | 'educational'
  | 'handcrafts'
  | 'home_cooking'
  | 'delivery'
  | 'beauty'
  | 'tech_support'
  | 'other';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  service_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface OtpCode {
  id: string;
  phone: string;
  code_hash: string;
  expires_at: Date;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthPayload {
  userId: string;
  accountType: 'beneficiary' | 'provider';
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface GeoSearchQuery {
  lat: number;
  lng: number;
  radius_km?: number;
  category?: ServiceCategory;
}

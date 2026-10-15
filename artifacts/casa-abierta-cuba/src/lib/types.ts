export type Role = 'traveler' | 'provider' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type RequestStatus = 'new' | 'reviewing' | 'accepted' | 'completed' | 'cancelled';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ContactStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  account_status: AccountStatus;
  country: string | null;
  user_country_id?: string | null;
  currency?: string | null;
  preferred_language: string | null;
  trip_style: string | null;
  budget_band: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id?: string;
  name: string;
  host_name: string;
  description: string;
  host_story: string;
  service_type: string;
  category: string;
  tourism_category: string;
  province: string;
  municipality: string;
  country_id?: string | null;
  city_id?: string | null;
  price_currency?: string | null;
  price_amount?: number | null;
  photos: string[];
  languages: string[];
  experience_details: string;
  recommended_for: string[];
  lgbt_friendly: boolean;
  verified?: boolean;
  sustainability_badge?: string | null;
  is_experience?: boolean;
  status: BusinessStatus;
  created_at: string;
}

export interface BusinessRow {
  id: string;
  business_id?: string;
  requester_id?: string;
  message: string;
  status: RequestStatus;
  service_requested: string;
  created_at: string;
  /** Solo presente en el almacén demo; en Supabase requiere RPC admin. */
  contact_email?: string;
  business?: { name: string; province: string } | null;
}

export interface Review {
  id: string;
  request_id: string;
  business_id: string;
  author_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'business' | 'user' | 'request';
  target_id: string;
  reason: string;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  sender_id: string;
  inquiry_type: string;
  subject: string;
  message: string;
  status: ContactStatus;
  created_at: string;
}

export interface Category {
  key: string;
  label: string;
  active: boolean;
}

export interface SubmitBusinessInput {
  name: string;
  host_name: string;
  description: string;
  host_story: string;
  service_type: string;
  tourism_category: string;
  province: string;
  municipality: string;
  photos: string[];
  languages: string[];
  experience_details: string;
  recommended_for: string[];
  lgbt_friendly: boolean;
  phone: string;
  email: string;
}

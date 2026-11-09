export interface Category {
  category_id: number;
  category_name: string;
  icon: string;
}

export interface MapsGroundingLink {
  uri: string;
  title: string;
}

export interface MapsGroundingData {
  locationQuery: string;
  summary: string;
  placeTitle?: string;
  address?: string;
  operatingHours?: string;
  safeHandoverSpots?: string[];
  links: MapsGroundingLink[];
  groundedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'student' | 'staff' | 'admin';
}

export interface LostFoundItem {
  id?: string;
  item_id: number | string;
  category_id: number;
  category_name: string;
  item_name: string;
  description: string;
  location_found: string;
  finder_contact: string;
  finder_name?: string;
  finder_id?: string;
  image_path?: string | null;
  item_status: 'Unclaimed' | 'Claimed';
  item_type: 'found' | 'lost';
  dropoff_location?: string;
  claimed_by?: string;
  claimed_date?: string;
  claim_notes?: string;
  date_posted: string;
  map_grounding?: MapsGroundingData | null;
}

export interface StatsData {
  total: number;
  unclaimed: number;
  claimed: number;
  recoveryRate: number;
  categoryCounts: { name: string; count: number }[];
  topLocations: [string, number][];
}

export interface EmailAlertSubscription {
  id: string;
  user_email: string;
  user_name?: string;
  keyword?: string;
  category_id?: number | 'All';
  category_name?: string;
  location_filter?: string;
  alert_type: 'instant' | 'daily_digest';
  active: boolean;
  created_at: string;
  match_count?: number;
}

export interface DispatchedEmail {
  id: string;
  to_email: string;
  recipient_name: string;
  subject: string;
  item_id: number | string;
  item_name: string;
  category_name: string;
  location: string;
  dropoff_location?: string;
  image_path?: string | null;
  sent_at: string;
  status: 'delivered' | 'simulated';
  match_reason: string;
  body_html: string;
  body_text: string;
}


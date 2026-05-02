export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// ENUMS
// ============================================================

export type PMSType = 'standalone' | 'ezee' | 'hotelogix'
export type RoomType = 'standard' | 'deluxe' | 'super_deluxe' | 'suite' | 'presidential'
export type BedType = 'king' | 'queen' | 'twin' | 'double' | 'single'
export type BookingSource = 'website' | 'walkin' | 'phone' | 'whatsapp' | 'mmt' | 'booking_com' | 'goibibo' | 'agoda' | 'other'
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded' | 'failed'
export type PaymentMethod = 'razorpay' | 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'
export type PaymentType = 'full' | 'partial' | 'deposit'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded'
export type StaffRole = 'superadmin' | 'admin' | 'manager' | 'frontdesk' | 'housekeeping' | 'maintenance'
export type LoyaltyTier = 'silver' | 'gold' | 'platinum'
export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjusted'
export type HousekeepingStatus = 'dirty' | 'cleaning' | 'inspecting' | 'ready' | 'maintenance' | 'do_not_disturb'
export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled'
export type MaintenancePriority = 'low' | 'normal' | 'high' | 'urgent'
export type MaintenanceIssueType = 'ac' | 'plumbing' | 'electrical' | 'furniture' | 'tv' | 'internet' | 'elevator' | 'other'
export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push'
export type NotificationRecipientType = 'guest' | 'owner' | 'staff' | 'manager'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'check_in_reminder'
  | 'check_out_reminder'
  | 'review_received'
  | 'low_inventory'
  | 'maintenance_alert'
  | 'general'
export type PricingRuleType = 'date_range' | 'day_of_week' | 'event' | 'last_minute' | 'early_bird'
export type PriceType = 'fixed' | 'percentage_increase' | 'percentage_decrease'
export type DiscountType = 'percentage' | 'fixed'
export type ReviewSource = 'google' | 'internal' | 'tripadvisor'
export type ImageCategory = 'general' | 'lobby' | 'restaurant' | 'pool' | 'exterior' | 'amenity'
export type CancelledBy = 'guest' | 'staff' | 'system'
export type GenderType = 'male' | 'female' | 'other'
export type IdProofType = 'aadhaar' | 'passport' | 'pan' | 'driving_license' | 'voter_id'

// ============================================================
// TABLE TYPES
// ============================================================

export interface Hotel {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  address: string
  city: string
  area: string
  state: string
  pincode: string
  phone: string
  whatsapp_number: string
  email: string
  google_place_id: string | null
  google_maps_url: string | null
  latitude: number | null
  longitude: number | null
  star_rating: number
  check_in_time: string
  check_out_time: string
  total_rooms: number
  pms_type: PMSType
  ezee_property_id: string | null
  ezee_api_key: string | null
  gst_number: string | null
  pan_number: string | null
  amenities: string[]
  policies: Json
  nearby_attractions: Json[]
  seo_title: string | null
  seo_description: string | null
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  hotel_id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  room_type: RoomType
  base_price: number
  weekend_price: number | null
  peak_price: number | null
  gst_rate: number
  max_occupancy: number
  total_count: number
  size_sqft: number | null
  bed_type: BedType | null
  floor_number: number | null
  amenities: string[]
  inclusions: string[]
  cancellation_policy: string | null
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface RoomImage {
  id: string
  room_id: string
  hotel_id: string
  image_url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface HotelImage {
  id: string
  hotel_id: string
  image_url: string
  alt_text: string | null
  caption: string | null
  category: ImageCategory
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface Availability {
  id: string
  hotel_id: string
  room_id: string
  date: string
  total_rooms: number
  booked_rooms: number
  blocked_rooms: number
  available_rooms: number
  is_blocked: boolean
  block_reason: string | null
  override_price: number | null
  updated_at: string
}

export interface Guest {
  id: string
  name: string
  email: string | null
  phone: string
  whatsapp_number: string | null
  date_of_birth: string | null
  gender: GenderType | null
  nationality: string
  id_proof_type: IdProofType | null
  id_proof_number: string | null
  id_proof_image_url: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  company_name: string | null
  gst_number: string | null
  loyalty_points: number
  loyalty_tier: LoyaltyTier
  total_stays: number
  total_spent: number
  preferences: Json
  password_hash: string | null
  otp_code: string | null
  otp_expires_at: string | null
  is_verified: boolean
  is_blacklisted: boolean
  blacklist_reason: string | null
  is_deleted: boolean
  deleted_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_reference: string
  hotel_id: string
  room_id: string
  guest_id: string
  check_in_date: string
  check_out_date: string
  number_of_nights: number
  adults: number
  children: number
  room_price_per_night: number
  total_room_amount: number
  discount_amount: number
  gst_rate: number
  gst_amount: number
  final_amount: number
  source: BookingSource
  status: BookingStatus
  payment_status: PaymentStatus
  special_requests: string | null
  internal_notes: string | null
  coupon_code: string | null
  coupon_discount: number
  loyalty_points_used: number
  loyalty_points_earned: number
  loyalty_discount: number
  ezee_booking_id: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  cancelled_by: CancelledBy | null
  checked_in_at: string | null
  checked_out_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  guest_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  status: TransactionStatus
  refund_id: string | null
  refund_amount: number | null
  refund_reason: string | null
  refunded_at: string | null
  failure_reason: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  password_hash: string
  role: StaffRole
  hotel_id: string | null
  permissions: Json
  avatar_url: string | null
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface PricingRule {
  id: string
  hotel_id: string | null
  room_id: string | null
  rule_name: string
  rule_type: PricingRuleType
  start_date: string | null
  end_date: string | null
  days_of_week: number[]
  price_type: PriceType
  price_value: number
  min_nights: number
  priority: number
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Coupon {
  id: string
  hotel_id: string | null
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  minimum_booking: number
  maximum_discount: number | null
  valid_from: string
  valid_until: string
  usage_limit: number | null
  used_count: number
  per_guest_limit: number
  applicable_rooms: string[]
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  guest_id: string
  booking_id: string | null
  transaction_type: LoyaltyTransactionType
  points: number
  balance_after: number
  description: string
  expires_at: string | null
  created_at: string
}

export interface Review {
  id: string
  hotel_id: string
  google_review_id: string | null
  reviewer_name: string
  reviewer_photo: string | null
  rating: number
  review_text: string | null
  review_date: string | null
  owner_reply: string | null
  owner_reply_date: string | null
  is_featured: boolean
  source: ReviewSource
  fetched_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Housekeeping {
  id: string
  hotel_id: string
  room_id: string
  room_number: string
  status: HousekeepingStatus
  assigned_to: string | null
  priority: HousekeepingPriority
  notes: string | null
  last_booking_id: string | null
  started_at: string | null
  completed_at: string | null
  updated_at: string
  updated_by: string | null
  created_at: string
}

export interface Maintenance {
  id: string
  hotel_id: string
  room_id: string | null
  issue_type: MaintenanceIssueType
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  reported_by: string | null
  assigned_to: string | null
  images: Json[]
  resolution_notes: string | null
  estimated_cost: number | null
  actual_cost: number | null
  resolved_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  hotel_id: string | null
  type: NotificationType
  channel: NotificationChannel
  recipient_type: NotificationRecipientType
  recipient_id: string | null
  recipient_phone: string | null
  recipient_email: string | null
  subject: string | null
  message: string
  template_id: string | null
  metadata: Json
  status: NotificationStatus
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failure_reason: string | null
  retry_count: number
  created_at: string
}

export interface WhatsappSession {
  id: string
  phone_number: string
  guest_id: string | null
  hotel_id: string | null
  current_step: string
  session_data: Json
  message_history: Json[]
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image: string | null
  author: string
  hotel_id: string | null
  city: string | null
  tags: string[]
  seo_title: string | null
  seo_description: string | null
  is_published: boolean
  published_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  staff_id: string | null
  staff_name: string | null
  staff_role: string | null
  hotel_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_value: Json | null
  new_value: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Setting {
  id: string
  hotel_id: string | null
  key: string
  value: string | null
  is_secret: boolean
  description: string | null
  updated_by: string | null
  updated_at: string
}

// ============================================================
// JOINED / EXTENDED TYPES
// ============================================================

export interface BookingWithDetails extends Booking {
  hotel: Pick<Hotel, 'id' | 'name' | 'slug' | 'address' | 'phone' | 'whatsapp_number' | 'city' | 'area'>
  room: Pick<Room, 'id' | 'name' | 'room_type' | 'bed_type' | 'max_occupancy'>
  guest: Pick<Guest, 'id' | 'name' | 'email' | 'phone' | 'loyalty_tier'>
  payment: Payment | null
}

export interface RoomWithImages extends Room {
  room_images: RoomImage[]
}

export interface HotelWithRooms extends Hotel {
  rooms: RoomWithImages[]
  hotel_images: HotelImage[]
}

export interface HotelWithStats extends Hotel {
  total_bookings: number
  confirmed_bookings: number
  revenue_today: number
  occupancy_rate: number
  average_rating: number
}

// ============================================================
// DATABASE INTERFACE FOR SUPABASE CLIENT
// ============================================================

export interface Database {
  public: {
    Tables: {
      hotels: {
        Row: Hotel
        Insert: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Hotel, 'id' | 'created_at'>>
      }
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Room, 'id' | 'created_at'>>
      }
      room_images: {
        Row: RoomImage
        Insert: Omit<RoomImage, 'id' | 'created_at'>
        Update: Partial<Omit<RoomImage, 'id' | 'created_at'>>
      }
      hotel_images: {
        Row: HotelImage
        Insert: Omit<HotelImage, 'id' | 'created_at'>
        Update: Partial<Omit<HotelImage, 'id' | 'created_at'>>
      }
      availability: {
        Row: Availability
        Insert: Omit<Availability, 'id' | 'available_rooms' | 'updated_at'>
        Update: Partial<Omit<Availability, 'id' | 'available_rooms'>>
      }
      guests: {
        Row: Guest
        Insert: Omit<Guest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Guest, 'id' | 'created_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'number_of_nights' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Booking, 'id' | 'number_of_nights' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      staff: {
        Row: Staff
        Insert: Omit<Staff, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Staff, 'id' | 'created_at'>>
      }
      pricing_rules: {
        Row: PricingRule
        Insert: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PricingRule, 'id' | 'created_at'>>
      }
      coupons: {
        Row: Coupon
        Insert: Omit<Coupon, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Coupon, 'id' | 'created_at'>>
      }
      loyalty_transactions: {
        Row: LoyaltyTransaction
        Insert: Omit<LoyaltyTransaction, 'id' | 'created_at'>
        Update: never
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
      }
      housekeeping: {
        Row: Housekeeping
        Insert: Omit<Housekeeping, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Housekeeping, 'id' | 'created_at'>>
      }
      maintenance: {
        Row: Maintenance
        Insert: Omit<Maintenance, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Maintenance, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      whatsapp_sessions: {
        Row: WhatsappSession
        Insert: Omit<WhatsappSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WhatsappSession, 'id' | 'created_at'>>
      }
      blog_posts: {
        Row: BlogPost
        Insert: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BlogPost, 'id' | 'created_at'>>
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
      settings: {
        Row: Setting
        Insert: Omit<Setting, 'id' | 'updated_at'>
        Update: Partial<Omit<Setting, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

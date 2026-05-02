-- ============================================================
-- SOUTHERN SUITES HOTEL BOOKING SAAS
-- Complete Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER FUNCTION: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE 1: HOTELS
-- ============================================================
CREATE TABLE hotels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  short_description   TEXT,
  address             TEXT NOT NULL,
  city                TEXT NOT NULL DEFAULT 'Hyderabad',
  area                TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'Andhra Pradesh',
  pincode             TEXT NOT NULL,
  phone               TEXT NOT NULL,
  whatsapp_number     TEXT NOT NULL,
  email               TEXT NOT NULL,
  google_place_id     TEXT,
  google_maps_url     TEXT,
  latitude            DECIMAL(10, 8),
  longitude           DECIMAL(11, 8),
  star_rating         SMALLINT DEFAULT 3 CHECK (star_rating BETWEEN 1 AND 5),
  check_in_time       TIME DEFAULT '12:00:00',
  check_out_time      TIME DEFAULT '11:00:00',
  total_rooms         SMALLINT NOT NULL DEFAULT 0,
  pms_type            TEXT NOT NULL DEFAULT 'standalone' CHECK (pms_type IN ('standalone', 'ezee', 'hotelogix')),
  ezee_property_id    TEXT,
  ezee_api_key        TEXT,
  gst_number          TEXT,
  pan_number          TEXT,
  amenities           JSONB DEFAULT '[]',
  policies            JSONB DEFAULT '{}',
  nearby_attractions  JSONB DEFAULT '[]',
  seo_title           TEXT,
  seo_description     TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hotels_slug ON hotels(slug);
CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_area ON hotels(area);
CREATE INDEX idx_hotels_is_active ON hotels(is_active) WHERE is_deleted = FALSE;

CREATE TRIGGER set_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 2: ROOMS
-- ============================================================
CREATE TABLE rooms (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  short_description TEXT,
  room_type         TEXT NOT NULL CHECK (room_type IN ('standard', 'deluxe', 'super_deluxe', 'suite', 'presidential')),
  base_price        NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  weekend_price     NUMERIC(10,2),
  peak_price        NUMERIC(10,2),
  gst_rate          NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  max_occupancy     SMALLINT NOT NULL DEFAULT 2,
  total_count       SMALLINT NOT NULL DEFAULT 1,
  size_sqft         SMALLINT,
  bed_type          TEXT CHECK (bed_type IN ('king', 'queen', 'twin', 'double', 'single')),
  floor_number      SMALLINT,
  amenities         JSONB DEFAULT '[]',
  inclusions        JSONB DEFAULT '[]',
  cancellation_policy TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, slug)
);

CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX idx_rooms_room_type ON rooms(room_type);
CREATE INDEX idx_rooms_base_price ON rooms(base_price);
CREATE INDEX idx_rooms_is_active ON rooms(is_active) WHERE is_deleted = FALSE;

CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 3: ROOM IMAGES
-- ============================================================
CREATE TABLE room_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  alt_text    TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_images_room_id ON room_images(room_id);
CREATE INDEX idx_room_images_hotel_id ON room_images(hotel_id);

-- ============================================================
-- TABLE 4: HOTEL IMAGES
-- ============================================================
CREATE TABLE hotel_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  alt_text    TEXT,
  caption     TEXT,
  category    TEXT DEFAULT 'general' CHECK (category IN ('general', 'lobby', 'restaurant', 'pool', 'exterior', 'amenity')),
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hotel_images_hotel_id ON hotel_images(hotel_id);

-- ============================================================
-- TABLE 5: AVAILABILITY
-- ============================================================
CREATE TABLE availability (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id          UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  total_rooms      SMALLINT NOT NULL DEFAULT 0,
  booked_rooms     SMALLINT NOT NULL DEFAULT 0,
  blocked_rooms    SMALLINT NOT NULL DEFAULT 0,
  available_rooms  SMALLINT GENERATED ALWAYS AS (total_rooms - booked_rooms - blocked_rooms) STORED,
  is_blocked       BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason     TEXT,
  override_price   NUMERIC(10,2),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, room_id, date),
  CHECK (booked_rooms >= 0),
  CHECK (blocked_rooms >= 0),
  CHECK (booked_rooms + blocked_rooms <= total_rooms)
);

CREATE INDEX idx_availability_hotel_room_date ON availability(hotel_id, room_id, date);
CREATE INDEX idx_availability_date ON availability(date);
CREATE INDEX idx_availability_room_id ON availability(room_id);

CREATE TRIGGER set_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 6: GUESTS
-- ============================================================
CREATE TABLE guests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  email               TEXT UNIQUE,
  phone               TEXT NOT NULL UNIQUE,
  whatsapp_number     TEXT,
  date_of_birth       DATE,
  gender              TEXT CHECK (gender IN ('male', 'female', 'other')),
  nationality         TEXT DEFAULT 'Indian',
  id_proof_type       TEXT CHECK (id_proof_type IN ('aadhaar', 'passport', 'pan', 'driving_license', 'voter_id')),
  id_proof_number     TEXT,
  id_proof_image_url  TEXT,
  address             TEXT,
  city                TEXT,
  state               TEXT,
  pincode             TEXT,
  company_name        TEXT,
  gst_number          TEXT,
  loyalty_points      INTEGER NOT NULL DEFAULT 0,
  loyalty_tier        TEXT NOT NULL DEFAULT 'silver' CHECK (loyalty_tier IN ('silver', 'gold', 'platinum')),
  total_stays         INTEGER NOT NULL DEFAULT 0,
  total_spent         NUMERIC(12,2) NOT NULL DEFAULT 0,
  preferences         JSONB DEFAULT '{}',
  password_hash       TEXT,
  otp_code            TEXT,
  otp_expires_at      TIMESTAMPTZ,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_blacklisted      BOOLEAN NOT NULL DEFAULT FALSE,
  blacklist_reason    TEXT,
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_loyalty_tier ON guests(loyalty_tier);

CREATE TRIGGER set_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 7: BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference     TEXT NOT NULL UNIQUE,
  hotel_id              UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  room_id               UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  guest_id              UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  check_in_date         DATE NOT NULL,
  check_out_date        DATE NOT NULL,
  number_of_nights      SMALLINT NOT NULL GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
  adults                SMALLINT NOT NULL DEFAULT 1,
  children              SMALLINT NOT NULL DEFAULT 0,
  room_price_per_night  NUMERIC(10,2) NOT NULL,
  total_room_amount     NUMERIC(10,2) NOT NULL,
  discount_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_rate              NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  gst_amount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_amount          NUMERIC(10,2) NOT NULL,
  source                TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'walkin', 'phone', 'whatsapp', 'mmt', 'booking_com', 'goibibo', 'agoda', 'other')),
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  payment_status        TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
  special_requests      TEXT,
  internal_notes        TEXT,
  coupon_code           TEXT,
  coupon_discount       NUMERIC(10,2) DEFAULT 0,
  loyalty_points_used   INTEGER DEFAULT 0,
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_discount      NUMERIC(10,2) DEFAULT 0,
  ezee_booking_id       TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  cancelled_by          TEXT CHECK (cancelled_by IN ('guest', 'staff', 'system')),
  checked_in_at         TIMESTAMPTZ,
  checked_out_at        TIMESTAMPTZ,
  is_deleted            BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out_date > check_in_date),
  CHECK (final_amount >= 0)
);

CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_bookings_check_out_date ON bookings(check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_booking_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_source ON bookings(source);

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_reference = 'SS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(CAST(FLOOR(RANDOM() * 99999 + 1) AS TEXT), 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_reference IS NULL OR NEW.booking_reference = '')
  EXECUTE FUNCTION generate_booking_reference();

-- ============================================================
-- TABLE 8: PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  guest_id              UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  amount                NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL DEFAULT 'INR',
  payment_method        TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cash', 'upi', 'card', 'bank_transfer', 'cheque')),
  payment_type          TEXT NOT NULL DEFAULT 'full' CHECK (payment_type IN ('full', 'partial', 'deposit')),
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_signature    TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'partially_refunded')),
  refund_id             TEXT,
  refund_amount         NUMERIC(10,2),
  refund_reason         TEXT,
  refunded_at           TIMESTAMPTZ,
  failure_reason        TEXT,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_guest_id ON payments(guest_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 9: STAFF
-- ============================================================
CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'frontdesk' CHECK (role IN ('superadmin', 'admin', 'manager', 'frontdesk', 'housekeeping', 'maintenance')),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  permissions     JSONB DEFAULT '{}',
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_hotel_id ON staff(hotel_id);
CREATE INDEX idx_staff_role ON staff(role);

CREATE TRIGGER set_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 10: PRICING RULES
-- ============================================================
CREATE TABLE pricing_rules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id       UUID REFERENCES rooms(id) ON DELETE CASCADE,
  rule_name     TEXT NOT NULL,
  rule_type     TEXT NOT NULL CHECK (rule_type IN ('date_range', 'day_of_week', 'event', 'last_minute', 'early_bird')),
  start_date    DATE,
  end_date      DATE,
  days_of_week  INTEGER[] DEFAULT '{}',
  price_type    TEXT NOT NULL CHECK (price_type IN ('fixed', 'percentage_increase', 'percentage_decrease')),
  price_value   NUMERIC(10,2) NOT NULL,
  min_nights    SMALLINT DEFAULT 1,
  priority      SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_hotel_id ON pricing_rules(hotel_id);
CREATE INDEX idx_pricing_rules_room_id ON pricing_rules(room_id);
CREATE INDEX idx_pricing_rules_is_active ON pricing_rules(is_active);

CREATE TRIGGER set_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 11: COUPONS
-- ============================================================
CREATE TABLE coupons (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id          UUID REFERENCES hotels(id) ON DELETE CASCADE,
  code              TEXT NOT NULL UNIQUE,
  description       TEXT,
  discount_type     TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value    NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  minimum_booking   NUMERIC(10,2) DEFAULT 0,
  maximum_discount  NUMERIC(10,2),
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until       TIMESTAMPTZ NOT NULL,
  usage_limit       INTEGER,
  used_count        INTEGER NOT NULL DEFAULT 0,
  per_guest_limit   SMALLINT DEFAULT 1,
  applicable_rooms  UUID[] DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_hotel_id ON coupons(hotel_id);
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);

CREATE TRIGGER set_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 12: LOYALTY TRANSACTIONS
-- ============================================================
CREATE TABLE loyalty_transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id          UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  booking_id        UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type  TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'bonus', 'adjusted')),
  points            INTEGER NOT NULL,
  balance_after     INTEGER NOT NULL,
  description       TEXT NOT NULL,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_guest_id ON loyalty_transactions(guest_id);
CREATE INDEX idx_loyalty_transactions_booking_id ON loyalty_transactions(booking_id);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);

-- ============================================================
-- TABLE 13: REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id            UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  google_review_id    TEXT UNIQUE,
  reviewer_name       TEXT NOT NULL,
  reviewer_photo      TEXT,
  rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text         TEXT,
  review_date         TIMESTAMPTZ,
  owner_reply         TEXT,
  owner_reply_date    TIMESTAMPTZ,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  source              TEXT NOT NULL DEFAULT 'google' CHECK (source IN ('google', 'internal', 'tripadvisor')),
  fetched_at          TIMESTAMPTZ DEFAULT NOW(),
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_hotel_id ON reviews(hotel_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_source ON reviews(source);

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 14: HOUSEKEEPING
-- ============================================================
CREATE TABLE housekeeping (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id           UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  room_number       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'dirty' CHECK (status IN ('dirty', 'cleaning', 'inspecting', 'ready', 'maintenance', 'do_not_disturb')),
  assigned_to       UUID REFERENCES staff(id) ON DELETE SET NULL,
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes             TEXT,
  last_booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_housekeeping_hotel_id ON housekeeping(hotel_id);
CREATE INDEX idx_housekeeping_room_id ON housekeeping(room_id);
CREATE INDEX idx_housekeeping_status ON housekeeping(status);
CREATE INDEX idx_housekeeping_assigned_to ON housekeeping(assigned_to);

CREATE TRIGGER set_housekeeping_updated_at
  BEFORE UPDATE ON housekeeping
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 15: MAINTENANCE
-- ============================================================
CREATE TABLE maintenance (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id           UUID REFERENCES rooms(id) ON DELETE SET NULL,
  issue_type        TEXT NOT NULL CHECK (issue_type IN ('ac', 'plumbing', 'electrical', 'furniture', 'tv', 'internet', 'elevator', 'other')),
  description       TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  reported_by       UUID REFERENCES staff(id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES staff(id) ON DELETE SET NULL,
  images            JSONB DEFAULT '[]',
  resolution_notes  TEXT,
  estimated_cost    NUMERIC(10,2),
  actual_cost       NUMERIC(10,2),
  resolved_at       TIMESTAMPTZ,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_hotel_id ON maintenance(hotel_id);
CREATE INDEX idx_maintenance_room_id ON maintenance(room_id);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_maintenance_priority ON maintenance(priority);

CREATE TRIGGER set_maintenance_updated_at
  BEFORE UPDATE ON maintenance
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 16: NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id          UUID REFERENCES hotels(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('booking_confirmed', 'booking_cancelled', 'payment_received', 'check_in_reminder', 'check_out_reminder', 'review_received', 'low_inventory', 'maintenance_alert', 'general')),
  channel           TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'push')),
  recipient_type    TEXT NOT NULL CHECK (recipient_type IN ('guest', 'owner', 'staff', 'manager')),
  recipient_id      UUID,
  recipient_phone   TEXT,
  recipient_email   TEXT,
  subject           TEXT,
  message           TEXT NOT NULL,
  template_id       TEXT,
  metadata          JSONB DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  failure_reason    TEXT,
  retry_count       SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_hotel_id ON notifications(hotel_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================
-- TABLE 17: WHATSAPP SESSIONS
-- ============================================================
CREATE TABLE whatsapp_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number    TEXT NOT NULL,
  guest_id        UUID REFERENCES guests(id) ON DELETE SET NULL,
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  current_step    TEXT NOT NULL DEFAULT 'start',
  session_data    JSONB DEFAULT '{}',
  message_history JSONB DEFAULT '[]',
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_guest_id ON whatsapp_sessions(guest_id);
CREATE INDEX idx_whatsapp_sessions_is_active ON whatsapp_sessions(is_active);

CREATE TRIGGER set_whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 18: BLOG POSTS
-- ============================================================
CREATE TABLE blog_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  content         TEXT NOT NULL,
  excerpt         TEXT,
  featured_image  TEXT,
  author          TEXT NOT NULL DEFAULT 'Southern Suites Team',
  hotel_id        UUID REFERENCES hotels(id) ON DELETE SET NULL,
  city            TEXT,
  tags            TEXT[] DEFAULT '{}',
  seo_title       TEXT,
  seo_description TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX idx_blog_posts_hotel_id ON blog_posts(hotel_id);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 19: AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id      UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name    TEXT,
  staff_role    TEXT,
  hotel_id      UUID REFERENCES hotels(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_staff_id ON audit_log(staff_id);
CREATE INDEX idx_audit_log_hotel_id ON audit_log(hotel_id);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================
-- TABLE 20: SETTINGS
-- ============================================================
CREATE TABLE settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT,
  is_secret   BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_by  UUID REFERENCES staff(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, key)
);

CREATE INDEX idx_settings_hotel_id ON settings(hotel_id);
CREATE INDEX idx_settings_key ON settings(key);

CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read policies for guest-facing data
CREATE POLICY "hotels_public_read" ON hotels
  FOR SELECT USING (is_active = TRUE AND is_deleted = FALSE);

CREATE POLICY "rooms_public_read" ON rooms
  FOR SELECT USING (is_active = TRUE AND is_deleted = FALSE);

CREATE POLICY "room_images_public_read" ON room_images
  FOR SELECT USING (TRUE);

CREATE POLICY "hotel_images_public_read" ON hotel_images
  FOR SELECT USING (TRUE);

CREATE POLICY "availability_public_read" ON availability
  FOR SELECT USING (TRUE);

CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT USING (is_published = TRUE AND is_deleted = FALSE);

CREATE POLICY "coupons_public_read" ON coupons
  FOR SELECT USING (is_active = TRUE AND is_deleted = FALSE AND valid_until > NOW());

-- Service role full access policies
CREATE POLICY "service_role_hotels" ON hotels
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_rooms" ON rooms
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_room_images" ON room_images
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_hotel_images" ON hotel_images
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_availability" ON availability
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_guests" ON guests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bookings" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_staff" ON staff
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_pricing_rules" ON pricing_rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_coupons" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_loyalty_transactions" ON loyalty_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_reviews" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_housekeeping" ON housekeeping
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_maintenance" ON maintenance
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_whatsapp_sessions" ON whatsapp_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_blog_posts" ON blog_posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_audit_log" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_settings" ON settings
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA: 9 ANDHRA PRADESH HOTELS
-- ============================================================

INSERT INTO hotels (
  name, slug, description, short_description,
  address, city, area, state, pincode,
  phone, whatsapp_number, email,
  star_rating, total_rooms, pms_type,
  check_in_time, check_out_time,
  amenities, is_active
) VALUES

(
  'Southern Suites Vijayawada Central',
  'southern-suites-vijayawada-central',
  'Experience luxury at the heart of Vijayawada. Southern Suites Vijayawada Central offers world-class amenities with warm Andhra hospitality, ideally located near the Krishna River and major business districts.',
  'Premium hotel in the heart of Vijayawada near Krishna River',
  '45-67 MG Road, Gandhi Nagar, Vijayawada',
  'Vijayawada', 'Gandhi Nagar', 'Andhra Pradesh', '520002',
  '+91-866-2345678', '+919866234567', 'vijayawada@southernsuites.in',
  4, 45, 'standalone', '12:00:00', '11:00:00',
  '["Free WiFi","AC","Room Service","Restaurant","Parking","Laundry","Power Backup","CCTV"]',
  TRUE
),

(
  'Southern Suites Visakhapatnam Beach',
  'southern-suites-visakhapatnam-beach',
  'Wake up to the sound of the Bay of Bengal at Southern Suites Visakhapatnam Beach. Located steps from the iconic Ramakrishna Beach, this property blends coastal charm with modern luxury.',
  'Beachfront hotel steps from Ramakrishna Beach Vizag',
  '12 Beach Road, MVP Colony, Visakhapatnam',
  'Visakhapatnam', 'MVP Colony', 'Andhra Pradesh', '530017',
  '+91-891-2345678', '+919891234567', 'vizag@southernsuites.in',
  4, 52, 'standalone', '12:00:00', '11:00:00',
  '["Sea View Rooms","Free WiFi","AC","Swimming Pool","Restaurant","Bar","Parking","Spa","Gym"]',
  TRUE
),

(
  'Southern Suites Tirupati Pilgrim',
  'southern-suites-tirupati-pilgrim',
  'The most trusted hotel for pilgrims and travellers visiting the sacred Tirumala Venkateswara Temple. Southern Suites Tirupati offers a peaceful, clean, and comfortable stay with pure vegetarian dining.',
  'Trusted pilgrim hotel near Tirupati temple town',
  '88 TP Area, Tiruchanoor Road, Tirupati',
  'Tirupati', 'TP Area', 'Andhra Pradesh', '517501',
  '+91-877-2345678', '+919877234567', 'tirupati@southernsuites.in',
  3, 60, 'standalone', '06:00:00', '11:00:00',
  '["Pure Veg Restaurant","Free WiFi","AC","Prasadam Counter","Luggage Storage","Parking","Power Backup","Laundry"]',
  TRUE
),

(
  'Southern Suites Guntur Business',
  'southern-suites-guntur-business',
  'The preferred business hotel in Guntur, ideally positioned for corporate travellers visiting the textile and trading hub. Modern rooms, high-speed internet, and efficient conference facilities.',
  'Premier business hotel in Guntur city centre',
  '23 Arundalpet, Main Road, Guntur',
  'Guntur', 'Arundalpet', 'Andhra Pradesh', '522002',
  '+91-863-2345678', '+919863234567', 'guntur@southernsuites.in',
  3, 38, 'standalone', '12:00:00', '11:00:00',
  '["Free WiFi","AC","Conference Hall","Restaurant","Parking","Room Service","Power Backup","Laundry"]',
  TRUE
),

(
  'Southern Suites Nellore Highway',
  'southern-suites-nellore-highway',
  'Strategically located on NH-16, Southern Suites Nellore Highway is the ideal stop for highway travellers, business visitors, and those exploring the prawn capital of India.',
  'Modern highway hotel on NH-16 Nellore',
  '156 NH-16, Muthukur Road, Nellore',
  'Nellore', 'Muthukur Road', 'Andhra Pradesh', '524004',
  '+91-861-2345678', '+919861234567', 'nellore@southernsuites.in',
  3, 35, 'standalone', '12:00:00', '11:00:00',
  '["Free WiFi","AC","Restaurant","Parking","24hr Reception","Power Backup","Room Service","CCTV"]',
  TRUE
),

(
  'Southern Suites Kurnool Grand',
  'southern-suites-kurnool-grand',
  'The grandest hotel in Kurnool, serving as the gateway to Belum Caves and Srisailam. Southern Suites Kurnool Grand combines regal interiors with modern comfort for a memorable stay.',
  'Grand heritage-style hotel in Kurnool city',
  '67 College Road, Kurnool',
  'Kurnool', 'College Road', 'Andhra Pradesh', '518002',
  '+91-8518-234567', '+919518234567', 'kurnool@southernsuites.in',
  4, 42, 'standalone', '12:00:00', '11:00:00',
  '["Free WiFi","AC","Restaurant","Banquet Hall","Parking","Room Service","Power Backup","Garden"]',
  TRUE
),

(
  'Southern Suites Kakinada Port',
  'southern-suites-kakinada-port',
  'Serving the booming port city of Kakinada, this property caters to oil and gas professionals, shipping executives, and leisure travellers discovering the pristine Kakinada Beach.',
  'Corporate hotel serving Kakinada port and oil sector',
  '34 Jawahar Street, Main Road, Kakinada',
  'Kakinada', 'Jawahar Street', 'Andhra Pradesh', '533001',
  '+91-884-2345678', '+919884234567', 'kakinada@southernsuites.in',
  3, 40, 'standalone', '12:00:00', '11:00:00',
  '["Free WiFi","AC","Restaurant","Conference Room","Parking","Room Service","Power Backup","Laundry"]',
  TRUE
),

(
  'Southern Suites Rajahmundry Heritage',
  'southern-suites-rajahmundry-heritage',
  'Overlooking the majestic Godavari River, Southern Suites Rajahmundry Heritage blends the cultural richness of the cultural capital of Andhra Pradesh with modern hospitality.',
  'Heritage hotel with Godavari River views in Rajahmundry',
  '12 Godavari Bund Road, Innespeta, Rajahmundry',
  'Rajahmundry', 'Innespeta', 'Andhra Pradesh', '533101',
  '+91-883-2345678', '+919883234567', 'rajahmundry@southernsuites.in',
  4, 48, 'standalone', '12:00:00', '11:00:00',
  '["River View Rooms","Free WiFi","AC","Restaurant","Parking","Room Service","Power Backup","Conference Hall"]',
  TRUE
),

(
  'Southern Suites Kadapa Executive',
  'southern-suites-kadapa-executive',
  'The most modern hotel in Kadapa, serving travellers exploring the historic Bramaramba Maleswara Swamy temple and the granite rich Rayalaseema region. Business and leisure made comfortable.',
  'Modern executive hotel in Kadapa Rayalaseema region',
  '89 Gandhi Nagar, Kadapa',
  'Kadapa', 'Gandhi Nagar', 'Andhra Pradesh', '516002',
  '+91-8562-234567', '+919562234567', 'kadapa@southernsuites.in',
  3, 36, 'standalone', '12:00:00', '11:00:00',
  '["Free WiFi","AC","Restaurant","Parking","Room Service","Power Backup","Laundry","CCTV"]',
  TRUE
);

-- ============================================================
-- SEED DEFAULT STAFF: SUPERADMIN
-- ============================================================
-- Password: Admin@123 (bcrypt hashed — replace in production)
INSERT INTO staff (name, email, phone, password_hash, role)
VALUES (
  'Southern Suites Admin',
  'admin@southernsuites.in',
  '+919000000000',
  '$2b$12$placeholderhashreplacebeforegoingliveinproduction12345',
  'superadmin'
);

-- ============================================================
-- SEED GLOBAL SETTINGS
-- ============================================================
INSERT INTO settings (hotel_id, key, value, is_secret, description) VALUES
(NULL, 'site_name', 'Southern Suites', FALSE, 'Website name'),
(NULL, 'site_tagline', 'Your Home Across Andhra Pradesh', FALSE, 'Website tagline'),
(NULL, 'support_email', 'support@southernsuites.in', FALSE, 'Support email'),
(NULL, 'support_phone', '+919000000001', FALSE, 'Support phone'),
(NULL, 'gst_rate_below_2500', '12', FALSE, 'GST rate for rooms below 2500'),
(NULL, 'gst_rate_above_2500', '18', FALSE, 'GST rate for rooms above 2500'),
(NULL, 'loyalty_points_per_rupee', '1', FALSE, 'Points earned per rupee spent'),
(NULL, 'loyalty_redemption_rate', '0.5', FALSE, 'Rupee value per point'),
(NULL, 'loyalty_silver_threshold', '0', FALSE, 'Min stays for silver'),
(NULL, 'loyalty_gold_threshold', '4', FALSE, 'Min stays for gold'),
(NULL, 'loyalty_platinum_threshold', '9', FALSE, 'Min stays for platinum'),
(NULL, 'razorpay_key_id', '', TRUE, 'Razorpay Key ID'),
(NULL, 'razorpay_key_secret', '', TRUE, 'Razorpay Key Secret'),
(NULL, 'whatsapp_api_token', '', TRUE, 'WhatsApp Business API Token'),
(NULL, 'whatsapp_phone_id', '', TRUE, 'WhatsApp Phone ID'),
(NULL, 'resend_api_key', '', TRUE, 'Resend Email API Key'),
(NULL, 'google_places_api_key', '', TRUE, 'Google Places API Key'),
(NULL, 'cancellation_hours', '24', FALSE, 'Hours before checkin for free cancellation'),
(NULL, 'currency', 'INR', FALSE, 'Default currency'),
(NULL, 'timezone', 'Asia/Kolkata', FALSE, 'Default timezone');

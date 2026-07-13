-- Performance indexes for StaySpace
ALTER TABLE Properties ADD INDEX IF NOT EXISTS idx_property_type (property_type);
ALTER TABLE Properties ADD INDEX IF NOT EXISTS idx_max_guests (max_guests);
ALTER TABLE Properties ADD INDEX IF NOT EXISTS idx_address (address(100));
ALTER TABLE Properties ADD INDEX IF NOT EXISTS idx_created_at (created_at);
ALTER TABLE Bookings ADD INDEX IF NOT EXISTS idx_guest_id (guest_id);
ALTER TABLE Bookings ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE Bookings ADD INDEX IF NOT EXISTS idx_property_id (property_id);
ALTER TABLE Reviews ADD INDEX IF NOT EXISTS idx_guest_id (guest_id);
ALTER TABLE Wishlist ADD INDEX IF NOT EXISTS idx_guest (guest_id);
ALTER TABLE Wishlist ADD INDEX IF NOT EXISTS idx_property (property_id);
ALTER TABLE Notifications ADD INDEX IF NOT EXISTS idx_is_read (is_read);
ALTER TABLE Payments ADD INDEX IF NOT EXISTS idx_booking_id (booking_id);
ALTER TABLE Payments ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE Complaints ADD INDEX IF NOT EXISTS idx_user_id (user_id);
ALTER TABLE Users ADD INDEX IF NOT EXISTS idx_role (role);
ALTER TABLE Hosts ADD INDEX IF NOT EXISTS idx_approved (is_approved);

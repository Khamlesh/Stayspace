#ifndef BOOKING_H
#define BOOKING_H

#include <string>

class BookingModule {
public:
    // Core booking operations
    static std::string createBooking(const std::string& token, int propertyId, const std::string& checkIn, const std::string& checkOut);
    static std::string cancelBooking(const std::string& token, int bookingId);
    static std::string confirmBooking(const std::string& token, int bookingId);

    // Query operations
    static std::string getBookingDetails(const std::string& token, int bookingId);
    static std::string getGuestBookings(const std::string& token);
    static std::string getHostBookings(const std::string& token);

private:
    // Helper: check if dates overlap with an existing confirmed/pending booking
    static bool hasDateConflict(int propertyId, const std::string& checkIn, const std::string& checkOut, int excludeBookingId = -1);
    // Helper: calculate number of nights between two date strings (YYYY-MM-DD)
    static int calculateNights(const std::string& checkIn, const std::string& checkOut);
    // Helper: validate date format YYYY-MM-DD
    static bool isValidDate(const std::string& dateStr);
};

#endif

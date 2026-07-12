#include "Booking.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>
#include <cstdlib>

// ===================== Helpers =====================

bool BookingModule::isValidDate(const std::string& dateStr) {
    // Expected format: YYYY-MM-DD
    if (dateStr.length() != 10) return false;
    if (dateStr[4] != '-' || dateStr[7] != '-') return false;
    for (int i = 0; i < 10; i++) {
        if (i == 4 || i == 7) continue;
        if (dateStr[i] < '0' || dateStr[i] > '9') return false;
    }
    int year = std::atoi(dateStr.substr(0, 4).c_str());
    int month = std::atoi(dateStr.substr(5, 2).c_str());
    int day = std::atoi(dateStr.substr(8, 2).c_str());
    if (year < 2020 || year > 2099) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
}

int BookingModule::calculateNights(const std::string& checkIn, const std::string& checkOut) {
    // Use MySQL to calculate the difference via a query for accuracy
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) return -1;
    try {
        std::string q = "SELECT DATEDIFF('" + conn->escapeString(checkOut) + "', '" + conn->escapeString(checkIn) + "') AS nights";
        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(q));
        if (res && res->next()) {
            return res->getInt("nights");
        }
    } catch (...) {}
    return -1;
}

bool BookingModule::hasDateConflict(int propertyId, const std::string& checkIn, const std::string& checkOut, int excludeBookingId) {
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) return true; // fail safe — assume conflict

    try {
        std::string sql = "SELECT COUNT(*) AS cnt FROM Bookings "
                          "WHERE property_id = ? "
                          "AND status != 'Cancelled' "
                          "AND check_in < ? AND check_out > ?";
        if (excludeBookingId > 0) {
            sql += " AND id != ?";
        }

        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(sql));
        stmt->setInt(1, propertyId);
        stmt->setString(2, checkOut);  // existing check_in < new check_out
        stmt->setString(3, checkIn);   // existing check_out > new check_in
        if (excludeBookingId > 0) {
            stmt->setInt(4, excludeBookingId);
        }
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());
        if (res && res->next()) {
            return res->getInt("cnt") > 0;
        }
    } catch (...) {}
    return true; // fail safe
}

// ===================== Core Operations =====================

std::string BookingModule::createBooking(const std::string& token, int propertyId, const std::string& checkIn, const std::string& checkOut) {
    // Only guests can create bookings
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "You must be logged in as a Guest to book a property.");
    }

    // Validate dates
    if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
        return JsonParser::makeResponse("error", "Invalid date format. Use YYYY-MM-DD.");
    }
    if (checkIn >= checkOut) {
        return JsonParser::makeResponse("error", "Check-out date must be after check-in date.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Verify property exists and get price
        std::unique_ptr<sql::PreparedStatement> propStmt(conn->prepareStatement(
            "SELECT id, price_per_night, host_id FROM Properties WHERE id = ?"));
        propStmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> propRes(propStmt->executeQuery());

        if (!propRes || !propRes->next()) {
            return JsonParser::makeResponse("error", "Property not found.");
        }

        double pricePerNight = propRes->getDouble("price_per_night");

        // Check for date conflicts
        if (hasDateConflict(propertyId, checkIn, checkOut)) {
            return JsonParser::makeResponse("error", "Property is not available for the selected dates. Dates conflict with an existing booking.");
        }

        // Calculate total price
        int nights = calculateNights(checkIn, checkOut);
        if (nights <= 0) {
            return JsonParser::makeResponse("error", "Invalid date range. Must be at least one night.");
        }
        double totalPrice = pricePerNight * nights;

        // Insert booking with Pending status
        std::unique_ptr<sql::PreparedStatement> bookStmt(conn->prepareStatement(
            "INSERT INTO Bookings (property_id, guest_id, check_in, check_out, total_price, status) "
            "VALUES (?, ?, ?, ?, ?, 'Pending')"));
        bookStmt->setInt(1, propertyId);
        bookStmt->setInt(2, guestId);
        bookStmt->setString(3, checkIn);
        bookStmt->setString(4, checkOut);
        bookStmt->setDouble(5, totalPrice);

        if (bookStmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to create booking.");
        }

        unsigned long long bookingId = conn->getLastInsertId();

        // Create a notification for the host
        int hostId = propRes->getInt("host_id");
        // Look up host user_id for notification
        std::unique_ptr<sql::PreparedStatement> hostStmt(conn->prepareStatement(
            "SELECT user_id FROM Hosts WHERE id = ?"));
        hostStmt->setInt(1, hostId);
        std::unique_ptr<sql::ResultSet> hostRes(hostStmt->executeQuery());
        if (hostRes && hostRes->next()) {
            int hostUserId = hostRes->getInt("user_id");
            std::unique_ptr<sql::PreparedStatement> notifStmt(conn->prepareStatement(
                "INSERT INTO Notifications (user_id, message) VALUES (?, ?)"));
            notifStmt->setInt(1, hostUserId);
            std::string notifMsg = "New booking request #" + std::to_string(bookingId) + " for your property (ID: " + std::to_string(propertyId) + ") from " + checkIn + " to " + checkOut + ".";
            notifStmt->setString(2, notifMsg);
            notifStmt->executeUpdate();
        }

        // Build response
        std::stringstream ss;
        ss << "{\"booking_id\":" << bookingId
           << ",\"property_id\":" << propertyId
           << ",\"check_in\":\"" << checkIn << "\""
           << ",\"check_out\":\"" << checkOut << "\""
           << ",\"nights\":" << nights
           << ",\"total_price\":" << totalPrice
           << ",\"status\":\"Pending\"}";

        return JsonParser::makeResponse("success", "Booking created successfully. Status: Pending.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string BookingModule::cancelBooking(const std::string& token, int bookingId) {
    int userId = Auth::getUserIdFromToken(token);
    bool isUserAdmin = Auth::isAdmin(token);
    int guestId = Auth::getGuestIdFromToken(token);
    int hostId = Auth::getHostIdFromToken(token);

    if (userId == -1) {
        return JsonParser::makeResponse("error", "Unauthorized. Please log in.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Fetch booking details
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT b.guest_id, b.status, p.host_id FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "WHERE b.id = ?"));
        stmt->setInt(1, bookingId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "Booking not found.");
        }

        int bookingGuestId = res->getInt("guest_id");
        std::string currentStatus = res->getString("status");
        int bookingHostId = res->getInt("host_id");

        if (currentStatus == "Cancelled") {
            return JsonParser::makeResponse("error", "Booking is already cancelled.");
        }

        // Authorization: guest who booked, host who owns property, or admin
        bool authorized = isUserAdmin || (guestId == bookingGuestId) || (hostId == bookingHostId);
        if (!authorized) {
            return JsonParser::makeResponse("error", "You are not authorized to cancel this booking.");
        }

        // Update status to Cancelled
        std::unique_ptr<sql::PreparedStatement> updateStmt(conn->prepareStatement(
            "UPDATE Bookings SET status = 'Cancelled' WHERE id = ?"));
        updateStmt->setInt(1, bookingId);

        if (updateStmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to cancel booking.");
        }

        // Notify the guest about cancellation
        std::unique_ptr<sql::PreparedStatement> guestUserStmt(conn->prepareStatement(
            "SELECT user_id FROM Guests WHERE id = ?"));
        guestUserStmt->setInt(1, bookingGuestId);
        std::unique_ptr<sql::ResultSet> guestUserRes(guestUserStmt->executeQuery());
        if (guestUserRes && guestUserRes->next()) {
            int guestUserId = guestUserRes->getInt("user_id");
            // Don't notify if the guest cancelled it themselves
            if (guestUserId != userId) {
                std::unique_ptr<sql::PreparedStatement> notifStmt(conn->prepareStatement(
                    "INSERT INTO Notifications (user_id, message) VALUES (?, ?)"));
                notifStmt->setInt(1, guestUserId);
                std::string notifMsg = "Your booking #" + std::to_string(bookingId) + " has been cancelled.";
                notifStmt->setString(2, notifMsg);
                notifStmt->executeUpdate();
            }
        }

        return JsonParser::makeResponse("success", "Booking #" + std::to_string(bookingId) + " cancelled successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string BookingModule::confirmBooking(const std::string& token, int bookingId) {
    int hostId = Auth::getHostIdFromToken(token);
    bool isUserAdmin = Auth::isAdmin(token);

    if (hostId == -1 && !isUserAdmin) {
        return JsonParser::makeResponse("error", "Only hosts and admins can confirm bookings.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Fetch booking and verify ownership
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT b.status, b.guest_id, p.host_id FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "WHERE b.id = ?"));
        stmt->setInt(1, bookingId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "Booking not found.");
        }

        std::string currentStatus = res->getString("status");
        int bookingHostId = res->getInt("host_id");
        int bookingGuestId = res->getInt("guest_id");

        if (currentStatus != "Pending") {
            return JsonParser::makeResponse("error", "Only pending bookings can be confirmed. Current status: " + currentStatus);
        }

        // Host must own the property
        if (!isUserAdmin && hostId != bookingHostId) {
            return JsonParser::makeResponse("error", "You are not the host of this property.");
        }

        // Update to Confirmed
        std::unique_ptr<sql::PreparedStatement> updateStmt(conn->prepareStatement(
            "UPDATE Bookings SET status = 'Confirmed' WHERE id = ?"));
        updateStmt->setInt(1, bookingId);

        if (updateStmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to confirm booking.");
        }

        // Notify the guest
        std::unique_ptr<sql::PreparedStatement> guestUserStmt(conn->prepareStatement(
            "SELECT user_id FROM Guests WHERE id = ?"));
        guestUserStmt->setInt(1, bookingGuestId);
        std::unique_ptr<sql::ResultSet> guestUserRes(guestUserStmt->executeQuery());
        if (guestUserRes && guestUserRes->next()) {
            int guestUserId = guestUserRes->getInt("user_id");
            std::unique_ptr<sql::PreparedStatement> notifStmt(conn->prepareStatement(
                "INSERT INTO Notifications (user_id, message) VALUES (?, ?)"));
            notifStmt->setInt(1, guestUserId);
            std::string notifMsg = "Your booking #" + std::to_string(bookingId) + " has been confirmed! Get ready for your trip.";
            notifStmt->setString(2, notifMsg);
            notifStmt->executeUpdate();
        }

        return JsonParser::makeResponse("success", "Booking #" + std::to_string(bookingId) + " confirmed successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

// ===================== Query Operations =====================

std::string BookingModule::getBookingDetails(const std::string& token, int bookingId) {
    int userId = Auth::getUserIdFromToken(token);
    if (userId == -1) {
        return JsonParser::makeResponse("error", "Unauthorized. Please log in.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT b.id, b.property_id, b.guest_id, b.check_in, b.check_out, b.total_price, b.status, b.created_at, "
            "p.title AS property_title, p.address AS property_address, p.price_per_night, "
            "u_guest.name AS guest_name, u_guest.email AS guest_email "
            "FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "JOIN Guests g ON b.guest_id = g.id "
            "JOIN Users u_guest ON g.user_id = u_guest.id "
            "WHERE b.id = ?"));
        stmt->setInt(1, bookingId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "Booking not found.");
        }

        std::stringstream ss;
        ss << "{\"id\":" << res->getInt("id")
           << ",\"property_id\":" << res->getInt("property_id")
           << ",\"property_title\":\"" << JsonParser::escape(res->getString("property_title")) << "\""
           << ",\"property_address\":\"" << JsonParser::escape(res->getString("property_address")) << "\""
           << ",\"price_per_night\":" << res->getDouble("price_per_night")
           << ",\"guest_id\":" << res->getInt("guest_id")
           << ",\"guest_name\":\"" << JsonParser::escape(res->getString("guest_name")) << "\""
           << ",\"guest_email\":\"" << JsonParser::escape(res->getString("guest_email")) << "\""
           << ",\"check_in\":\"" << res->getString("check_in") << "\""
           << ",\"check_out\":\"" << res->getString("check_out") << "\""
           << ",\"total_price\":" << res->getDouble("total_price")
           << ",\"status\":\"" << res->getString("status") << "\""
           << ",\"created_at\":\"" << res->getString("created_at") << "\"}";

        return JsonParser::makeResponse("success", "Booking details fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string BookingModule::getGuestBookings(const std::string& token) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "Guest session is unauthorized or expired.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT b.id, b.property_id, b.check_in, b.check_out, b.total_price, b.status, b.created_at, "
            "p.title AS property_title, p.address AS property_address "
            "FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "WHERE b.guest_id = ? "
            "ORDER BY b.id DESC"));
        stmt->setInt(1, guestId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"id\":" << res->getInt("id")
               << ",\"property_id\":" << res->getInt("property_id")
               << ",\"property_title\":\"" << JsonParser::escape(res->getString("property_title")) << "\""
               << ",\"property_address\":\"" << JsonParser::escape(res->getString("property_address")) << "\""
               << ",\"check_in\":\"" << res->getString("check_in") << "\""
               << ",\"check_out\":\"" << res->getString("check_out") << "\""
               << ",\"total_price\":" << res->getDouble("total_price")
               << ",\"status\":\"" << res->getString("status") << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Guest bookings fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string BookingModule::getHostBookings(const std::string& token) {
    int hostId = Auth::getHostIdFromToken(token);
    if (hostId == -1) {
        return JsonParser::makeResponse("error", "Host session is unauthorized, unapproved, or expired.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT b.id, b.property_id, b.guest_id, b.check_in, b.check_out, b.total_price, b.status, b.created_at, "
            "p.title AS property_title, "
            "u_guest.name AS guest_name, u_guest.email AS guest_email "
            "FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "JOIN Guests g ON b.guest_id = g.id "
            "JOIN Users u_guest ON g.user_id = u_guest.id "
            "WHERE p.host_id = ? "
            "ORDER BY b.id DESC"));
        stmt->setInt(1, hostId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"id\":" << res->getInt("id")
               << ",\"property_id\":" << res->getInt("property_id")
               << ",\"property_title\":\"" << JsonParser::escape(res->getString("property_title")) << "\""
               << ",\"guest_id\":" << res->getInt("guest_id")
               << ",\"guest_name\":\"" << JsonParser::escape(res->getString("guest_name")) << "\""
               << ",\"guest_email\":\"" << JsonParser::escape(res->getString("guest_email")) << "\""
               << ",\"check_in\":\"" << res->getString("check_in") << "\""
               << ",\"check_out\":\"" << res->getString("check_out") << "\""
               << ",\"total_price\":" << res->getDouble("total_price")
               << ",\"status\":\"" << res->getString("status") << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Host bookings fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

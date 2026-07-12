#include "Report.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>
#include <fstream>
#include <ctime>
#include <iomanip>
#include <direct.h>

bool ReportModule::isValidFormat(const std::string& format) {
    return format == "txt" || format == "csv";
}

// ===================== Booking Report =====================

std::string ReportModule::generateBookingReport(const std::string& token, const std::string& format) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can generate reports.");
    }
    if (!isValidFormat(format)) {
        return JsonParser::makeResponse("error", "Invalid format. Use 'txt' or 'csv'.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        _mkdir("Reports");
        time_t now = time(0);
        std::string filename = "Reports/booking_report_" + std::to_string(now) + "." + format;
        std::ofstream file(filename);
        if (!file.is_open()) {
            return JsonParser::makeResponse("error", "Failed to create report file.");
        }

        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(
            "SELECT b.id, b.property_id, b.guest_id, b.check_in, b.check_out, b.total_price, b.status, b.created_at, "
            "p.title AS property_title, u.name AS guest_name "
            "FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "JOIN Guests g ON b.guest_id = g.id "
            "JOIN Users u ON g.user_id = u.id "
            "ORDER BY b.id DESC"));

        if (format == "csv") {
            file << "Booking ID,Property ID,Property Title,Guest ID,Guest Name,Check-In,Check-Out,Total Price,Status,Created At" << std::endl;
            while (res && res->next()) {
                file << res->getInt("id") << ","
                     << res->getInt("property_id") << ","
                     << "\"" << res->getString("property_title") << "\","
                     << res->getInt("guest_id") << ","
                     << "\"" << res->getString("guest_name") << "\","
                     << res->getString("check_in") << ","
                     << res->getString("check_out") << ","
                     << res->getDouble("total_price") << ","
                     << res->getString("status") << ","
                     << res->getString("created_at") << std::endl;
            }
        } else {
            file << "=====================================================" << std::endl;
            file << "           STAYSPACE BOOKING REPORT                   " << std::endl;
            file << "=====================================================" << std::endl;
            char dateBuffer[64];
            struct tm* ltm = localtime(&now);
            strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d %H:%M:%S", ltm);
            file << "  Generated: " << dateBuffer << std::endl;
            file << "=====================================================" << std::endl << std::endl;

            while (res && res->next()) {
                file << "  Booking #" << res->getInt("id") << std::endl;
                file << "    Property  : " << res->getString("property_title") << " (ID: " << res->getInt("property_id") << ")" << std::endl;
                file << "    Guest     : " << res->getString("guest_name") << " (ID: " << res->getInt("guest_id") << ")" << std::endl;
                file << "    Dates     : " << res->getString("check_in") << " to " << res->getString("check_out") << std::endl;
                file << std::fixed << std::setprecision(2);
                file << "    Total     : ₹" << res->getDouble("total_price") << std::endl;
                file << "    Status    : " << res->getString("status") << std::endl;
                file << "    Created   : " << res->getString("created_at") << std::endl;
                file << "-----------------------------------------------------" << std::endl;
            }
        }

        file.close();

        // Log the report in the database
        std::unique_ptr<sql::PreparedStatement> logStmt(conn->prepareStatement(
            "INSERT INTO Reports (type, path) VALUES ('Analytics', ?)"));
        logStmt->setString(1, filename);
        logStmt->executeUpdate();

        std::stringstream ss;
        ss << "{\"report_path\":\"" << JsonParser::escape(filename) << "\"}";
        return JsonParser::makeResponse("success", "Booking report generated.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

// ===================== Revenue Report =====================

std::string ReportModule::generateRevenueReport(const std::string& token, const std::string& format) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can generate reports.");
    }
    if (!isValidFormat(format)) {
        return JsonParser::makeResponse("error", "Invalid format. Use 'txt' or 'csv'.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        _mkdir("Reports");
        time_t now = time(0);
        std::string filename = "Reports/revenue_report_" + std::to_string(now) + "." + format;
        std::ofstream file(filename);
        if (!file.is_open()) {
            return JsonParser::makeResponse("error", "Failed to create report file.");
        }

        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(
            "SELECT p.id, p.booking_id, p.amount, p.payment_method, p.status, p.transaction_id, p.created_at "
            "FROM Payments p ORDER BY p.id DESC"));

        // Total revenue
        std::unique_ptr<sql::ResultSet> totalRes(conn->executeQuery(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM Payments WHERE status = 'Success'"));
        double totalRevenue = 0;
        if (totalRes && totalRes->next()) totalRevenue = totalRes->getDouble("total");

        if (format == "csv") {
            file << "Payment ID,Booking ID,Amount,Payment Method,Status,Transaction ID,Created At" << std::endl;
            while (res && res->next()) {
                file << res->getInt("id") << ","
                     << res->getInt("booking_id") << ","
                     << res->getDouble("amount") << ","
                     << "\"" << res->getString("payment_method") << "\","
                     << res->getString("status") << ","
                     << res->getString("transaction_id") << ","
                     << res->getString("created_at") << std::endl;
            }
            file << std::endl << "Total Revenue," << totalRevenue << std::endl;
        } else {
            file << "=====================================================" << std::endl;
            file << "           STAYSPACE REVENUE REPORT                   " << std::endl;
            file << "=====================================================" << std::endl;
            char dateBuffer[64];
            struct tm* ltm = localtime(&now);
            strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d %H:%M:%S", ltm);
            file << "  Generated: " << dateBuffer << std::endl;
            file << std::fixed << std::setprecision(2);
            file << "  Total Revenue: ₹" << totalRevenue << std::endl;
            file << "=====================================================" << std::endl << std::endl;

            while (res && res->next()) {
                file << "  Payment #" << res->getInt("id") << std::endl;
                file << "    Booking ID    : " << res->getInt("booking_id") << std::endl;
                file << "    Amount        : ₹" << res->getDouble("amount") << std::endl;
                file << "    Method        : " << res->getString("payment_method") << std::endl;
                file << "    Status        : " << res->getString("status") << std::endl;
                file << "    Transaction   : " << res->getString("transaction_id") << std::endl;
                file << "    Date          : " << res->getString("created_at") << std::endl;
                file << "-----------------------------------------------------" << std::endl;
            }
        }

        file.close();

        std::unique_ptr<sql::PreparedStatement> logStmt(conn->prepareStatement(
            "INSERT INTO Reports (type, path) VALUES ('Revenue', ?)"));
        logStmt->setString(1, filename);
        logStmt->executeUpdate();

        std::stringstream ss;
        ss << "{\"report_path\":\"" << JsonParser::escape(filename) << "\",\"total_revenue\":" << totalRevenue << "}";
        return JsonParser::makeResponse("success", "Revenue report generated.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

// ===================== Host Earnings Report =====================

std::string ReportModule::generateHostEarningsReport(const std::string& token, const std::string& format) {
    // Can be generated by host (for their own) or admin (for all)
    bool isUserAdmin = Auth::isAdmin(token);
    int hostId = Auth::getHostIdFromToken(token);

    if (!isUserAdmin && hostId == -1) {
        return JsonParser::makeResponse("error", "Only hosts and admins can generate earnings reports.");
    }
    if (!isValidFormat(format)) {
        return JsonParser::makeResponse("error", "Invalid format. Use 'txt' or 'csv'.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        _mkdir("Reports");
        time_t now = time(0);
        std::string filename = "Reports/host_earnings_" + std::to_string(now) + "." + format;
        std::ofstream file(filename);
        if (!file.is_open()) {
            return JsonParser::makeResponse("error", "Failed to create report file.");
        }

        std::string query;
        if (isUserAdmin) {
            // All hosts
            query = "SELECT u.name AS host_name, u.email AS host_email, "
                    "COALESCE(SUM(pay.amount), 0) AS total_earnings, COUNT(DISTINCT b.id) AS total_bookings "
                    "FROM Hosts h "
                    "JOIN Users u ON h.user_id = u.id "
                    "LEFT JOIN Properties p ON p.host_id = h.id "
                    "LEFT JOIN Bookings b ON b.property_id = p.id AND b.status = 'Confirmed' "
                    "LEFT JOIN Payments pay ON pay.booking_id = b.id AND pay.status = 'Success' "
                    "GROUP BY h.id, u.name, u.email "
                    "ORDER BY total_earnings DESC";
        } else {
            // Just this host
            query = "SELECT u.name AS host_name, u.email AS host_email, "
                    "COALESCE(SUM(pay.amount), 0) AS total_earnings, COUNT(DISTINCT b.id) AS total_bookings "
                    "FROM Hosts h "
                    "JOIN Users u ON h.user_id = u.id "
                    "LEFT JOIN Properties p ON p.host_id = h.id "
                    "LEFT JOIN Bookings b ON b.property_id = p.id AND b.status = 'Confirmed' "
                    "LEFT JOIN Payments pay ON pay.booking_id = b.id AND pay.status = 'Success' "
                    "WHERE h.id = " + std::to_string(hostId) + " "
                    "GROUP BY h.id, u.name, u.email";
        }

        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(query));

        if (format == "csv") {
            file << "Host Name,Email,Total Earnings,Total Bookings" << std::endl;
            while (res && res->next()) {
                file << "\"" << res->getString("host_name") << "\","
                     << res->getString("host_email") << ","
                     << res->getDouble("total_earnings") << ","
                     << res->getInt("total_bookings") << std::endl;
            }
        } else {
            file << "=====================================================" << std::endl;
            file << "           STAYSPACE HOST EARNINGS REPORT             " << std::endl;
            file << "=====================================================" << std::endl;
            char dateBuffer[64];
            struct tm* ltm = localtime(&now);
            strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d %H:%M:%S", ltm);
            file << "  Generated: " << dateBuffer << std::endl;
            file << "=====================================================" << std::endl << std::endl;

            while (res && res->next()) {
                file << "  Host: " << res->getString("host_name") << " (" << res->getString("host_email") << ")" << std::endl;
                file << std::fixed << std::setprecision(2);
                file << "    Total Earnings  : ₹" << res->getDouble("total_earnings") << std::endl;
                file << "    Total Bookings  : " << res->getInt("total_bookings") << std::endl;
                file << "-----------------------------------------------------" << std::endl;
            }
        }

        file.close();

        std::unique_ptr<sql::PreparedStatement> logStmt(conn->prepareStatement(
            "INSERT INTO Reports (type, path) VALUES ('Earnings', ?)"));
        logStmt->setString(1, filename);
        logStmt->executeUpdate();

        std::stringstream ss;
        ss << "{\"report_path\":\"" << JsonParser::escape(filename) << "\"}";
        return JsonParser::makeResponse("success", "Host earnings report generated.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

// ===================== Property Report =====================

std::string ReportModule::generatePropertyReport(const std::string& token, const std::string& format) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can generate reports.");
    }
    if (!isValidFormat(format)) {
        return JsonParser::makeResponse("error", "Invalid format. Use 'txt' or 'csv'.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        _mkdir("Reports");
        time_t now = time(0);
        std::string filename = "Reports/property_report_" + std::to_string(now) + "." + format;
        std::ofstream file(filename);
        if (!file.is_open()) {
            return JsonParser::makeResponse("error", "Failed to create report file.");
        }

        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(
            "SELECT p.id, p.title, p.address, p.price_per_night, p.max_guests, p.created_at, "
            "u.name AS host_name, "
            "COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(r.id) AS review_count "
            "FROM Properties p "
            "JOIN Hosts h ON p.host_id = h.id "
            "JOIN Users u ON h.user_id = u.id "
            "LEFT JOIN Reviews r ON r.property_id = p.id "
            "GROUP BY p.id, p.title, p.address, p.price_per_night, p.max_guests, p.created_at, u.name "
            "ORDER BY p.id DESC"));

        if (format == "csv") {
            file << "Property ID,Title,Address,Price/Night,Max Guests,Host,Avg Rating,Reviews,Created At" << std::endl;
            while (res && res->next()) {
                file << res->getInt("id") << ","
                     << "\"" << res->getString("title") << "\","
                     << "\"" << res->getString("address") << "\","
                     << res->getDouble("price_per_night") << ","
                     << res->getInt("max_guests") << ","
                     << "\"" << res->getString("host_name") << "\","
                     << res->getDouble("avg_rating") << ","
                     << res->getInt("review_count") << ","
                     << res->getString("created_at") << std::endl;
            }
        } else {
            file << "=====================================================" << std::endl;
            file << "           STAYSPACE PROPERTY REPORT                  " << std::endl;
            file << "=====================================================" << std::endl;
            char dateBuffer[64];
            struct tm* ltm = localtime(&now);
            strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d %H:%M:%S", ltm);
            file << "  Generated: " << dateBuffer << std::endl;
            file << "=====================================================" << std::endl << std::endl;

            while (res && res->next()) {
                file << "  Property #" << res->getInt("id") << ": " << res->getString("title") << std::endl;
                file << "    Address       : " << res->getString("address") << std::endl;
                file << std::fixed << std::setprecision(2);
                file << "    Price/Night   : ₹" << res->getDouble("price_per_night") << std::endl;
                file << "    Max Guests    : " << res->getInt("max_guests") << std::endl;
                file << "    Host          : " << res->getString("host_name") << std::endl;
                file << "    Avg Rating    : " << res->getDouble("avg_rating") << " (" << res->getInt("review_count") << " reviews)" << std::endl;
                file << "-----------------------------------------------------" << std::endl;
            }
        }

        file.close();

        std::unique_ptr<sql::PreparedStatement> logStmt(conn->prepareStatement(
            "INSERT INTO Reports (type, path) VALUES ('Analytics', ?)"));
        logStmt->setString(1, filename);
        logStmt->executeUpdate();

        std::stringstream ss;
        ss << "{\"report_path\":\"" << JsonParser::escape(filename) << "\"}";
        return JsonParser::makeResponse("success", "Property report generated.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

// ===================== User Activity Report =====================

std::string ReportModule::generateUserActivityReport(const std::string& token, const std::string& format) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can generate reports.");
    }
    if (!isValidFormat(format)) {
        return JsonParser::makeResponse("error", "Invalid format. Use 'txt' or 'csv'.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        _mkdir("Reports");
        time_t now = time(0);
        std::string filename = "Reports/user_activity_" + std::to_string(now) + "." + format;
        std::ofstream file(filename);
        if (!file.is_open()) {
            return JsonParser::makeResponse("error", "Failed to create report file.");
        }

        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(
            "SELECT u.id, u.name, u.email, u.role, u.created_at, "
            "COALESCE(booking_counts.total_bookings, 0) AS total_bookings, "
            "COALESCE(review_counts.total_reviews, 0) AS total_reviews "
            "FROM Users u "
            "LEFT JOIN ("
            "  SELECT g.user_id, COUNT(b.id) AS total_bookings "
            "  FROM Guests g LEFT JOIN Bookings b ON g.id = b.guest_id "
            "  GROUP BY g.user_id"
            ") booking_counts ON u.id = booking_counts.user_id "
            "LEFT JOIN ("
            "  SELECT g.user_id, COUNT(r.id) AS total_reviews "
            "  FROM Guests g LEFT JOIN Reviews r ON g.id = r.guest_id "
            "  GROUP BY g.user_id"
            ") review_counts ON u.id = review_counts.user_id "
            "ORDER BY u.id ASC"));

        if (format == "csv") {
            file << "User ID,Name,Email,Role,Total Bookings,Total Reviews,Created At" << std::endl;
            while (res && res->next()) {
                file << res->getInt("id") << ","
                     << "\"" << res->getString("name") << "\","
                     << res->getString("email") << ","
                     << res->getString("role") << ","
                     << res->getInt("total_bookings") << ","
                     << res->getInt("total_reviews") << ","
                     << res->getString("created_at") << std::endl;
            }
        } else {
            file << "=====================================================" << std::endl;
            file << "           STAYSPACE USER ACTIVITY REPORT             " << std::endl;
            file << "=====================================================" << std::endl;
            char dateBuffer[64];
            struct tm* ltm = localtime(&now);
            strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d %H:%M:%S", ltm);
            file << "  Generated: " << dateBuffer << std::endl;
            file << "=====================================================" << std::endl << std::endl;

            while (res && res->next()) {
                file << "  User #" << res->getInt("id") << ": " << res->getString("name") << std::endl;
                file << "    Email         : " << res->getString("email") << std::endl;
                file << "    Role          : " << res->getString("role") << std::endl;
                file << "    Bookings      : " << res->getInt("total_bookings") << std::endl;
                file << "    Reviews       : " << res->getInt("total_reviews") << std::endl;
                file << "    Joined        : " << res->getString("created_at") << std::endl;
                file << "-----------------------------------------------------" << std::endl;
            }
        }

        file.close();

        std::unique_ptr<sql::PreparedStatement> logStmt(conn->prepareStatement(
            "INSERT INTO Reports (type, path) VALUES ('Activity', ?)"));
        logStmt->setString(1, filename);
        logStmt->executeUpdate();

        std::stringstream ss;
        ss << "{\"report_path\":\"" << JsonParser::escape(filename) << "\"}";
        return JsonParser::makeResponse("success", "User activity report generated.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

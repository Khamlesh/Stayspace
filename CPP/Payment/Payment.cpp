#include "Payment.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include "../Utils/HashUtils.h"
#include <sstream>
#include <memory>
#include <fstream>
#include <ctime>
#include <iomanip>
#include <direct.h>

// ===================== Helpers =====================

std::string PaymentModule::generateTransactionId() {
    // Create a unique transaction ID: TXN_ + timestamp + random hex
    std::string randomPart = HashUtils::generateSalt(8);
    time_t now = time(0);
    std::stringstream ss;
    ss << "TXN_" << now << "_" << randomPart;
    return ss.str();
}

bool PaymentModule::isValidPaymentMethod(const std::string& method) {
    return method == "Credit Card" || method == "Debit Card" || method == "UPI" || method == "Net Banking";
}

std::string PaymentModule::generateReceipt(int paymentId, int bookingId, double amount, const std::string& method, const std::string& transactionId, const std::string& guestName, const std::string& propertyTitle, const std::string& checkIn, const std::string& checkOut) {
    // Ensure Receipts/ directory exists
    _mkdir("Receipts");

    std::string filename = "Receipts/receipt_" + std::to_string(paymentId) + ".txt";
    std::ofstream file(filename);
    if (!file.is_open()) {
        return "";
    }

    time_t now = time(0);
    struct tm* ltm = localtime(&now);
    char dateBuffer[64];
    strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d %H:%M:%S", ltm);

    file << "===============================================" << std::endl;
    file << "           STAYSPACE PAYMENT RECEIPT           " << std::endl;
    file << "===============================================" << std::endl;
    file << std::endl;
    file << "  Receipt Date    : " << dateBuffer << std::endl;
    file << "  Transaction ID  : " << transactionId << std::endl;
    file << "  Payment ID      : " << paymentId << std::endl;
    file << "  Booking ID      : " << bookingId << std::endl;
    file << std::endl;
    file << "-----------------------------------------------" << std::endl;
    file << "  GUEST INFORMATION" << std::endl;
    file << "-----------------------------------------------" << std::endl;
    file << "  Guest Name      : " << guestName << std::endl;
    file << std::endl;
    file << "-----------------------------------------------" << std::endl;
    file << "  PROPERTY DETAILS" << std::endl;
    file << "-----------------------------------------------" << std::endl;
    file << "  Property        : " << propertyTitle << std::endl;
    file << "  Check-In        : " << checkIn << std::endl;
    file << "  Check-Out       : " << checkOut << std::endl;
    file << std::endl;
    file << "-----------------------------------------------" << std::endl;
    file << "  PAYMENT SUMMARY" << std::endl;
    file << "-----------------------------------------------" << std::endl;
    file << "  Payment Method  : " << method << std::endl;
    file << std::fixed << std::setprecision(2);
    file << "  Amount Paid     : ₹" << amount << std::endl;
    file << "  Payment Status  : SUCCESS" << std::endl;
    file << std::endl;
    file << "===============================================" << std::endl;
    file << "  Thank you for choosing StaySpace!            " << std::endl;
    file << "  We hope you enjoy your stay.                 " << std::endl;
    file << "===============================================" << std::endl;

    file.close();
    return filename;
}

// ===================== Core Operations =====================

std::string PaymentModule::processPayment(const std::string& token, int bookingId, const std::string& paymentMethod, const std::string& paymentDetails) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "You must be logged in as a Guest to make a payment.");
    }

    if (!isValidPaymentMethod(paymentMethod)) {
        return JsonParser::makeResponse("error", "Invalid payment method. Supported: Credit Card, Debit Card, UPI, Net Banking.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Verify booking exists, belongs to this guest, and is Confirmed
        std::unique_ptr<sql::PreparedStatement> bookStmt(conn->prepareStatement(
            "SELECT b.id, b.guest_id, b.total_price, b.status, b.check_in, b.check_out, "
            "p.title AS property_title "
            "FROM Bookings b "
            "JOIN Properties p ON b.property_id = p.id "
            "WHERE b.id = ?"));
        bookStmt->setInt(1, bookingId);
        std::unique_ptr<sql::ResultSet> bookRes(bookStmt->executeQuery());

        if (!bookRes || !bookRes->next()) {
            return JsonParser::makeResponse("error", "Booking not found.");
        }

        int bookingGuestId = bookRes->getInt("guest_id");
        double amount = bookRes->getDouble("total_price");
        std::string status = bookRes->getString("status");
        std::string checkIn = bookRes->getString("check_in");
        std::string checkOut = bookRes->getString("check_out");
        std::string propertyTitle = bookRes->getString("property_title");

        if (bookingGuestId != guestId) {
            return JsonParser::makeResponse("error", "This booking does not belong to you.");
        }
        if (status == "Cancelled") {
            return JsonParser::makeResponse("error", "Cannot pay for a cancelled booking.");
        }

        // Check if payment already exists for this booking
        std::unique_ptr<sql::PreparedStatement> existCheckStmt(conn->prepareStatement(
            "SELECT COUNT(*) AS cnt FROM Payments WHERE booking_id = ? AND status = 'Success'"));
        existCheckStmt->setInt(1, bookingId);
        std::unique_ptr<sql::ResultSet> existRes(existCheckStmt->executeQuery());
        if (existRes && existRes->next() && existRes->getInt("cnt") > 0) {
            return JsonParser::makeResponse("error", "Payment has already been made for this booking.");
        }

        // Simulate payment processing (always succeeds for educational project)
        std::string transactionId = generateTransactionId();

        // Insert payment record
        std::unique_ptr<sql::PreparedStatement> payStmt(conn->prepareStatement(
            "INSERT INTO Payments (booking_id, amount, payment_method, status, transaction_id) "
            "VALUES (?, ?, ?, 'Success', ?)"));
        payStmt->setInt(1, bookingId);
        payStmt->setDouble(2, amount);
        payStmt->setString(3, paymentMethod);
        payStmt->setString(4, transactionId);

        if (payStmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to record payment.");
        }

        unsigned long long paymentId = conn->getLastInsertId();

        // Get guest name for receipt
        std::unique_ptr<sql::PreparedStatement> guestStmt(conn->prepareStatement(
            "SELECT u.name FROM Guests g JOIN Users u ON g.user_id = u.id WHERE g.id = ?"));
        guestStmt->setInt(1, guestId);
        std::unique_ptr<sql::ResultSet> guestRes(guestStmt->executeQuery());
        std::string guestName = "Guest";
        if (guestRes && guestRes->next()) {
            guestName = guestRes->getString("name");
        }

        // Generate receipt file
        std::string receiptPath = generateReceipt((int)paymentId, bookingId, amount, paymentMethod, transactionId, guestName, propertyTitle, checkIn, checkOut);

        // Store receipt path in database
        if (!receiptPath.empty()) {
            std::unique_ptr<sql::PreparedStatement> rcptStmt(conn->prepareStatement(
                "INSERT INTO Receipts (payment_id, receipt_path) VALUES (?, ?)"));
            rcptStmt->setInt(1, paymentId);
            rcptStmt->setString(2, receiptPath);
            rcptStmt->executeUpdate();
        }

        // Notify the guest about successful payment
        int userId = Auth::getUserIdFromToken(token);
        std::unique_ptr<sql::PreparedStatement> notifStmt(conn->prepareStatement(
            "INSERT INTO Notifications (user_id, message) VALUES (?, ?)"));
        notifStmt->setInt(1, userId);
        std::string notifMsg = "Payment of ₹" + std::to_string(amount) + " for booking #" + std::to_string(bookingId) + " was successful. Transaction: " + transactionId;
        notifStmt->setString(2, notifMsg);
        notifStmt->executeUpdate();

        // Build response
        std::stringstream ss;
        ss << "{\"payment_id\":" << paymentId
           << ",\"booking_id\":" << bookingId
           << ",\"amount\":" << amount
           << ",\"payment_method\":\"" << JsonParser::escape(paymentMethod) << "\""
           << ",\"transaction_id\":\"" << JsonParser::escape(transactionId) << "\""
           << ",\"status\":\"Success\""
           << ",\"receipt_path\":\"" << JsonParser::escape(receiptPath) << "\"}";

        return JsonParser::makeResponse("success", "Payment processed successfully.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PaymentModule::getPaymentByBooking(const std::string& token, int bookingId) {
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
            "SELECT p.id, p.booking_id, p.amount, p.payment_method, p.status, p.transaction_id, p.created_at, "
            "COALESCE(r.receipt_path, '') AS receipt_path "
            "FROM Payments p "
            "LEFT JOIN Receipts r ON p.id = r.payment_id "
            "WHERE p.booking_id = ?"));
        stmt->setInt(1, bookingId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "No payment found for this booking.");
        }

        std::stringstream ss;
        ss << "{\"id\":" << res->getInt("id")
           << ",\"booking_id\":" << res->getInt("booking_id")
           << ",\"amount\":" << res->getDouble("amount")
           << ",\"payment_method\":\"" << JsonParser::escape(res->getString("payment_method")) << "\""
           << ",\"status\":\"" << res->getString("status") << "\""
           << ",\"transaction_id\":\"" << JsonParser::escape(res->getString("transaction_id")) << "\""
           << ",\"receipt_path\":\"" << JsonParser::escape(res->getString("receipt_path")) << "\""
           << ",\"created_at\":\"" << res->getString("created_at") << "\"}";

        return JsonParser::makeResponse("success", "Payment details fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PaymentModule::getGuestPayments(const std::string& token) {
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
            "SELECT p.id, p.booking_id, p.amount, p.payment_method, p.status, p.transaction_id, p.created_at "
            "FROM Payments p "
            "JOIN Bookings b ON p.booking_id = b.id "
            "WHERE b.guest_id = ? "
            "ORDER BY p.id DESC"));
        stmt->setInt(1, guestId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"id\":" << res->getInt("id")
               << ",\"booking_id\":" << res->getInt("booking_id")
               << ",\"amount\":" << res->getDouble("amount")
               << ",\"payment_method\":\"" << JsonParser::escape(res->getString("payment_method")) << "\""
               << ",\"status\":\"" << res->getString("status") << "\""
               << ",\"transaction_id\":\"" << JsonParser::escape(res->getString("transaction_id")) << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Guest payments fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

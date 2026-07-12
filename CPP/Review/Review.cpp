#include "Review.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>

std::string ReviewModule::addReview(const std::string& token, int propertyId, int rating, const std::string& comment) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "You must be logged in as a Guest to leave a review.");
    }

    if (rating < 1 || rating > 5) {
        return JsonParser::makeResponse("error", "Rating must be between 1 and 5.");
    }
    if (comment.empty()) {
        return JsonParser::makeResponse("error", "Review comment cannot be empty.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Verify property exists
        std::unique_ptr<sql::PreparedStatement> propStmt(conn->prepareStatement("SELECT id FROM Properties WHERE id = ?"));
        propStmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> propRes(propStmt->executeQuery());
        if (!propRes || !propRes->next()) {
            return JsonParser::makeResponse("error", "Property not found.");
        }

        // Check if guest has a confirmed booking for this property (optional but good practice)
        std::unique_ptr<sql::PreparedStatement> bookCheckStmt(conn->prepareStatement(
            "SELECT COUNT(*) AS cnt FROM Bookings WHERE guest_id = ? AND property_id = ? AND status = 'Confirmed'"));
        bookCheckStmt->setInt(1, guestId);
        bookCheckStmt->setInt(2, propertyId);
        std::unique_ptr<sql::ResultSet> bookCheckRes(bookCheckStmt->executeQuery());
        if (bookCheckRes && bookCheckRes->next() && bookCheckRes->getInt("cnt") == 0) {
            return JsonParser::makeResponse("error", "You can only review properties where you have a confirmed booking.");
        }

        // Check if guest already reviewed this property
        std::unique_ptr<sql::PreparedStatement> dupCheckStmt(conn->prepareStatement(
            "SELECT COUNT(*) AS cnt FROM Reviews WHERE guest_id = ? AND property_id = ?"));
        dupCheckStmt->setInt(1, guestId);
        dupCheckStmt->setInt(2, propertyId);
        std::unique_ptr<sql::ResultSet> dupRes(dupCheckStmt->executeQuery());
        if (dupRes && dupRes->next() && dupRes->getInt("cnt") > 0) {
            return JsonParser::makeResponse("error", "You have already reviewed this property. Use edit instead.");
        }

        // Insert review
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "INSERT INTO Reviews (property_id, guest_id, rating, comment) VALUES (?, ?, ?, ?)"));
        stmt->setInt(1, propertyId);
        stmt->setInt(2, guestId);
        stmt->setInt(3, rating);
        stmt->setString(4, comment);

        if (stmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to add review.");
        }

        unsigned long long reviewId = conn->getLastInsertId();
        std::stringstream ss;
        ss << "{\"review_id\":" << reviewId << "}";
        return JsonParser::makeResponse("success", "Review added successfully.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string ReviewModule::editReview(const std::string& token, int reviewId, int rating, const std::string& comment) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "You must be logged in as a Guest to edit a review.");
    }

    if (rating < 1 || rating > 5) {
        return JsonParser::makeResponse("error", "Rating must be between 1 and 5.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Verify ownership
        std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT guest_id FROM Reviews WHERE id = ?"));
        checkStmt->setInt(1, reviewId);
        std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
        if (!res || !res->next() || res->getInt("guest_id") != guestId) {
            return JsonParser::makeResponse("error", "Review not found or unauthorized.");
        }

        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "UPDATE Reviews SET rating = ?, comment = ? WHERE id = ?"));
        stmt->setInt(1, rating);
        stmt->setString(2, comment);
        stmt->setInt(3, reviewId);

        if (stmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to update review.");
        }

        return JsonParser::makeResponse("success", "Review updated successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string ReviewModule::deleteReview(const std::string& token, int reviewId) {
    int guestId = Auth::getGuestIdFromToken(token);
    bool isUserAdmin = Auth::isAdmin(token);

    if (guestId == -1 && !isUserAdmin) {
        return JsonParser::makeResponse("error", "Unauthorized command.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        if (!isUserAdmin) {
            std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT guest_id FROM Reviews WHERE id = ?"));
            checkStmt->setInt(1, reviewId);
            std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
            if (!res || !res->next() || res->getInt("guest_id") != guestId) {
                return JsonParser::makeResponse("error", "Review not found or unauthorized.");
            }
        }

        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement("DELETE FROM Reviews WHERE id = ?"));
        stmt->setInt(1, reviewId);
        stmt->executeUpdate();

        return JsonParser::makeResponse("success", "Review deleted successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string ReviewModule::getPropertyReviews(int propertyId) {
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT r.id, r.rating, r.comment, r.created_at, u.name AS guest_name "
            "FROM Reviews r "
            "JOIN Guests g ON r.guest_id = g.id "
            "JOIN Users u ON g.user_id = u.id "
            "WHERE r.property_id = ? "
            "ORDER BY r.id DESC"));
        stmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        double sumRating = 0;
        int count = 0;
        while (res && res->next()) {
            if (!first) ss << ",";
            int rat = res->getInt("rating");
            sumRating += rat;
            count++;
            ss << "{\"id\":" << res->getInt("id")
               << ",\"guest_name\":\"" << JsonParser::escape(res->getString("guest_name")) << "\""
               << ",\"rating\":" << rat
               << ",\"comment\":\"" << JsonParser::escape(res->getString("comment")) << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        double avgRating = count > 0 ? (sumRating / count) : 0.0;
        std::stringstream dataSs;
        dataSs << "{\"reviews\":" << ss.str()
               << ",\"average_rating\":" << avgRating
               << ",\"total_reviews\":" << count << "}";

        return JsonParser::makeResponse("success", "Reviews fetched.", dataSs.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

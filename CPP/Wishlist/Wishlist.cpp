#include "Wishlist.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>

std::string WishlistModule::addToWishlist(const std::string& token, int propertyId) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "You must be logged in as a Guest to use wishlists.");
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

        // Check if already in wishlist
        std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement(
            "SELECT COUNT(*) AS cnt FROM Wishlist WHERE guest_id = ? AND property_id = ?"));
        checkStmt->setInt(1, guestId);
        checkStmt->setInt(2, propertyId);
        std::unique_ptr<sql::ResultSet> checkRes(checkStmt->executeQuery());
        if (checkRes && checkRes->next() && checkRes->getInt("cnt") > 0) {
            return JsonParser::makeResponse("error", "Property is already in your wishlist.");
        }

        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "INSERT INTO Wishlist (guest_id, property_id) VALUES (?, ?)"));
        stmt->setInt(1, guestId);
        stmt->setInt(2, propertyId);

        if (stmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to add to wishlist.");
        }

        return JsonParser::makeResponse("success", "Property added to wishlist.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string WishlistModule::removeFromWishlist(const std::string& token, int propertyId) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "You must be logged in as a Guest to use wishlists.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "DELETE FROM Wishlist WHERE guest_id = ? AND property_id = ?"));
        stmt->setInt(1, guestId);
        stmt->setInt(2, propertyId);
        stmt->executeUpdate();

        return JsonParser::makeResponse("success", "Property removed from wishlist.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string WishlistModule::getWishlist(const std::string& token) {
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
            "SELECT w.id AS wishlist_id, w.created_at AS added_at, "
            "p.id AS property_id, p.title, p.address, p.price_per_night, p.max_guests "
            "FROM Wishlist w "
            "JOIN Properties p ON w.property_id = p.id "
            "WHERE w.guest_id = ? "
            "ORDER BY w.id DESC"));
        stmt->setInt(1, guestId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"wishlist_id\":" << res->getInt("wishlist_id")
               << ",\"property_id\":" << res->getInt("property_id")
               << ",\"title\":\"" << JsonParser::escape(res->getString("title")) << "\""
               << ",\"address\":\"" << JsonParser::escape(res->getString("address")) << "\""
               << ",\"price_per_night\":" << res->getDouble("price_per_night")
               << ",\"max_guests\":" << res->getInt("max_guests")
               << ",\"added_at\":\"" << res->getString("added_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Wishlist fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

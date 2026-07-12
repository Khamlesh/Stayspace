#include "UserModule.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>

std::string UserModule::updateProfile(const std::string& token, const std::string& name, const std::string& bio, const std::string& profilePic) {
    int userId = Auth::getUserIdFromToken(token);
    if (userId == -1) {
        return JsonParser::makeResponse("error", "Session expired or invalid.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Query current role
        std::unique_ptr<sql::PreparedStatement> roleStmt(conn->prepareStatement("SELECT role FROM Users WHERE id = ?"));
        roleStmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> roleRes(roleStmt->executeQuery());
        if (!roleRes || !roleRes->next()) {
            return JsonParser::makeResponse("error", "User not found.");
        }
        std::string role = roleRes->getString("role");

        // Update Users table (name & optionally profile_picture)
        std::string updateUsersQuery = "UPDATE Users SET name = ? ";
        if (!profilePic.empty()) {
            updateUsersQuery += ", profile_picture = ? ";
        }
        updateUsersQuery += "WHERE id = ?";

        std::unique_ptr<sql::PreparedStatement> updateStmt(conn->prepareStatement(updateUsersQuery));
        updateStmt->setString(1, name);
        if (!profilePic.empty()) {
            updateStmt->setString(2, profilePic);
            updateStmt->setInt(3, userId);
        } else {
            updateStmt->setInt(2, userId);
        }

        if (updateStmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to update profile name.");
        }

        // Update role-specific bio
        if (role == "Guest") {
            std::unique_ptr<sql::PreparedStatement> bioStmt(conn->prepareStatement("UPDATE Guests SET bio = ? WHERE user_id = ?"));
            bioStmt->setString(1, bio);
            bioStmt->setInt(2, userId);
            bioStmt->executeUpdate();
        } else if (role == "Host") {
            std::unique_ptr<sql::PreparedStatement> bioStmt(conn->prepareStatement("UPDATE Hosts SET bio = ? WHERE user_id = ?"));
            bioStmt->setString(1, bio);
            bioStmt->setInt(2, userId);
            bioStmt->executeUpdate();
        }

        return viewProfile(token); // Return updated profile view
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string UserModule::viewProfile(const std::string& token) {
    int userId = Auth::getUserIdFromToken(token);
    if (userId == -1) {
        return JsonParser::makeResponse("error", "Session expired or invalid.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT id, name, email, role, profile_picture, created_at FROM Users WHERE id = ?"));
        stmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (res && res->next()) {
            std::string name = res->getString("name");
            std::string email = res->getString("email");
            std::string role = res->getString("role");
            std::string profilePic = res->getString("profile_picture");
            std::string createdAt = res->getString("created_at");

            std::string bio = "";
            bool isApproved = false;

            if (role == "Guest") {
                std::unique_ptr<sql::PreparedStatement> subStmt(conn->prepareStatement("SELECT bio FROM Guests WHERE user_id = ?"));
                subStmt->setInt(1, userId);
                std::unique_ptr<sql::ResultSet> subRes(subStmt->executeQuery());
                if (subRes && subRes->next()) {
                    bio = subRes->getString("bio");
                }
            } else if (role == "Host") {
                std::unique_ptr<sql::PreparedStatement> subStmt(conn->prepareStatement("SELECT bio, is_approved FROM Hosts WHERE user_id = ?"));
                subStmt->setInt(1, userId);
                std::unique_ptr<sql::ResultSet> subRes(subStmt->executeQuery());
                if (subRes && subRes->next()) {
                    bio = subRes->getString("bio");
                    isApproved = subRes->getBoolean("is_approved");
                }
            }

            std::stringstream ss;
            ss << "{\"id\":" << userId
               << ",\"name\":\"" << JsonParser::escape(name) << "\""
               << ",\"email\":\"" << JsonParser::escape(email) << "\""
               << ",\"role\":\"" << JsonParser::escape(role) << "\""
               << ",\"profile_picture\":\"" << JsonParser::escape(profilePic) << "\""
               << ",\"created_at\":\"" << JsonParser::escape(createdAt) << "\""
               << ",\"bio\":\"" << JsonParser::escape(bio) << "\"";
            if (role == "Host") {
                ss << ",\"is_approved\":" << (isApproved ? "true" : "false");
            }
            ss << "}";

            return JsonParser::makeResponse("success", "Profile fetched.", ss.str());
        }
        return JsonParser::makeResponse("error", "Profile not found.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string UserModule::getBookingHistory(const std::string& token) {
    int userId = Auth::getUserIdFromToken(token);
    if (userId == -1) {
        return JsonParser::makeResponse("error", "Session expired or invalid.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> roleStmt(conn->prepareStatement("SELECT role FROM Users WHERE id = ?"));
        roleStmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> roleRes(roleStmt->executeQuery());
        if (!roleRes || !roleRes->next()) {
            return JsonParser::makeResponse("error", "User not found.");
        }
        std::string role = roleRes->getString("role");

        std::stringstream ss;
        ss << "[";
        bool first = true;

        if (role == "Guest") {
            std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
                "SELECT b.id, b.property_id, b.check_in, b.check_out, b.total_price, b.status, b.created_at, "
                "p.title as property_title, p.address as property_address "
                "FROM Bookings b "
                "JOIN Properties p ON b.property_id = p.id "
                "WHERE b.guest_id = (SELECT id FROM Guests WHERE user_id = ?) "
                "ORDER BY b.id DESC"));
            stmt->setInt(1, userId);
            std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

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
        } else if (role == "Host") {
            std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
                "SELECT b.id, b.property_id, b.check_in, b.check_out, b.total_price, b.status, b.created_at, "
                "p.title as property_title, p.address as property_address, u.name as guest_name "
                "FROM Bookings b "
                "JOIN Properties p ON b.property_id = p.id "
                "JOIN Guests g ON b.guest_id = g.id "
                "JOIN Users u ON g.user_id = u.id "
                "WHERE p.host_id = (SELECT id FROM Hosts WHERE user_id = ?) "
                "ORDER BY b.id DESC"));
            stmt->setInt(1, userId);
            std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

            while (res && res->next()) {
                if (!first) ss << ",";
                ss << "{\"id\":" << res->getInt("id")
                   << ",\"property_id\":" << res->getInt("property_id")
                   << ",\"property_title\":\"" << JsonParser::escape(res->getString("property_title")) << "\""
                   << ",\"property_address\":\"" << JsonParser::escape(res->getString("property_address")) << "\""
                   << ",\"guest_name\":\"" << JsonParser::escape(res->getString("guest_name")) << "\""
                   << ",\"check_in\":\"" << res->getString("check_in") << "\""
                   << ",\"check_out\":\"" << res->getString("check_out") << "\""
                   << ",\"total_price\":" << res->getDouble("total_price")
                   << ",\"status\":\"" << res->getString("status") << "\""
                   << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
                first = false;
            }
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Booking history fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string UserModule::getWishlist(const std::string& token) {
    int guestId = Auth::getGuestIdFromToken(token);
    if (guestId == -1) {
        return JsonParser::makeResponse("error", "Unauthorized or invalid guest session.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT p.id, p.title, p.description, p.address, p.price_per_night, p.max_guests "
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
            ss << "{\"id\":" << res->getInt("id")
               << ",\"title\":\"" << JsonParser::escape(res->getString("title")) << "\""
               << ",\"description\":\"" << JsonParser::escape(res->getString("description")) << "\""
               << ",\"address\":\"" << JsonParser::escape(res->getString("address")) << "\""
               << ",\"price_per_night\":" << res->getDouble("price_per_night")
               << ",\"max_guests\":" << res->getInt("max_guests") << "}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Wishlist properties fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

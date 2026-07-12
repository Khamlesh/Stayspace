#include "Admin.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>

std::string AdminModule::approveHost(const std::string& token, int hostId) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can approve hosts.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Check host exists
        std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT user_id, is_approved FROM Hosts WHERE id = ?"));
        checkStmt->setInt(1, hostId);
        std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "Host not found.");
        }

        if (res->getBoolean("is_approved")) {
            return JsonParser::makeResponse("error", "Host is already approved.");
        }

        int hostUserId = res->getInt("user_id");

        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "UPDATE Hosts SET is_approved = TRUE WHERE id = ?"));
        stmt->setInt(1, hostId);

        if (stmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to approve host.");
        }

        // Notify the host
        std::unique_ptr<sql::PreparedStatement> notifStmt(conn->prepareStatement(
            "INSERT INTO Notifications (user_id, message) VALUES (?, ?)"));
        notifStmt->setInt(1, hostUserId);
        notifStmt->setString(2, "Congratulations! Your host account has been approved. You can now publish properties.");
        notifStmt->executeUpdate();

        return JsonParser::makeResponse("success", "Host #" + std::to_string(hostId) + " approved successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string AdminModule::rejectHost(const std::string& token, int hostId) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can reject hosts.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT user_id FROM Hosts WHERE id = ?"));
        checkStmt->setInt(1, hostId);
        std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "Host not found.");
        }

        int hostUserId = res->getInt("user_id");

        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "UPDATE Hosts SET is_approved = FALSE WHERE id = ?"));
        stmt->setInt(1, hostId);
        stmt->executeUpdate();

        // Notify the host
        std::unique_ptr<sql::PreparedStatement> notifStmt(conn->prepareStatement(
            "INSERT INTO Notifications (user_id, message) VALUES (?, ?)"));
        notifStmt->setInt(1, hostUserId);
        notifStmt->setString(2, "Your host account application has been rejected. Please contact support for more information.");
        notifStmt->executeUpdate();

        return JsonParser::makeResponse("success", "Host #" + std::to_string(hostId) + " rejected.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string AdminModule::getPendingHosts(const std::string& token) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can view pending hosts.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT h.id AS host_id, h.bio, h.created_at, u.id AS user_id, u.name, u.email "
            "FROM Hosts h "
            "JOIN Users u ON h.user_id = u.id "
            "WHERE h.is_approved = FALSE "
            "ORDER BY h.id ASC"));
        // No parameters needed for this query
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"host_id\":" << res->getInt("host_id")
               << ",\"user_id\":" << res->getInt("user_id")
               << ",\"name\":\"" << JsonParser::escape(res->getString("name")) << "\""
               << ",\"email\":\"" << JsonParser::escape(res->getString("email")) << "\""
               << ",\"bio\":\"" << JsonParser::escape(res->getString("bio")) << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Pending hosts fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string AdminModule::getAllUsers(const std::string& token) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can view all users.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(
            "SELECT id, name, email, role, profile_picture, created_at FROM Users ORDER BY id ASC"));

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"id\":" << res->getInt("id")
               << ",\"name\":\"" << JsonParser::escape(res->getString("name")) << "\""
               << ",\"email\":\"" << JsonParser::escape(res->getString("email")) << "\""
               << ",\"role\":\"" << res->getString("role") << "\""
               << ",\"profile_picture\":\"" << JsonParser::escape(res->getString("profile_picture")) << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "All users fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string AdminModule::getDashboardStats(const std::string& token) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can view dashboard stats.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Total users
        std::unique_ptr<sql::ResultSet> usersRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Users"));
        int totalUsers = 0;
        if (usersRes && usersRes->next()) totalUsers = usersRes->getInt("cnt");

        // Total guests
        std::unique_ptr<sql::ResultSet> guestsRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Guests"));
        int totalGuests = 0;
        if (guestsRes && guestsRes->next()) totalGuests = guestsRes->getInt("cnt");

        // Total hosts
        std::unique_ptr<sql::ResultSet> hostsRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Hosts"));
        int totalHosts = 0;
        if (hostsRes && hostsRes->next()) totalHosts = hostsRes->getInt("cnt");

        // Approved hosts
        std::unique_ptr<sql::ResultSet> approvedRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Hosts WHERE is_approved = TRUE"));
        int approvedHosts = 0;
        if (approvedRes && approvedRes->next()) approvedHosts = approvedRes->getInt("cnt");

        // Pending hosts
        int pendingHosts = totalHosts - approvedHosts;

        // Total properties
        std::unique_ptr<sql::ResultSet> propsRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Properties"));
        int totalProperties = 0;
        if (propsRes && propsRes->next()) totalProperties = propsRes->getInt("cnt");

        // Total bookings
        std::unique_ptr<sql::ResultSet> bookRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Bookings"));
        int totalBookings = 0;
        if (bookRes && bookRes->next()) totalBookings = bookRes->getInt("cnt");

        // Active bookings (Pending + Confirmed)
        std::unique_ptr<sql::ResultSet> activeRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Bookings WHERE status != 'Cancelled'"));
        int activeBookings = 0;
        if (activeRes && activeRes->next()) activeBookings = activeRes->getInt("cnt");

        // Total revenue (sum of successful payments)
        std::unique_ptr<sql::ResultSet> revRes(conn->executeQuery("SELECT COALESCE(SUM(amount), 0) AS total FROM Payments WHERE status = 'Success'"));
        double totalRevenue = 0;
        if (revRes && revRes->next()) totalRevenue = revRes->getDouble("total");

        // Total reviews
        std::unique_ptr<sql::ResultSet> reviewsRes(conn->executeQuery("SELECT COUNT(*) AS cnt FROM Reviews"));
        int totalReviews = 0;
        if (reviewsRes && reviewsRes->next()) totalReviews = reviewsRes->getInt("cnt");

        std::stringstream ss;
        ss << "{\"total_users\":" << totalUsers
           << ",\"total_guests\":" << totalGuests
           << ",\"total_hosts\":" << totalHosts
           << ",\"approved_hosts\":" << approvedHosts
           << ",\"pending_hosts\":" << pendingHosts
           << ",\"total_properties\":" << totalProperties
           << ",\"total_bookings\":" << totalBookings
           << ",\"active_bookings\":" << activeBookings
           << ",\"total_revenue\":" << totalRevenue
           << ",\"total_reviews\":" << totalReviews << "}";

        return JsonParser::makeResponse("success", "Dashboard stats fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string AdminModule::getAllProperties(const std::string& token) {
    if (!Auth::isAdmin(token)) {
        return JsonParser::makeResponse("error", "Only administrators can view all properties.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(
            "SELECT p.id, p.title, p.address, p.price_per_night, p.max_guests, p.created_at, "
            "u.name AS host_name, u.email AS host_email "
            "FROM Properties p "
            "JOIN Hosts h ON p.host_id = h.id "
            "JOIN Users u ON h.user_id = u.id "
            "ORDER BY p.id DESC"));

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"id\":" << res->getInt("id")
               << ",\"title\":\"" << JsonParser::escape(res->getString("title")) << "\""
               << ",\"address\":\"" << JsonParser::escape(res->getString("address")) << "\""
               << ",\"price_per_night\":" << res->getDouble("price_per_night")
               << ",\"max_guests\":" << res->getInt("max_guests")
               << ",\"host_name\":\"" << JsonParser::escape(res->getString("host_name")) << "\""
               << ",\"host_email\":\"" << JsonParser::escape(res->getString("host_email")) << "\""
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "All properties fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

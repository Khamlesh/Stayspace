#include "Notification.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>

std::string NotificationModule::getNotifications(const std::string& token) {
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
            "SELECT id, message, is_read, created_at FROM Notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50"));
        stmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            ss << "{\"id\":" << res->getInt("id")
               << ",\"message\":\"" << JsonParser::escape(res->getString("message")) << "\""
               << ",\"is_read\":" << (res->getBoolean("is_read") ? "true" : "false")
               << ",\"created_at\":\"" << res->getString("created_at") << "\"}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Notifications fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string NotificationModule::markAsRead(const std::string& token, int notificationId) {
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
            "UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?"));
        stmt->setInt(1, notificationId);
        stmt->setInt(2, userId);
        stmt->executeUpdate();

        return JsonParser::makeResponse("success", "Notification marked as read.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string NotificationModule::markAllAsRead(const std::string& token) {
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
            "UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE"));
        stmt->setInt(1, userId);
        stmt->executeUpdate();

        return JsonParser::makeResponse("success", "All notifications marked as read.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string NotificationModule::getUnreadCount(const std::string& token) {
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
            "SELECT COUNT(*) AS cnt FROM Notifications WHERE user_id = ? AND is_read = FALSE"));
        stmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        int count = 0;
        if (res && res->next()) {
            count = res->getInt("cnt");
        }

        std::stringstream ss;
        ss << "{\"unread_count\":" << count << "}";
        return JsonParser::makeResponse("success", "Unread count fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

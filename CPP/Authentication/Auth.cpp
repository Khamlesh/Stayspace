#include "Auth.h"
#include <iostream>
#include <memory>

std::string Auth::registerUser(const std::string& name, const std::string& email, const std::string& password, const std::string& role) {
    if (name.empty() || email.empty() || password.empty() || role.empty()) {
        return JsonParser::makeResponse("error", "All fields are required.");
    }
    if (role != "Guest" && role != "Host" && role != "Admin") {
        return JsonParser::makeResponse("error", "Invalid user role specified.");
    }
    if (email.find('@') == std::string::npos) {
        return JsonParser::makeResponse("error", "Invalid email address format.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Check if email already exists
        std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT COUNT(*) FROM Users WHERE email = ?"));
        checkStmt->setString(1, email);
        std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
        if (res && res->next()) {
            if (res->getInt(1) > 0) {
                return JsonParser::makeResponse("error", "Email address already registered.");
            }
        }

        // Hash password
        std::string salt = HashUtils::generateSalt();
        std::string hash = HashUtils::hashPassword(password, salt);

        // Insert User
        std::unique_ptr<sql::PreparedStatement> insertUserStmt(conn->prepareStatement(
            "INSERT INTO Users (name, email, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)"));
        insertUserStmt->setString(1, name);
        insertUserStmt->setString(2, email);
        insertUserStmt->setString(3, hash);
        insertUserStmt->setString(4, salt);
        insertUserStmt->setString(5, role);

        if (insertUserStmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to create user account.");
        }

        unsigned long long userId = conn->getLastInsertId();

        // Insert role-specific profile data
        if (role == "Guest") {
            std::unique_ptr<sql::PreparedStatement> subStmt(conn->prepareStatement("INSERT INTO Guests (user_id, bio) VALUES (?, '')"));
            subStmt->setInt(1, userId);
            subStmt->executeUpdate();
        } else if (role == "Host") {
            std::unique_ptr<sql::PreparedStatement> subStmt(conn->prepareStatement("INSERT INTO Hosts (user_id, is_approved, bio) VALUES (?, FALSE, '')"));
            subStmt->setInt(1, userId);
            subStmt->executeUpdate();
        } else if (role == "Admin") {
            std::unique_ptr<sql::PreparedStatement> subStmt(conn->prepareStatement("INSERT INTO Admins (user_id) VALUES (?)"));
            subStmt->setInt(1, userId);
            subStmt->executeUpdate();
        }

        // Query created user details
        std::unique_ptr<sql::PreparedStatement> queryStmt(conn->prepareStatement(
            "SELECT id, name, email, role, profile_picture, created_at FROM Users WHERE id = ?"));
        queryStmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> userRes(queryStmt->executeQuery());

        if (userRes && userRes->next()) {
            std::unique_ptr<User> userObj;
            if (role == "Guest") {
                userObj = std::unique_ptr<User>(new GuestUser(userRes->getInt("id"), userRes->getString("name"), userRes->getString("email"), userRes->getString("profile_picture"), userRes->getString("created_at"), ""));
            } else if (role == "Host") {
                userObj = std::unique_ptr<User>(new HostUser(userRes->getInt("id"), userRes->getString("name"), userRes->getString("email"), userRes->getString("profile_picture"), userRes->getString("created_at"), false, ""));
            } else {
                userObj = std::unique_ptr<User>(new AdminUser(userRes->getInt("id"), userRes->getString("name"), userRes->getString("email"), userRes->getString("profile_picture"), userRes->getString("created_at")));
            }
            return JsonParser::makeResponse("success", "Registration successful.", userObj->toJson());
        }

        return JsonParser::makeResponse("success", "Registration successful.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string Auth::loginUser(const std::string& email, const std::string& password) {
    if (email.empty() || password.empty()) {
        return JsonParser::makeResponse("error", "Email and password are required.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT id, name, email, password_hash, salt, role, profile_picture, created_at FROM Users WHERE email = ?"));
        stmt->setString(1, email);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (res && res->next()) {
            int userId = res->getInt("id");
            std::string name = res->getString("name");
            std::string dbHash = res->getString("password_hash");
            std::string salt = res->getString("salt");
            std::string role = res->getString("role");
            std::string profilePic = res->getString("profile_picture");
            std::string createdAt = res->getString("created_at");

            // Verify password hash
            std::string inputHash = HashUtils::hashPassword(password, salt);
            if (inputHash != dbHash) {
                return JsonParser::makeResponse("error", "Invalid email or password.");
            }

            // If Host, query approval status
            bool isApproved = false;
            std::string bio = "";
            if (role == "Host") {
                std::unique_ptr<sql::PreparedStatement> hostStmt(conn->prepareStatement("SELECT is_approved, bio FROM Hosts WHERE user_id = ?"));
                hostStmt->setInt(1, userId);
                std::unique_ptr<sql::ResultSet> hostRes(hostStmt->executeQuery());
                if (hostRes && hostRes->next()) {
                    isApproved = hostRes->getBoolean("is_approved");
                    bio = hostRes->getString("bio");
                }
            } else if (role == "Guest") {
                std::unique_ptr<sql::PreparedStatement> guestStmt(conn->prepareStatement("SELECT bio FROM Guests WHERE user_id = ?"));
                guestStmt->setInt(1, userId);
                std::unique_ptr<sql::ResultSet> guestRes(guestStmt->executeQuery());
                if (guestRes && guestRes->next()) {
                    bio = guestRes->getString("bio");
                }
            }

            // Generate session token
            std::string sessionToken = HashUtils::generateSalt(32);

            // Clean old sessions for this user
            std::unique_ptr<sql::PreparedStatement> cleanStmt(conn->prepareStatement("DELETE FROM Sessions WHERE user_id = ?"));
            cleanStmt->setInt(1, userId);
            cleanStmt->executeUpdate();

            // Insert new session token
            std::unique_ptr<sql::PreparedStatement> sessStmt(conn->prepareStatement(
                "INSERT INTO Sessions (user_id, session_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))"));
            sessStmt->setInt(1, userId);
            sessStmt->setString(2, sessionToken);
            if (sessStmt->executeUpdate() < 0) {
                return JsonParser::makeResponse("error", "Failed to start user session.");
            }

            // Build response user object
            std::stringstream userSs;
            userSs << "{\"id\":" << userId
                   << ",\"name\":\"" << JsonParser::escape(name) << "\""
                   << ",\"email\":\"" << JsonParser::escape(email) << "\""
                   << ",\"role\":\"" << JsonParser::escape(role) << "\""
                   << ",\"profile_picture\":\"" << JsonParser::escape(profilePic) << "\""
                   << ",\"created_at\":\"" << JsonParser::escape(createdAt) << "\"";
            if (role == "Host") {
                userSs << ",\"is_approved\":" << (isApproved ? "true" : "false")
                       << ",\"bio\":\"" << JsonParser::escape(bio) << "\"";
            } else if (role == "Guest") {
                userSs << ",\"bio\":\"" << JsonParser::escape(bio) << "\"";
            }
            userSs << "}";

            // Return response
            std::stringstream respSs;
            respSs << "{\"token\":\"" << sessionToken << "\",\"user\":" << userSs.str() << "}";
            return JsonParser::makeResponse("success", "Login successful.", respSs.str());
        }

        return JsonParser::makeResponse("error", "Invalid email or password.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error during login: ") + e.what());
    }
}

std::string Auth::logoutUser(const std::string& token) {
    if (token.empty()) {
        return JsonParser::makeResponse("error", "Session token is required.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement("DELETE FROM Sessions WHERE session_token = ?"));
        stmt->setString(1, token);
        stmt->executeUpdate();
        return JsonParser::makeResponse("success", "Logout successful.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string Auth::validateSession(const std::string& token) {
    if (token.empty()) {
        return JsonParser::makeResponse("error", "Session token is required.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT u.id, u.name, u.email, u.role, u.profile_picture, u.created_at "
            "FROM Sessions s JOIN Users u ON s.user_id = u.id "
            "WHERE s.session_token = ? AND s.expires_at > NOW()"));
        stmt->setString(1, token);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (res && res->next()) {
            int userId = res->getInt("id");
            std::string name = res->getString("name");
            std::string email = res->getString("email");
            std::string role = res->getString("role");
            std::string profilePic = res->getString("profile_picture");
            std::string createdAt = res->getString("created_at");

            bool isApproved = false;
            std::string bio = "";
            if (role == "Host") {
                std::unique_ptr<sql::PreparedStatement> hostStmt(conn->prepareStatement("SELECT is_approved, bio FROM Hosts WHERE user_id = ?"));
                hostStmt->setInt(1, userId);
                std::unique_ptr<sql::ResultSet> hostRes(hostStmt->executeQuery());
                if (hostRes && hostRes->next()) {
                    isApproved = hostRes->getBoolean("is_approved");
                    bio = hostRes->getString("bio");
                }
            } else if (role == "Guest") {
                std::unique_ptr<sql::PreparedStatement> guestStmt(conn->prepareStatement("SELECT bio FROM Guests WHERE user_id = ?"));
                guestStmt->setInt(1, userId);
                std::unique_ptr<sql::ResultSet> guestRes(guestStmt->executeQuery());
                if (guestRes && guestRes->next()) {
                    bio = guestRes->getString("bio");
                }
            }

            std::stringstream userSs;
            userSs << "{\"id\":" << userId
                   << ",\"name\":\"" << JsonParser::escape(name) << "\""
                   << ",\"email\":\"" << JsonParser::escape(email) << "\""
                   << ",\"role\":\"" << JsonParser::escape(role) << "\""
                   << ",\"profile_picture\":\"" << JsonParser::escape(profilePic) << "\""
                   << ",\"created_at\":\"" << JsonParser::escape(createdAt) << "\"";
            if (role == "Host") {
                userSs << ",\"is_approved\":" << (isApproved ? "true" : "false")
                       << ",\"bio\":\"" << JsonParser::escape(bio) << "\"";
            } else if (role == "Guest") {
                userSs << ",\"bio\":\"" << JsonParser::escape(bio) << "\"";
            }
            userSs << "}";

            return JsonParser::makeResponse("success", "Session is valid.", userSs.str());
        }

        return JsonParser::makeResponse("error", "Session expired or invalid.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string Auth::changePassword(const std::string& token, const std::string& oldPassword, const std::string& newPassword) {
    if (token.empty() || oldPassword.empty() || newPassword.empty()) {
        return JsonParser::makeResponse("error", "All parameters are required.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Find user by token
        std::unique_ptr<sql::PreparedStatement> tokenStmt(conn->prepareStatement(
            "SELECT user_id FROM Sessions WHERE session_token = ? AND expires_at > NOW()"));
        tokenStmt->setString(1, token);
        std::unique_ptr<sql::ResultSet> tokenRes(tokenStmt->executeQuery());

        if (!tokenRes || !tokenRes->next()) {
            return JsonParser::makeResponse("error", "Session expired or invalid.");
        }

        int userId = tokenRes->getInt("user_id");

        // Get current password hash and salt
        std::unique_ptr<sql::PreparedStatement> userStmt(conn->prepareStatement(
            "SELECT password_hash, salt FROM Users WHERE id = ?"));
        userStmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> userRes(userStmt->executeQuery());

        if (userRes && userRes->next()) {
            std::string dbHash = userRes->getString("password_hash");
            std::string salt = userRes->getString("salt");

            // Verify old password
            std::string oldHash = HashUtils::hashPassword(oldPassword, salt);
            if (oldHash != dbHash) {
                return JsonParser::makeResponse("error", "Incorrect old password.");
            }

            // Hash new password with a new salt
            std::string newSalt = HashUtils::generateSalt();
            std::string newHash = HashUtils::hashPassword(newPassword, newSalt);

            // Update user record
            std::unique_ptr<sql::PreparedStatement> updateStmt(conn->prepareStatement(
                "UPDATE Users SET password_hash = ?, salt = ? WHERE id = ?"));
            updateStmt->setString(1, newHash);
            updateStmt->setString(2, newSalt);
            updateStmt->setInt(3, userId);

            if (updateStmt->executeUpdate() < 0) {
                return JsonParser::makeResponse("error", "Failed to update password.");
            }

            return JsonParser::makeResponse("success", "Password changed successfully.");
        }

        return JsonParser::makeResponse("error", "User not found.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string Auth::forgotPassword(const std::string& email) {
    if (email.empty()) {
        return JsonParser::makeResponse("error", "Email is required.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement("SELECT id FROM Users WHERE email = ?"));
        stmt->setString(1, email);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (res && res->next()) {
            // In a real system, we would send a reset link.
            // For education, we'll return a simulated success showing a fake reset token.
            std::string dummyResetToken = HashUtils::generateSalt(10);
            std::string data = "{\"reset_token\":\"" + dummyResetToken + "\"}";
            return JsonParser::makeResponse("success", "Simulated password reset email sent. Temporary token generated.", data);
        }

        return JsonParser::makeResponse("error", "Email address not registered.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

int Auth::getUserIdFromToken(const std::string& token) {
    if (token.empty()) return -1;
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) return -1;
    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT user_id FROM Sessions WHERE session_token = ? AND expires_at > NOW()"));
        stmt->setString(1, token);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());
        if (res && res->next()) {
            return res->getInt("user_id");
        }
    } catch (...) {}
    return -1;
}

int Auth::getHostIdFromToken(const std::string& token) {
    int userId = getUserIdFromToken(token);
    if (userId == -1) return -1;
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) return -1;
    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT id FROM Hosts WHERE user_id = ? AND is_approved = TRUE"));
        stmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());
        if (res && res->next()) {
            return res->getInt("id");
        }
    } catch (...) {}
    return -1;
}

int Auth::getGuestIdFromToken(const std::string& token) {
    int userId = getUserIdFromToken(token);
    if (userId == -1) return -1;
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) return -1;
    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT id FROM Guests WHERE user_id = ?"));
        stmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());
        if (res && res->next()) {
            return res->getInt("id");
        }
    } catch (...) {}
    return -1;
}

bool Auth::isAdmin(const std::string& token) {
    int userId = getUserIdFromToken(token);
    if (userId == -1) return false;
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) return false;
    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT id FROM Admins WHERE user_id = ?"));
        stmt->setInt(1, userId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());
        if (res && res->next()) {
            return true;
        }
    } catch (...) {}
    return false;
}


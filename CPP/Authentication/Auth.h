#ifndef AUTH_H
#define AUTH_H

#include "../Database/DatabaseConnection.h"
#include "../User/User.h"
#include "../Utils/JsonParser.h"
#include "../Utils/HashUtils.h"
#include <string>

class Auth {
public:
    static std::string registerUser(const std::string& name, const std::string& email, const std::string& password, const std::string& role);
    static std::string loginUser(const std::string& email, const std::string& password);
    static std::string logoutUser(const std::string& token);
    static std::string validateSession(const std::string& token);
    static std::string changePassword(const std::string& token, const std::string& oldPassword, const std::string& newPassword);
    static std::string forgotPassword(const std::string& email);

    // Session helpers
    static int getUserIdFromToken(const std::string& token);
    static int getHostIdFromToken(const std::string& token);
    static int getGuestIdFromToken(const std::string& token);
    static bool isAdmin(const std::string& token);
};

#endif

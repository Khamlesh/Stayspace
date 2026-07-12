#ifndef USER_MODULE_H
#define USER_MODULE_H

#include <string>

class UserModule {
public:
    static std::string updateProfile(const std::string& token, const std::string& name, const std::string& bio, const std::string& profilePic);
    static std::string viewProfile(const std::string& token);
    static std::string getBookingHistory(const std::string& token);
    static std::string getWishlist(const std::string& token);
};

#endif

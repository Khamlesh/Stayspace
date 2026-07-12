#ifndef ADMIN_H
#define ADMIN_H

#include <string>

class AdminModule {
public:
    // Host management
    static std::string approveHost(const std::string& token, int hostId);
    static std::string rejectHost(const std::string& token, int hostId);
    static std::string getPendingHosts(const std::string& token);
    static std::string getAllUsers(const std::string& token);

    // Dashboard stats
    static std::string getDashboardStats(const std::string& token);

    // Property management
    static std::string getAllProperties(const std::string& token);
};

#endif

#ifndef NOTIFICATION_H
#define NOTIFICATION_H

#include <string>

class NotificationModule {
public:
    static std::string getNotifications(const std::string& token);
    static std::string markAsRead(const std::string& token, int notificationId);
    static std::string markAllAsRead(const std::string& token);
    static std::string getUnreadCount(const std::string& token);
};

#endif

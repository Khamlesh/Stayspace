#ifndef USER_H
#define USER_H

#include <string>
#include <sstream>
#include "../Utils/JsonParser.h"

class User {
protected:
    int id;
    std::string name;
    std::string email;
    std::string role;
    std::string profilePicture;
    std::string createdAt;

public:
    User(int id, const std::string& name, const std::string& email, const std::string& role, const std::string& profilePic, const std::string& created)
        : id(id), name(name), email(email), role(role), profilePicture(profilePic), createdAt(created) {}

    virtual ~User() {}

    int getId() const { return id; }
    std::string getName() const { return name; }
    std::string getEmail() const { return email; }
    std::string getRole() const { return role; }
    std::string getProfilePicture() const { return profilePicture; }
    std::string getCreatedAt() const { return createdAt; }

    void setName(const std::string& n) { name = n; }
    void setProfilePicture(const std::string& p) { profilePicture = p; }

    virtual std::string toJson() const {
        std::stringstream ss;
        ss << "{\"id\":" << id
           << ",\"name\":\"" << JsonParser::escape(name) << "\""
           << ",\"email\":\"" << JsonParser::escape(email) << "\""
           << ",\"role\":\"" << JsonParser::escape(role) << "\""
           << ",\"profile_picture\":\"" << JsonParser::escape(profilePicture) << "\""
           << ",\"created_at\":\"" << JsonParser::escape(createdAt) << "\"}";
        return ss.str();
    }
};

class GuestUser : public User {
private:
    std::string bio;

public:
    GuestUser(int id, const std::string& name, const std::string& email, const std::string& profilePic, const std::string& created, const std::string& bio)
        : User(id, name, email, "Guest", profilePic, created), bio(bio) {}

    std::string getBio() const { return bio; }
    void setBio(const std::string& b) { bio = b; }

    std::string toJson() const override {
        std::stringstream ss;
        ss << "{\"id\":" << id
           << ",\"name\":\"" << JsonParser::escape(name) << "\""
           << ",\"email\":\"" << JsonParser::escape(email) << "\""
           << ",\"role\":\"" << JsonParser::escape(role) << "\""
           << ",\"profile_picture\":\"" << JsonParser::escape(profilePicture) << "\""
           << ",\"created_at\":\"" << JsonParser::escape(createdAt) << "\""
           << ",\"bio\":\"" << JsonParser::escape(bio) << "\"}";
        return ss.str();
    }
};

class HostUser : public User {
private:
    bool isApproved;
    std::string bio;

public:
    HostUser(int id, const std::string& name, const std::string& email, const std::string& profilePic, const std::string& created, bool approved, const std::string& bio)
        : User(id, name, email, "Host", profilePic, created), isApproved(approved), bio(bio) {}

    bool getIsApproved() const { return isApproved; }
    std::string getBio() const { return bio; }
    void setBio(const std::string& b) { bio = b; }

    std::string toJson() const override {
        std::stringstream ss;
        ss << "{\"id\":" << id
           << ",\"name\":\"" << JsonParser::escape(name) << "\""
           << ",\"email\":\"" << JsonParser::escape(email) << "\""
           << ",\"role\":\"" << JsonParser::escape(role) << "\""
           << ",\"profile_picture\":\"" << JsonParser::escape(profilePicture) << "\""
           << ",\"created_at\":\"" << JsonParser::escape(createdAt) << "\""
           << ",\"is_approved\":" << (isApproved ? "true" : "false")
           << ",\"bio\":\"" << JsonParser::escape(bio) << "\"}";
        return ss.str();
    }
};

class AdminUser : public User {
public:
    AdminUser(int id, const std::string& name, const std::string& email, const std::string& profilePic, const std::string& created)
        : User(id, name, email, "Admin", profilePic, created) {}

    std::string toJson() const override {
        return User::toJson();
    }
};

#endif

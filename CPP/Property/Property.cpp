#include "Property.h"
#include "../Authentication/Auth.h"
#include "../Database/DatabaseConnection.h"
#include "../Utils/JsonParser.h"
#include <sstream>
#include <memory>
#include <vector>

// Helper utility to split string by comma
static std::vector<std::string> split(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream tokenStream(str);
    while (std::getline(tokenStream, token, delimiter)) {
        // Trim token
        size_t first = token.find_first_not_of(" \t\r\n");
        if (first != std::string::npos) {
            size_t last = token.find_last_not_of(" \t\r\n");
            tokens.push_back(token.substr(first, (last - first + 1)));
        }
    }
    return tokens;
}

std::string PropertyModule::addProperty(const std::string& token, const std::string& title, const std::string& description, const std::string& address, double pricePerNight, int maxGuests, const std::string& amenitiesCsv) {
    int hostId = Auth::getHostIdFromToken(token);
    if (hostId == -1) {
        return JsonParser::makeResponse("error", "Host session is unauthorized, unapproved, or expired.");
    }
    if (title.empty() || description.empty() || address.empty() || pricePerNight <= 0 || maxGuests <= 0) {
        return JsonParser::makeResponse("error", "Invalid listing details.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "INSERT INTO Properties (host_id, title, description, address, price_per_night, max_guests) VALUES (?, ?, ?, ?, ?, ?)"));
        stmt->setInt(1, hostId);
        stmt->setString(2, title);
        stmt->setString(3, description);
        stmt->setString(4, address);
        stmt->setDouble(5, pricePerNight);
        stmt->setInt(6, maxGuests);

        if (stmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to insert property.");
        }

        unsigned long long propId = conn->getLastInsertId();

        // Process and insert amenities
        std::vector<std::string> amenities = split(amenitiesCsv, ',');
        for (const auto& amen : amenities) {
            if (amen.empty()) continue;
            std::unique_ptr<sql::PreparedStatement> amenStmt(conn->prepareStatement(
                "INSERT INTO Amenities (property_id, name) VALUES (?, ?)"));
            amenStmt->setInt(1, propId);
            amenStmt->setString(2, amen);
            amenStmt->executeUpdate();
        }

        std::stringstream ss;
        ss << "{\"property_id\":" << propId << "}";
        return JsonParser::makeResponse("success", "Property published successfully.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PropertyModule::editProperty(const std::string& token, int propertyId, const std::string& title, const std::string& description, const std::string& address, double pricePerNight, int maxGuests, const std::string& amenitiesCsv) {
    int hostId = Auth::getHostIdFromToken(token);
    if (hostId == -1) {
        return JsonParser::makeResponse("error", "Host session is unauthorized, unapproved, or expired.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Verify property ownership
        std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT host_id FROM Properties WHERE id = ?"));
        checkStmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
        if (!res || !res->next() || res->getInt("host_id") != hostId) {
            return JsonParser::makeResponse("error", "Property not found or unauthorized to edit.");
        }

        // Update Properties
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "UPDATE Properties SET title = ?, description = ?, address = ?, price_per_night = ?, max_guests = ? WHERE id = ?"));
        stmt->setString(1, title);
        stmt->setString(2, description);
        stmt->setString(3, address);
        stmt->setDouble(4, pricePerNight);
        stmt->setInt(5, maxGuests);
        stmt->setInt(6, propertyId);

        if (stmt->executeUpdate() < 0) {
            return JsonParser::makeResponse("error", "Failed to update property details.");
        }

        // Delete old amenities
        std::unique_ptr<sql::PreparedStatement> delStmt(conn->prepareStatement("DELETE FROM Amenities WHERE property_id = ?"));
        delStmt->setInt(1, propertyId);
        delStmt->executeUpdate();

        // Insert new amenities
        std::vector<std::string> amenities = split(amenitiesCsv, ',');
        for (const auto& amen : amenities) {
            if (amen.empty()) continue;
            std::unique_ptr<sql::PreparedStatement> amenStmt(conn->prepareStatement(
                "INSERT INTO Amenities (property_id, name) VALUES (?, ?)"));
            amenStmt->setInt(1, propertyId);
            amenStmt->setString(2, amen);
            amenStmt->executeUpdate();
        }

        return JsonParser::makeResponse("success", "Property updated successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PropertyModule::deleteProperty(const std::string& token, int propertyId) {
    int hostId = Auth::getHostIdFromToken(token);
    bool isUserAdmin = Auth::isAdmin(token);

    if (hostId == -1 && !isUserAdmin) {
        return JsonParser::makeResponse("error", "Unauthorized command.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        if (!isUserAdmin) {
            // Verify ownership for hosts
            std::unique_ptr<sql::PreparedStatement> checkStmt(conn->prepareStatement("SELECT host_id FROM Properties WHERE id = ?"));
            checkStmt->setInt(1, propertyId);
            std::unique_ptr<sql::ResultSet> res(checkStmt->executeQuery());
            if (!res || !res->next() || res->getInt("host_id") != hostId) {
                return JsonParser::makeResponse("error", "Property not found or unauthorized to delete.");
            }
        }

        // Delete property (cascades automatically due to foreign key ON DELETE CASCADE)
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement("DELETE FROM Properties WHERE id = ?"));
        stmt->setInt(1, propertyId);
        stmt->executeUpdate();

        return JsonParser::makeResponse("success", "Property deleted successfully.");
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PropertyModule::getPropertyDetails(int propertyId) {
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Query Property & Host
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT p.id, p.title, p.description, p.address, p.price_per_night, p.max_guests, "
            "u.name as host_name, u.email as host_email, u.profile_picture as host_picture, h.bio as host_bio "
            "FROM Properties p "
            "JOIN Hosts h ON p.host_id = h.id "
            "JOIN Users u ON h.user_id = u.id "
            "WHERE p.id = ?"));
        stmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> res(stmt->executeQuery());

        if (!res || !res->next()) {
            return JsonParser::makeResponse("error", "Property not found.");
        }

        std::string title = res->getString("title");
        std::string description = res->getString("description");
        std::string address = res->getString("address");
        double price = res->getDouble("price_per_night");
        int maxGuests = res->getInt("max_guests");
        std::string hostName = res->getString("host_name");
        std::string hostEmail = res->getString("host_email");
        std::string hostPic = res->getString("host_picture");
        std::string hostBio = res->getString("host_bio");

        // Query Amenities
        std::unique_ptr<sql::PreparedStatement> amenStmt(conn->prepareStatement("SELECT name FROM Amenities WHERE property_id = ?"));
        amenStmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> amenRes(amenStmt->executeQuery());
        std::stringstream amenSs;
        amenSs << "[";
        bool firstAmen = true;
        while (amenRes && amenRes->next()) {
            if (!firstAmen) amenSs << ",";
            amenSs << "\"" << JsonParser::escape(amenRes->getString("name")) << "\"";
            firstAmen = false;
        }
        amenSs << "]";

        // Query Reviews
        std::unique_ptr<sql::PreparedStatement> revStmt(conn->prepareStatement(
            "SELECT r.id, r.rating, r.comment, r.created_at, u.name as guest_name "
            "FROM Reviews r "
            "JOIN Guests g ON r.guest_id = g.id "
            "JOIN Users u ON g.user_id = u.id "
            "WHERE r.property_id = ? "
            "ORDER BY r.id DESC"));
        revStmt->setInt(1, propertyId);
        std::unique_ptr<sql::ResultSet> revRes(revStmt->executeQuery());
        
        std::stringstream revSs;
        revSs << "[";
        bool firstRev = true;
        double sumRating = 0;
        int countRating = 0;

        while (revRes && revRes->next()) {
            if (!firstRev) revSs << ",";
            int rat = revRes->getInt("rating");
            sumRating += rat;
            countRating++;

            revSs << "{\"id\":" << revRes->getInt("id")
                  << ",\"guest_name\":\"" << JsonParser::escape(revRes->getString("guest_name")) << "\""
                  << ",\"rating\":" << rat
                  << ",\"comment\":\"" << JsonParser::escape(revRes->getString("comment")) << "\""
                  << ",\"created_at\":\"" << revRes->getString("created_at") << "\"}";
            firstRev = false;
        }
        revSs << "]";

        double avgRating = countRating > 0 ? (sumRating / countRating) : 0.0;

        std::stringstream finalSs;
        finalSs << "{\"id\":" << propertyId
                << ",\"title\":\"" << JsonParser::escape(title) << "\""
                << ",\"description\":\"" << JsonParser::escape(description) << "\""
                << ",\"address\":\"" << JsonParser::escape(address) << "\""
                << ",\"price_per_night\":" << price
                << ",\"max_guests\":" << maxGuests
                << ",\"host\":{"
                << "  \"name\":\"" << JsonParser::escape(hostName) << "\","
                << "  \"email\":\"" << JsonParser::escape(hostEmail) << "\","
                << "  \"profile_picture\":\"" << JsonParser::escape(hostPic) << "\","
                << "  \"bio\":\"" << JsonParser::escape(hostBio) << "\""
                << "},"
                << "\"amenities\":" << amenSs.str() << ","
                << "\"reviews\":" << revSs.str() << ","
                << "\"average_rating\":" << avgRating << ","
                << "\"review_count\":" << countRating
                << "}";

        return JsonParser::makeResponse("success", "Property details fetched.", finalSs.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PropertyModule::searchProperties(const std::string& query, double minPrice, double maxPrice, int guests) {
    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        // Build search query dynamically to avoid injection via escaping
        std::string sqlQuery = "SELECT id, title, description, address, price_per_night, max_guests FROM Properties WHERE 1=1 ";
        if (!query.empty()) {
            sqlQuery += "AND (title LIKE '%" + conn->escapeString(query) + "%' OR address LIKE '%" + conn->escapeString(query) + "%') ";
        }
        if (minPrice > 0) {
            sqlQuery += "AND price_per_night >= " + std::to_string(minPrice) + " ";
        }
        if (maxPrice > 0) {
            sqlQuery += "AND price_per_night <= " + std::to_string(maxPrice) + " ";
        }
        if (guests > 0) {
            sqlQuery += "AND max_guests >= " + std::to_string(guests) + " ";
        }
        sqlQuery += "ORDER BY id DESC";

        std::unique_ptr<sql::ResultSet> res(conn->executeQuery(sqlQuery));

        std::stringstream ss;
        ss << "[";
        bool first = true;
        while (res && res->next()) {
            if (!first) ss << ",";
            int propId = res->getInt("id");

            // Query average rating
            std::unique_ptr<sql::PreparedStatement> ratingStmt(conn->prepareStatement(
                "SELECT AVG(rating), COUNT(rating) FROM Reviews WHERE property_id = ?"));
            ratingStmt->setInt(1, propId);
            std::unique_ptr<sql::ResultSet> ratingRes(ratingStmt->executeQuery());
            double avgRating = 0;
            int totalReviews = 0;
            if (ratingRes && ratingRes->next()) {
                avgRating = ratingRes->getDouble(1);
                totalReviews = ratingRes->getInt(2);
            }

            ss << "{\"id\":" << propId
               << ",\"title\":\"" << JsonParser::escape(res->getString("title")) << "\""
               << ",\"description\":\"" << JsonParser::escape(res->getString("description")) << "\""
               << ",\"address\":\"" << JsonParser::escape(res->getString("address")) << "\""
               << ",\"price_per_night\":" << res->getDouble("price_per_night")
               << ",\"max_guests\":" << res->getInt("max_guests")
               << ",\"average_rating\":" << avgRating
               << ",\"review_count\":" << totalReviews << "}";
            first = false;
        }
        ss << "]";

        return JsonParser::makeResponse("success", "Search completed.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

std::string PropertyModule::getHostProperties(const std::string& token) {
    int hostId = Auth::getHostIdFromToken(token);
    if (hostId == -1) {
        return JsonParser::makeResponse("error", "Host session is unauthorized, unapproved, or expired.");
    }

    sql::Connection* conn = DatabaseConnection::getInstance().getConnection();
    if (!conn) {
        return JsonParser::makeResponse("error", "Database connection failed.");
    }

    try {
        std::unique_ptr<sql::PreparedStatement> stmt(conn->prepareStatement(
            "SELECT id, title, description, address, price_per_night, max_guests FROM Properties WHERE host_id = ? ORDER BY id DESC"));
        stmt->setInt(1, hostId);
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

        return JsonParser::makeResponse("success", "Host properties fetched.", ss.str());
    } catch (const std::exception& e) {
        return JsonParser::makeResponse("error", std::string("Database error: ") + e.what());
    }
}

#ifndef PROPERTY_H
#define PROPERTY_H

#include <string>

class PropertyModule {
public:
    static std::string addProperty(const std::string& token, const std::string& title, const std::string& description, const std::string& address, double pricePerNight, int maxGuests, const std::string& amenitiesCsv);
    static std::string editProperty(const std::string& token, int propertyId, const std::string& title, const std::string& description, const std::string& address, double pricePerNight, int maxGuests, const std::string& amenitiesCsv);
    static std::string deleteProperty(const std::string& token, int propertyId);
    static std::string getPropertyDetails(int propertyId);
    static std::string searchProperties(const std::string& query, double minPrice, double maxPrice, int guests);
    static std::string getHostProperties(const std::string& token);
};

#endif

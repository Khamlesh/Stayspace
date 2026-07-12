#include "Database/DatabaseConnection.h"
#include "Authentication/Auth.h"
#include "Property/Property.h"
#include "Utils/JsonParser.h"
#include <iostream>
#include <string>
#include <windows.h>

int main(int argc, char* argv[]) {
    // Ensure console output is in UTF-8
    SetConsoleOutputCP(CP_UTF8);

    if (argc < 2) {
        std::cout << JsonParser::makeResponse("error", "Usage: stayspace_core.exe <module> <action> <json_params>") << std::endl;
        return 0;
    }

    // Auto-initialize and verify connection
    if (!DatabaseConnection::getInstance().initialize()) {
        std::cout << JsonParser::makeResponse("error", "Database initialization failed.") << std::endl;
        return 0;
    }

    std::string module = argv[1];

    if (module == "db_init") {
        std::cout << JsonParser::makeResponse("success", "Database initialized and seeded successfully.") << std::endl;
        return 0;
    }

    if (argc < 4) {
        std::cout << JsonParser::makeResponse("error", "Params are missing. Usage: stayspace_core.exe <module> <action> <json_params>") << std::endl;
        return 0;
    }

    std::string action = argv[2];
    std::string jsonParams = argv[3];

    // Parse flat parameter map
    std::map<std::string, std::string> params = JsonParser::parseFlatObject(jsonParams);

    if (module == "auth") {
        if (action == "register") {
            std::cout << Auth::registerUser(params["name"], params["email"], params["password"], params["role"]) << std::endl;
        } else if (action == "login") {
            std::cout << Auth::loginUser(params["email"], params["password"]) << std::endl;
        } else if (action == "logout") {
            std::cout << Auth::logoutUser(params["token"]) << std::endl;
        } else if (action == "validate") {
            std::cout << Auth::validateSession(params["token"]) << std::endl;
        } else if (action == "change_password") {
            std::cout << Auth::changePassword(params["token"], params["old_password"], params["new_password"]) << std::endl;
        } else if (action == "forgot_password") {
            std::cout << Auth::forgotPassword(params["email"]) << std::endl;
        } else {
            std::cout << JsonParser::makeResponse("error", "Unknown auth action.") << std::endl;
        }
        return 0;
    }

    if (module == "property") {
        if (action == "create") {
            double price = params["price_per_night"].empty() ? 0.0 : std::stod(params["price_per_night"]);
            int guests = params["max_guests"].empty() ? 0 : std::stoi(params["max_guests"]);
            std::cout << PropertyModule::addProperty(params["token"], params["title"], params["description"], params["address"], price, guests, params["amenities"]) << std::endl;
        } else if (action == "list") {
            double minPrice = params["min_price"].empty() ? 0.0 : std::stod(params["min_price"]);
            double maxPrice = params["max_price"].empty() ? 0.0 : std::stod(params["max_price"]);
            int guests = params["guests"].empty() ? 0 : std::stoi(params["guests"]);
            std::cout << PropertyModule::searchProperties(params["query"], minPrice, maxPrice, guests) << std::endl;
        } else if (action == "details") {
            int propertyId = params["property_id"].empty() ? 0 : std::stoi(params["property_id"]);
            std::cout << PropertyModule::getPropertyDetails(propertyId) << std::endl;
        } else if (action == "host") {
            std::cout << PropertyModule::getHostProperties(params["token"]) << std::endl;
        } else {
            std::cout << JsonParser::makeResponse("error", "Unknown property action.") << std::endl;
        }
        return 0;
    }

    std::cout << JsonParser::makeResponse("error", "Unknown module '" + module + "'.") << std::endl;
    return 0;
}

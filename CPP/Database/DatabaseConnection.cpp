#include "DatabaseConnection.h"

DatabaseConnection::DatabaseConnection() : conn(nullptr), port(3306), initialized(false) {}

DatabaseConnection::~DatabaseConnection() {}

DatabaseConnection& DatabaseConnection::getInstance() {
    static DatabaseConnection instance;
    return instance;
}

bool DatabaseConnection::initialize() {
    if (initialized) return true;

    EnvReader env;
    if (!env.load()) {
        std::cerr << "[DatabaseConnection] Error: Could not find or load .env file." << std::endl;
        return false;
    }

    host = env.get("DB_HOST", "localhost");
    user = env.get("DB_USER", "root");
    pass = env.get("DB_PASSWORD", "");
    dbName = env.get("DB_NAME", "stayspace");
    
    std::string portStr = env.get("DB_PORT", "3306");
    port = std::stoi(portStr);

    std::clog << "[DatabaseConnection] Attempting to connect to MySQL Server at " << host << ":" << port << "..." << std::endl;

    conn = std::unique_ptr<sql::Connection>(new sql::Connection());
    if (!conn->connect(host, user, pass, "", port)) {
        std::cerr << "[DatabaseConnection] Error: Could not connect to MySQL server. Check credentials." << std::endl;
        return false;
    }

    std::clog << "[DatabaseConnection] Connected to MySQL Server." << std::endl;

    if (!dbExists()) {
        std::clog << "[DatabaseConnection] Database '" << dbName << "' does not exist. Creating database..." << std::endl;
        if (!createDatabase()) {
            std::cerr << "[DatabaseConnection] Error: Failed to create database '" << dbName << "'." << std::endl;
            return false;
        }
    }

    if (!conn->selectDatabase(dbName)) {
        std::cerr << "[DatabaseConnection] Error: Failed to select database '" << dbName << "'." << std::endl;
        return false;
    }

    std::clog << "[DatabaseConnection] Selected database '" << dbName << "'." << std::endl;

    if (!createTables()) {
        std::cerr << "[DatabaseConnection] Error: Failed to initialize database tables." << std::endl;
        return false;
    }

    initialized = true;
    return true;
}

sql::Connection* DatabaseConnection::getConnection() {
    if (!initialized) {
        if (!initialize()) {
            return nullptr;
        }
    }
    return conn.get();
}

bool DatabaseConnection::dbExists() {
    std::string q = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" + dbName + "'";
    std::unique_ptr<sql::ResultSet> res(conn->executeQuery(q));
    if (res && res->next()) {
        return true;
    }
    return false;
}

bool DatabaseConnection::createDatabase() {
    std::string q = "CREATE DATABASE IF NOT EXISTS " + dbName;
    int r = conn->executeUpdate(q);
    return r >= 0;
}

bool DatabaseConnection::createTables() {
    std::vector<std::pair<std::string, std::string>> tables = {
        {"Users", 
         "CREATE TABLE IF NOT EXISTS Users ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  name VARCHAR(100) NOT NULL,"
         "  email VARCHAR(100) UNIQUE NOT NULL,"
         "  password_hash VARCHAR(255) NOT NULL,"
         "  salt VARCHAR(64) NOT NULL,"
         "  role ENUM('Guest', 'Host', 'Admin') NOT NULL DEFAULT 'Guest',"
         "  profile_picture VARCHAR(255) NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
         ") ENGINE=InnoDB;"},

        {"Guests",
         "CREATE TABLE IF NOT EXISTS Guests ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  user_id INT NOT NULL UNIQUE,"
         "  bio TEXT,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE"
         ") ENGINE=InnoDB;"},

        {"Hosts",
         "CREATE TABLE IF NOT EXISTS Hosts ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  user_id INT NOT NULL UNIQUE,"
         "  is_approved BOOLEAN DEFAULT FALSE,"
         "  bio TEXT,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE"
         ") ENGINE=InnoDB;"},

        {"Admins",
         "CREATE TABLE IF NOT EXISTS Admins ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  user_id INT NOT NULL UNIQUE,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE"
         ") ENGINE=InnoDB;"},

        {"Properties",
         "CREATE TABLE IF NOT EXISTS Properties ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  host_id INT NOT NULL,"
         "  title VARCHAR(150) NOT NULL,"
         "  description TEXT NOT NULL,"
         "  address VARCHAR(255) NOT NULL,"
         "  price_per_night DECIMAL(10, 2) NOT NULL,"
         "  max_guests INT NOT NULL,"
         "  latitude DECIMAL(9, 6) NULL,"
         "  longitude DECIMAL(9, 6) NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (host_id) REFERENCES Hosts(id) ON DELETE CASCADE,"
         "  INDEX idx_price (price_per_night),"
         "  INDEX idx_host (host_id)"
         ") ENGINE=InnoDB;"},

        {"Amenities",
         "CREATE TABLE IF NOT EXISTS Amenities ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  property_id INT NOT NULL,"
         "  name VARCHAR(100) NOT NULL,"
         "  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,"
         "  INDEX idx_property (property_id)"
         ") ENGINE=InnoDB;"},

        {"Bookings",
         "CREATE TABLE IF NOT EXISTS Bookings ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  property_id INT NOT NULL,"
         "  guest_id INT NOT NULL,"
         "  check_in DATE NOT NULL,"
         "  check_out DATE NOT NULL,"
         "  total_price DECIMAL(10, 2) NOT NULL,"
         "  status ENUM('Pending', 'Confirmed', 'Cancelled') DEFAULT 'Pending',"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,"
         "  FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE CASCADE,"
         "  INDEX idx_dates (check_in, check_out)"
         ") ENGINE=InnoDB;"},

        {"Payments",
         "CREATE TABLE IF NOT EXISTS Payments ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  booking_id INT NOT NULL,"
         "  amount DECIMAL(10, 2) NOT NULL,"
         "  payment_method ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking') NOT NULL,"
         "  status ENUM('Success', 'Failed') DEFAULT 'Success',"
         "  transaction_id VARCHAR(100) NOT NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE,"
         "  INDEX idx_transaction (transaction_id)"
         ") ENGINE=InnoDB;"},

        {"Reviews",
         "CREATE TABLE IF NOT EXISTS Reviews ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  property_id INT NOT NULL,"
         "  guest_id INT NOT NULL,"
         "  rating INT CHECK (rating >= 1 AND rating <= 5),"
         "  comment TEXT,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,"
         "  FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE CASCADE,"
         "  INDEX idx_property_rev (property_id)"
         ") ENGINE=InnoDB;"},

        {"Wishlist",
         "CREATE TABLE IF NOT EXISTS Wishlist ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  guest_id INT NOT NULL,"
         "  property_id INT NOT NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  UNIQUE KEY unique_wishlist (guest_id, property_id),"
         "  FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE CASCADE,"
         "  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE"
         ") ENGINE=InnoDB;"},

        {"Notifications",
         "CREATE TABLE IF NOT EXISTS Notifications ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  user_id INT NOT NULL,"
         "  message TEXT NOT NULL,"
         "  is_read BOOLEAN DEFAULT FALSE,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,"
         "  INDEX idx_user_notif (user_id)"
         ") ENGINE=InnoDB;"},

        {"Receipts",
         "CREATE TABLE IF NOT EXISTS Receipts ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  payment_id INT NOT NULL UNIQUE,"
         "  receipt_path VARCHAR(255) NOT NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (payment_id) REFERENCES Payments(id) ON DELETE CASCADE"
         ") ENGINE=InnoDB;"},

        {"Reports",
         "CREATE TABLE IF NOT EXISTS Reports ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  type ENUM('Earnings', 'Analytics', 'Activity', 'Revenue') NOT NULL,"
         "  path VARCHAR(255) NOT NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
         ") ENGINE=InnoDB;"},

        {"Sessions",
         "CREATE TABLE IF NOT EXISTS Sessions ("
         "  id INT AUTO_INCREMENT PRIMARY KEY,"
         "  user_id INT NOT NULL,"
         "  session_token VARCHAR(255) NOT NULL UNIQUE,"
         "  expires_at TIMESTAMP NOT NULL,"
         "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
         "  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,"
         "  INDEX idx_token (session_token)"
         ") ENGINE=InnoDB;"}
    };

    for (const auto& table : tables) {
        std::clog << "[DatabaseConnection] Making sure table '" << table.first << "' exists..." << std::endl;
        int r = conn->executeUpdate(table.second);
        if (r < 0) {
            std::cerr << "[DatabaseConnection] Error creating table '" << table.first << "'." << std::endl;
            return false;
        }
    }

    std::clog << "[DatabaseConnection] All tables checked/created successfully." << std::endl;

    return seedDefaultData();
}

bool DatabaseConnection::seedDefaultData() {
    std::string checkQ = "SELECT COUNT(*) FROM Users";
    std::unique_ptr<sql::ResultSet> res(conn->executeQuery(checkQ));
    if (res && res->next()) {
        int count = res->getInt(1);
        if (count > 0) {
            return true;
        }
    }

    std::clog << "[DatabaseConnection] Seeding default administrator account and sample records..." << std::endl;

    // 1. Insert default administrator
    std::string adminSalt = HashUtils::generateSalt();
    std::string adminHash = HashUtils::hashPassword("Admin@1234", adminSalt);
    std::string insertAdminUser = 
        "INSERT INTO Users (name, email, password_hash, salt, role) VALUES ('System Administrator', 'admin@stayspace.com', '" + adminHash + "', '" + adminSalt + "', 'Admin')";
    
    if (conn->executeUpdate(insertAdminUser) < 0) return false;
    unsigned long long adminUserId = conn->getLastInsertId();

    std::string insertAdminMap = "INSERT INTO Admins (user_id) VALUES (" + std::to_string(adminUserId) + ")";
    if (conn->executeUpdate(insertAdminMap) < 0) return false;

    // 2. Insert guest
    std::string guestSalt = HashUtils::generateSalt();
    std::string guestHash = HashUtils::hashPassword("Guest@1234", guestSalt);
    std::string insertGuestUser = 
        "INSERT INTO Users (name, email, password_hash, salt, role) VALUES ('Aarav Guest', 'guest@stayspace.com', '" + guestHash + "', '" + guestSalt + "', 'Guest')";
    
    if (conn->executeUpdate(insertGuestUser) < 0) return false;
    unsigned long long guestUserId = conn->getLastInsertId();

    std::string insertGuestMap = "INSERT INTO Guests (user_id, bio) VALUES (" + std::to_string(guestUserId) + ", 'Avid traveler exploring memorable stays across India.')";
    if (conn->executeUpdate(insertGuestMap) < 0) return false;
    unsigned long long guestId = conn->getLastInsertId();

    // 3. Insert host
    std::string hostSalt = HashUtils::generateSalt();
    std::string hostHash = HashUtils::hashPassword("Host@1234", hostSalt);
    std::string insertHostUser = 
        "INSERT INTO Users (name, email, password_hash, salt, role) VALUES ('Priya Host', 'host@stayspace.com', '" + hostHash + "', '" + hostSalt + "', 'Host')";
    
    if (conn->executeUpdate(insertHostUser) < 0) return false;
    unsigned long long hostUserId = conn->getLastInsertId();

    std::string insertHostMap = "INSERT INTO Hosts (user_id, is_approved, bio) VALUES (" + std::to_string(hostUserId) + ", TRUE, 'Hosting unique villas, havelis, and apartments across India since 2021.')";
    if (conn->executeUpdate(insertHostMap) < 0) return false;
    unsigned long long hostId = conn->getLastInsertId();

    // 4. Insert dummy properties and amenities
    struct SeedProperty {
        std::string title;
        std::string desc;
        std::string addr;
        double price;
        int guests;
        std::vector<std::string> amenities;
    };

    std::vector<SeedProperty> seedProperties = {
        {
            "Jaipur Heritage Haveli",
            "Stay inside a restored haveli near the old city, with carved balconies, a quiet courtyard, and warm Rajasthani hospitality.",
            "Badi Chaupar, Jaipur, Rajasthan",
            4200.00,
            4, 
            {"Wifi", "Courtyard", "Kitchen", "AC", "Free Parking"}
        },
        {
            "Goa Seaside Glass Villa",
            "Wake up to sea breeze and palm views in this modern villa near Candolim, with open living spaces, a private pool, and beach access.",
            "Candolim Beach Road, Goa",
            12500.00,
            6, 
            {"Wifi", "Sea View", "Pool", "Kitchen", "AC", "Private Patio"}
        },
        {
            "Mumbai Sea View Penthouse",
            "Experience city luxury with Arabian Sea views, elegant interiors, a chef-ready kitchen, and quick access to Bandra cafes.",
            "Carter Road, Bandra West, Mumbai, Maharashtra",
            9800.00,
            2, 
            {"Wifi", "Sea View", "Gym", "Kitchen", "AC", "Elevator"}
        }
    };

    for (const auto& prop : seedProperties) {
        std::string insertProp = 
            "INSERT INTO Properties (host_id, title, description, address, price_per_night, max_guests) VALUES ("
            + std::to_string(hostId) + ", '" + conn->escapeString(prop.title) + "', '" + conn->escapeString(prop.desc) + "', '" 
            + conn->escapeString(prop.addr) + "', " + std::to_string(prop.price) + ", " + std::to_string(prop.guests) + ")";
        
        if (conn->executeUpdate(insertProp) < 0) return false;
        unsigned long long propId = conn->getLastInsertId();

        for (const auto& amen : prop.amenities) {
            std::string insertAmen = "INSERT INTO Amenities (property_id, name) VALUES (" + std::to_string(propId) + ", '" + conn->escapeString(amen) + "')";
            if (conn->executeUpdate(insertAmen) < 0) return false;
        }

        std::string insertRev = 
            "INSERT INTO Reviews (property_id, guest_id, rating, comment) VALUES ("
            + std::to_string(propId) + ", " + std::to_string(guestId) + ", 5, 'Absolutely loved the place! Had a wonderful stay. Highly recommended!')";
        if (conn->executeUpdate(insertRev) < 0) return false;
    }

    std::clog << "[DatabaseConnection] Seeding finished successfully." << std::endl;
    return true;
}

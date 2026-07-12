#ifndef DATABASE_CONNECTION_H
#define DATABASE_CONNECTION_H

#include "MySqlConnector.h"
#include "EnvReader.h"
#include "../Utils/HashUtils.h"
#include <memory>

class DatabaseConnection {
private:
    std::unique_ptr<sql::Connection> conn;
    std::string host, user, pass, dbName;
    unsigned int port;
    bool initialized;

    bool dbExists();
    bool createDatabase();
    bool createTables();
    bool seedDefaultData();

    DatabaseConnection(const DatabaseConnection&) = delete;
    DatabaseConnection& operator=(const DatabaseConnection&) = delete;

public:
    DatabaseConnection();
    ~DatabaseConnection();

    static DatabaseConnection& getInstance();

    bool initialize();
    sql::Connection* getConnection();
    bool isInitialized() const { return initialized; }
};

#endif

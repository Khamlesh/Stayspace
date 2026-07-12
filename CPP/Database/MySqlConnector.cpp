#include "MySqlConnector.h"

// Define static members of MySqlDll
HMODULE MySqlDll::hModule = NULL;
MySqlDll::mysql_init_t MySqlDll::mysql_init = nullptr;
MySqlDll::mysql_real_connect_t MySqlDll::mysql_real_connect = nullptr;
MySqlDll::mysql_query_t MySqlDll::mysql_query = nullptr;
MySqlDll::mysql_store_result_t MySqlDll::mysql_store_result = nullptr;
MySqlDll::mysql_num_fields_t MySqlDll::mysql_num_fields = nullptr;
MySqlDll::mysql_fetch_row_t MySqlDll::mysql_fetch_row = nullptr;
MySqlDll::mysql_fetch_fields_t MySqlDll::mysql_fetch_fields = nullptr;
MySqlDll::mysql_free_result_t MySqlDll::mysql_free_result = nullptr;
MySqlDll::mysql_close_t MySqlDll::mysql_close = nullptr;
MySqlDll::mysql_error_t MySqlDll::mysql_error = nullptr;
MySqlDll::mysql_real_escape_string_t MySqlDll::mysql_real_escape_string = nullptr;
MySqlDll::mysql_affected_rows_t MySqlDll::mysql_affected_rows = nullptr;
MySqlDll::mysql_insert_id_t MySqlDll::mysql_insert_id = nullptr;

bool MySqlDll::load() {
    if (hModule != NULL) return true;

    // Check common paths for MySQL Server installation libmysql.dll
    std::vector<std::string> paths = {
        "C:\\Program Files\\MySQL\\MySQL Server 8.0\\lib\\libmysql.dll",
        "libmysql.dll",
        "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\libmysql.dll",
        "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\lib\\libmysql.dll"
    };

    for (const auto& path : paths) {
        hModule = LoadLibraryA(path.c_str());
        if (hModule != NULL) {
            break;
        }
    }

    if (hModule == NULL) {
        std::cerr << "[MySqlDll] Error: Failed to load libmysql.dll. Ensure MySQL Server is installed." << std::endl;
        return false;
    }

    mysql_init = (mysql_init_t)GetProcAddress(hModule, "mysql_init");
    mysql_real_connect = (mysql_real_connect_t)GetProcAddress(hModule, "mysql_real_connect");
    mysql_query = (mysql_query_t)GetProcAddress(hModule, "mysql_query");
    mysql_store_result = (mysql_store_result_t)GetProcAddress(hModule, "mysql_store_result");
    mysql_num_fields = (mysql_num_fields_t)GetProcAddress(hModule, "mysql_num_fields");
    mysql_fetch_row = (mysql_fetch_row_t)GetProcAddress(hModule, "mysql_fetch_row");
    mysql_fetch_fields = (mysql_fetch_fields_t)GetProcAddress(hModule, "mysql_fetch_fields");
    mysql_free_result = (mysql_free_result_t)GetProcAddress(hModule, "mysql_free_result");
    mysql_close = (mysql_close_t)GetProcAddress(hModule, "mysql_close");
    mysql_error = (mysql_error_t)GetProcAddress(hModule, "mysql_error");
    mysql_real_escape_string = (mysql_real_escape_string_t)GetProcAddress(hModule, "mysql_real_escape_string");
    mysql_affected_rows = (mysql_affected_rows_t)GetProcAddress(hModule, "mysql_affected_rows");
    mysql_insert_id = (mysql_insert_id_t)GetProcAddress(hModule, "mysql_insert_id");

    if (!mysql_init || !mysql_real_connect || !mysql_query || !mysql_store_result || 
        !mysql_num_fields || !mysql_fetch_row || !mysql_free_result || !mysql_close || 
        !mysql_error || !mysql_real_escape_string || !mysql_affected_rows || !mysql_insert_id) {
        std::cerr << "[MySqlDll] Error: Failed to resolve core API functions from libmysql.dll." << std::endl;
        FreeLibrary(hModule);
        hModule = NULL;
        return false;
    }

    return true;
}

namespace sql {

    // Helper structures matching internal MySQL field struct to retrieve names
    struct mysql_field_internal {
        char *name;                 /* Name of column */
        char *org_name;             /* Original column name, if an alias */
        char *table;                /* Table of column if column was a field */
        char *org_table;            /* Org table name, if table was an alias */
        char *db;                   /* Database for table */
        char *catalog;              /* Catalog for table */
        char *def;                  /* Default value (computed by mysql_list_fields) */
        unsigned long length;       /* Width of column (create length) */
        unsigned long max_length;   /* Max width for selected record set */
        unsigned int name_length;
        unsigned int org_name_length;
        unsigned int table_length;
        unsigned int org_table_length;
        unsigned int db_length;
        unsigned int catalog_length;
        unsigned int def_length;
        unsigned int flags;         /* Div flags */
        unsigned int decimals;      /* Number of decimals in field */
        unsigned int charsetnr;     /* Character set number */
        unsigned int type;          /* Type of field. See mysql_com.h for types */
        void *extension;
    };

    // ==========================================
    // ResultSet Implementation
    // ==========================================
    ResultSet::ResultSet(void* mysqlResult) : res(mysqlResult), currentRow(nullptr), numFields(0) {
        if (res) {
            numFields = MySqlDll::mysql_num_fields(res);
            mysql_field_internal* fields = (mysql_field_internal*)MySqlDll::mysql_fetch_fields(res);
            if (fields) {
                for (unsigned int i = 0; i < numFields; ++i) {
                    std::string name = fields[i].name;
                    fieldNames.push_back(name);
                    fieldIndexMap[name] = i;
                }
            }
        }
    }

    ResultSet::~ResultSet() {
        if (res) {
            MySqlDll::mysql_free_result(res);
        }
    }

    bool ResultSet::next() {
        if (!res) return false;
        currentRow = MySqlDll::mysql_fetch_row(res);
        return currentRow != nullptr;
    }

    std::string ResultSet::getString(const std::string& column) {
        auto it = fieldIndexMap.find(column);
        if (it == fieldIndexMap.end() || !currentRow || !currentRow[it->second]) {
            return "";
        }
        return currentRow[it->second];
    }

    int ResultSet::getInt(const std::string& column) {
        std::string val = getString(column);
        return val.empty() ? 0 : std::stoi(val);
    }

    double ResultSet::getDouble(const std::string& column) {
        std::string val = getString(column);
        return val.empty() ? 0.0 : std::stod(val);
    }

    bool ResultSet::getBoolean(const std::string& column) {
        std::string val = getString(column);
        return (val == "1" || val == "true" || val == "TRUE");
    }

    std::string ResultSet::getString(int columnIndex) {
        int idx = columnIndex - 1;
        if (idx < 0 || idx >= (int)numFields || !currentRow || !currentRow[idx]) {
            return "";
        }
        return currentRow[idx];
    }

    int ResultSet::getInt(int columnIndex) {
        std::string val = getString(columnIndex);
        return val.empty() ? 0 : std::stoi(val);
    }

    double ResultSet::getDouble(int columnIndex) {
        std::string val = getString(columnIndex);
        return val.empty() ? 0.0 : std::stod(val);
    }

    bool ResultSet::getBoolean(int columnIndex) {
        std::string val = getString(columnIndex);
        return (val == "1" || val == "true");
    }

    std::string ResultSet::getColumnName(int columnIndex) const {
        int idx = columnIndex - 1;
        if (idx < 0 || idx >= (int)fieldNames.size()) return "";
        return fieldNames[idx];
    }

    // ==========================================
    // PreparedStatement Implementation
    // ==========================================
    void PreparedStatement::setString(int index, const std::string& val) {
        params[index] = "'" + conn->escapeString(val) + "'";
    }

    void PreparedStatement::setInt(int index, int val) {
        params[index] = std::to_string(val);
    }

    void PreparedStatement::setDouble(int index, double val) {
        params[index] = std::to_string(val);
    }

    void PreparedStatement::setBoolean(int index, bool val) {
        params[index] = val ? "1" : "0";
    }

    void PreparedStatement::setNull(int index) {
        params[index] = "NULL";
    }

    ResultSet* PreparedStatement::executeQuery() {
        std::string query = "";
        int paramIndex = 1;
        for (size_t i = 0; i < queryTemplate.length(); ++i) {
            if (queryTemplate[i] == '?') {
                auto it = params.find(paramIndex);
                if (it != params.end()) {
                    query += it->second;
                } else {
                    query += "NULL";
                }
                paramIndex++;
            } else {
                query += queryTemplate[i];
            }
        }
        return conn->executeQuery(query);
    }

    int PreparedStatement::executeUpdate() {
        std::string query = "";
        int paramIndex = 1;
        for (size_t i = 0; i < queryTemplate.length(); ++i) {
            if (queryTemplate[i] == '?') {
                auto it = params.find(paramIndex);
                if (it != params.end()) {
                    query += it->second;
                } else {
                    query += "NULL";
                }
                paramIndex++;
            } else {
                query += queryTemplate[i];
            }
        }
        return conn->executeUpdate(query);
    }

    unsigned long long PreparedStatement::getLastInsertId() {
        return conn->getLastInsertId();
    }

    // ==========================================
    // Connection Implementation
    // ==========================================
    Connection::Connection() : mysql(nullptr), port(3306) {}

    Connection::~Connection() {
        close();
    }

    bool Connection::connect(const std::string& h, const std::string& u, const std::string& p, const std::string& d, unsigned int pt) {
        host = h; user = u; pass = p; db = d; port = pt;

        if (!MySqlDll::load()) return false;

        mysql = MySqlDll::mysql_init(nullptr);
        if (!mysql) return false;

        void* connectResult = MySqlDll::mysql_real_connect(mysql, host.c_str(), user.c_str(), pass.c_str(), 
                                                          db.empty() ? nullptr : db.c_str(), port, nullptr, 0);
        if (!connectResult) {
            std::cerr << "[sql::Connection] Connect error: " << MySqlDll::mysql_error(mysql) << std::endl;
            MySqlDll::mysql_close(mysql);
            mysql = nullptr;
            return false;
        }
        return true;
    }

    void Connection::close() {
        if (mysql) {
            MySqlDll::mysql_close(mysql);
            mysql = nullptr;
        }
    }

    bool Connection::selectDatabase(const std::string& dbName) {
        if (!mysql) return false;
        std::string q = "USE " + dbName;
        int r = MySqlDll::mysql_query(mysql, q.c_str());
        return r == 0;
    }

    int Connection::executeUpdate(const std::string& query) {
        if (!mysql) return -1;
        int r = MySqlDll::mysql_query(mysql, query.c_str());
        if (r != 0) {
            std::cerr << "[sql::Connection] Query error: " << MySqlDll::mysql_error(mysql) 
                      << " (Query: " << query << ")" << std::endl;
            return -1;
        }
        return MySqlDll::mysql_affected_rows(mysql);
    }

    ResultSet* Connection::executeQuery(const std::string& query) {
        if (!mysql) return nullptr;
        int r = MySqlDll::mysql_query(mysql, query.c_str());
        if (r != 0) {
            std::cerr << "[sql::Connection] Query error: " << MySqlDll::mysql_error(mysql) 
                      << " (Query: " << query << ")" << std::endl;
            return nullptr;
        }
        void* res = MySqlDll::mysql_store_result(mysql);
        return new ResultSet(res);
    }

    PreparedStatement* Connection::prepareStatement(const std::string& query) {
        return new PreparedStatement(this, query);
    }

    std::string Connection::escapeString(const std::string& src) {
        if (!mysql || src.empty()) return "";
        std::vector<char> dest(src.length() * 2 + 1, 0);
        unsigned long len = MySqlDll::mysql_real_escape_string(mysql, dest.data(), src.c_str(), src.length());
        return std::string(dest.data(), len);
    }

    unsigned long long Connection::getLastInsertId() {
        if (!mysql) return 0;
        return MySqlDll::mysql_insert_id(mysql);
    }
}

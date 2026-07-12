#ifndef MYSQL_CONNECTOR_H
#define MYSQL_CONNECTOR_H

#include <windows.h>
#include <string>
#include <vector>
#include <map>
#include <iostream>
#include <sstream>

#ifndef STDCALL
#define STDCALL __stdcall
#endif

class MySqlDll {
public:
    static HMODULE hModule;
    
    // Function pointers matching MySQL C API
    typedef void* (STDCALL *mysql_init_t)(void*);
    typedef void* (STDCALL *mysql_real_connect_t)(void*, const char*, const char*, const char*, const char*, unsigned int, const char*, unsigned long);
    typedef int (STDCALL *mysql_query_t)(void*, const char*);
    typedef void* (STDCALL *mysql_store_result_t)(void*);
    typedef unsigned int (STDCALL *mysql_num_fields_t)(void*);
    typedef char** (STDCALL *mysql_fetch_row_t)(void*);
    typedef void* (STDCALL *mysql_fetch_fields_t)(void*);
    typedef void (STDCALL *mysql_free_result_t)(void*);
    typedef void (STDCALL *mysql_close_t)(void*);
    typedef const char* (STDCALL *mysql_error_t)(void*);
    typedef unsigned long (STDCALL *mysql_real_escape_string_t)(void*, char*, const char*, unsigned long);
    typedef unsigned long long (STDCALL *mysql_affected_rows_t)(void*);
    typedef unsigned long long (STDCALL *mysql_insert_id_t)(void*);

    static mysql_init_t mysql_init;
    static mysql_real_connect_t mysql_real_connect;
    static mysql_query_t mysql_query;
    static mysql_store_result_t mysql_store_result;
    static mysql_num_fields_t mysql_num_fields;
    static mysql_fetch_row_t mysql_fetch_row;
    static mysql_fetch_fields_t mysql_fetch_fields;
    static mysql_free_result_t mysql_free_result;
    static mysql_close_t mysql_close;
    static mysql_error_t mysql_error;
    static mysql_real_escape_string_t mysql_real_escape_string;
    static mysql_affected_rows_t mysql_affected_rows;
    static mysql_insert_id_t mysql_insert_id;

    static bool load();
};

namespace sql {
    class Connection;
    class PreparedStatement;

    class ResultSet {
    private:
        void* res; // MYSQL_RES*
        char** currentRow;
        unsigned int numFields;
        std::vector<std::string> fieldNames;
        std::map<std::string, int> fieldIndexMap;

    public:
        ResultSet(void* mysqlResult);
        ~ResultSet();

        bool next();
        std::string getString(const std::string& column);
        int getInt(const std::string& column);
        double getDouble(const std::string& column);
        bool getBoolean(const std::string& column);

        std::string getString(int columnIndex);
        int getInt(int columnIndex);
        double getDouble(int columnIndex);
        bool getBoolean(int columnIndex);

        int getColumnCount() const { return numFields; }
        std::string getColumnName(int columnIndex) const;
    };

    class PreparedStatement {
    private:
        Connection* conn;
        std::string queryTemplate;
        std::map<int, std::string> params; // 1-based index to string representation

    public:
        PreparedStatement(Connection* c, const std::string& query) : conn(c), queryTemplate(query) {}

        void setString(int index, const std::string& val);
        void setInt(int index, int val);
        void setDouble(int index, double val);
        void setBoolean(int index, bool val);
        void setNull(int index);

        ResultSet* executeQuery();
        int executeUpdate();
        unsigned long long getLastInsertId();
    };

    class Connection {
    private:
        void* mysql; // MYSQL*
        std::string host, user, pass, db;
        unsigned int port;

    public:
        Connection();
        ~Connection();

        bool connect(const std::string& h, const std::string& u, const std::string& p, const std::string& d, unsigned int pt);
        void close();
        bool selectDatabase(const std::string& dbName);
        int executeUpdate(const std::string& query);
        ResultSet* executeQuery(const std::string& query);
        PreparedStatement* prepareStatement(const std::string& query);
        std::string escapeString(const std::string& src);
        unsigned long long getLastInsertId();
    };
}

#endif

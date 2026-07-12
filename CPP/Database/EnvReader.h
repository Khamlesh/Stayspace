#ifndef ENV_READER_H
#define ENV_READER_H

#include <string>
#include <map>
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>

class EnvReader {
private:
    std::map<std::string, std::string> envMap;

    static std::string trim(const std::string& str) {
        size_t first = str.find_first_not_of(" \t\r\n\"");
        if (std::string::npos == first) {
            return "";
        }
        size_t last = str.find_last_not_of(" \t\r\n\"");
        return str.substr(first, (last - first + 1));
    }

public:
    EnvReader() {}

    bool load(const std::string& filepath = ".env") {
        std::ifstream file(filepath);
        if (!file.is_open()) {
            // Check parent folder (in case executed from CPP/ or build/)
            std::ifstream file_up("../" + filepath);
            if (file_up.is_open()) {
                parse(file_up);
                return true;
            }
            std::ifstream file_up2("../../" + filepath);
            if (file_up2.is_open()) {
                parse(file_up2);
                return true;
            }
            return false;
        }
        parse(file);
        return true;
    }

    void parse(std::ifstream& file) {
        std::string line;
        while (std::getline(file, line)) {
            line = trim(line);
            if (line.empty() || line[0] == '#') {
                continue;
            }
            size_t pos = line.find('=');
            if (pos != std::string::npos) {
                std::string key = trim(line.substr(0, pos));
                std::string val = trim(line.substr(pos + 1));
                envMap[key] = val;
            }
        }
    }

    std::string get(const std::string& key, const std::string& defaultVal = "") const {
        auto it = envMap.find(key);
        if (it != envMap.end()) {
            return it->second;
        }
        return defaultVal;
    }
};

#endif

#ifndef JSON_PARSER_H
#define JSON_PARSER_H

#include <string>
#include <map>
#include <vector>
#include <sstream>
#include <iostream>

class JsonParser {
public:
    // Parses a flat JSON object (string values, number values, boolean values)
    static std::map<std::string, std::string> parseFlatObject(const std::string& jsonStr) {
        std::map<std::string, std::string> result;
        if (jsonStr.empty()) return result;

        size_t start = jsonStr.find('{');
        size_t end = jsonStr.find_last_of('}');
        if (start == std::string::npos || end == std::string::npos || start >= end) {
            return result;
        }

        std::string content = jsonStr.substr(start + 1, end - start - 1);
        bool inString = false;
        bool isEscaped = false;
        std::string currentToken = "";
        std::vector<std::string> tokens;

        for (size_t i = 0; i < content.length(); ++i) {
            char c = content[i];
            if (isEscaped) {
                currentToken += c;
                isEscaped = false;
                continue;
            }
            if (c == '\\') {
                isEscaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                currentToken += c;
                continue;
            }
            if (!inString) {
                if (c == ',' || c == ':') {
                    if (!currentToken.empty()) {
                        tokens.push_back(currentToken);
                        currentToken = "";
                    }
                    std::string delim(1, c);
                    tokens.push_back(delim);
                } else if (c != ' ' && c != '\t' && c != '\r' && c != '\n') {
                    currentToken += c;
                }
            } else {
                currentToken += c;
            }
        }
        if (!currentToken.empty()) {
            tokens.push_back(currentToken);
        }

        for (size_t i = 0; i < tokens.size(); ) {
            if (tokens[i][0] == '"') {
                std::string key = tokens[i].substr(1, tokens[i].length() - 2);
                if (i + 2 < tokens.size() && tokens[i+1] == ":") {
                    std::string valToken = tokens[i+2];
                    std::string value;
                    if (valToken[0] == '"') {
                        value = valToken.substr(1, valToken.length() - 2);
                    } else {
                        value = valToken; // number or boolean or null
                    }
                    result[key] = value;
                    i += 3;
                    if (i < tokens.size() && tokens[i] == ",") {
                        i++;
                    }
                    continue;
                }
            }
            i++;
        }

        return result;
    }

    // Encodes a status and response to standard API format
    static std::string makeResponse(const std::string& status, const std::string& message = "", const std::string& dataJson = "") {
        std::stringstream ss;
        ss << "{\"status\":\"" << status << "\"";
        if (!message.empty()) {
            ss << ",\"message\":\"" << escape(message) << "\"";
        }
        if (!dataJson.empty()) {
            ss << ",\"data\":" << dataJson;
        }
        ss << "}";
        return ss.str();
    }

    static std::string mapToJson(const std::map<std::string, std::string>& m) {
        std::stringstream ss;
        ss << "{";
        bool first = true;
        for (const auto& pair : m) {
            if (!first) ss << ",";
            ss << "\"" << escape(pair.first) << "\":\"" << escape(pair.second) << "\"";
            first = false;
        }
        ss << "}";
        return ss.str();
    }

    static std::string escape(const std::string& src) {
        std::string dest = "";
        for (char c : src) {
            if (c == '"') dest += "\\\"";
            else if (c == '\\') dest += "\\\\";
            else if (c == '\n') dest += "\\n";
            else if (c == '\r') dest += "\\r";
            else if (c == '\t') dest += "\\t";
            else dest += c;
        }
        return dest;
    }
};

#endif

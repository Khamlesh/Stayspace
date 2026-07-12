#ifndef REPORT_H
#define REPORT_H

#include <string>

class ReportModule {
public:
    // Generate reports (returns file paths)
    static std::string generateBookingReport(const std::string& token, const std::string& format);
    static std::string generateRevenueReport(const std::string& token, const std::string& format);
    static std::string generateHostEarningsReport(const std::string& token, const std::string& format);
    static std::string generatePropertyReport(const std::string& token, const std::string& format);
    static std::string generateUserActivityReport(const std::string& token, const std::string& format);

private:
    static bool isValidFormat(const std::string& format);
};

#endif

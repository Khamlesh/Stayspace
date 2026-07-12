#ifndef PAYMENT_H
#define PAYMENT_H

#include <string>

class PaymentModule {
public:
    // Process a simulated payment for a booking
    static std::string processPayment(const std::string& token, int bookingId, const std::string& paymentMethod, const std::string& paymentDetails);
    // Get payment details for a booking
    static std::string getPaymentByBooking(const std::string& token, int bookingId);
    // Get all payments for a guest
    static std::string getGuestPayments(const std::string& token);

private:
    // Generate a unique simulated transaction ID
    static std::string generateTransactionId();
    // Validate payment method
    static bool isValidPaymentMethod(const std::string& method);
    // Generate a text receipt file and return its path
    static std::string generateReceipt(int paymentId, int bookingId, double amount, const std::string& method, const std::string& transactionId, const std::string& guestName, const std::string& propertyTitle, const std::string& checkIn, const std::string& checkOut);
};

#endif

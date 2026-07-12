#ifndef REVIEW_H
#define REVIEW_H

#include <string>

class ReviewModule {
public:
    static std::string addReview(const std::string& token, int propertyId, int rating, const std::string& comment);
    static std::string editReview(const std::string& token, int reviewId, int rating, const std::string& comment);
    static std::string deleteReview(const std::string& token, int reviewId);
    static std::string getPropertyReviews(int propertyId);
};

#endif

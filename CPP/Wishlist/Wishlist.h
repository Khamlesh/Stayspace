#ifndef WISHLIST_H
#define WISHLIST_H

#include <string>

class WishlistModule {
public:
    static std::string addToWishlist(const std::string& token, int propertyId);
    static std::string removeFromWishlist(const std::string& token, int propertyId);
    static std::string getWishlist(const std::string& token);
};

#endif

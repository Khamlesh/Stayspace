#ifndef HASH_UTILS_H
#define HASH_UTILS_H

#include <string>
#include <sstream>
#include <iomanip>
#include <random>
#include <chrono>
#include <cstring>

// Macros for SHA-256 processing placed at the top for compilation order
#define ROTRRIGHT(a,b) (((a) >> (b)) | ((a) << (32-(b))))
#define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTRRIGHT(x,2) ^ ROTRRIGHT(x,13) ^ ROTRRIGHT(x,22))
#define EP1(x) (ROTRRIGHT(x,6) ^ ROTRRIGHT(x,11) ^ ROTRRIGHT(x,25))
#define SIG0(x) (ROTRRIGHT(x,7) ^ ROTRRIGHT(x,18) ^ ((x) >> 3))
#define SIG1(x) (ROTRRIGHT(x,17) ^ ROTRRIGHT(x,19) ^ ((x) >> 10))

class HashUtils {
private:
    typedef unsigned char uint8;
    typedef unsigned int uint32;

    static const uint32 K[64];

    struct SHA256_CTX {
        uint8 data[64];
        uint32 datalen;
        unsigned long long bitlen;
        uint32 state[8];
    };

    static void sha256_transform(SHA256_CTX *ctx, const uint8 data[]) {
        uint32 a, b, c, d, e, f, g, h, i, j, t1, t2, m[64];

        for (i = 0, j = 0; i < 16; ++i, j += 4)
            m[i] = (data[j] << 24) | (data[j + 1] << 16) | (data[j + 2] << 8) | (data[j + 3]);
        for ( ; i < 64; ++i)
            m[i] = SIG1(m[i - 2]) + m[i - 7] + SIG0(m[i - 15]) + m[i - 16];

        a = ctx->state[0];
        b = ctx->state[1];
        c = ctx->state[2];
        d = ctx->state[3];
        e = ctx->state[4];
        f = ctx->state[5];
        g = ctx->state[6];
        h = ctx->state[7];

        for (i = 0; i < 64; ++i) {
            t1 = h + EP1(e) + CH(e, f, g) + K[i] + m[i];
            t2 = EP0(a) + MAJ(a, b, c);
            h = g;
            g = f;
            f = e;
            e = d + t1;
            d = c;
            c = b;
            b = a;
            a = t1 + t2;
        }

        ctx->state[0] += a;
        ctx->state[1] += b;
        ctx->state[2] += c;
        ctx->state[3] += d;
        ctx->state[4] += e;
        ctx->state[5] += f;
        ctx->state[6] += g;
        ctx->state[7] += h;
    }

    static void sha256_init(SHA256_CTX *ctx) {
        ctx->datalen = 0;
        ctx->bitlen = 0;
        ctx->state[0] = 0x6a09e667;
        ctx->state[1] = 0xbb67ae85;
        ctx->state[2] = 0x3c6ef372;
        ctx->state[3] = 0xa54ff53a;
        ctx->state[4] = 0x510e527f;
        ctx->state[5] = 0x9b05688c;
        ctx->state[6] = 0x1f83d9ab;
        ctx->state[7] = 0x5be0cd19;
    }

    static void sha256_update(SHA256_CTX *ctx, const uint8 data[], size_t len) {
        for (size_t i = 0; i < len; ++i) {
            ctx->data[ctx->datalen] = data[i];
            ctx->datalen++;
            if (ctx->datalen == 64) {
                sha256_transform(ctx, ctx->data);
                ctx->bitlen += 512;
                ctx->datalen = 0;
            }
        }
    }

    static void sha256_final(SHA256_CTX *ctx, uint8 hash[]) {
        uint32 i = ctx->datalen;
        uint32 originalDatalen = ctx->datalen;

        if (ctx->datalen < 56) {
            ctx->data[i++] = 0x80;
            while (i < 56)
                ctx->data[i++] = 0x00;
        } else {
            ctx->data[i++] = 0x80;
            while (i < 64)
                ctx->data[i++] = 0x00;
            sha256_transform(ctx, ctx->data);
            memset(ctx->data, 0, 56);
        }

        ctx->bitlen += originalDatalen * 8;
        ctx->data[56] = (ctx->bitlen >> 56);
        ctx->data[57] = (ctx->bitlen >> 48);
        ctx->data[58] = (ctx->bitlen >> 40);
        ctx->data[59] = (ctx->bitlen >> 32);
        ctx->data[60] = (ctx->bitlen >> 24);
        ctx->data[61] = (ctx->bitlen >> 16);
        ctx->data[62] = (ctx->bitlen >> 8);
        ctx->data[63] = (ctx->bitlen);
        sha256_transform(ctx, ctx->data);

        for (i = 0; i < 4; ++i) {
            hash[i]      = (ctx->state[0] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 4]  = (ctx->state[1] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 8]  = (ctx->state[2] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 12] = (ctx->state[3] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 16] = (ctx->state[4] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 20] = (ctx->state[5] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 24] = (ctx->state[6] >> (24 - i * 8)) & 0x000000ff;
            hash[i + 28] = (ctx->state[7] >> (24 - i * 8)) & 0x000000ff;
        }
    }

public:
    static std::string sha256(const std::string& str) {
        SHA256_CTX ctx;
        uint8 hash[32];
        sha256_init(&ctx);
        sha256_update(&ctx, (const uint8*)str.c_str(), str.length());
        sha256_final(&ctx, hash);

        std::stringstream ss;
        for (int i = 0; i < 32; i++) {
            ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
        }
        return ss.str();
    }

    static std::string hashPassword(const std::string& password, const std::string& salt) {
        return sha256(password + salt);
    }

    static std::string generateSalt(size_t length = 16) {
        const char charset[] =
            "0123456789"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz";
        const size_t max_index = sizeof(charset) - 1;
        
        std::string salt = "";
        unsigned int seed = std::chrono::system_clock::now().time_since_epoch().count();
        std::mt19937 generator(seed);
        std::uniform_int_distribution<int> distribution(0, max_index - 1);

        for (size_t i = 0; i < length; ++i) {
            salt += charset[distribution(generator)];
        }
        return salt;
    }
};

#endif

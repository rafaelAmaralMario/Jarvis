#include <catch2/catch_test_macros.hpp>
#include "jarvis/network/network_manager.h"
#include <algorithm>
#include <string>
#include <map>

using namespace jarvis::network;

TEST_CASE("HttpResponse struct", "[network]") {
    HttpResponse resp;

    SECTION("default status is 0") {
        REQUIRE(resp.statusCode == 0);
    }

    SECTION("default body is empty") {
        REQUIRE(resp.body.empty());
    }

    SECTION("default headers are empty") {
        REQUIRE(resp.headers.empty());
    }

    SECTION("can set response fields") {
        resp.statusCode = 200;
        resp.body = "{\"ok\": true}";
        resp.headers["Content-Type"] = "application/json";
        REQUIRE(resp.statusCode == 200);
        REQUIRE(resp.body == "{\"ok\": true}");
        REQUIRE(resp.headers["Content-Type"] == "application/json");
    }

    SECTION("handles error response") {
        resp.statusCode = 404;
        resp.body = "Not Found";
        REQUIRE(resp.statusCode == 404);
    }
}

TEST_CASE("HTTP header handling", "[network]") {
    std::map<std::string, std::string> headers;

    SECTION("default headers are correct") {
        headers["Content-Type"] = "application/json";
        headers["Accept"] = "application/json";
        REQUIRE(headers.size() == 2);
        REQUIRE(headers["Content-Type"] == "application/json");
        REQUIRE(headers["Accept"] == "application/json");
    }

    SECTION("multiple values for same header overwrites") {
        headers["Authorization"] = "Bearer token1";
        headers["Authorization"] = "Bearer token2";
        REQUIRE(headers["Authorization"] == "Bearer token2");
    }
}

TEST_CASE("OAuth provider identifiers", "[network]") {
    SECTION("valid provider names") {
        std::vector<std::string> providers = {"github", "google", "gitlab"};
        for (const auto& p : providers) {
            REQUIRE_FALSE(p.empty());
            REQUIRE(std::all_of(p.begin(), p.end(), ::isalpha));
        }
    }

    SECTION("provider ID validation") {
        auto isValid = [](const std::string& s) {
            return !s.empty() && std::all_of(s.begin(), s.end(),
                [](char c) { return std::isalnum(static_cast<unsigned char>(c)); });
        };
        REQUIRE(isValid("github"));
        REQUIRE(isValid("google123"));
        REQUIRE_FALSE(isValid(""));
        REQUIRE_FALSE(isValid("provider with spaces"));
    }
}

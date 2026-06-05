#include <catch2/catch_test_macros.hpp>
#include "jarvis/core/service_locator.h"

using namespace jarvis::core;

TEST_CASE("ServiceLocator registers and retrieves services", "[core]") {
    ServiceLocator locator;

    SECTION("register and get") {
        int value = 42;
        locator.registerService("test", &value);
        REQUIRE(locator.hasService("test"));
        REQUIRE(locator.getService("test") == &value);
    }

    SECTION("get nonexistent returns null") {
        REQUIRE(locator.getService("nonexistent") == nullptr);
        REQUIRE_FALSE(locator.hasService("nonexistent"));
    }

    SECTION("unregister removes service") {
        int value = 42;
        locator.registerService("test", &value);
        locator.unregisterService("test");
        REQUIRE_FALSE(locator.hasService("test"));
    }

    SECTION("template get works") {
        int value = 42;
        locator.registerService("test", &value);
        auto* retrieved = locator.getService<int>("test");
        REQUIRE(retrieved != nullptr);
        REQUIRE(*retrieved == 42);
    }
}

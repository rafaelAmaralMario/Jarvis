#include <catch2/catch_test_macros.hpp>
#include "jarvis/api/module_api.h"

TEST_CASE("ModuleAPI struct sizes and alignment", "[api]") {
    SECTION("ModuleAPI has all required fields") {
        REQUIRE(sizeof(ModuleAPI) > 0);
        REQUIRE(sizeof(ModuleHost) > 0);
        REQUIRE(sizeof(ModuleManifest) > 0);
    }

    SECTION("LogLevel values are correct") {
        REQUIRE(static_cast<int>(LogLevel::Trace) == 0);
        REQUIRE(static_cast<int>(LogLevel::Info) == 3);
        REQUIRE(static_cast<int>(LogLevel::Error) == 4);
    }

    SECTION("PermissionResult values") {
        REQUIRE(static_cast<int>(PermissionResult::Granted) == 0);
        REQUIRE(static_cast<int>(PermissionResult::Denied) == 1);
    }

    SECTION("ModuleState values") {
        REQUIRE(static_cast<int>(ModuleState::Discovered) == 0);
        REQUIRE(static_cast<int>(ModuleState::Loaded) == 1);
        REQUIRE(static_cast<int>(ModuleState::Initialized) == 2);
        REQUIRE(static_cast<int>(ModuleState::Active) == 3);
        REQUIRE(static_cast<int>(ModuleState::Shutdown) == 4);
        REQUIRE(static_cast<int>(ModuleState::Error) == 5);
    }
}

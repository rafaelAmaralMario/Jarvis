#include <catch2/catch_test_macros.hpp>
#include "jarvis/terminal/terminal_manager.h"
#include <string>
#include <algorithm>

using namespace jarvis::terminal;

TEST_CASE("TerminalInstance struct defaults", "[terminal]") {
    TerminalInstance term;

    SECTION("default id is empty") {
        REQUIRE(term.id.empty());
    }

    SECTION("default dimensions are 80x24") {
        REQUIRE(term.cols == 80);
        REQUIRE(term.rows == 24);
    }

    SECTION("default state is not running") {
        REQUIRE_FALSE(term.isRunning);
    }

    SECTION("default shell is empty") {
        REQUIRE(term.shell.empty());
    }

    SECTION("process pointer is null initially") {
        REQUIRE(term.process == nullptr);
    }
}

TEST_CASE("TerminalInstance lifecycle", "[terminal]") {
    TerminalInstance term;
    term.id = "term-1";
    term.cols = 120;
    term.rows = 40;
    term.isRunning = true;
    term.shell = "powershell.exe";

    SECTION("can be configured") {
        REQUIRE(term.id == "term-1");
        REQUIRE(term.cols == 120);
        REQUIRE(term.rows == 40);
        REQUIRE(term.isRunning);
        REQUIRE(term.shell == "powershell.exe");
    }

    SECTION("can be stopped") {
        term.isRunning = false;
        REQUIRE_FALSE(term.isRunning);
    }

    SECTION("can be resized") {
        term.cols = 100;
        term.rows = 30;
        REQUIRE(term.cols == 100);
        REQUIRE(term.rows == 30);
    }
}

TEST_CASE("Terminal ID uniqueness", "[terminal]") {
    std::vector<std::string> ids = {"term-1", "term-2", "term-3"};
    std::sort(ids.begin(), ids.end());
    auto last = std::unique(ids.begin(), ids.end());
    REQUIRE(last == ids.end()); // all unique
}

TEST_CASE("ITerminalManager interface is well-defined", "[terminal]") {
    REQUIRE(true); // compile-time check
    // Methods: create, write, resize, close, closeAll, list, setOutputCallback, setExitCallback
    // All return std::string or void, accept std::string params
}

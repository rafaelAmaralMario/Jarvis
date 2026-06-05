#include <catch2/catch_test_macros.hpp>
#include "jarvis/workspace/file_utils.h"

using namespace jarvis::workspace;

TEST_CASE("isValidFileName rejects dangerous names", "[workspace][file_utils]") {
    REQUIRE(isValidFileName("normal.txt"));
    REQUIRE(isValidFileName("my file (1).js"));
    REQUIRE(isValidFileName(".gitignore"));
    REQUIRE_FALSE(isValidFileName(""));
    REQUIRE_FALSE(isValidFileName("  "));
    REQUIRE_FALSE(isValidFileName("con")); // Windows reserved
    REQUIRE_FALSE(isValidFileName("file?name"));
    REQUIRE_FALSE(isValidFileName("file<name"));
    REQUIRE_FALSE(isValidFileName("file>name"));
    REQUIRE_FALSE(isValidFileName("file|name"));
    REQUIRE_FALSE(isValidFileName("file\"name"));
}

TEST_CASE("joinPath handles separators", "[workspace][file_utils]") {
    REQUIRE(joinPath("base", "file.txt") == "base/file.txt");
    REQUIRE(joinPath("base/", "file.txt") == "base/file.txt");
    REQUIRE(joinPath("base", "/file.txt") == "base/file.txt");
    REQUIRE(joinPath("a/b", "c/d.txt") == "a/b/c/d.txt");
}

TEST_CASE("normalizePath handles platform quirks", "[workspace][file_utils]") {
    auto norm = normalizePath("/foo//bar/../baz");
    REQUIRE(norm.find("//") == std::string::npos);
    REQUIRE(norm.find("/../") == std::string::npos);
}

TEST_CASE("getExtension returns lowercase extension", "[workspace][file_utils]") {
    REQUIRE(getExtension("file.txt") == ".txt");
    REQUIRE(getExtension("archive.tar.gz") == ".gz");
    REQUIRE(getExtension("Makefile") == "");
    REQUIRE(getExtension(".gitignore") == "");
    REQUIRE(getExtension("path/to/file.JS") == ".js");
}

TEST_CASE("getMimeType returns correct types", "[workspace][file_utils]") {
    REQUIRE(getMimeType("file.html") == "text/html");
    REQUIRE(getMimeType("file.css") == "text/css");
    REQUIRE(getMimeType("file.js") == "application/javascript");
    REQUIRE(getMimeType("file.png") == "image/png");
    REQUIRE(getMimeType("file.pdf") == "application/pdf");
    REQUIRE(getMimeType("file.unknown") == "application/octet-stream");
}

TEST_CASE("isBinaryExtension detects binary files", "[workspace][file_utils]") {
    REQUIRE_FALSE(isBinaryExtension(".txt"));
    REQUIRE_FALSE(isBinaryExtension(".md"));
    REQUIRE_FALSE(isBinaryExtension(".js"));
    REQUIRE(isBinaryExtension(".png"));
    REQUIRE(isBinaryExtension(".exe"));
    REQUIRE(isBinaryExtension(".zip"));
    REQUIRE(isBinaryExtension(".pdf"));
    REQUIRE(isBinaryExtension(".o"));
}

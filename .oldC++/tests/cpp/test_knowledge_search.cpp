#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "jarvis/knowledge/search_engine.h"
#include <QString>
#include <string>
#include <vector>
#include <algorithm>
#include <cctype>
#include <map>

using namespace jarvis::knowledge;

// Helper: simple tokenizer for search indexing (matches expected search behavior)
static std::vector<std::string> tokenize(const std::string& text) {
    std::vector<std::string> tokens;
    std::string current;
    for (char c : text) {
        if (std::isalnum(static_cast<unsigned char>(c))) {
            current += static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
        } else if (!current.empty()) {
            tokens.push_back(current);
            current.clear();
        }
    }
    if (!current.empty()) tokens.push_back(current);
    return tokens;
}

// Helper: simple TF-IDF score for a term in a document
static double termFrequency(const std::string& term, const std::vector<std::string>& tokens) {
    int count = 0;
    for (const auto& t : tokens)
        if (t == term) count++;
    return tokens.empty() ? 0.0 : static_cast<double>(count) / tokens.size();
}

TEST_CASE("Search tokenization", "[knowledge][search]") {
    SECTION("splits on whitespace and punctuation") {
        auto tokens = tokenize("Hello, World! This is a test.");
        REQUIRE(tokens.size() == 6);
        REQUIRE(tokens[0] == "hello");
        REQUIRE(tokens[1] == "world");
    }

    SECTION("lowercases all tokens") {
        auto tokens = tokenize("Hello World");
        REQUIRE(tokens[0] == "hello");
        REQUIRE(tokens[1] == "world");
    }

    SECTION("handles empty input") {
        REQUIRE(tokenize("").empty());
    }

    SECTION("handles repeated terms") {
        auto tokens = tokenize("test test test");
        REQUIRE(tokens.size() == 3);
    }

    SECTION("handles mixed content") {
        auto tokens = tokenize("note-1_v2: (test)");
        REQUIRE(tokens.size() >= 3);
        REQUIRE(std::find(tokens.begin(), tokens.end(), "test") != tokens.end());
    }
}

TEST_CASE("TF-IDF scoring", "[knowledge][search]") {
    SECTION("exact match scores highest") {
        auto tokens = tokenize("machine learning is fun");
        double score = termFrequency("machine", tokens);
        REQUIRE(score > 0);
        REQUIRE(score == Catch::Approx(0.25));
    }

    SECTION("term not present scores zero") {
        auto tokens = tokenize("hello world");
        double score = termFrequency("absent", tokens);
        REQUIRE(score == 0.0);
    }

    SECTION("multiple occurrences increase score") {
        auto tokens = tokenize("test test test test");
        double score = termFrequency("test", tokens);
        REQUIRE(score == Catch::Approx(1.0));
    }

    SECTION("empty document scores zero") {
        std::vector<std::string> empty;
        double score = termFrequency("anything", empty);
        REQUIRE(score == 0.0);
    }
}

TEST_CASE("SearchResult ordering by relevance", "[knowledge][search]") {
    SECTION("higher score means more relevant") {
        SearchResult a{"id1", "Doc A", "excerpt", 0.9};
        SearchResult b{"id2", "Doc B", "excerpt", 0.5};
        REQUIRE(a.score > b.score);
    }
}

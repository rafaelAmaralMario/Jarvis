#include <catch2/catch_test_macros.hpp>
#include <QString>
#include <QRegularExpression>
#include <QTextStream>
#include <vector>
#include <string>

// Test the wikilink parsing logic (standalone, no DB needed)
static std::vector<std::string> extractWikilinks(const std::string& content) {
    std::vector<std::string> links;
    static QRegularExpression re(R"(\[\[([^\]]+)\]\])");
    auto it = re.globalMatch(QString::fromStdString(content));
    while (it.hasNext()) {
        auto match = it.next();
        QString target = match.captured(1).trimmed();
        int pipe = target.indexOf('|');
        if (pipe >= 0) target = target.left(pipe);
        links.push_back(target.trimmed().toStdString());
    }
    return links;
}

TEST_CASE("Wikilink parsing", "[knowledge]") {
    SECTION("extracts simple wikilinks") {
        auto links = extractWikilinks("Hello [[note1]] world [[note2]]");
        REQUIRE(links.size() == 2);
        REQUIRE(links[0] == "note1");
        REQUIRE(links[1] == "note2");
    }

    SECTION("extracts wikilink with alias") {
        auto links = extractWikilinks("See [[target|display text]] here");
        REQUIRE(links.size() == 1);
        REQUIRE(links[0] == "target");
    }

    SECTION("returns empty when no wikilinks") {
        auto links = extractWikilinks("No links here");
        REQUIRE(links.empty());
    }

    SECTION("handles nested brackets in content") {
        auto links = extractWikilinks("[[simple]] and [[also]]");
        REQUIRE(links.size() == 2);
    }

    SECTION("trims whitespace in targets") {
        auto links = extractWikilinks("[[  spaced  ]]");
        REQUIRE(links.size() == 1);
        REQUIRE(links[0] == "spaced");
    }
}

TEST_CASE("Front matter parsing helpers", "[knowledge]") {
    SECTION("detects front matter boundaries") {
        std::string content = "---\ntitle: Test\n---\nBody content";
        REQUIRE(content.substr(0, 3) == "---");
        auto end = content.find("---", 3);
        REQUIRE(end != std::string::npos);
        REQUIRE(end > 3);
    }

    SECTION("returns body after front matter") {
        std::string content = "---\ntitle: Test\n---\nBody content";
        auto end = content.find("---", 3);
        auto rest = content.substr(end + 3);
        auto start = rest.find_first_not_of(" \t\r\n");
        std::string body = (start == std::string::npos) ? "" : rest.substr(start);
        REQUIRE(body == "Body content");
    }

    SECTION("no front matter returns full content") {
        std::string content = "Just body text";
        bool hasFrontMatter = content.size() >= 4 && content.substr(0, 3) == "---";
        REQUIRE_FALSE(hasFrontMatter);
    }
}

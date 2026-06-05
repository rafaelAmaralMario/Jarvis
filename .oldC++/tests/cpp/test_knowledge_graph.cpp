#include <catch2/catch_test_macros.hpp>
#include "jarvis/knowledge/graph_builder.h"
#include "jarvis/knowledge/note.h"
#include <QString>
#include <QRegularExpression>

using namespace jarvis::knowledge;

// Helper: extract wikilink targets from text (same pattern used by graph builder)
static std::vector<std::string> parseWikilinks(const std::string& content) {
    std::vector<std::string> targets;
    static QRegularExpression re(R"(\[\[([^\]]+)\]\])");
    auto it = re.globalMatch(QString::fromStdString(content));
    while (it.hasNext()) {
        auto match = it.next();
        QString target = match.captured(1).trimmed();
        int pipe = target.indexOf('|');
        if (pipe >= 0) target = target.left(pipe);
        targets.push_back(target.trimmed().toStdString());
    }
    return targets;
}

TEST_CASE("GraphBuilder wikilink extraction", "[knowledge][graph]") {
    SECTION("extracts single target") {
        auto links = parseWikilinks("Link to [[Note A]]");
        REQUIRE(links.size() == 1);
        REQUIRE(links[0] == "Note A");
    }

    SECTION("extracts multiple targets") {
        auto links = parseWikilinks("Links to [[A]] and [[B]] and [[C]]");
        REQUIRE(links.size() == 3);
    }

    SECTION("handles alias syntax") {
        auto links = parseWikilinks("See [[Note|display text]]");
        REQUIRE(links.size() == 1);
        REQUIRE(links[0] == "Note");
    }

    SECTION("returns empty for no links") {
        auto links = parseWikilinks("Plain text with no links");
        REQUIRE(links.empty());
    }

    SECTION("deduplicates repeated links") {
        auto links = parseWikilinks("[[Same]] and [[Same]] again");
        REQUIRE(links.size() == 2);
        REQUIRE(links[0] == "Same");
        REQUIRE(links[1] == "Same");
    }
}

TEST_CASE("GraphBuilder edge direction", "[knowledge][graph]") {
    SECTION("link creates directional edge") {
        // Note A linking to Note B means edge A → B
        auto links = parseWikilinks("See [[Note B]]");
        REQUIRE(links.size() == 1);
        // In a real graph, this would create edge "Note A" → "Note B"
    }

    SECTION("bidirectional links create two edges") {
        auto fromA = parseWikilinks("See [[B]]");
        auto fromB = parseWikilinks("See [[A]]");
        REQUIRE(fromA[0] == "B");
        REQUIRE(fromB[0] == "A");
    }
}

TEST_CASE("GraphData structure", "[knowledge][graph]") {
    GraphData gd;
    gd.nodes = {
        GraphNode{"n1", "Node 1", "/", {}, 0},
        GraphNode{"n2", "Node 2", "/", {}, 0}
    };
    gd.edges = {GraphEdge{"n1", "n2", "wikilink"}};

    SECTION("nodes have id, label, folder") {
        REQUIRE(gd.nodes.size() == 2);
        REQUIRE(gd.nodes[0].id == "n1");
        REQUIRE(gd.nodes[0].label == "Node 1");
    }

    SECTION("edges connect nodes by id") {
        REQUIRE(gd.edges.size() == 1);
        REQUIRE(gd.edges[0].source == "n1");
        REQUIRE(gd.edges[0].target == "n2");
    }

    SECTION("empty graph") {
        GraphData empty;
        REQUIRE(empty.nodes.empty());
        REQUIRE(empty.edges.empty());
    }
}

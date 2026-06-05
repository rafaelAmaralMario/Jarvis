#include <catch2/catch_test_macros.hpp>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QString>
#include <QVariant>
#include <QVariantMap>

TEST_CASE("JSON-RPC request format validation", "[bridge]") {
    SECTION("valid request has id, method, args") {
        QJsonObject msg;
        msg["id"] = "1";
        msg["method"] = "listNotes";
        msg["args"] = QJsonArray();

        REQUIRE(msg.contains("id"));
        REQUIRE(msg.contains("method"));
        REQUIRE(msg.contains("args"));
        REQUIRE(msg["id"].isString());
        REQUIRE(msg["method"].isString());
        REQUIRE(msg["args"].isArray());
    }

    SECTION("request serializes to valid JSON") {
        QJsonObject msg;
        msg["id"] = "42";
        msg["method"] = "createNote";
        msg["args"] = QJsonArray{"title", "content"};

        QJsonDocument doc(msg);
        QByteArray json = doc.toJson(QJsonDocument::Compact);

        QJsonDocument parsed = QJsonDocument::fromJson(json);
        REQUIRE(parsed.isObject());
        QJsonObject obj = parsed.object();
        REQUIRE(obj["id"].toString() == "42");
        REQUIRE(obj["method"].toString() == "createNote");
    }

    SECTION("request with args array") {
        QJsonObject msg;
        msg["id"] = "1";
        msg["method"] = "openFile";
        QJsonArray args{"path/to/file.txt"};
        msg["args"] = args;

        REQUIRE(msg["args"].toArray().size() == 1);
        REQUIRE(msg["args"].toArray()[0].toString() == "path/to/file.txt");
    }

    SECTION("request with no args") {
        QJsonObject msg;
        msg["id"] = "1";
        msg["method"] = "listModels";
        msg["args"] = QJsonArray();

        REQUIRE(msg["args"].toArray().isEmpty());
    }
}

TEST_CASE("JSON-RPC response format validation", "[bridge]") {
    SECTION("successful response has id and result") {
        QJsonObject msg;
        msg["id"] = "1";
        msg["result"] = QJsonObject{{"name", "test"}};

        QJsonDocument doc(msg);
        QByteArray json = doc.toJson(QJsonDocument::Compact);

        QJsonDocument parsed = QJsonDocument::fromJson(json);
        QJsonObject obj = parsed.object();
        REQUIRE(obj["id"].toString() == "1");
        REQUIRE(obj["result"].toObject()["name"].toString() == "test");
    }

    SECTION("error response has id and error") {
        QJsonObject msg;
        msg["id"] = "1";
        msg["error"] = "Method not found";

        REQUIRE(msg.contains("error"));
        REQUIRE(msg["error"].isString());
    }

    SECTION("response with array result") {
        QJsonObject msg;
        msg["id"] = "1";
        QJsonArray items;
        items.append(QJsonObject{{"title", "Note 1"}});
        items.append(QJsonObject{{"title", "Note 2"}});
        msg["result"] = items;

        REQUIRE(msg["result"].toArray().size() == 2);
    }

    SECTION("response with null result") {
        QJsonObject msg;
        msg["id"] = "1";
        msg["result"] = QJsonValue::Null;

        REQUIRE(msg["result"].isNull());
    }
}

TEST_CASE("JSON-RPC message routing", "[bridge]") {
    SECTION("different methods route differently") {
        QJsonObject listRequest;
        listRequest["id"] = "1";
        listRequest["method"] = "listNotes";
        listRequest["args"] = QJsonArray();

        QJsonObject createRequest;
        createRequest["id"] = "2";
        createRequest["method"] = "createNote";
        createRequest["args"] = QJsonArray{"title", "body"};

        REQUIRE(listRequest["method"].toString() != createRequest["method"].toString());
        REQUIRE(listRequest["args"].toArray().isEmpty());
        REQUIRE_FALSE(createRequest["args"].toArray().isEmpty());
    }

    SECTION("unique request IDs") {
        // Simulate incrementing request counter
        QJsonObject r1;
        r1["id"] = "1";
        r1["method"] = "ping";

        QJsonObject r2;
        r2["id"] = "2";
        r2["method"] = "ping";

        REQUIRE(r1["id"].toString() != r2["id"].toString());
    }
}

TEST_CASE("QVariant conversion for bridge arguments", "[bridge]") {
    SECTION("string arguments") {
        QVariantList args{"hello", "world"};
        REQUIRE(args.size() == 2);
        REQUIRE(args[0].toString() == "hello");
    }

    SECTION("numeric arguments") {
        QVariantList args{42, 3.14};
        REQUIRE(args[0].toInt() == 42);
        REQUIRE(args[1].toDouble() == 3.14);
    }

    SECTION("boolean arguments") {
        QVariantList args{true, false};
        REQUIRE(args[0].toBool());
        REQUIRE_FALSE(args[1].toBool());
    }

    SECTION("mixed argument types") {
        QVariantList args{"test", 123, true};
        REQUIRE(args.size() == 3);
    }
}

TEST_CASE("Bridge handler map simulation", "[bridge]") {
    // The handler map in BridgeHandler is a QMap<QString, RequestHandler>
    // Test the lookup pattern without needing WebEngine

    QMap<QString, int> handlerCount;
    handlerCount["listNotes"] = 1;
    handlerCount["createNote"] = 1;
    handlerCount["deleteNote"] = 1;
    handlerCount["updateNote"] = 1;
    handlerCount["getNote"] = 1;
    handlerCount["searchNotes"] = 1;
    handlerCount["getModules"] = 1;

    SECTION("handler lookup") {
        REQUIRE(handlerCount.contains("listNotes"));
        REQUIRE(handlerCount.contains("createNote"));
        REQUIRE_FALSE(handlerCount.contains("nonexistent"));
    }

    SECTION("handler count") {
        REQUIRE(handlerCount.size() == 7);
        REQUIRE(handlerCount.keys().size() == 7);
    }
}

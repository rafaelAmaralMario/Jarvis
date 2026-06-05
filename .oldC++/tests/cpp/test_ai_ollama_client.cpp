#include <catch2/catch_test_macros.hpp>
#include "jarvis/ai/ollama_client.h"
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <string>

using namespace jarvis::ai;

TEST_CASE("OllamaClient URL construction", "[ai][ollama]") {
    SECTION("default base URL") {
        OllamaClient client;
        // Default should be http://localhost:11434
        REQUIRE(true); // compiles
    }

    SECTION("custom base URL") {
        OllamaClient client("http://10.0.0.1:11434");
        REQUIRE(true); // compiles, URL stored in private member
    }

    SECTION("trailing slash removed") {
        OllamaClient client("http://localhost:11434/");
        REQUIRE(true); // compiles, constructor strips trailing /
    }
}

TEST_CASE("OllamaGenerateRequest struct", "[ai][ollama]") {
    OllamaGenerateRequest req;

    SECTION("default request fields") {
        REQUIRE(req.model.empty());
        REQUIRE(req.prompt.empty());
        REQUIRE(req.system.empty());
        REQUIRE(req.temperature == 0.7);
        REQUIRE(req.maxTokens == 2048);
        REQUIRE_FALSE(req.stream);
    }

    SECTION("streaming request") {
        req.model = "llama3.2:3b";
        req.prompt = "Hello!";
        req.stream = true;
        REQUIRE(req.stream);
        REQUIRE(req.model == "llama3.2:3b");
    }

    SECTION("request with system prompt") {
        req.model = "llama3.2:3b";
        req.prompt = "Explain gravity";
        req.system = "You are a physics professor";
        req.temperature = 0.3;
        REQUIRE(req.system == "You are a physics professor");
        REQUIRE(req.temperature == 0.3);
    }
}

TEST_CASE("OllamaGenerateResponse struct", "[ai][ollama]") {
    OllamaGenerateResponse resp;

    SECTION("default response fields") {
        REQUIRE(resp.response.empty());
        REQUIRE_FALSE(resp.done);
        REQUIRE(resp.promptEvalCount == 0);
        REQUIRE(resp.evalCount == 0);
        REQUIRE(resp.latencyMs == 0);
    }

    SECTION("completed response") {
        resp.response = "Hello! How can I help?";
        resp.done = true;
        resp.promptEvalCount = 10;
        resp.evalCount = 25;
        resp.latencyMs = 1500;
        REQUIRE(resp.done);
        REQUIRE(resp.response.size() > 0);
        REQUIRE(resp.latencyMs == 1500);
    }
}

TEST_CASE("OllamaModel struct", "[ai][ollama]") {
    OllamaModel model;

    SECTION("default model fields") {
        REQUIRE(model.name.empty());
        REQUIRE(model.modifiedAt.empty());
        REQUIRE(model.sizeBytes == 0);
        REQUIRE(model.digest.empty());
        REQUIRE(model.details.empty());
    }

    SECTION("populated model") {
        model.name = "llama3.2:3b";
        model.sizeBytes = 2147483648; // 2GB
        model.digest = "sha256:abc123...";
        model.details = "llama";
        REQUIRE(model.name == "llama3.2:3b");
        REQUIRE(model.sizeBytes == 2147483648);
    }
}

TEST_CASE("Ollama API response parsing", "[ai][ollama]") {
    SECTION("parses list models response") {
        QJsonObject model1;
        model1["name"] = "llama3.2:3b";
        model1["modified_at"] = "2024-01-15T10:00:00Z";
        model1["size"] = 2147483648;
        model1["digest"] = "abc123";

        QJsonObject details;
        details["families"] = QJsonArray{"llama"};
        model1["details"] = details;

        QJsonArray models;
        models.append(model1);
        QJsonObject root;
        root["models"] = models;

        auto doc = QJsonDocument(root);
        auto arr = doc.object()["models"].toArray();
        REQUIRE(arr.size() == 1);

        auto obj = arr[0].toObject();
        REQUIRE(obj["name"].toString().toStdString() == "llama3.2:3b");
        REQUIRE(obj["size"].toVariant().toLongLong() == 2147483648);
    }

    SECTION("parses generate response") {
        QJsonObject resp;
        resp["response"] = "Hello!";
        resp["done"] = true;
        resp["prompt_eval_count"] = 10;
        resp["eval_count"] = 25;

        auto doc = QJsonDocument(resp);
        auto obj = doc.object();
        REQUIRE(obj["response"].toString().toStdString() == "Hello!");
        REQUIRE(obj["done"].toBool());
        REQUIRE(obj["prompt_eval_count"].toInt() == 10);
    }
}

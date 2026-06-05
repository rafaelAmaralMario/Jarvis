#include <catch2/catch_test_macros.hpp>
#include "jarvis/ai/orchestration_manager.h"
#include <string>

using namespace jarvis::ai;

TEST_CASE("OrchestrationConfig struct defaults", "[ai][orchestration]") {
    OrchestrationConfig config;

    SECTION("default config enables orchestration") {
        REQUIRE(config.enabled);
        REQUIRE(config.criticEnabled);
        REQUIRE(config.showTrace);
    }

    SECTION("default numeric values") {
        REQUIRE(config.criticTemperature == 0.1);
        REQUIRE(config.maxAgentsPerQuery == 3);
    }

    SECTION("default orchestrator model is empty") {
        REQUIRE(config.orchestratorModel.empty());
    }

    SECTION("can toggle config") {
        config.enabled = false;
        config.criticEnabled = false;
        config.showTrace = false;
        REQUIRE_FALSE(config.enabled);
        REQUIRE_FALSE(config.criticEnabled);
        REQUIRE_FALSE(config.showTrace);
    }

    SECTION("can customize") {
        config.orchestratorModel = "llama3.2:3b";
        config.maxAgentsPerQuery = 5;
        config.criticTemperature = 0.5;
        REQUIRE(config.orchestratorModel == "llama3.2:3b");
        REQUIRE(config.maxAgentsPerQuery == 5);
        REQUIRE(config.criticTemperature == 0.5);
    }
}

TEST_CASE("AgentResult struct", "[ai][orchestration]") {
    AgentResult result;

    SECTION("default result") {
        REQUIRE(result.agentName.empty());
        REQUIRE(result.specialty.empty());
        REQUIRE(result.model.empty());
        REQUIRE(result.response.empty());
        REQUIRE(result.tokensUsed == 0);
        REQUIRE(result.latencyMs == 0);
    }

    SECTION("populated result") {
        result.agentName = "Code Expert";
        result.specialty = "code";
        result.model = "codellama:7b";
        result.response = "Here is the code...";
        result.tokensUsed = 150;
        result.latencyMs = 2000;
        REQUIRE(result.agentName == "Code Expert");
        REQUIRE(result.tokensUsed == 150);
    }
}

TEST_CASE("AgentTrace struct", "[ai][orchestration]") {
    AgentTrace trace;

    SECTION("default trace") {
        REQUIRE(trace.queryId.empty());
        REQUIRE(trace.query.empty());
        REQUIRE(trace.agentsConsulted.empty());
    }

    SECTION("trace with consulted agents") {
        trace.queryId = "q-001";
        trace.query = "What is the capital of France?";
        trace.agentsConsulted.push_back({"Expert A", "knowledge", "model-x", "Paris", 10, 100});
        trace.agentsConsulted.push_back({"Expert B", "reasoning", "model-y", "Capital is Paris", 5, 50});
        REQUIRE(trace.agentsConsulted.size() == 2);
        REQUIRE(trace.agentsConsulted[0].response == "Paris");
    }

    SECTION("complete trace") {
        trace.queryId = "q-002";
        trace.query = "Write a sorting algorithm";
        trace.orchestratorReasoning = "Need code expert";
        trace.criticReview = "Looks correct";
        trace.finalResponse = "Here is quicksort...";
        REQUIRE_FALSE(trace.finalResponse.empty());
        REQUIRE_FALSE(trace.orchestratorReasoning.empty());
    }
}

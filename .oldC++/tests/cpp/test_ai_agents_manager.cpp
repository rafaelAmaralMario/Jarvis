#include <catch2/catch_test_macros.hpp>
#include "jarvis/ai/agents_manager.h"
#include <string>

using namespace jarvis::ai;

TEST_CASE("Agent struct defaults and assignment", "[ai][agents]") {
    Agent agent;

    SECTION("default fields are empty/zero") {
        REQUIRE(agent.id.empty());
        REQUIRE(agent.name.empty());
        REQUIRE(agent.model.empty());
        REQUIRE(agent.systemPrompt.empty());
        REQUIRE(agent.specialty.empty());
        REQUIRE(agent.tools.empty());
        REQUIRE_FALSE(agent.isDefault);
        REQUIRE_FALSE(agent.canOrchestrate);
        REQUIRE(agent.priority == 0);
        REQUIRE(agent.temperature == 0.0);
        REQUIRE(agent.maxTokens == 0);
    }

    SECTION("default agent") {
        agent.id = "agent-1";
        agent.name = "Assistant Geral";
        agent.model = "llama3.2:3b";
        agent.isDefault = true;
        agent.canOrchestrate = true;
        agent.priority = 5;
        agent.temperature = 0.7;
        agent.maxTokens = 2048;
        REQUIRE(agent.isDefault);
        REQUIRE(agent.canOrchestrate);
        REQUIRE(agent.priority == 5);
    }

    SECTION("orchestration pool agent") {
        agent.id = "agent-2";
        agent.name = "Code Expert";
        agent.canOrchestrate = true;
        agent.priority = 10;
        agent.specialty = "code";
        REQUIRE(agent.canOrchestrate);
        REQUIRE(agent.priority == 10);
    }
}

TEST_CASE("CreateAgentDTO defaults", "[ai][agents]") {
    SECTION("default DTO values") {
        CreateAgentDTO dto;
        REQUIRE(dto.name.empty());
        REQUIRE(dto.temperature == 0.7);
        REQUIRE(dto.maxTokens == 2048);
        REQUIRE(dto.specialty == "general");
        REQUIRE(dto.tools.empty());
        REQUIRE(dto.canOrchestrate);
        REQUIRE(dto.priority == 5);
    }

    SECTION("minimal DTO") {
        CreateAgentDTO dto;
        dto.name = "Test Agent";
        dto.model = "llama3.2:3b";
        REQUIRE(dto.name == "Test Agent");
        REQUIRE(dto.model == "llama3.2:3b");
        REQUIRE(dto.temperature == 0.7); // default preserved
    }

    SECTION("code agent DTO") {
        CreateAgentDTO dto;
        dto.name = "Code Helper";
        dto.model = "codellama:7b";
        dto.specialty = "code";
        dto.temperature = 0.2;
        dto.tools = {"terminal", "editor"};
        REQUIRE(dto.tools.size() == 2);
        REQUIRE(dto.specialty == "code");
    }
}

TEST_CASE("Agent ID format", "[ai][agents]") {
    SECTION("UUID-like IDs") {
        std::string id1 = "agent-123e4567-e89b-12d3-a456-426614174000";
        std::string id2 = "agent-abc-123";
        REQUIRE_FALSE(id1.empty());
        REQUIRE_FALSE(id2.empty());
        REQUIRE(id1.find("agent-") == 0);
    }
}

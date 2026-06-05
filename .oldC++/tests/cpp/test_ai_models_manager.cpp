#include <catch2/catch_test_macros.hpp>
#include "jarvis/ai/models_manager.h"
#include <string>

using namespace jarvis::ai;

TEST_CASE("ModelStatus enum values", "[ai][models]") {
    REQUIRE(static_cast<int>(ModelStatus::NotDownloaded) == 0);
    REQUIRE(static_cast<int>(ModelStatus::Downloaded) == 1);
    REQUIRE(static_cast<int>(ModelStatus::Running) == 2);
    REQUIRE(static_cast<int>(ModelStatus::Stopped) == 3);
    REQUIRE(static_cast<int>(ModelStatus::Error) == 4);
}

TEST_CASE("ModelSpecialty enum values", "[ai][models]") {
    REQUIRE(static_cast<int>(ModelSpecialty::Chat) == 0);
    REQUIRE(static_cast<int>(ModelSpecialty::Code) == 1);
    REQUIRE(static_cast<int>(ModelSpecialty::Reasoning) == 2);
    REQUIRE(static_cast<int>(ModelSpecialty::Embedding) == 3);
    REQUIRE(static_cast<int>(ModelSpecialty::Vision) == 4);
    REQUIRE(static_cast<int>(ModelSpecialty::General) == 5);
}

TEST_CASE("ModelInfo struct defaults and assignment", "[ai][models]") {
    ModelInfo model;

    SECTION("default fields are empty/zero") {
        REQUIRE(model.name.empty());
        REQUIRE(model.size.empty());
        REQUIRE(model.description.empty());
        REQUIRE(model.color.empty());
        REQUIRE(model.icon.empty());
        REQUIRE(model.errorMessage.empty());
        REQUIRE(model.specialty == ModelSpecialty::General);
        REQUIRE(model.status == ModelStatus::NotDownloaded);
    }

    SECTION("running model") {
        model.name = "llama3.2:3b";
        model.specialty = ModelSpecialty::Chat;
        model.status = ModelStatus::Running;
        model.size = "2.0 GB";
        REQUIRE(model.name == "llama3.2:3b");
        REQUIRE(model.specialty == ModelSpecialty::Chat);
        REQUIRE(model.status == ModelStatus::Running);
    }

    SECTION("model with error") {
        model.name = "faulty-model";
        model.status = ModelStatus::Error;
        model.errorMessage = "Out of memory";
        REQUIRE(model.status == ModelStatus::Error);
        REQUIRE(model.errorMessage == "Out of memory");
    }
}

TEST_CASE("ModelMetadata struct", "[ai][models]") {
    ModelMetadata meta;

    SECTION("default metadata") {
        REQUIRE(meta.specialty == ModelSpecialty::General);
        REQUIRE(meta.notes.empty());
        REQUIRE(meta.color.empty());
        REQUIRE(meta.icon.empty());
    }

    SECTION("custom metadata") {
        meta.specialty = ModelSpecialty::Code;
        meta.notes = "Great for coding";
        meta.color = "#6b7280";
        meta.icon = "🤖";
        REQUIRE(meta.specialty == ModelSpecialty::Code);
        REQUIRE(meta.notes == "Great for coding");
    }
}

TEST_CASE("Model name validation", "[ai][models]") {
    auto isValidModelName = [](const std::string& name) -> bool {
        if (name.empty()) return false;
        auto colon = name.find(':');
        if (colon == std::string::npos || colon == 0) return false;
        auto tag = name.substr(colon + 1);
        return !tag.empty();
    };

    SECTION("valid model names") {
        REQUIRE(isValidModelName("llama3.2:3b"));
        REQUIRE(isValidModelName("codellama:7b"));
        REQUIRE(isValidModelName("mistral:7b-instruct"));
    }

    SECTION("invalid model names") {
        REQUIRE_FALSE(isValidModelName(""));
        REQUIRE_FALSE(isValidModelName("llama3.2")); // no tag
        REQUIRE_FALSE(isValidModelName(":3b")); // no name
    }
}

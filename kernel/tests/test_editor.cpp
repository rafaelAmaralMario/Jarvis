#include <catch2/catch_test_macros.hpp>
#include "jarvis/editor/editor_manager.h"
#include <fstream>
#include <filesystem>
#include <cstdio>

namespace fs = std::filesystem;

static fs::path createTempFile(const std::string& name, const std::string& content) {
    auto tmp = fs::temp_directory_path() / "jarvis-test-editor" / name;
    fs::create_directories(tmp.parent_path());
    std::ofstream f(tmp);
    f << content;
    return tmp;
}

static void cleanup() {
    fs::remove_all(fs::temp_directory_path() / "jarvis-test-editor");
}

TEST_CASE("EditorService — detectLanguage", "[editor]") {
    auto* editor = jarvis::editor::createEditorService();

    SECTION("detects JavaScript by extension") {
        REQUIRE(editor->detectLanguage("file.js") == "javascript");
        REQUIRE(editor->detectLanguage("file.jsx") == "javascript");
        REQUIRE(editor->detectLanguage("file.mjs") == "javascript");
    }

    SECTION("detects TypeScript by extension") {
        REQUIRE(editor->detectLanguage("file.ts") == "typescript");
        REQUIRE(editor->detectLanguage("file.tsx") == "typescript");
    }

    SECTION("detects C++ by extension") {
        REQUIRE(editor->detectLanguage("file.cpp") == "cpp");
        REQUIRE(editor->detectLanguage("file.hpp") == "cpp");
        REQUIRE(editor->detectLanguage("file.cc") == "cpp");
    }

    SECTION("detects Python") {
        REQUIRE(editor->detectLanguage("file.py") == "python");
    }

    SECTION("detects Rust") {
        REQUIRE(editor->detectLanguage("file.rs") == "rust");
    }

    SECTION("detects Markdown") {
        REQUIRE(editor->detectLanguage("file.md") == "markdown");
        REQUIRE(editor->detectLanguage("file.mdx") == "markdown");
    }

    SECTION("returns plaintext for unknown extension") {
        REQUIRE(editor->detectLanguage("file.xyz") == "plaintext");
        REQUIRE(editor->detectLanguage("Makefile") == "plaintext");
    }

    SECTION("handles Dockerfile and dotfiles") {
        REQUIRE(editor->detectLanguage("Dockerfile") == "dockerfile");
        REQUIRE(editor->detectLanguage(".gitignore") == "ignore");
    }

    delete editor;
}

TEST_CASE("EditorService — file operations", "[editor]") {
    cleanup();
    auto* editor = jarvis::editor::createEditorService();

    SECTION("openFile reads content correctly") {
        auto path = createTempFile("hello.js", "console.log('hello');");
        auto result = editor->openFile(path.string());
        REQUIRE(result.has_value());
        REQUIRE(result->path == path.string());
        REQUIRE(result->language == "javascript");
        REQUIRE(result->content == "console.log('hello');");
        REQUIRE(result->isDirty == false);
    }

    SECTION("openFile returns null for nonexistent file") {
        auto result = editor->openFile("/nonexistent/file.txt");
        REQUIRE_FALSE(result.has_value());
    }

    SECTION("saveFile writes content to disk") {
        auto path = createTempFile("test.js", "original");
        editor->openFile(path.string());

        bool saved = editor->saveFile(path.string(), "modified content");
        REQUIRE(saved);

        std::ifstream f(path.string());
        std::string content((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
        REQUIRE(content == "modified content");
    }

    SECTION("saveFile updates tab state") {
        auto path = createTempFile("state.js", "before");
        editor->openFile(path.string());
        editor->saveFile(path.string(), "after");

        auto files = editor->getOpenFiles();
        REQUIRE(files.size() == 1);
        REQUIRE(files[0].isDirty == false);
        REQUIRE(files[0].size == 5); // "after".size()
    }

    SECTION("closeFile removes from open list") {
        auto path = createTempFile("close.js", "content");
        editor->openFile(path.string());
        REQUIRE(editor->getOpenFiles().size() == 1);

        bool closed = editor->closeFile(path.string());
        REQUIRE(closed);
        REQUIRE(editor->getOpenFiles().empty());
    }

    SECTION("closeFile returns false for unknown file") {
        REQUIRE_FALSE(editor->closeFile("/unknown/file.js"));
    }

    SECTION("getOpenFiles returns all open files") {
        auto a = createTempFile("a.js", "a");
        auto b = createTempFile("b.js", "b");
        auto c = createTempFile("c.js", "c");

        editor->openFile(a.string());
        editor->openFile(b.string());
        editor->openFile(c.string());

        auto files = editor->getOpenFiles();
        REQUIRE(files.size() == 3);
    }

    SECTION("updateTabState changes isDirty flag") {
        auto path = createTempFile("dirty.js", "clean");
        editor->openFile(path.string());

        editor->updateTabState(path.string(), true);
        auto files = editor->getOpenFiles();
        REQUIRE(files[0].isDirty == true);

        editor->updateTabState(path.string(), false);
        files = editor->getOpenFiles();
        REQUIRE(files[0].isDirty == false);
    }

    delete editor;
    cleanup();
}

TEST_CASE("EditorService — edge cases", "[editor]") {
    cleanup();
    auto* editor = jarvis::editor::createEditorService();

    SECTION("opens file with special characters in name") {
        auto path = createTempFile("my file (1).test.js", "special");
        auto result = editor->openFile(path.string());
        REQUIRE(result.has_value());
        REQUIRE(result->path == path.string());
    }

    SECTION("opens empty file") {
        auto path = createTempFile("empty.js", "");
        auto result = editor->openFile(path.string());
        REQUIRE(result.has_value());
        REQUIRE(result->content.empty());
        REQUIRE(result->size == 0);
    }

    SECTION("multiple saves preserve content") {
        auto path = createTempFile("multi.js", "v1");
        editor->openFile(path.string());
        editor->saveFile(path.string(), "v2");
        editor->saveFile(path.string(), "v3");

        auto result = editor->openFile(path.string());
        REQUIRE(result->content == "v3");
    }

    delete editor;
    cleanup();
}

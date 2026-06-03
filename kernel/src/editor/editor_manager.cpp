#include "jarvis/editor/editor_manager.h"
#include <fstream>
#include <filesystem>
#include <unordered_map>
#include <algorithm>

namespace jarvis::editor {
namespace fs = std::filesystem;

static const std::unordered_map<std::string, std::string> LANG_MAP = {
    {".js", "javascript"}, {".jsx", "javascript"},
    {".ts", "typescript"}, {".tsx", "typescript"},
    {".mjs", "javascript"}, {".cjs", "javascript"},
    {".py", "python"},
    {".cpp", "cpp"}, {".cc", "cpp"}, {".cxx", "cpp"},
    {".hpp", "cpp"}, {".hh", "cpp"}, {".hxx", "cpp"},
    {".h", "c"},
    {".c", "c"},
    {".java", "java"},
    {".rs", "rust"},
    {".go", "go"},
    {".rb", "ruby"},
    {".php", "php"},
    {".swift", "swift"},
    {".kt", "kotlin"}, {".kts", "kotlin"},
    {".scala", "scala"},
    {".dart", "dart"},
    {".lua", "lua"},
    {".pl", "perl"}, {".pm", "perl"},
    {".r", "r"},
    {".json", "json"},
    {".md", "markdown"}, {".mdx", "markdown"},
    {".html", "html"}, {".htm", "html"},
    {".css", "css"}, {".scss", "scss"}, {".less", "less"},
    {".xml", "xml"}, {".svg", "xml"},
    {".yaml", "yaml"}, {".yml", "yaml"},
    {".toml", "toml"},
    {".sql", "sql"},
    {".sh", "shell"}, {".bash", "shell"}, {".zsh", "shell"},
    {".bat", "bat"}, {".cmd", "bat"},
    {".ps1", "powershell"},
    {".dockerfile", "dockerfile"},
    {".gitignore", "ignore"},
    {".env", "plaintext"},
    {".txt", "plaintext"},
    {".csv", "plaintext"},
    {".log", "plaintext"},
    {".diff", "diff"}, {".patch", "diff"},
};

static std::string detect(const std::string& filename) {
    auto pos = filename.find_last_of('.');
    if (pos == std::string::npos) return "plaintext";

    auto ext = filename.substr(pos);
    std::string lower;
    lower.reserve(ext.size());
    for (auto c : ext) lower += static_cast<char>(std::tolower(c));

    auto it = LANG_MAP.find(lower);
    if (it != LANG_MAP.end()) return it->second;

    auto nameLower = filename;
    std::transform(nameLower.begin(), nameLower.end(), nameLower.begin(), ::tolower);
    auto dit = LANG_MAP.find(nameLower);
    if (dit != LANG_MAP.end()) return dit->second;

    return "plaintext";
}

class EditorManager : public IEditorService {
public:
    std::optional<EditorTabInfo> openFile(const std::string& path) override {
        if (!fs::exists(path)) return std::nullopt;

        std::ifstream file(path, std::ios::binary | std::ios::ate);
        if (!file.is_open()) return std::nullopt;

        auto size = file.tellg();
        file.seekg(0);

        std::string content(static_cast<size_t>(size), '\0');
        file.read(content.data(), size);

        auto lastModified = fs::last_write_time(path).time_since_epoch().count();

        EditorTabInfo info;
        info.path = path;
        info.language = detect(path);
        info.content = content;
        info.size = static_cast<int64_t>(size);
        info.lastModified = static_cast<int64_t>(lastModified);
        info.isDirty = false;

        openTabs_[path] = info;
        return info;
    }

    bool saveFile(const std::string& path, const std::string& content) override {
        std::ofstream file(path, std::ios::binary | std::ios::trunc);
        if (!file.is_open()) return false;

        file.write(content.data(), static_cast<std::streamsize>(content.size()));
        if (!file.good()) return false;

        if (openTabs_.count(path)) {
            openTabs_[path].content = content;
            openTabs_[path].isDirty = false;
            openTabs_[path].size = static_cast<int64_t>(content.size());
            openTabs_[path].lastModified =
                static_cast<int64_t>(fs::last_write_time(path).time_since_epoch().count());
        }
        return true;
    }

    bool closeFile(const std::string& path) override {
        return openTabs_.erase(path) > 0;
    }

    std::vector<EditorTabInfo> getOpenFiles() override {
        std::vector<EditorTabInfo> result;
        result.reserve(openTabs_.size());
        for (const auto& [_, tab] : openTabs_) {
            result.push_back(tab);
        }
        return result;
    }

    std::string detectLanguage(const std::string& filename) override {
        return detect(filename);
    }

    void updateTabState(const std::string& path, bool isDirty) override {
        if (openTabs_.count(path)) {
            openTabs_[path].isDirty = isDirty;
        }
    }

private:
    std::unordered_map<std::string, EditorTabInfo> openTabs_;
};

IEditorService* createEditorService() {
    return new EditorManager();
}

} // namespace jarvis::editor

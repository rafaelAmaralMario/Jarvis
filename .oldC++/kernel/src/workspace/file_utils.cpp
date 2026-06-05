#include "jarvis/workspace/file_utils.h"
#include <QDir>
#include <QFileInfo>
#include <algorithm>
#include <cctype>

namespace jarvis::workspace {

static const std::vector<std::string> windowsReserved = {
    "con", "prn", "aux", "nul",
    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"
};

static const std::vector<std::string> binaryExts = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".o", ".obj",
    ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
    ".woff", ".woff2", ".ttf", ".eot",
    ".pyc", ".class", ".jar"
};

bool isValidFileName(const std::string& name) {
    if (name.empty() || name == "." || name == "..") return false;
    if (name.size() > 255) return false;

    // Reject names that are entirely whitespace
    if (std::all_of(name.begin(), name.end(), [](char c){ return std::isspace(static_cast<unsigned char>(c)); }))
        return false;

    // Check for invalid characters
    const std::string invalidChars = "<>:\"/\\|?*\n\r\t";
    for (char c : name) {
        if (invalidChars.find(c) != std::string::npos) return false;
    }

    // Check Windows reserved names
    std::string lower = name;
    std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
    // Strip extension for reserved check
    auto dot = lower.find('.');
    std::string base = (dot != std::string::npos) ? lower.substr(0, dot) : lower;

    for (const auto& reserved : windowsReserved) {
        if (base == reserved) return false;
    }

    return true;
}

std::string joinPath(const std::string& base, const std::string& name) {
    if (base.empty()) return name;
    if (name.empty()) return base;

    std::string result = base;
    if (result.back() != '/' && result.back() != '\\')
        result += '/';
    result += name;
    return QDir::cleanPath(QString::fromStdString(result)).toStdString();
}

std::string normalizePath(const std::string& path) {
    return QDir::cleanPath(QString::fromStdString(path)).toStdString();
}

std::string getExtension(const std::string& path) {
    auto dot = path.find_last_of('.');
    if (dot == std::string::npos || dot == 0) return "";
    auto sep = path.find_last_of("/\\");
    if (sep != std::string::npos && dot < sep) return "";
    std::string ext = path.substr(dot);
    std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
    return ext;
}

std::string getMimeType(const std::string& path) {
    auto ext = getExtension(path);
    if (ext == ".txt" || ext == ".md") return "text/plain";
    if (ext == ".html" || ext == ".htm") return "text/html";
    if (ext == ".css") return "text/css";
    if (ext == ".js") return "application/javascript";
    if (ext == ".json") return "application/json";
    if (ext == ".xml") return "application/xml";
    if (ext == ".py") return "text/x-python";
    if (ext == ".cpp" || ext == ".cc" || ext == ".cxx") return "text/x-c++src";
    if (ext == ".h" || ext == ".hpp") return "text/x-c++hdr";
    if (ext == ".c") return "text/x-csrc";
    if (ext == ".java") return "text/x-java";
    if (ext == ".ts" || ext == ".tsx") return "text/x-typescript";
    if (ext == ".rs") return "text/x-rust";
    if (ext == ".go") return "text/x-go";
    if (ext == ".yaml" || ext == ".yml") return "text/yaml";
    if (ext == ".toml") return "text/toml";
    if (ext == ".sh" || ext == ".bash") return "text/x-shellscript";
    if (ext == ".ps1") return "text/x-powershell";
    if (ext == ".sql") return "text/x-sql";
    if (ext == ".cmake") return "text/x-cmake";
    if (ext == ".png") return "image/png";
    if (ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
    if (ext == ".gif") return "image/gif";
    if (ext == ".bmp") return "image/bmp";
    if (ext == ".ico") return "image/x-icon";
    if (ext == ".svg") return "image/svg+xml";
    if (ext == ".webp") return "image/webp";
    if (ext == ".pdf") return "application/pdf";
    return "application/octet-stream";
}

bool isBinaryExtension(const std::string& ext) {
    std::string lower = ext;
    std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
    for (const auto& b : binaryExts) {
        if (lower == b) return true;
    }
    return false;
}

} // namespace jarvis::workspace

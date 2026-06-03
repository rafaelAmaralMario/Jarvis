#pragma once

#include <string>
#include <vector>
#include <map>
#include <functional>

namespace jarvis::network {

struct HttpResponse {
    int statusCode = 0;
    std::string body;
    std::map<std::string, std::string> headers;
};

class INetworkManager {
public:
    virtual ~INetworkManager() = default;

    virtual HttpResponse get(const std::string& url, const std::map<std::string, std::string>& headers = {}) = 0;
    virtual HttpResponse post(const std::string& url, const std::string& body, const std::string& contentType = "application/json", const std::map<std::string, std::string>& headers = {}) = 0;

    virtual std::string startOAuth(const std::string& provider) = 0;
    virtual std::string completeOAuth(const std::string& provider, const std::string& code) = 0;
    virtual std::string getStoredToken(const std::string& provider) = 0;
    virtual bool clearToken(const std::string& provider) = 0;

    virtual void connectWebSocket(const std::string& url) = 0;
    virtual void sendWebSocket(const std::string& data) = 0;
    virtual void disconnectWebSocket() = 0;
    virtual void setWebSocketCallbacks(
        std::function<void(const std::string& data)> onMessage,
        std::function<void()> onConnected,
        std::function<void(const std::string& error)> onError
    ) = 0;

    virtual bool storeApiKey(const std::string& service, const std::string& key) = 0;
    virtual std::string getApiKey(const std::string& service) = 0;
    virtual bool deleteApiKey(const std::string& service) = 0;
    virtual std::vector<std::pair<std::string, std::string>> listApiKeys() = 0;
};

INetworkManager* createNetworkManager(class jarvis::persistence::IDatabase* db);

} // namespace jarvis::network

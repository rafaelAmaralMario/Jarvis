#include "jarvis/network/network_manager.h"
#include "jarvis/persistence/database.h"

#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QWebSocket>
#include <QEventLoop>
#include <QTimer>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSqlQuery>
#include <QDebug>
#include <QUuid>
#include <QUrl>
#include <QUrlQuery>

namespace jarvis::network {

static const int HTTP_TIMEOUT_MS = 30000;

// ---------------------------------------------------------------------------
// WebSocket helper — wires QWebSocket signals to std::function callbacks
// ---------------------------------------------------------------------------

struct WsCallbacks {
    std::function<void(const std::string&)> onMessage;
    std::function<void()> onConnected;
    std::function<void(const std::string&)> onError;
};

// ---------------------------------------------------------------------------
// NetworkManager
// ---------------------------------------------------------------------------

class NetworkManager : public INetworkManager {
public:
    explicit NetworkManager(jarvis::persistence::IDatabase* db)
        : db_(db)
        , accessManager_(new QNetworkAccessManager())
        , webSocket_(new QWebSocket())
    {
        QObject::connect(webSocket_, &QWebSocket::connected, [this]() {
            if (wsCallbacks_.onConnected) wsCallbacks_.onConnected();
        });
        QObject::connect(webSocket_, &QWebSocket::disconnected, []() {
            qDebug() << "WebSocket disconnected";
        });
        QObject::connect(webSocket_, &QWebSocket::textMessageReceived, [this](const QString& msg) {
            if (wsCallbacks_.onMessage) wsCallbacks_.onMessage(msg.toStdString());
        });
        QObject::connect(webSocket_, QOverload<QAbstractSocket::SocketError>::of(&QWebSocket::errorOccurred),
                [this](QAbstractSocket::SocketError) {
            if (wsCallbacks_.onError) wsCallbacks_.onError("WebSocket error");
        });
    }

    ~NetworkManager() override {
        webSocket_->close();
        delete webSocket_;
        delete accessManager_;
    }

    // ---- HTTP ----

    HttpResponse get(const std::string& url, const std::map<std::string, std::string>& headers) override {
        return doRequest("GET", url, "", "", headers);
    }

    HttpResponse post(const std::string& url, const std::string& body, const std::string& contentType, const std::map<std::string, std::string>& headers) override {
        return doRequest("POST", url, body, contentType, headers);
    }

    // ---- OAuth ----

    std::string startOAuth(const std::string& provider) override {
        if (provider == "github") {
            std::string clientId = getOAuthClientId("github");
            if (clientId.empty()) {
                qWarning() << "OAuth: no client_id configured for github";
                return "";
            }
            std::string state = QUuid::createUuid().toString(QUuid::Id128).toStdString();
            oauthStates_["github"] = state;

            QUrl authUrl("https://github.com/login/oauth/authorize");
            QUrlQuery query;
            query.addQueryItem("client_id", QString::fromStdString(clientId));
            query.addQueryItem("scope", "repo,user");
            query.addQueryItem("state", QString::fromStdString(state));
            query.addQueryItem("redirect_uri", "http://localhost/callback");
            authUrl.setQuery(query);

            return authUrl.toString().toStdString();
        }
        return "";
    }

    std::string completeOAuth(const std::string& provider, const std::string& code) override {
        if (provider == "github") {
            std::string clientId = getOAuthClientId("github");
            std::string clientSecret = getOAuthClientSecret("github");
            if (clientId.empty() || clientSecret.empty()) {
                qWarning() << "OAuth: missing client_id or client_secret";
                return "";
            }

            QUrl tokenUrl("https://github.com/login/oauth/access_token");
            QNetworkRequest req(tokenUrl);
            req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
            req.setRawHeader("Accept", "application/json");

            QJsonObject body;
            body["client_id"] = QString::fromStdString(clientId);
            body["client_secret"] = QString::fromStdString(clientSecret);
            body["code"] = QString::fromStdString(code);

            auto reply = accessManager_->post(req, QJsonDocument(body).toJson());

            QEventLoop loop;
            QTimer timer;
            timer.setSingleShot(true);
            QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
            QObject::connect(&timer, &QTimer::timeout, &loop, &QEventLoop::quit);
            timer.start(HTTP_TIMEOUT_MS);
            loop.exec();

            if (!reply->isFinished()) {
                reply->abort();
                reply->deleteLater();
                return "";
            }

            int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
            QByteArray responseData = reply->readAll();
            reply->deleteLater();

            if (status != 200) return "";

            QJsonDocument doc = QJsonDocument::fromJson(responseData);
            if (doc.isObject()) {
                QString token = doc.object()["access_token"].toString();
                if (!token.isEmpty()) {
                    storeToken(provider, token.toStdString());
                    return token.toStdString();
                }
            }
        }
        return "";
    }

    std::string getStoredToken(const std::string& provider) override {
        if (!db_ || !db_->isOpen()) return "";
        try {
            QSqlQuery q(db_->qSqlDatabase());
            q.prepare("SELECT token FROM oauth_tokens WHERE provider = ?");
            q.addBindValue(QString::fromStdString(provider));
            if (q.exec() && q.next()) {
                return q.value(0).toString().toStdString();
            }
        } catch (...) {}
        return "";
    }

    bool clearToken(const std::string& provider) override {
        if (!db_ || !db_->isOpen()) return false;
        try {
            QSqlQuery q(db_->qSqlDatabase());
            q.prepare("DELETE FROM oauth_tokens WHERE provider = ?");
            q.addBindValue(QString::fromStdString(provider));
            return q.exec();
        } catch (...) {
            return false;
        }
    }

    // ---- WebSocket ----

    void connectWebSocket(const std::string& url) override {
        webSocket_->open(QUrl(QString::fromStdString(url)));
    }

    void sendWebSocket(const std::string& data) override {
        webSocket_->sendTextMessage(QString::fromStdString(data));
    }

    void disconnectWebSocket() override {
        webSocket_->close();
    }

    void setWebSocketCallbacks(
        std::function<void(const std::string&)> onMessage,
        std::function<void()> onConnected,
        std::function<void(const std::string&)> onError
    ) override {
        wsCallbacks_.onMessage = std::move(onMessage);
        wsCallbacks_.onConnected = std::move(onConnected);
        wsCallbacks_.onError = std::move(onError);
    }

    // ---- API Keys ----

    bool storeApiKey(const std::string& service, const std::string& key) override {
        if (!db_ || !db_->isOpen()) return false;
        try {
            QSqlQuery q(db_->qSqlDatabase());
            q.prepare("INSERT OR REPLACE INTO api_keys (service, key_encrypted) VALUES (?, ?)");
            q.addBindValue(QString::fromStdString(service));
            q.addBindValue(QString::fromStdString(key));
            return q.exec();
        } catch (...) {
            return false;
        }
    }

    std::string getApiKey(const std::string& service) override {
        if (!db_ || !db_->isOpen()) return "";
        try {
            QSqlQuery q(db_->qSqlDatabase());
            q.prepare("SELECT key_encrypted FROM api_keys WHERE service = ?");
            q.addBindValue(QString::fromStdString(service));
            if (q.exec() && q.next()) {
                return q.value(0).toString().toStdString();
            }
        } catch (...) {}
        return "";
    }

    bool deleteApiKey(const std::string& service) override {
        if (!db_ || !db_->isOpen()) return false;
        try {
            QSqlQuery q(db_->qSqlDatabase());
            q.prepare("DELETE FROM api_keys WHERE service = ?");
            q.addBindValue(QString::fromStdString(service));
            return q.exec();
        } catch (...) {
            return false;
        }
    }

    std::vector<std::pair<std::string, std::string>> listApiKeys() override {
        std::vector<std::pair<std::string, std::string>> result;
        if (!db_ || !db_->isOpen()) return result;
        try {
            QSqlQuery q(db_->qSqlDatabase());
            if (q.exec("SELECT service, key_encrypted FROM api_keys ORDER BY service")) {
                while (q.next()) {
                    result.emplace_back(
                        q.value(0).toString().toStdString(),
                        q.value(1).toString().toStdString()
                    );
                }
            }
        } catch (...) {}
        return result;
    }

private:
    HttpResponse doRequest(const QString& method, const std::string& url, const std::string& body, const std::string& contentType, const std::map<std::string, std::string>& headers) {
        HttpResponse result;

        QNetworkRequest req(QUrl(QString::fromStdString(url)));
        req.setTransferTimeout(HTTP_TIMEOUT_MS);

        if (!contentType.empty()) {
            req.setHeader(QNetworkRequest::ContentTypeHeader, QString::fromStdString(contentType));
        }

        for (const auto& [key, val] : headers) {
            req.setRawHeader(QByteArray::fromStdString(key), QByteArray::fromStdString(val));
        }

        QNetworkReply* reply = nullptr;
        if (method == "POST") {
            reply = accessManager_->post(req, QByteArray::fromStdString(body));
        } else {
            reply = accessManager_->get(req);
        }

        QEventLoop loop;
        QTimer timer;
        timer.setSingleShot(true);
        QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
        QObject::connect(&timer, &QTimer::timeout, &loop, &QEventLoop::quit);
        timer.start(HTTP_TIMEOUT_MS);
        loop.exec();

        if (!reply->isFinished()) {
            reply->abort();
            result.statusCode = -1;
            result.body = "TIMEOUT";
            reply->deleteLater();
            return result;
        }

        result.statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        result.body = reply->readAll().toStdString();

        for (const auto& [key, val] : reply->rawHeaderPairs()) {
            result.headers[key.toStdString()] = val.toStdString();
        }

        reply->deleteLater();
        return result;
    }

    std::string getOAuthClientId(const std::string& provider) {
        std::string key = getApiKey(provider + "_client_id");
        if (key.empty()) {
            key = qEnvironmentVariable(QString::fromStdString(provider + "_CLIENT_ID").toUpper().toStdString()).toStdString();
        }
        return key;
    }

    std::string getOAuthClientSecret(const std::string& provider) {
        std::string secret = getApiKey(provider + "_client_secret");
        if (secret.empty()) {
            secret = qEnvironmentVariable(QString::fromStdString(provider + "_CLIENT_SECRET").toUpper().toStdString()).toStdString();
        }
        return secret;
    }

    void storeToken(const std::string& provider, const std::string& token) {
        if (!db_ || !db_->isOpen()) return;
        try {
            QSqlQuery q(db_->qSqlDatabase());
            q.prepare("INSERT OR REPLACE INTO oauth_tokens (provider, token) VALUES (?, ?)");
            q.addBindValue(QString::fromStdString(provider));
            q.addBindValue(QString::fromStdString(token));
            q.exec();
        } catch (...) {}
    }

    jarvis::persistence::IDatabase* db_;
    QNetworkAccessManager* accessManager_;
    QWebSocket* webSocket_;
    WsCallbacks wsCallbacks_;
    std::map<std::string, std::string> oauthStates_;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

INetworkManager* createNetworkManager(jarvis::persistence::IDatabase* db) {
    return new NetworkManager(db);
}

} // namespace jarvis::network

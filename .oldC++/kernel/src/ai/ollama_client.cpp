#include "jarvis/ai/ollama_client.h"
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QEventLoop>
#include <QTimer>
#include <chrono>

namespace jarvis::ai {

OllamaClient::OllamaClient(const std::string& baseUrl)
    : baseUrl_(baseUrl)
{
    if (baseUrl_.empty()) baseUrl_ = "http://localhost:11434";
    // Remove trailing slash
    if (baseUrl_.back() == '/') baseUrl_.pop_back();
}

bool OllamaClient::ping() {
    try {
        auto resp = httpGet("/api/tags");
        return !resp.empty();
    } catch (...) {
        return false;
    }
}

std::vector<OllamaModel> OllamaClient::listModels() {
    std::vector<OllamaModel> models;
    auto resp = httpGet("/api/tags");
    auto doc = QJsonDocument::fromJson(QByteArray::fromStdString(resp));
    auto arr = doc.object()["models"].toArray();
    for (const auto& m : arr) {
        auto obj = m.toObject();
        OllamaModel model;
        model.name = obj["name"].toString().toStdString();
        model.modifiedAt = obj["modified_at"].toString().toStdString();
        model.sizeBytes = obj["size"].toVariant().toLongLong();
        model.digest = obj["digest"].toString().toStdString();
        if (obj.contains("details")) {
            auto det = obj["details"].toObject();
            model.details = det["families"].toArray().first().toString().toStdString();
        }
        models.push_back(std::move(model));
    }
    return models;
}

bool OllamaClient::pullModel(const std::string& name) {
    QJsonObject body;
    body["name"] = QString::fromStdString(name);
    body["stream"] = false;
    auto resp = httpPost("/api/pull", QJsonDocument(body).toJson().toStdString());
    auto doc = QJsonDocument::fromJson(QByteArray::fromStdString(resp));
    return doc.object()["status"].toString() == "success";
}

bool OllamaClient::deleteModel(const std::string& name) {
    QJsonObject body;
    body["name"] = QString::fromStdString(name);
    auto resp = httpDelete("/api/delete");
    return !resp.empty();
}

OllamaGenerateResponse OllamaClient::generate(const OllamaGenerateRequest& req) {
    QJsonObject body;
    body["model"] = QString::fromStdString(req.model);
    body["prompt"] = QString::fromStdString(req.prompt);
    if (!req.system.empty()) body["system"] = QString::fromStdString(req.system);
    body["stream"] = req.stream;
    body["options"] = QJsonObject{
        {"temperature", req.temperature},
        {"num_predict", req.maxTokens}
    };

    auto t1 = std::chrono::steady_clock::now();
    auto resp = httpPost("/api/generate", QJsonDocument(body).toJson().toStdString());
    auto t2 = std::chrono::steady_clock::now();

    auto doc = QJsonDocument::fromJson(QByteArray::fromStdString(resp));
    auto obj = doc.object();

    OllamaGenerateResponse result;
    result.response = obj["response"].toString().toStdString();
    result.done = obj["done"].toBool();
    result.promptEvalCount = obj["prompt_eval_count"].toInt();
    result.evalCount = obj["eval_count"].toInt();
    result.latencyMs = std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count();
    return result;
}

bool OllamaClient::generateStream(const OllamaGenerateRequest& req,
                                   std::function<void(const std::string&)> onChunk) {
    QNetworkAccessManager mgr;
    QNetworkRequest netReq(QUrl(QString::fromStdString(baseUrl_ + "/api/generate")));
    netReq.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject body;
    body["model"] = QString::fromStdString(req.model);
    body["prompt"] = QString::fromStdString(req.prompt);
    if (!req.system.empty()) body["system"] = QString::fromStdString(req.system);
    body["stream"] = true;
    body["options"] = QJsonObject{
        {"temperature", req.temperature},
        {"num_predict", req.maxTokens}
    };

    auto* reply = mgr.post(netReq, QJsonDocument(body).toJson());
    QObject::connect(reply, &QNetworkReply::readyRead, [reply, onChunk]() {
        auto data = reply->readAll();
        // Ollama streams JSON lines
        for (const auto& line : data.split('\n')) {
            if (line.isEmpty()) continue;
            auto doc = QJsonDocument::fromJson(line);
            if (doc.isObject() && doc.object().contains("response")) {
                auto chunk = doc.object()["response"].toString().toStdString();
                if (onChunk) onChunk(chunk);
            }
        }
    });

    QEventLoop loop;
    QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    QTimer::singleShot(60000, &loop, &QEventLoop::quit); // 60s timeout
    loop.exec();

    return reply->error() == QNetworkReply::NoError;
}

std::string OllamaClient::httpGet(const std::string& path) {
    QNetworkAccessManager mgr;
    QNetworkReply* reply = mgr.get(QNetworkRequest(
        QUrl(QString::fromStdString(baseUrl_ + path))));
    QEventLoop loop;
    QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    QTimer::singleShot(30000, &loop, &QEventLoop::quit);
    loop.exec();

    if (reply->error() != QNetworkReply::NoError) {
        auto err = reply->errorString().toStdString();
        reply->deleteLater();
        throw std::runtime_error("HTTP GET failed: " + err);
    }
    auto data = reply->readAll().toStdString();
    reply->deleteLater();
    return data;
}

std::string OllamaClient::httpPost(const std::string& path, const std::string& body) {
    QNetworkAccessManager mgr;
    QNetworkRequest req(QUrl(QString::fromStdString(baseUrl_ + path)));
    req.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    QNetworkReply* reply = mgr.post(req, QByteArray::fromStdString(body));
    QEventLoop loop;
    QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    QTimer::singleShot(120000, &loop, &QEventLoop::quit); // 2min for pulls
    loop.exec();

    if (reply->error() != QNetworkReply::NoError) {
        auto err = reply->errorString().toStdString();
        reply->deleteLater();
        throw std::runtime_error("HTTP POST failed: " + err);
    }
    auto data = reply->readAll().toStdString();
    reply->deleteLater();
    return data;
}

std::string OllamaClient::httpDelete(const std::string& path) {
    QNetworkAccessManager mgr;
    QNetworkRequest req(QUrl(QString::fromStdString(baseUrl_ + path)));
    QNetworkReply* reply = mgr.deleteResource(req);
    QEventLoop loop;
    QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    QTimer::singleShot(30000, &loop, &QEventLoop::quit);
    loop.exec();

    if (reply->error() != QNetworkReply::NoError) {
        auto err = reply->errorString().toStdString();
        reply->deleteLater();
        throw std::runtime_error("HTTP DELETE failed: " + err);
    }
    auto data = reply->readAll().toStdString();
    reply->deleteLater();
    return data;
}

} // namespace jarvis::ai

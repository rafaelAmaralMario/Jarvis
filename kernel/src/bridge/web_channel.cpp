#include "jarvis/bridge/web_channel.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QDebug>

namespace jarvis::bridge {

BridgeHandler::BridgeHandler(QObject* parent)
    : QObject(parent) {}

void BridgeHandler::registerHandler(const QString& method, RequestHandler handler) {
    handlers_[method] = handler;
}

void BridgeHandler::emitEvent(const QString& event, const QVariant& data) {
    Q_EMIT eventEmitted(event, data);
}

QString BridgeHandler::handleMessage(const QString& json) {
    QJsonDocument doc = QJsonDocument::fromJson(json.toUtf8());
    if (!doc.isObject()) {
        return R"({"error":"invalid json"})";
    }

    QJsonObject msg = doc.object();
    QString id = msg["id"].toString();
    QString method = msg["method"].toString();
    QJsonArray args = msg["args"].toArray();
    QVariantList argsList = args.toVariantList();

    auto it = handlers_.find(method);
    if (it == handlers_.end()) {
        QJsonObject error;
        error["id"] = id;
        error["error"] = QString("Unknown method: %1").arg(method);
        return QString(QJsonDocument(error).toJson(QJsonDocument::Compact));
    }

    try {
        QVariant result = it.value()(argsList);
        QJsonObject response;
        response["id"] = id;
        response["result"] = QJsonValue::fromVariant(result);
        return QString(QJsonDocument(response).toJson(QJsonDocument::Compact));
    } catch (const std::exception& e) {
        QJsonObject error;
        error["id"] = id;
        error["error"] = e.what();
        return QString(QJsonDocument(error).toJson(QJsonDocument::Compact));
    }
}

WebEngineBridge::WebEngineBridge(QWebEngineView* view)
    : view_(view)
{
    handler_.moveToThread(view->thread());

    QObject::connect(&handler_, &BridgeHandler::eventEmitted, this, [this](const QString& event, const QVariant& data) {
        QJsonObject msg;
        msg["event"] = event;
        msg["data"] = QJsonValue::fromVariant(data);
        QString json = QString(QJsonDocument(msg).toJson(QJsonDocument::Compact));
        QString script = QString(
            "if (window.jarvisBridge && window.jarvisBridge.onMessage) {"
            "  window.jarvisBridge.onMessage(%1);"
            "}"
        ).arg(json);
        view_->page()->runJavaScript(script);
    });

    channel_.registerObject("backend", &handler_);
    view_->page()->setWebChannel(&channel_);
}

void WebEngineBridge::registerHandler(const QString& method, BridgeHandler::RequestHandler handler) {
    handler_.registerHandler(method, handler);
}

void WebEngineBridge::emitEvent(const QString& event, const QVariant& data) {
    handler_.emitEvent(event, data);
}

} // namespace jarvis::bridge

#include "jarvis/bridge/web_channel.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QWebEngineScript>
#include <QWebEngineScriptCollection>
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

    QObject::connect(&handler_, &BridgeHandler::eventEmitted, view_, [this](const QString& event, const QVariant& data) {
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

    // Inject bridge adapter at DocumentCreation — runs before page JS loads.
    // Translates the frontend's custom JSON-RPC protocol into QWebChannel
    // protocol messages so that JS -> C++ communication works correctly.
    // Since qwebchannel.js hasn't loaded yet at DocumentCreation, we poll
    // for window.qt.webChannelTransport before patching.
    QWebEngineScript adapter;
    adapter.setName("jarvis_bridge_adapter");
    adapter.setSourceCode(R"(
(function(){
    var _onMsg = null;
    var _reqId = 0;
    var _patched = false;

    function patch() {
        var t = window.qt && window.qt.webChannelTransport;
        if (!t || t.__jarvisPatched || _patched) return;

        _patched = true;
        t.__jarvisPatched = true;
        var _origSend = t.send.bind(t);

        t.send = function(msg) {
            // Only wrap our custom JSON-RPC messages.
            // QWebChannel protocol messages have a "type" field — pass those through.
            try {
                var parsed = JSON.parse(msg);
                if (parsed && parsed.type !== undefined) {
                    _origSend(msg);
                    return;
                }
            } catch(e) {
                _origSend(msg);
                return;
            }

            // Our frontend message: wrap in QWebChannel type-2 envelope
            var id = ++_reqId;
            var pkt = JSON.stringify({
                type: 2,
                id: id,
                objectName: "backend",
                method: "handleMessage",
                args: [msg]
            });
            _origSend(pkt);
        };

        Object.defineProperty(t, 'onmessage', {
            configurable: true,
            get: function() { return _onMsg; },
            set: function(fn) {
                _onMsg = function(raw) {
                    try {
                        var d = JSON.parse(raw);
                        if (d.type === 3 && d.result !== undefined) {
                            fn(d.result);
                            return;
                        }
                    } catch(e) {}
                    fn(raw);
                };
            }
        });
    }

    // Try immediately, then poll until available
    patch();
    if (!_patched) {
        var check = setInterval(function() {
            patch();
            if (_patched) clearInterval(check);
        }, 5);
    }
})();
)");
    adapter.setInjectionPoint(QWebEngineScript::DocumentCreation);
    adapter.setWorldId(QWebEngineScript::MainWorld);
    view_->page()->scripts().insert(adapter);
}

void WebEngineBridge::registerHandler(const QString& method, BridgeHandler::RequestHandler handler) {
    handler_.registerHandler(method, handler);
}

void WebEngineBridge::emitEvent(const QString& event, const QVariant& data) {
    handler_.emitEvent(event, data);
}

} // namespace jarvis::bridge

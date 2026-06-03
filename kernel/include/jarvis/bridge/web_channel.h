#ifndef JARVIS_BRIDGE_WEB_CHANNEL_H
#define JARVIS_BRIDGE_WEB_CHANNEL_H

#include <QObject>
#include <QWebChannel>
#include <QWebEnginePage>
#include <QWebEngineView>
#include <QVariantMap>
#include <functional>

namespace jarvis::bridge {

class BridgeHandler : public QObject {
    Q_OBJECT
public:
    using RequestHandler = std::function<QVariant(const QVariantList&)>;

    explicit BridgeHandler(QObject* parent = nullptr);

    void registerHandler(const QString& method, RequestHandler handler);
    void emitEvent(const QString& event, const QVariant& data);

public slots:
    QString handleMessage(const QString& json);

signals:
    void eventEmitted(const QString& event, const QVariant& data);

private:
    QMap<QString, RequestHandler> handlers_;
};

class WebEngineBridge {
public:
    WebEngineBridge(QWebEngineView* view);

    void registerHandler(const QString& method, BridgeHandler::RequestHandler handler);
    void emitEvent(const QString& event, const QVariant& data);

    QWebChannel* channel() { return &channel_; }
    BridgeHandler* handler() { return &handler_; }

private:
    QWebChannel channel_;
    BridgeHandler handler_;
    QWebEngineView* view_;
};

} // namespace jarvis::bridge

#endif // JARVIS_BRIDGE_WEB_CHANNEL_H

# Uso do Qt Framework

## Modulos Qt Utilizados

| Modulo | Uso |
|--------|-----|
| Qt Core | QObject, signals/slots, QThread, QTimer, QFile, QDir |
| Qt GUI | QWindow, QSurface, eventos de input |
| Qt Quick / QML | UI declarativa (QQmlApplicationEngine) |
| Qt Widgets | Componentes classicos (se necessario) |
| Qt SQL | QSqlDatabase, QSqlQuery (SQLite) |
| Qt Network | QNetworkAccessManager, QWebSocket |
| Qt WebEngine | Monaco Editor (modulo IDE) |
| Qt QML Models | QAbstractListModel para dados |

## Arquitetura QML + C++

```
QML (UI) ←→ C++ (backend) via:
  1. context properties (rootContext->setContextProperty)
  2. QML registered types (qmlRegisterType)
  3. Signals/Slots (conexao automatica)
```

## Exemplo: Modulo Conhecimento

```cpp
// C++
class NoteModel : public QAbstractListModel {
    Q_OBJECT
    Q_PROPERTY(int count READ count NOTIFY countChanged)
public:
    enum Roles { IdRole = Qt::UserRole + 1, TitleRole, ContentRole, TagsRole };
    
    int rowCount(const QModelIndex& parent = {}) const override;
    QVariant data(const QModelIndex& index, int role) const override;
    QHash<int, QByteArray> roleNames() const override;
    
    void setNotes(const std::vector<Note>& notes);
    
signals:
    void countChanged();
    
private:
    std::vector<Note> notes_;
};
```

```qml
// QML
ListView {
    model: noteModel  // context property do C++
    delegate: Rectangle {
        Text { text: title }  // TitleRole -> "title" (roleNames)
        Text { text: content }
    }
}
```

## Threading

- UI sempre na main thread (Qt QML thread)
- Operacoes bloqueantes (IO, AI) em QThread ou QtConcurrent
- Comunicacao via signals/slots (thread-safe)
- Modulos podem criar suas proprias threads

## Build System (CMake + Qt)

```cmake
find_package(Qt6 REQUIRED COMPONENTS Core Quick Sql Network WebEngineWidgets)

qt_add_executable(jarvis
    src/main.cpp
    resources/jarvis.qrc
)

qt_add_qml_module(jarvis
    URI "jarvis"
    VERSION 1.0
    QML_FILES
        qml/main.qml
        qml/KnowledgePanel.qml
)

target_link_libraries(jarvis PRIVATE
    Qt6::Core
    Qt6::Quick
    Qt6::Sql
    Qt6::Network
)
```

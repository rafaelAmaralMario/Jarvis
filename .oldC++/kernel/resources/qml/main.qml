import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: window
    title: "JARVIS"
    width: 1280
    height: 800
    visible: true

    // Tema escuro padrao
    color: "#1e1e1e"

    RowLayout {
        anchors.fill: parent
        spacing: 0

        // Sidebar com botoes dos modulos
        Rectangle {
            id: sidebar
            Layout.preferredWidth: 48
            Layout.fillHeight: true
            color: "#252526"

            ColumnLayout {
                anchors.fill: parent
                spacing: 4
                padding: 8

                Repeater {
                    model: [
                        { icon: "\u2630", name: "Conhecimento" },
                        { icon: "\u2699", name: "IDE" },
                        { icon: "\u2601", name: "IA" },
                        { icon: "\u2692", name: "Automacao" }
                    ]
                    delegate: Button {
                        Layout.preferredWidth: 32
                        Layout.preferredHeight: 32
                        text: modelData.icon
                        hoverEnabled: true
                        ToolTip.visible: hovered
                        ToolTip.text: modelData.name
                        flat: true
                    }
                }
            }
        }

        // Area principal do modulo ativo
        Rectangle {
            id: mainArea
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#1e1e1e"

            Label {
                anchors.center: parent
                text: "JARVIS v" + Qt.application.version
                color: "#888"
                font.pixelSize: 24
            }
        }

        // Painel de IA (chat)
        Rectangle {
            id: aiPanel
            Layout.preferredWidth: 320
            Layout.fillHeight: true
            color: "#252526"

            ColumnLayout {
                anchors.fill: parent
                spacing: 8
                padding: 12

                Label {
                    text: "Assistente IA"
                    color: "#ccc"
                    font.bold: true
                    font.pixelSize: 14
                }

                ScrollView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true

                    TextArea {
                        readOnly: true
                        placeholderText: "Inicie uma conversa..."
                        color: "#ccc"
                        background: Rectangle { color: "#1e1e1e" }
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    TextField {
                        Layout.fillWidth: true
                        placeholderText: "Digite sua mensagem..."
                        color: "#ccc"
                    }

                    Button {
                        text: "Enviar"
                        highlighted: true
                    }
                }
            }
        }
    }

    // Barra de status
    footer: Rectangle {
        height: 24
        color: "#007acc"

        RowLayout {
            anchors.fill: parent
            spacing: 16
            padding { left: 16; right: 16 }

            Label {
                text: "JARVIS v" + Qt.application.version
                color: "white"
                font.pixelSize: 12
            }

            Item { Layout.fillWidth: true }

            Label {
                text: "Modulos: " + 0 + " ativos"
                color: "white"
                font.pixelSize: 12
            }

            Label {
                text: "Modelo: nenhum"
                color: "white"
                font.pixelSize: 12
            }
        }
    }
}

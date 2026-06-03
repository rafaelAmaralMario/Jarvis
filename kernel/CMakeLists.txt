cmake_minimum_required(VERSION 3.30)

set(KERNEL_SRC
    src/main.cpp
    src/module_loader.cpp
    src/lifecycle.cpp
    src/service_locator.cpp
    src/permission_manager.cpp
    src/bridge/web_channel.cpp
    src/ai/models_manager.cpp
    src/ai/agents_manager.cpp
    src/ai/orchestration_manager.cpp
    src/ai/ollama_client.cpp
    src/knowledge/knowledge_manager.cpp
    src/knowledge/search_engine.cpp
    src/knowledge/graph_builder.cpp
    src/workspace/workspace_manager.cpp
    src/workspace/file_watcher.cpp
    src/workspace/file_utils.cpp
    src/persistence/database.cpp
    src/persistence/migration_runner.cpp
    src/persistence/repository.cpp
    src/persistence/query_builder.cpp
    src/persistence/backup_manager.cpp
    src/editor/editor_manager.cpp
)

qt_add_executable(jarvis
    ${KERNEL_SRC}
    resources/jarvis.qrc
)

target_include_directories(jarvis PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(jarvis PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::WebEngineWidgets
    Qt6::WebChannel
    Qt6::Sql
    Qt6::Network
)

target_compile_definitions(jarvis PRIVATE
    JARVIS_VERSION="${PROJECT_VERSION}"
    JARVIS_MODULES_DIR="${CMAKE_SOURCE_DIR}/modules"
)

# Copy webui to build directory
add_custom_command(TARGET jarvis POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_SOURCE_DIR}/kernel/resources/webui
        $<TARGET_FILE_DIR:jarvis>/webui
    COMMENT "Copying web UI to build directory"
)

# ---- Tests ----
if(BUILD_TESTING)
    enable_testing()
    find_package(Catch2 REQUIRED)

    add_executable(kernel-tests
        tests/test_service_locator.cpp
        tests/test_module_loader.cpp
        tests/test_database.cpp
        tests/test_migration_runner.cpp
        tests/test_knowledge.cpp
        tests/test_workspace.cpp
        tests/test_editor.cpp
    )

    target_include_directories(kernel-tests PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    )

    target_link_libraries(kernel-tests PRIVATE
        Catch2::Catch2WithMain
        Qt6::Core
        Qt6::Sql
    )

    include(CTest)
    include(Catch)
    catch_discover_tests(kernel-tests)
endif()

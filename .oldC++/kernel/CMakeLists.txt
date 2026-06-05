cmake_minimum_required(VERSION 3.30)

include(FetchContent)
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(nlohmann_json)

set(KERNEL_LIB_SRC
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
    src/terminal/terminal_manager.cpp
    src/network/network_manager.cpp
    src/git/git_manager.cpp
)

add_library(jarvis_kernel STATIC ${KERNEL_LIB_SRC})

target_include_directories(jarvis_kernel PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(jarvis_kernel PUBLIC
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::WebEngineWidgets
    Qt6::WebChannel
    Qt6::Sql
    Qt6::Network
    Qt6::WebSockets
    nlohmann_json::nlohmann_json
)

target_compile_definitions(jarvis_kernel PUBLIC
    JARVIS_VERSION="${PROJECT_VERSION}"
    JARVIS_MODULES_DIR="${CMAKE_SOURCE_DIR}/modules"
)

qt_add_executable(jarvis
    src/main.cpp
    include/jarvis/bridge/web_channel.h
    resources/jarvis.qrc
)

target_link_libraries(jarvis PRIVATE
    jarvis_kernel
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
    include(FetchContent)
    FetchContent_Declare(
        Catch2
        GIT_REPOSITORY https://github.com/catchorg/Catch2.git
        GIT_TAG v3.8.1
    )
    FetchContent_MakeAvailable(Catch2)

    file(GLOB KERNEL_TEST_SRC
        tests/test_*.cpp
        ${CMAKE_SOURCE_DIR}/tests/cpp/test_*.cpp
    )

    add_executable(kernel-tests
        ${KERNEL_TEST_SRC}
    )

    target_link_libraries(kernel-tests PRIVATE
        jarvis_kernel
        Catch2::Catch2WithMain
    )

    include(CTest)
    include(Catch)
    catch_discover_tests(kernel-tests)
endif()

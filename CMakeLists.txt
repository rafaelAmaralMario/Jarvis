cmake_minimum_required(VERSION 3.30)
project(jarvis VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

# ---- Dependencies ----
find_package(Qt6 REQUIRED COMPONENTS
    Core
    Gui
    Widgets
    WebEngineWidgets
    WebChannel
    Sql
    Network
)

# ---- Kernel (main executable) ----
add_subdirectory(kernel)

# ---- Modules (will be added as they are implemented) ----
# add_subdirectory(modules/conhecimento)
# add_subdirectory(modules/workspace)
# add_subdirectory(modules/ai-engine)
# add_subdirectory(modules/ide)
# add_subdirectory(modules/seguranca)
# add_subdirectory(modules/rede)
# add_subdirectory(modules/automacao)
# add_subdirectory(modules/voz)
# add_subdirectory(modules/perifericos)
# add_subdirectory(modules/plugins)

# ---- Custom target to build web UI ----
find_program(NODE_EXECUTABLE node)
find_program(NPM_EXECUTABLE npm)

if(NPM_EXECUTABLE)
    add_custom_target(webui
        COMMAND ${CMAKE_COMMAND} -E echo "Building web UI..."
        COMMAND ${NPM_EXECUTABLE} install
        COMMAND ${NPM_EXECUTABLE} run build
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/ui
        COMMENT "Building React frontend with Vite"
    )
    add_dependencies(jarvis webui)
endif()

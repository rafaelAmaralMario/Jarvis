#ifndef JARVIS_CORE_SERVICE_LOCATOR_H
#define JARVIS_CORE_SERVICE_LOCATOR_H

#include <string>
#include <unordered_map>

namespace jarvis::core {

class ServiceLocator {
public:
    void registerService(const std::string& name, void* service);
    void* getService(const std::string& name);

    template<typename T>
    T* getService(const std::string& name) {
        return static_cast<T*>(getService(name));
    }

    bool hasService(const std::string& name) const;
    void unregisterService(const std::string& name);

private:
    std::unordered_map<std::string, void*> services_;
};

} // namespace jarvis::core

#endif // JARVIS_CORE_SERVICE_LOCATOR_H

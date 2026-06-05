#include "jarvis/core/service_locator.h"

namespace jarvis::core {

void ServiceLocator::registerService(const std::string& name, void* service) {
    services_[name] = service;
}

void* ServiceLocator::getService(const std::string& name) {
    auto it = services_.find(name);
    return it != services_.end() ? it->second : nullptr;
}

bool ServiceLocator::hasService(const std::string& name) const {
    return services_.find(name) != services_.end();
}

void ServiceLocator::unregisterService(const std::string& name) {
    services_.erase(name);
}

} // namespace jarvis::core

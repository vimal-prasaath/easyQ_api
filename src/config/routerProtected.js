import authenticate from '../middleware/authorization.js'; 
import AuthorizationManager from '../middleware/authorizationPolicies.js'; 

const _inferAction = (method) => {
    switch (method.toLowerCase()) {
        case 'get': return 'read';
        case 'post': return 'create';
        case 'put':
        case 'patch': return 'update';
        case 'delete': return 'delete';
        default: return 'unknown'; 
    }
};

export const setupProtectedRoutes = (router, routesConfig) => {
    routesConfig.forEach(routeConfig => {
        const { path, method, resourceType, action, handlers = [] } = routeConfig;
        const finalAction = action || _inferAction(method);

        if (!resourceType || !finalAction || handlers.length === 0) {
            console.warn(`Skipping route ${method.toUpperCase()} ${path}: Missing resourceType, action, or handlers. This route will not be protected by policy-based authorization.`);
            return;
        }

        const authMiddleware = AuthorizationManager.authorize(finalAction, resourceType);

        router[method.toLowerCase()](
            path,
            authenticate,
            authMiddleware,
            ...handlers
        );
    });
};


import React from "react";
import { useAuthStore } from "../../store/authStore";
import { Role } from "../../config/roles";

interface RoleBasedControlProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

/**
 * A component to conditionally render UI based on roles or permissions.
 * Usage:
 * <RoleBasedControl allowedRoles={[Role.ADMIN, Role.DEAN]}>
 *   <button>Admin Action</button>
 * </RoleBasedControl>
 */
const RoleBasedControl: React.FC<RoleBasedControlProps> = ({
  children,
  allowedRoles,
  permissions,
  fallback = null,
}) => {
  const { hasRole, hasPermission } = useAuthStore();

  let isAuthorized = true;

  if (allowedRoles && !hasRole(allowedRoles)) {
    isAuthorized = false;
  }

  if (permissions && permissions.length > 0) {
    const hasAllPermissions = permissions.every((p) => hasPermission(p));
    if (!hasAllPermissions) {
      isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedControl;

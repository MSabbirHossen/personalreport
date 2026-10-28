import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  SystemRole,
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@reportbd/shared';

export interface PermissionGateProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  anyPermission?: Permission[];
  role?: SystemRole;
  roles?: SystemRole[];
  fallback?: React.ReactNode;
  disabledMode?: boolean;
  disabledTooltip?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions,
  anyPermission,
  role,
  roles,
  fallback = null,
  disabledMode = false,
  disabledTooltip,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const userRoles = (user.roles || []) as SystemRole[];
  let authorized = true;

  if (permission && !hasPermission(userRoles, permission)) {
    authorized = false;
  }

  if (authorized && permissions && permissions.length > 0 && !hasAllPermissions(userRoles, permissions)) {
    authorized = false;
  }

  if (authorized && anyPermission && anyPermission.length > 0 && !hasAnyPermission(userRoles, anyPermission)) {
    authorized = false;
  }

  if (authorized && role && !userRoles.includes(role)) {
    authorized = false;
  }

  if (authorized && roles && roles.length > 0 && !userRoles.some((r) => roles.includes(r))) {
    authorized = false;
  }

  if (authorized) {
    return <>{children}</>;
  }

  if (disabledMode && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      'aria-disabled': 'true',
      title: disabledTooltip || 'You do not have permission to perform this action',
      className: `${(children as any).props?.className || ''} opacity-50 cursor-not-allowed pointer-events-none`,
    });
  }

  return <>{fallback}</>;
};


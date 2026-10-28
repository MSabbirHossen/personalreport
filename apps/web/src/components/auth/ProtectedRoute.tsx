import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { BPSReportLoader } from '../common/BPSReportLoader.js';
import { AccessDenied } from './AccessDenied.js';
import {
  SystemRole,
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@reportbd/shared';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  anyPermission?: Permission[];
  requiredRole?: SystemRole;
  requiredRoles?: SystemRole[];
  fallback?: 'access-denied' | 'redirect';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  anyPermission,
  requiredRole,
  requiredRoles,
  fallback = 'access-denied',
  redirectTo,
}) => {
  const { user, loading } = useAuth();
  const { locale } = useLanguage();

  if (loading) {
    return <BPSReportLoader fullScreen={true} locale={locale} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = (user.roles || []) as SystemRole[];

  // 1. Check required single permission
  if (requiredPermission && !hasPermission(userRoles, requiredPermission)) {
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo || '/app/home'} replace />;
    }
    return <AccessDenied requiredPermission={requiredPermission} fallbackPath={redirectTo} />;
  }

  // 2. Check required all permissions
  if (requiredPermissions && requiredPermissions.length > 0 && !hasAllPermissions(userRoles, requiredPermissions)) {
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo || '/app/home'} replace />;
    }
    return <AccessDenied requiredPermission={requiredPermissions.join(', ')} fallbackPath={redirectTo} />;
  }

  // 3. Check any permission from list
  if (anyPermission && anyPermission.length > 0 && !hasAnyPermission(userRoles, anyPermission)) {
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo || '/app/home'} replace />;
    }
    return <AccessDenied requiredPermission={anyPermission.join(' | ')} fallbackPath={redirectTo} />;
  }

  // 4. Check required single role
  if (requiredRole && !userRoles.includes(requiredRole)) {
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo || '/app/home'} replace />;
    }
    return <AccessDenied requiredRole={requiredRole} fallbackPath={redirectTo} />;
  }

  // 5. Check required roles list
  if (requiredRoles && requiredRoles.length > 0 && !userRoles.some((r) => requiredRoles.includes(r))) {
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo || '/app/home'} replace />;
    }
    return <AccessDenied requiredRole={requiredRoles.join(' | ')} fallbackPath={redirectTo} />;
  }

  return <>{children}</>;
};


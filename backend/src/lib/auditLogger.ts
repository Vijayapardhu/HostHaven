import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { logger } from '../utils/logger.util';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'BLOCK'
  | 'UNBLOCK'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'EXPORT'
  | 'IMPORT'
  | 'SETTINGS_CHANGE'
  | 'PASSWORD_CHANGE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE';

export type AuditResource = 
  | 'USER'
  | 'VENDOR'
  | 'PROPERTY'
  | 'BOOKING'
  | 'PAYMENT'
  | 'PAYOUT'
  | 'REVIEW'
  | 'SERVICE'
  | 'TEMPLE'
  | 'CMS_PAGE'
  | 'SETTINGS'
  | 'SYSTEM'
  | 'SESSION';

export interface AuditLogInput {
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

const sanitizeChanges = (changes: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined => {
  if (!changes) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(changes)) {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('password') || 
        lowerKey.includes('token') || 
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('credential')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[truncated]';
    } else {
      sanitized[key] = value as string | number | boolean | null;
    }
  }
  
  return sanitized as Prisma.JsonObject;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const auditLogger = {
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId || null,
          userName: input.userName || 'System',
          userEmail: input.userEmail || null,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId || null,
          changes: sanitizeChanges(input.changes),
          ipAddress: input.ipAddress || null,
        },
      });
    } catch (error) {
      logger.error({ error, input }, 'Failed to create audit log');
    }
  },

  async logAction(
    adminId: string,
    adminName: string,
    adminEmail: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    changes?: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId: adminId,
      userName: adminName,
      userEmail: adminEmail,
      action,
      resource,
      resourceId,
      changes,
      ipAddress,
    });
  },

  async logLogin(
    userId: string,
    userName: string,
    userEmail: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      userEmail,
      action: 'LOGIN',
      resource: 'SESSION',
      ipAddress,
    });
  },

  async logLogout(
    userId: string,
    userName: string,
    userEmail: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      userEmail,
      action: 'LOGOUT',
      resource: 'SESSION',
      ipAddress,
    });
  },

  async logCreation(
    adminId: string,
    adminName: string,
    adminEmail: string,
    resource: AuditResource,
    resourceId: string,
    changes: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction(adminId, adminName, adminEmail, 'CREATE', resource, resourceId, changes, ipAddress);
  },

  async logUpdate(
    adminId: string,
    adminName: string,
    adminEmail: string,
    resource: AuditResource,
    resourceId: string,
    changes: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction(adminId, adminName, adminEmail, 'UPDATE', resource, resourceId, changes, ipAddress);
  },

  async logDeletion(
    adminId: string,
    adminName: string,
    adminEmail: string,
    resource: AuditResource,
    resourceId: string,
    changes?: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction(adminId, adminName, adminEmail, 'DELETE', resource, resourceId, changes, ipAddress);
  },

  async logApproval(
    adminId: string,
    adminName: string,
    adminEmail: string,
    resource: AuditResource,
    resourceId: string,
    resourceName: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction(
      adminId, 
      adminName, 
      adminEmail, 
      'APPROVE', 
      resource, 
      resourceId, 
      { name: resourceName, status: 'approved' }, 
      ipAddress
    );
  },

  async logRejection(
    adminId: string,
    adminName: string,
    adminEmail: string,
    resource: AuditResource,
    resourceId: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction(
      adminId, 
      adminName, 
      adminEmail, 
      'REJECT', 
      resource, 
      resourceId, 
      { reason: reason || 'No reason provided' }, 
      ipAddress
    );
  },
};

export default auditLogger;

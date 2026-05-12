import AuditLog from '../models/AuditLog.js';

/**
 * Helper function to create an audit log entry.
 * @param {Object} options
 * @param {String} options.userId - ID of the user performing the action
 * @param {String} options.action - 'CREATE', 'UPDATE', or 'DELETE'
 * @param {String} options.entityType - e.g., 'Material', 'User', 'Order'
 * @param {String} options.entityId - ID of the created/modified/deleted entity
 * @param {Object} options.details - JSON details/payload of the action
 * @param {String} options.ipAddress - User's IP Address
 */
export const logAudit = async ({
    userId,
    action,
    entityType,
    entityId,
    details = {},
    ipAddress = null,
}) => {
    try {
        await AuditLog.create({
            userId,
            action,
            entityType,
            entityId,
            details,
            ipAddress,
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};

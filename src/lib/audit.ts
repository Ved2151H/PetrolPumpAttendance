import prisma from './prisma'

export async function createAuditLog(
  adminId: string,
  action: string,
  details: string,
  entityType?: string,
  entityId?: string
) {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return;

    await prisma.auditLog.create({
      data: {
        adminId,
        adminNumber: admin.adminNumber,
        adminName: admin.name,
        action,
        details,
        entityType,
        entityId
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * license_service - 创建 License、检查有效期、quota、scope，吊销/暂停
 * buyandsell.md
 */
import { prisma } from "./db";
import { LicenseStatus } from "@prisma/client";

export async function checkLicenseForInvocation(
  licenseId: string,
  agentId: string,
  buyerId: string,
  scope?: string
): Promise<{ ok: boolean; error?: string }> {
  const license = await prisma.license.findUnique({
    where: { id: licenseId },
    include: { agent: true },
  });
  if (!license) return { ok: false, error: "license_not_found" };
  if (license.buyerId !== buyerId) return { ok: false, error: "license_not_yours" };
  if (license.agentId !== agentId) return { ok: false, error: "agent_mismatch" };
  if (license.status !== LicenseStatus.ACTIVE) return { ok: false, error: "license_inactive" };
  if (license.expiresAt < new Date()) return { ok: false, error: "license_expired" };
  if (license.quotaUsed >= license.quotaTotal) return { ok: false, error: "quota_exhausted" };
  if (scope && license.scope && license.scope !== scope) return { ok: false, error: "scope_mismatch" };
  if (scope) {
    const scopes = Array.isArray(license.agent.supportedScopes) ? (license.agent.supportedScopes as string[]) : [];
    if (!scopes.includes(scope)) return { ok: false, error: "scope_not_supported" };
  }
  return { ok: true };
}

export async function decrementLicenseQuota(licenseId: string): Promise<void> {
  await prisma.license.update({
    where: { id: licenseId },
    data: { quotaUsed: { increment: 1 } },
  });
}

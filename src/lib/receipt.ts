/**
 * receipt_service - 接收小兰回执、验签、对账、标记合法/异常调用
 * buyandsell.md § Step 7
 */
import { prisma } from "./db";
import { InvocationTokenStatus } from "@prisma/client";
import { decrementLicenseQuota } from "./license";

export type ReceiptReconciliationResult =
  | { valid: true }
  | { valid: false; reason: string };

export async function reconcileReceipt(
  requestId: string,
  licenseId: string,
  agentId: string,
  inputHash: string,
  sellerId: string
): Promise<ReceiptReconciliationResult> {
  const req = await prisma.invocationRequest.findUnique({
    where: { requestId },
    include: { token: true, receipt: true },
  });
  if (!req) return { valid: false, reason: "request_not_found" };
  if (req.licenseId !== licenseId) return { valid: false, reason: "license_mismatch" };
  if (req.agentId !== agentId) return { valid: false, reason: "agent_mismatch" };
  if (req.inputHash !== inputHash) return { valid: false, reason: "input_hash_mismatch" };
  if (req.receipt) return { valid: false, reason: "receipt_already_submitted" };

  const token = req.token;
  if (!token) return { valid: false, reason: "token_not_found" };
  if (token.status !== InvocationTokenStatus.ISSUED) return { valid: false, reason: "token_already_used" };
  if (token.expiresAt < new Date()) return { valid: false, reason: "token_expired" };

  await prisma.$transaction(async (tx) => {
    await tx.invocationToken.update({
      where: { id: token.id },
      data: { status: InvocationTokenStatus.USED },
    });
    await tx.executionReceipt.create({
      data: {
        requestId,
        invocationReqId: req.id,
        licenseId,
        agentId,
        sellerId,
        inputHash,
        status: "SUCCESS",
        finishedAt: new Date(),
      },
    });
  });

  await decrementLicenseQuota(licenseId);
  return { valid: true };
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export type AppSession = {
  userId: string;
  workspaceId: string;
};

export async function requireAppSession(): Promise<AppSession> {
  const clerk = await auth();
  const externalId = clerk.userId ?? process.env.AUTH_DEMO_USER_ID;

  if (!externalId) {
    throw new Error("Authentication is required.");
  }

  const clerkUser = clerk.userId ? await currentUser() : null;
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || undefined;

  const user = await prisma.user.upsert({
    where: { externalId },
    update: { email, name },
    create: {
      externalId,
      email,
      name,
      memberships: {
        create: {
          role: "OWNER",
          workspace: {
            create: { name: name ? `${name}'s Workspace` : "Personal Workspace" }
          }
        }
      }
    },
    include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } }
  });

  const membership = user.memberships[0];
  if (!membership) {
    throw new Error("No workspace is available for this user.");
  }

  return { userId: user.id, workspaceId: membership.workspaceId };
}

export async function assertWorkspaceScanAccess(scanId: string, workspaceId: string) {
  const scan = await prisma.scan.findFirst({
    where: { id: scanId, workspaceId }
  });

  if (!scan) {
    throw new Error("Scan was not found.");
  }

  return scan;
}

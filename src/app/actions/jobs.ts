"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createJob(input: {
  title: string;
  company: string;
  location?: string;
  url?: string;
  description: string;
}) {
  const job = await prisma.job.create({
    data: { ...input, stage: "wishlist" },
  });
  revalidatePath("/");
  return job;
}

export async function moveJob(id: string, stage: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return;
  await prisma.job.update({
    where: { id },
    data: {
      stage,
      // stamp the first time a job reaches "applied"; keep the original date after that
      appliedAt: stage === "applied" && !job.appliedAt ? new Date() : job.appliedAt,
    },
  });
  revalidatePath("/");
}

export async function deleteJob(id: string) {
  await prisma.job.delete({ where: { id } });
  revalidatePath("/");
}

export async function listJobs() {
  return prisma.job.findMany({ orderBy: { createdAt: "desc" } });
}

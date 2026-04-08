import { Router, type IRouter } from "express";
import { eq, sql, gte, lte, and, notInArray } from "drizzle-orm";
import { db, dealsTable, ownersTable } from "@workspace/db";
import {
  GetPipelineSummaryResponse,
  GetDealsByStageResponse,
  GetDealsByOwnerResponse,
  GetClosingSoonDealsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/pipeline/summary", async (req, res): Promise<void> => {
  const deals = await db.select().from(dealsTable);

  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + parseFloat(String(d.value)), 0);
  const wonDeals = deals.filter((d) => d.stage === "closed_won");
  const lostDeals = deals.filter((d) => d.stage === "closed_lost");
  const activeDeals = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage));

  const wonValue = wonDeals.reduce((sum, d) => sum + parseFloat(String(d.value)), 0);
  const lostValue = lostDeals.reduce((sum, d) => sum + parseFloat(String(d.value)), 0);
  const activeValue = activeDeals.reduce((sum, d) => sum + parseFloat(String(d.value)), 0);
  const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? wonDeals.length / closedCount : 0;

  res.json(
    GetPipelineSummaryResponse.parse({
      totalDeals,
      totalValue,
      wonValue,
      lostValue,
      activeDeals: activeDeals.length,
      activeValue,
      avgDealValue,
      winRate,
    })
  );
});

router.get("/pipeline/by-stage", async (req, res): Promise<void> => {
  const deals = await db.select().from(dealsTable);
  const stages = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
  const breakdown = stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      totalValue: stageDeals.reduce((sum, d) => sum + parseFloat(String(d.value)), 0),
    };
  });
  res.json(GetDealsByStageResponse.parse(breakdown));
});

router.get("/pipeline/by-owner", async (req, res): Promise<void> => {
  const result = await db
    .select({
      ownerId: ownersTable.id,
      ownerName: ownersTable.name,
      count: sql<number>`count(${dealsTable.id})::int`,
      totalValue: sql<number>`coalesce(sum(${dealsTable.value}::numeric), 0)`,
    })
    .from(ownersTable)
    .leftJoin(dealsTable, eq(dealsTable.ownerId, ownersTable.id))
    .groupBy(ownersTable.id, ownersTable.name)
    .orderBy(ownersTable.name);

  const coerced = result.map((r) => ({ ...r, totalValue: parseFloat(String(r.totalValue)) }));
  res.json(GetDealsByOwnerResponse.parse(coerced));
});

router.get("/pipeline/closing-soon", async (req, res): Promise<void> => {
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);

  const todayStr = today.toISOString().split("T")[0];
  const futureStr = in30Days.toISOString().split("T")[0];

  const deals = await db
    .select({
      id: dealsTable.id,
      title: dealsTable.title,
      companyName: dealsTable.companyName,
      stage: dealsTable.stage,
      value: dealsTable.value,
      expectedCloseDate: dealsTable.expectedCloseDate,
      ownerId: dealsTable.ownerId,
      ownerName: ownersTable.name,
      notes: dealsTable.notes,
      createdAt: dealsTable.createdAt,
      updatedAt: dealsTable.updatedAt,
    })
    .from(dealsTable)
    .leftJoin(ownersTable, eq(dealsTable.ownerId, ownersTable.id))
    .where(
      and(
        gte(dealsTable.expectedCloseDate, todayStr),
        lte(dealsTable.expectedCloseDate, futureStr),
        notInArray(dealsTable.stage, ["closed_won", "closed_lost"])
      )
    )
    .orderBy(dealsTable.expectedCloseDate);

  const coerced = deals.map((d) => ({ ...d, value: parseFloat(String(d.value)) }));
  res.json(GetClosingSoonDealsResponse.parse(coerced));
});

export default router;

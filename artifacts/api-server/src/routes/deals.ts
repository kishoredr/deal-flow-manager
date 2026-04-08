import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, dealsTable, ownersTable } from "@workspace/db";
import {
  ListDealsResponse,
  ListDealsQueryParams,
  CreateDealBody,
  GetDealParams,
  GetDealResponse,
  UpdateDealParams,
  UpdateDealBody,
  UpdateDealResponse,
  DeleteDealParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const dealsWithOwner = async (conditions: Parameters<typeof db.select>[0] extends undefined ? undefined : any[] = []) => {
  const query = db
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
    .leftJoin(ownersTable, eq(dealsTable.ownerId, ownersTable.id));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
};

router.get("/deals", async (req, res): Promise<void> => {
  const queryParams = ListDealsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const conditions: any[] = [];
  if (queryParams.data.stage) {
    conditions.push(eq(dealsTable.stage, queryParams.data.stage));
  }
  if (queryParams.data.ownerId) {
    conditions.push(eq(dealsTable.ownerId, queryParams.data.ownerId));
  }

  const deals = await dealsWithOwner(conditions);
  const coerced = deals.map((d) => ({ ...d, value: parseFloat(String(d.value)) }));
  res.json(ListDealsResponse.parse(coerced));
});

router.post("/deals", async (req, res): Promise<void> => {
  const parsed = CreateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [deal] = await db.insert(dealsTable).values({
    ...parsed.data,
    value: String(parsed.data.value),
  }).returning();

  const [dealWithOwner] = await dealsWithOwner([eq(dealsTable.id, deal.id)]);
  const coercedNew = { ...dealWithOwner, value: parseFloat(String(dealWithOwner.value)) };
  res.status(201).json(GetDealResponse.parse(coercedNew));
});

router.get("/deals/:id", async (req, res): Promise<void> => {
  const params = GetDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deal] = await dealsWithOwner([eq(dealsTable.id, params.data.id)]);
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  res.json(GetDealResponse.parse({ ...deal, value: parseFloat(String(deal.value)) }));
});

router.patch("/deals/:id", async (req, res): Promise<void> => {
  const params = UpdateDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, any> = { ...parsed.data };
  if (parsed.data.value !== undefined) {
    updateData.value = String(parsed.data.value);
  }

  const [updated] = await db
    .update(dealsTable)
    .set(updateData)
    .where(eq(dealsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  const [dealWithOwner] = await dealsWithOwner([eq(dealsTable.id, updated.id)]);
  res.json(UpdateDealResponse.parse({ ...dealWithOwner, value: parseFloat(String(dealWithOwner.value)) }));
});

router.delete("/deals/:id", async (req, res): Promise<void> => {
  const params = DeleteDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deal] = await db.delete(dealsTable).where(eq(dealsTable.id, params.data.id)).returning();
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

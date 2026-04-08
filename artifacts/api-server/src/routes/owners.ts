import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ownersTable } from "@workspace/db";
import {
  ListOwnersResponse,
  CreateOwnerBody,
  GetOwnerParams,
  GetOwnerResponse,
  UpdateOwnerParams,
  UpdateOwnerBody,
  UpdateOwnerResponse,
  DeleteOwnerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/owners", async (req, res): Promise<void> => {
  const owners = await db.select().from(ownersTable).orderBy(ownersTable.name);
  res.json(ListOwnersResponse.parse(owners));
});

router.post("/owners", async (req, res): Promise<void> => {
  const parsed = CreateOwnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [owner] = await db.insert(ownersTable).values(parsed.data).returning();
  res.status(201).json(GetOwnerResponse.parse(owner));
});

router.get("/owners/:id", async (req, res): Promise<void> => {
  const params = GetOwnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [owner] = await db.select().from(ownersTable).where(eq(ownersTable.id, params.data.id));
  if (!owner) {
    res.status(404).json({ error: "Owner not found" });
    return;
  }
  res.json(GetOwnerResponse.parse(owner));
});

router.patch("/owners/:id", async (req, res): Promise<void> => {
  const params = UpdateOwnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOwnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [owner] = await db
    .update(ownersTable)
    .set(parsed.data)
    .where(eq(ownersTable.id, params.data.id))
    .returning();
  if (!owner) {
    res.status(404).json({ error: "Owner not found" });
    return;
  }
  res.json(UpdateOwnerResponse.parse(owner));
});

router.delete("/owners/:id", async (req, res): Promise<void> => {
  const params = DeleteOwnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [owner] = await db.delete(ownersTable).where(eq(ownersTable.id, params.data.id)).returning();
  if (!owner) {
    res.status(404).json({ error: "Owner not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

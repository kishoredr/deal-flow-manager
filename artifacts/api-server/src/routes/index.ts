import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ownersRouter from "./owners";
import dealsRouter from "./deals";
import pipelineRouter from "./pipeline";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ownersRouter);
router.use(dealsRouter);
router.use(pipelineRouter);

export default router;

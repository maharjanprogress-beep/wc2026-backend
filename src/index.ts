import express from "express";
import cors from "cors";
import predictionsRouter from "./routes/predictions.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get("/api/healthz", (_req, res) => res.json({ ok: true }));
app.use("/api", predictionsRouter);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

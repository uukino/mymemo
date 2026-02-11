import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" })); // 本番は拡張機能のoriginに限定
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

app.get("/memos", async (req, res) => {
  const { url } = req.query;
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("url", url);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/memos", async (req, res) => {
  const { url, text, user_id } = req.body; // 本番はJWTから user_id を取得
  const { data, error } = await supabase
    .from("memos")
    .insert([{ url, text, user_id }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.listen(process.env.PORT || 3001, () => {
  console.log("API running");
});

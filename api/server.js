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
  const { url, q } = req.query;

  let query = supabase.from("memos").select("*");

  if (q && q.trim()) {
    query = query.ilike("text", `%${q.trim()}%`);
  } else if (url && url.trim()) {
    query = query.eq("url", url.trim());
  } else {
    return res.status(400).json({ error: "url or q is required" });
  }

  const { data, error } = await query.order("created_at", { ascending: false });
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

app.post("/users/register", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ message: "name and password are required" });
  }
  const { data, error } = await supabase
    .from("users")
    .insert({ name, password })
    .select()
    .single();
  if (error) return res.status(400).json({ message: "User already exists" });
  res.json({ id: data.id, name: data.name });
});

app.post("/users/login", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ message: "name and password are required" });
  }
  const { data, error } = await supabase
    .from("users")
    .select("id, name")
    .eq("name", name)
    .eq("password", password)
    .single();
  if (error || !data)
    return res.status(401).json({ message: "Invalid credentials" });
  res.json({ id: data.id, name: data.name });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(process.env.PORT || 3001, () => {
  console.log("API running");
});

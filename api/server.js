import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

import path from "path";
import {fileURLToPath} from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// 強制的に標準出力に書き込む
process.stdout.write("=== SERVER SCRIPT STARTED ===\n");
console.log("=== Server Starting ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT || 3001);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "[HIDDEN]" : "undefined",
);

// 一時的にコメントアウト
// if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//   console.error("ERROR: Missing required environment variables!");
//   process.exit(1);
// }

const app = express();
console.log("Express app created");

app.use(cors({ origin: "*" }));
console.log("CORS enabled");

app.use(express.json());
console.log("JSON parser enabled");

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

let supabase;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  console.log("Supabase client created successfully");
} else {
  console.warn(
    "WARNING: Supabase not initialized - environment variables missing",
  );
}

console.log("Registering /health endpoint");
app.get("/health", (_req, res) => {
  console.log("Health check requested");
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    supabaseConnected: !!supabase,
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
});

console.log("Registering /memos endpoints");
app.get("/memos", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  console.log("GET /memos - query:", req.query);
  const { url, q } = req.query;

  let query = supabase.from("memos").select("*");

  if (q && q.trim()) {
    query = query.ilike("text", `%${q.trim()}%`);
  } else if (url && url.trim()) {
    query = query.eq("url", url.trim());
  } else {
    console.log("Missing url or q parameter");
    return res.status(400).json({ error: "url or q is required" });
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("GET /memos error:", error);
    return res.status(500).json({ error: error.message });
  }
  console.log("GET /memos success - count:", data.length);
  res.json(data);
});

app.use(express.static(path.join(dirname)));


console.log("Static path:",path.join(dirname));

app.get("/update.xml", (req, res) => {
  res.sendFile(path.join(dirname, "update.xml"));
});


app.post("/memos", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  console.log("POST /memos - body:", req.body);
  const { url, text, user_id } = req.body;
  const { data, error } = await supabase
    .from("memos")
    .insert([{ url, text, user_id }])
    .select();
  if (error) {
    console.error("POST /memos error:", error);
    return res.status(500).json({ error: error.message });
  }
  console.log("POST /memos success:", data[0]);
  res.json(data[0]);
});

console.log("Registering /users endpoints");
app.post("/users/register", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  console.log("POST /users/register - body:", {
    name: req.body.name,
    password: "***",
  });
  const { name, password } = req.body;
  if (!name || !password) {
    console.log("Missing name or password");
    return res.status(400).json({ message: "name and password are required" });
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .insert({ name, password })
      .select()
      .single();
    if (error) {
      console.error("POST /users/register error:", error);
      return res.status(400).json({ message: "User already exists" });
    }
    console.log("User registered successfully:", {
      id: data.id,
      name: data.name,
    });
    res.json({ id: data.id, name: data.name });
  } catch (err) {
    console.error("Unexpected error in /users/register:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/users/login", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  console.log("POST /users/login - body:", {
    name: req.body.name,
    password: "***",
  });
  const { name, password } = req.body;
  if (!name || !password) {
    console.log("Missing name or password");
    return res.status(400).json({ message: "name and password are required" });
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("name", name)
      .eq("password", password)
      .single();
    if (error || !data) {
      console.error("POST /users/login error:", error);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log("User logged in successfully:", {
      id: data.id,
      name: data.name,
    });
    res.json({ id: data.id, name: data.name });
  } catch (err) {
    console.error("Unexpected error in /users/login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/memos/:id/like", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }
  console.log("POST /memos/:id/like - id:", req.params.id);
  const { id } = req.params;
  const { data, error } = await supabase
    .from("memos")
    .select("good")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Memo not found:", error);
    return res.status(404).json({ message: "Memo not found" });
  }

  const newGood = (data.good || 0) + 1;
  const { error: updateError } = await supabase
    .from("memos")
    .update({ good: newGood })
    .eq("id", id);

  if (updateError) {
    console.error("Failed to update like:", updateError);
    return res.status(500).json({ message: "Failed to update" });
  }

  console.log("Like updated successfully:", { id, good: newGood });
  res.json({ id, good: newGood });
});

const PORT = process.env.PORT || 3001;
console.log("About to start server on port:", PORT);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`=== API Server Running on Port ${PORT} ===`);
  console.log("Server is listening on all network interfaces");
  console.log("Available endpoints:");
  console.log("  GET  /health");
  console.log("  POST /users/register");
  console.log("  POST /users/login");
  console.log("  GET  /memos");
  console.log("  POST /memos");
  console.log("  POST /memos/:id/like");
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

console.log("Script execution completed");
// Update health check
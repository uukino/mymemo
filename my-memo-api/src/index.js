import { createClient } from "@supabase/supabase-js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 環境変数の確認
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500,
      });
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // CORS対応
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    try {
      // GET /health
      if (url.pathname === "/health" && request.method === "GET") {
        return new Response(JSON.stringify({ ok: true }), {
          headers: corsHeaders,
        });
      }

      // GET /memos
      if (url.pathname === "/memos" && request.method === "GET") {
        const urlParam = url.searchParams.get("url");
        const q = url.searchParams.get("q");

        console.log(`GET /memos - url: ${urlParam}, q: ${q}`);

        let query = supabase.from("memos").select("*");
        if (q && q.trim()) {
          query = query.ilike("text", `%${q.trim()}%`);
        } else if (urlParam && urlParam.trim()) {
          query = query.eq("url", urlParam);
        } else {
          return new Response(JSON.stringify({ error: "url or q required" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });
        if (error) {
          console.error("GET /memos error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // POST /memos
      if (url.pathname === "/memos" && request.method === "POST") {
        const { url: memoUrl, text, user_id } = await request.json();
        console.log(
          `POST /memos - url: ${memoUrl}, text: ${text}, user_id: ${user_id}`,
        );

        const { data, error } = await supabase
          .from("memos")
          .insert([{ url: memoUrl, text, user_id }])
          .select();

        if (error) {
          console.error("POST /memos error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify(data[0]), { headers: corsHeaders });
      }

      // POST /users/register
      if (url.pathname === "/users/register" && request.method === "POST") {
        const { name, password } = await request.json();
        console.log(`POST /users/register - name: ${name}`);

        const { data, error } = await supabase
          .from("users")
          .insert([{ name, password }])
          .select()
          .single();

        if (error) {
          console.error("POST /users/register error:", error);
          return new Response(
            JSON.stringify({ message: error.message || "User already exists" }),
            { status: 400, headers: corsHeaders },
          );
        }
        return new Response(JSON.stringify({ id: data.id, name: data.name }), {
          headers: corsHeaders,
        });
      }

      // POST /users/login
      if (url.pathname === "/users/login" && request.method === "POST") {
        const { name, password } = await request.json();
        console.log(`POST /users/login - name: ${name}`);

        const { data, error } = await supabase
          .from("users")
          .select("id, name")
          .eq("name", name)
          .eq("password", password)
          .single();

        if (error) {
          console.error("POST /users/login error:", error);
          return new Response(
            JSON.stringify({ message: "Invalid credentials" }),
            { status: 401, headers: corsHeaders },
          );
        }
        return new Response(JSON.stringify({ id: data.id, name: data.name }), {
          headers: corsHeaders,
        });
      }

      // POST /memos/:id/like
      if (
        url.pathname.match(/^\/memos\/\d+\/like$/) &&
        request.method === "POST"
      ) {
        const id = url.pathname.split("/")[2];
        console.log(`POST /memos/${id}/like`);

        const { data, error } = await supabase
          .from("memos")
          .select("good")
          .eq("id", id)
          .single();

        if (error) {
          console.error(`POST /memos/${id}/like error:`, error);
          return new Response(JSON.stringify({ message: "Memo not found" }), {
            status: 404,
            headers: corsHeaders,
          });
        }

        const newGood = (data.good || 0) + 1;
        await supabase.from("memos").update({ good: newGood }).eq("id", id);

        return new Response(JSON.stringify({ id, good: newGood }), {
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (err) {
      console.error("Unhandled error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

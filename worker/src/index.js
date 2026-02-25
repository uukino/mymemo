import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function corsPreflightResponse() {
  return new Response(null, { headers: CORS_HEADERS });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // データ操作用（service_role: RLSをバイパス）
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // auth操作用（anon key: signIn/signUpに必要）
    const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    try {
      // ヘルスチェック
      if (path === "/health" && request.method === "GET") {
        return json({ ok: true, timestamp: new Date().toISOString() });
      }

      // ── Auth ──────────────────────────────────────────────

      if (path === "/auth/signup" && request.method === "POST") {
        const { email, password, display_name } = await request.json();
        if (!email || !password) {
          return json({ error: "email と password は必須です" }, 400);
        }
        // admin API で作成することでメール確認を不要にする
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: display_name || email },
        });
        if (error) return json({ error: error.message }, 400);
        return json({
          id: data.user.id,
          email: data.user.email,
          display_name: display_name || data.user.email,
        });
      }

      if (path === "/auth/signin" && request.method === "POST") {
        const { email, password } = await request.json();
        if (!email || !password) {
          return json(
            { error: "email と password は必須です" },
            400,
          );
        }
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return json({ error: error.message }, 401);
        const user = data.user;
        return json({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.email,
        });
      }

      if (path === "/auth/signout" && request.method === "POST") {
        await supabaseAuth.auth.signOut();
        return json({ success: true });
      }

      // ── Memos ────────────────────────────────────────────

      if (path === "/memos" && request.method === "GET") {
        const memoUrl = url.searchParams.get("url");
        const q = url.searchParams.get("q");
        const userId = url.searchParams.get("user_id");

        let query = supabase.from("memos").select("*");
        if (userId?.trim()) {
          query = query.eq("user_id", userId.trim());
        } else if (q?.trim()) {
          query = query.ilike("text", `%${q.trim()}%`);
        } else if (memoUrl?.trim()) {
          query = query.eq("url", memoUrl.trim());
        } else {
          return json({ error: "url または q が必要です" }, 400);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });
        if (error) return json({ error: error.message }, 500);
        return json(data);
      }

      if (path === "/memos" && request.method === "POST") {
        const { url: memoUrl, text, user_id } = await request.json();
        const { data, error } = await supabase
          .from("memos")
          .insert([{ url: memoUrl, text, user_id }])
          .select();
        if (error) return json({ error: error.message }, 500);
        return json(data[0]);
      }

      // DELETE /memos/:id
      const memoIdMatch = path.match(/^\/memos\/([^/]+)$/);
      if (memoIdMatch && request.method === "DELETE") {
        const id = memoIdMatch[1];
        const { user_id } = await request.json();
        const { data: memo, error: fetchError } = await supabase
          .from("memos")
          .select("user_id")
          .eq("id", id)
          .single();
        if (fetchError || !memo) return json({ error: "Memo not found" }, 404);
        if (memo.user_id !== user_id) return json({ error: "Unauthorized" }, 403);
        const { error } = await supabase.from("memos").delete().eq("id", id);
        if (error) return json({ error: error.message }, 500);
        return json({ success: true });
      }

      // POST /memos/:id/like
      const likeMatch = path.match(/^\/memos\/([^/]+)\/like$/);
      if (likeMatch && request.method === "POST") {
        const id = likeMatch[1];
        const { data, error } = await supabase
          .from("memos")
          .select("good")
          .eq("id", id)
          .single();
        if (error || !data) return json({ error: "Memo not found" }, 404);
        const newGood = (data.good || 0) + 1;
        const { error: updateError } = await supabase
          .from("memos")
          .update({ good: newGood })
          .eq("id", id);
        if (updateError) return json({ error: "Failed to update" }, 500);
        return json({ id, good: newGood });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  },
};

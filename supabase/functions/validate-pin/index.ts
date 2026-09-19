import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { compare } from "https://deno.land/x/bcrypt/mod.ts";

// Bcrypt hash of the admin PIN (852963)
const PIN_HASH = "$2b$10$FsxBLDy8CzK7oyI2knduVeolYasxrTNHb9VY80nyWId/AijtyW6Um";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const { pin } = await req.json();
    const isValid = await compare(pin, PIN_HASH);
    if (isValid) {
      // No user session is needed; client will treat login as successful.
      return new Response(JSON.stringify({ ok: true, session: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ ok: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

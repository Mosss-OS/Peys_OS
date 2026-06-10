import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { hasPermission, hasAnyPermission, canManageRole, OrgRole, OrgPermission } from "../_shared/rbac.ts";

function getAuthClient(authHeader: string | null) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader ?? "" },
      },
    }
  );
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

async function verifyMembership(
  supabase: ReturnType<typeof getAuthClient>,
  userId: string,
  orgId: string
): Promise<{ role: OrgRole; status: string } | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, status")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return { role: data.role as OrgRole, status: data.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders() });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = getAuthClient(authHeader);
    const serviceClient = getServiceClient();

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.replace("/organizations", "").split("/").filter(Boolean);
    const method = req.method;

    if (pathParts.length === 0) {
      if (method === "GET") {
        const { data } = await supabase
          .from("organization_members")
          .select("organization_id, organizations(*)")
          .eq("user_id", user.id)
          .eq("status", "active");

        return new Response(JSON.stringify({ organizations: data }), {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      if (method === "POST") {
        if (!hasPermission("owner", "org:update")) {
          return new Response(JSON.stringify({ error: "Not authorized to create organizations" }), {
            status: 403,
            headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        const { name, description, website } = body;

        if (!name) {
          return new Response(JSON.stringify({ error: "Organization name required" }), {
            status: 400,
            headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
          });
        }

        const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
        const { data: org, error: orgError } = await serviceClient
          .from("organizations")
          .insert({ name, description, website, slug, owner_id: user.id })
          .select()
          .single();

        if (orgError) throw orgError;

        await serviceClient
          .from("organization_members")
          .insert({
            organization_id: org.id,
            user_id: user.id,
            email: user.email,
            role: "owner",
            status: "active",
            accepted_at: new Date().toISOString(),
          });

        return new Response(JSON.stringify({ organization: org }), {
          status: 201,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }
    }

    const orgId = pathParts[0];
    const membership = await verifyMembership(supabase, user.id, orgId);

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this organization" }), {
        status: 403,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      });
    }

    if (pathParts.length === 1) {
      if (method === "GET") {
        const { data } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", orgId)
          .single();

        return new Response(JSON.stringify({ organization: data, membership }), {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      if (method === "PATCH" && hasPermission(membership.role, "settings:update")) {
        const body = await req.json();
        const { data } = await serviceClient
          .from("organizations")
          .update(body)
          .eq("id", orgId)
          .select()
          .single();

        return new Response(JSON.stringify({ organization: data }), {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && membership.role === "owner") {
        await serviceClient.from("organizations").delete().eq("id", orgId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }
    }

    if (pathParts[1] === "members") {
      if (!hasPermission(membership.role, "team:read")) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      if (method === "GET") {
        const { data } = await supabase
          .from("organization_members")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ members: data }), {
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && hasPermission(membership.role, "team:invite")) {
        const body = await req.json();
        const { email, role } = body;

        await serviceClient
          .from("organization_members")
          .insert({
            organization_id: orgId,
            email,
            role: role || "viewer",
            status: "invited",
            invited_by: user.id,
            invited_at: new Date().toISOString(),
          });

        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        });
      }

      if (pathParts[2]) {
        const memberId = pathParts[2];

        if (method === "DELETE" && hasPermission(membership.role, "team:remove")) {
          const { data: targetMember } = await supabase
            .from("organization_members")
            .select("role")
            .eq("id", memberId)
            .single();

          if (targetMember && canManageRole(membership.role, targetMember.role as OrgRole)) {
            await serviceClient
              .from("organization_members")
              .delete()
              .eq("id", memberId);

            return new Response(JSON.stringify({ success: true }), {
              headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Not authorized to remove this member" }), {
            status: 403,
            headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
          });
        }

        if (method === "PATCH" && hasPermission(membership.role, "team:update_role")) {
          const body = await req.json();
          const { role } = body;

          const { data: targetMember } = await supabase
            .from("organization_members")
            .select("role")
            .eq("id", memberId)
            .single();

          if (targetMember && canManageRole(membership.role, targetMember.role as OrgRole) && canManageRole(membership.role, role)) {
            await serviceClient
              .from("organization_members")
              .update({ role })
              .eq("id", memberId);

            return new Response(JSON.stringify({ success: true }), {
              headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Not authorized to update this member's role" }), {
            status: 403,
            headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Organization API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});

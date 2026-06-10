import { createClient } from "jsr:@supabase/supabase-js@2";

interface AuditLogEntry {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(
  supabaseUrl: string,
  serviceRoleKey: string,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    await supabase.from("audit_logs").insert({
      user_id: entry.user_id || null,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || {},
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export function getClientIp(request: Request): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
}

export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}

export async function auditMiddleware(
  request: Request,
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  await logAuditEvent(supabaseUrl, serviceRoleKey, {
    user_id: userId ?? undefined,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: getClientIp(request),
    user_agent: getUserAgent(request),
    metadata: {
      method: request.method,
      path: new URL(request.url).pathname,
    },
  });
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";

export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  {
    actorId,
    restaurantId,
    action,
    entity,
    entityId,
    metadata = {},
  }: {
    actorId: string | null;
    restaurantId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    metadata?: Json;
  },
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    restaurant_id: restaurantId,
    action,
    entity,
    entity_id: entityId,
    metadata,
  });
}

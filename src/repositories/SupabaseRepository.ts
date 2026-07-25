import { supabase } from "../lib/supabase";

export async function savePlannerData(
  userId: string,
  json: string,
): Promise<void> {
  const { error } = await supabase
    .from("planner_data")
    .upsert(
      {
        user_id: userId,
        data: JSON.parse(json) as unknown,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    throw error;
  }
}

export async function loadPlannerData(
  userId: string,
): Promise<unknown | null> {
  const { data, error } = await supabase
    .from("planner_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data ?? null;
}

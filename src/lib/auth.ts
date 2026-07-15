import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** The authenticated user's id, or null if not signed in. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** For server components: returns the user id or redirects to /login. */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  return userId;
}

/** For API route handlers: returns the user id or null (caller returns 401). */
export async function getApiUserId(): Promise<string | null> {
  return getUserId();
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MatchWithListing } from "@/types";

export function useMatches(status?: string) {
    return useQuery({
        queryKey: ["matches", status],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            let query = supabase
                .from("matches")
                .select(`
          *,
          listing:listings(*)
        `)
                .order("detected_at", { ascending: false });

            if (status && status !== "all") {
                query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as MatchWithListing[];
        },
    });
}

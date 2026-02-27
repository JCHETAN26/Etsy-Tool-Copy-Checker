import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Shop, Listing, Match, ScanLog } from "@/types";

export function useDashboardData() {
    const { data: shop, isLoading: isShopLoading } = useQuery({
        queryKey: ["current-shop"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("shops")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data as Shop;
        },
    });

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ["dashboard-stats", shop?.id],
        enabled: !!shop?.id,
        queryFn: async () => {
            const { count: listingCount } = await supabase
                .from("listings")
                .select("*", { count: "exact", head: true })
                .eq("shop_id", shop!.id);

            const { count: matchCount } = await supabase
                .from("matches")
                .select("*", { count: "exact", head: true })
                .eq("shop_id", shop!.id)
                .eq("status", "new");

            const { count: resolvedCount } = await supabase
                .from("matches")
                .select("*", { count: "exact", head: true })
                .eq("shop_id", shop!.id)
                .eq("status", "resolved");

            return {
                listingCount: listingCount || 0,
                matchCount: matchCount || 0,
                resolvedCount: resolvedCount || 0,
            };
        },
    });

    const { data: recentMatches, isLoading: isMatchesLoading } = useQuery({
        queryKey: ["recent-matches", shop?.id],
        enabled: !!shop?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("matches")
                .select(`
          *,
          listing:listings(*)
        `)
                .eq("shop_id", shop!.id)
                .in("status", ["new", "reviewing"])
                .order("detected_at", { ascending: false })
                .limit(3);

            if (error) throw error;
            return data as any[];
        },
    });

    const { data: scanHistory, isLoading: isHistoryLoading } = useQuery({
        queryKey: ["scan-history", shop?.id],
        enabled: !!shop?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("scan_logs")
                .select("*")
                .eq("shop_id", shop!.id)
                .order("started_at", { ascending: false })
                .limit(5);

            if (error) throw error;
            return data as ScanLog[];
        },
    });

    return {
        shop,
        stats,
        recentMatches,
        scanHistory,
        isLoading: isShopLoading || isStatsLoading || isMatchesLoading || isHistoryLoading,
    };
}

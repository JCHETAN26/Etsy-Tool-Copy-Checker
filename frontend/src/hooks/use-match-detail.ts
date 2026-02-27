import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MatchWithListing } from "@/types";
import { toast } from "sonner";

export function useMatchDetail(id: string | undefined) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["match", id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("matches")
                .select(`
          *,
          listing:listings(*)
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as MatchWithListing;
        },
    });

    const updateStatus = useMutation({
        mutationFn: async (status: string) => {
            if (!id) return;
            const { error } = await supabase
                .from("matches")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: ["match", id] });
            queryClient.invalidateQueries({ queryKey: ["matches"] });
            toast.success(`Match marked as ${status}`);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update match");
        }
    });

    return { ...query, updateStatus };
}

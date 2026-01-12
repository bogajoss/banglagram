import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../database.types";

export type AdminUser = Database["public"]["Tables"]["profiles"]["Row"];

export const ADMIN_USERS_QUERY_KEY = ["admin", "users"];

export const useAdminUsers = (searchQuery: string = "") => {
    return useInfiniteQuery({
        queryKey: [...ADMIN_USERS_QUERY_KEY, searchQuery],
        initialPageParam: 0,
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * 20;
            const to = from + 19;

            let query = supabase
                .from("profiles")
                .select("*")
                .order("updated_at", { ascending: false })
                .range(from, to);

            if (searchQuery) {
                query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as AdminUser[];
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 20 ? allPages.length : undefined;
        },
    });
};

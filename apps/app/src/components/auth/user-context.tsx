"use client";

import { createClient } from "@v1/supabase/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTRPC } from "@/trpc/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

interface UserContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  openSignInDialog: () => void;
  closeSignInDialog: () => void;
  signInDialogOpen: boolean;
  refreshProfile: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery(
    trpc.userProfiles.me.queryOptions(),
  );

  useEffect(() => {
    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries(trpc.userProfiles.me.queryOptions());
    });
    return () => subscription.subscription.unsubscribe();
  }, [queryClient, trpc.userProfiles.me]);

  const openSignInDialog = useCallback(() => setSignInDialogOpen(true), []);
  const closeSignInDialog = useCallback(() => setSignInDialogOpen(false), []);
  const refreshProfile = useCallback(() => {
    queryClient.invalidateQueries(trpc.userProfiles.me.queryOptions());
  }, [queryClient, trpc.userProfiles.me]);

  return (
    <UserContext.Provider
      value={{
        profile: profile ?? null,
        isLoading,
        openSignInDialog,
        closeSignInDialog,
        signInDialogOpen,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

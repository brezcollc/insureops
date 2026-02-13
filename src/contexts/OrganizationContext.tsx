import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  organizationId: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganization = async () => {
    if (!user) {
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id, organizations(*)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data?.organizations) {
        setOrganization(data.organizations as unknown as Organization);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.error("Failed to fetch organization:", err);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchOrganization();
  }, [user?.id]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizationId: organization?.id ?? null,
        isLoading,
        refetch: fetchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

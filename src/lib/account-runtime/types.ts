export type AccountPrincipalProvider = "supabase";

export type AccountPrincipal = {
  accountId: string;
  provider: AccountPrincipalProvider;
};

export type AccountPrincipalRejectedStatus =
  | "anonymous"
  | "invalid"
  | "expired"
  | "revoked"
  | "ambiguous"
  | "unsupported"
  | "unconfigured";

export type AccountPrincipalResult =
  | {
      status: "authenticated";
      principal: AccountPrincipal;
    }
  | {
      status: AccountPrincipalRejectedStatus;
      principal: null;
    };

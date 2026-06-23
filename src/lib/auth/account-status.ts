import {
  readAccountPrincipal,
  type ReadAccountPrincipalOptions,
} from "@/lib/account-runtime/session";

export type AuthAccountStatus =
  | {
      status: "signed_in";
    }
  | {
      status: "signed_out";
    }
  | {
      status: "unavailable";
    };

export async function readAuthAccountStatus(
  options: ReadAccountPrincipalOptions = {}
): Promise<AuthAccountStatus> {
  const principal = await readAccountPrincipal(options);

  if (principal.status === "authenticated") {
    return {
      status: "signed_in",
    };
  }

  if (principal.status === "unconfigured") {
    return {
      status: "unavailable",
    };
  }

  return {
    status: "signed_out",
  };
}

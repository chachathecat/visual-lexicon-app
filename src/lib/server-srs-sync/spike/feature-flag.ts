export const VLX_SERVER_SRS_SYNC_SPIKE_ENABLED = false as const;

export type VlxServerSrsSyncSpikeFeatureFlag = {
  enabled: typeof VLX_SERVER_SRS_SYNC_SPIKE_ENABLED;
  status: "disabled_by_default";
  runtimeIntegrated: false;
};

export function assertServerSrsSyncSpikeDisabledByDefault(
  enabled: boolean = VLX_SERVER_SRS_SYNC_SPIKE_ENABLED
): asserts enabled is false {
  if (enabled !== false) {
    throw new Error("Server SRS sync spike must remain disabled by default.");
  }
}

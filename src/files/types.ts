/** Map of workspace-relative path -> file contents. */
export type SeedFiles = Record<string, string | Uint8Array>;

export interface RecentWorkspace {
  workspaceDir: string;
  displayName: string;
  openedAt: number;
}

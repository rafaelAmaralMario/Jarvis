export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  permissions: string[];
  source?: string;
  valid?: boolean;
  errors?: string[];
}

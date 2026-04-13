import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, type AppConfig } from "@/lib/config/schema";
import { useConfigStore } from "@/stores/config.store";
import { ConfigForm } from "./ConfigForm";
import { ConfigSection } from "./ConfigSection";
import { Input, Button } from "@/components/ui";

export function SettingsPanel() {
  const { config, save, update, loading, unsavedChanges } = useConfigStore();

  const form = useForm<AppConfig>({
    resolver: zodResolver(configSchema),
    defaultValues: config,
  });

  const onSubmit = async (data: AppConfig) => {
    update(data);
    await save();
  };

  return (
    <div className="space-y-6">
      <ConfigForm form={form} onSubmit={onSubmit}>
        <ConfigSection title="Media Paths" description="Configure where your movies and TV shows are located.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Movies Directory</label>
              <Input {...form.register("paths.movies")} placeholder="/path/to/movies" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">TV Shows Directory</label>
              <Input {...form.register("paths.tv")} placeholder="/path/to/tv" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Directory</label>
              <Input {...form.register("paths.output")} placeholder="/path/to/output" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Temporary Directory</label>
              <Input {...form.register("paths.temp")} placeholder="/path/to/temp" />
            </div>
          </div>
        </ConfigSection>

        <ConfigSection title="Google Cloud Integration" description="Configure Gemini AI and Vertex API.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project ID</label>
              <Input {...form.register("google.projectId")} placeholder="your-project-id" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input {...form.register("google.location")} placeholder="us-central1" />
            </div>
          </div>
        </ConfigSection>

        <ConfigSection title="Video Output Settings" description="Configure video resolution and quality.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Width</label>
              <Input type="number" {...form.register("video.targetWidth", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Height</label>
              <Input type="number" {...form.register("video.targetHeight", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FPS</label>
              <Input type="number" {...form.register("video.fps", { valueAsNumber: true })} />
            </div>
          </div>
        </ConfigSection>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          {unsavedChanges && <span className="text-sm text-yellow-500 self-center">Unsaved changes</span>}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </ConfigForm>
    </div>
  );
}

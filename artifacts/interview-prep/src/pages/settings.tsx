import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter", preview: "Aa" },
  { value: "JetBrains Mono", label: "JetBrains Mono", preview: "Aa" },
  { value: "Georgia", label: "Georgia", preview: "Aa" },
  { value: "System", label: "System UI", preview: "Aa" },
];

const FONT_SIZES = [
  { value: "small", label: "Small", size: "text-sm" },
  { value: "medium", label: "Medium", size: "text-base" },
  { value: "large", label: "Large", size: "text-lg" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, desc: "Always light" },
  { value: "dark", label: "Dark", icon: Moon, desc: "Always dark" },
  { value: "system", label: "System", icon: Monitor, desc: "Follows OS" },
];

const AVATARS = ["👨‍💻", "👩‍💻", "🧑‍💻", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "🤖", "🦾", "🐉", "🦊", "🐺", "🦁"];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="py-8">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useTheme();
  const { user, updateUser } = useUser();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "👨‍💻");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateUser({ name, avatar });
      toast({ title: "Profile updated" });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-8 py-4">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Customize your InterviewPrep experience</p>
      </div>

      <div className="max-w-2xl mx-auto px-8">
        {/* Profile */}
        <Section title="Profile" description="Your local identity stored in the browser.">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-sm font-medium">Display name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                data-testid="input-profile-name"
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    data-testid={`avatar-option-${emoji}`}
                    className={cn(
                      "relative h-11 w-11 rounded-xl text-xl flex items-center justify-center border-2 transition-all duration-150",
                      avatar === emoji
                        ? "border-primary bg-primary/10 scale-110 shadow-sm"
                        : "border-border bg-card hover:border-primary/50 hover:scale-105"
                    )}
                  >
                    {emoji}
                    {avatar === emoji && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              data-testid="button-save-profile"
              size="sm"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Section>

        <Separator />

        {/* Theme */}
        <Section title="Appearance" description="Choose how InterviewPrep looks and feels.">
          <div className="space-y-6">
            {/* Theme toggle */}
            <SettingRow
              label="Color theme"
              description="Switch between light, dark, or follow your OS setting."
            >
              <div className="flex gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateSettings({ themeMode: value as "light" | "dark" | "system" })}
                    data-testid={`radio-theme-${value}`}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-xs font-medium transition-all duration-150 min-w-[72px]",
                      settings.themeMode === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </SettingRow>

            <Separator />

            {/* Font family */}
            <SettingRow label="Font family" description="Choose a typeface for the interface.">
              <div className="flex flex-col gap-2">
                {FONT_FAMILIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateSettings({ fontFamily: value })}
                    data-testid={`font-${value}`}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-sm transition-all duration-150 min-w-[180px]",
                      settings.fontFamily === value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                    style={{ fontFamily: value === "System" ? "system-ui" : `'${value}'` }}
                  >
                    <span>{label}</span>
                    {settings.fontFamily === value && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </SettingRow>

            <Separator />

            {/* Font size */}
            <SettingRow label="Font size" description="Controls the base text size across the app.">
              <div className="flex gap-2">
                {FONT_SIZES.map(({ value, label, size }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateSettings({ fontSize: value as "small" | "medium" | "large" })}
                    data-testid={`radio-size-${value}`}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border-2 transition-all duration-150",
                      settings.fontSize === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <span className={cn("font-semibold", size)}>Aa</span>
                    <span className="text-[11px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </SettingRow>
          </div>
        </Section>

        <Separator />

        {/* Storage info */}
        <Section title="Data & Storage" description="All data is stored locally in your browser — nothing leaves your device.">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-emerald-500 text-lg">🔒</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">100% offline & private</p>
              <p className="text-xs text-muted-foreground mt-0.5">Data stored in IndexedDB. Use Import/Export to back up or move to another device.</p>
            </div>
          </div>
        </Section>

        <div className="h-12" />
      </div>
    </div>
  );
}

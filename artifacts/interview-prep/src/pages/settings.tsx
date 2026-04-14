import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Moon, Sun, Monitor, Type, Palette, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FONT_FAMILIES = ["Inter", "JetBrains Mono", "Georgia", "System"];
const AVATARS = ["👨‍💻", "👩‍💻", "🧑‍💻", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "🤖", "🦾", "🐉", "🦊", "🐺", "🦁"];

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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your experience</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                data-testid="input-profile-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    data-testid={`avatar-option-${emoji}`}
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${
                      avatar === emoji
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile} data-testid="button-save-profile">
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Theme mode */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup
                value={settings.themeMode}
                onValueChange={(v) => updateSettings({ themeMode: v as "light" | "dark" | "system" })}
                className="flex gap-4"
              >
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={value} className="flex items-center gap-2">
                    <RadioGroupItem value={value} id={`theme-${value}`} data-testid={`radio-theme-${value}`} />
                    <Label htmlFor={`theme-${value}`} className="flex items-center gap-1.5 cursor-pointer">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Font family */}
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(v) => updateSettings({ fontFamily: v })}
              >
                <SelectTrigger className="w-56" data-testid="select-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font size */}
            <div className="space-y-2">
              <Label>Font Size</Label>
              <RadioGroup
                value={settings.fontSize}
                onValueChange={(v) => updateSettings({ fontSize: v as "small" | "medium" | "large" })}
                className="flex gap-4"
              >
                {["small", "medium", "large"].map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <RadioGroupItem value={size} id={`size-${size}`} data-testid={`radio-size-${size}`} />
                    <Label htmlFor={`size-${size}`} className="capitalize cursor-pointer">{size}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BookOpen } from "lucide-react";

const AVATARS = ["👨‍💻", "👩‍💻", "🧑‍💻", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "🤖", "🦾", "🐉", "🦊", "🐺", "🦁"];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  avatar: z.string().min(1, "Pick an avatar"),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingPage() {
  const { createUser } = useUser();
  const [, setLocation] = useLocation();
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", avatar: "👨‍💻" },
  });

  const selectedAvatar = form.watch("avatar");

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await createUser(values.name, values.avatar);
      setLocation("/");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">InterviewPrep</h1>
          <p className="text-muted-foreground mt-2">Your personal interview knowledge base. Let's get you set up.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-name"
                        placeholder="e.g. Alex Chen"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose an avatar</FormLabel>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          data-testid={`avatar-${emoji}`}
                          onClick={() => field.onChange(emoji)}
                          className={`h-12 w-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                            selectedAvatar === emoji
                              ? "border-primary bg-primary/10 scale-110"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={saving}
                data-testid="button-create-profile"
              >
                {saving ? "Setting up..." : "Start Prepping"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

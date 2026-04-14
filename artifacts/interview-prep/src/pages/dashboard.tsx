import { useEffect, useState } from "react";
import { Link } from "wouter";
import { db } from "@/lib/db";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, FolderOpen, Layers, Clock, ArrowRight, Zap } from "lucide-react";
import type { Question } from "@/lib/db";
import { cn } from "@/lib/utils";

const DIFFICULTY_CONFIG = {
  easy:   { cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20", bar: "bg-emerald-500" },
  medium: { cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",       bar: "bg-amber-500" },
  hard:   { cls: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",               bar: "bg-red-500" },
};

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent: string }) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-card-border shadow-xs">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", accent)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState({ groups: 0, categories: 0, questions: 0, easy: 0, medium: 0, hard: 0 });
  const [recent, setRecent] = useState<Question[]>([]);

  useEffect(() => {
    async function load() {
      const [groups, categories, questions] = await Promise.all([
        db.groups.count(),
        db.categories.count(),
        db.questions.toArray(),
      ]);
      const easy = questions.filter((q) => q.difficulty === "easy").length;
      const medium = questions.filter((q) => q.difficulty === "medium").length;
      const hard = questions.filter((q) => q.difficulty === "hard").length;
      setStats({ groups, categories, questions: questions.length, easy, medium, hard });
      setRecent([...questions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6));
    }
    load();
  }, []);

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? "Good morning" : getHour() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">{greeting}</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {user ? `${user.avatar} ${user.name}` : "Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {stats.questions === 0
                ? "Start adding questions to track your progress."
                : `You have ${stats.questions} question${stats.questions !== 1 ? "s" : ""} across ${stats.groups} group${stats.groups !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <Button asChild data-testid="button-add-question" className="shrink-0">
            <Link href="/questions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-8 pb-10 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Questions" value={stats.questions} icon={BookOpen} accent="bg-primary/10 text-primary" />
          <StatCard label="Groups" value={stats.groups} icon={FolderOpen} accent="bg-violet-500/10 text-violet-500" />
          <StatCard label="Categories" value={stats.categories} icon={Layers} accent="bg-cyan-500/10 text-cyan-500" />
        </div>

        {/* Difficulty breakdown */}
        {stats.questions > 0 && (
          <div className="p-5 rounded-2xl bg-card border border-card-border shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Difficulty Breakdown</h2>
            </div>
            <div className="space-y-3">
              {(["easy", "medium", "hard"] as const).map((d) => {
                const count = stats[d];
                const pct = stats.questions ? Math.round((count / stats.questions) * 100) : 0;
                const cfg = DIFFICULTY_CONFIG[d];
                return (
                  <div key={d} data-testid={`difficulty-${d}`} className="flex items-center gap-3">
                    <div className="w-16 shrink-0">
                      <Badge variant="secondary" className={cn("text-xs capitalize border px-2", cfg.cls)}>{d}</Badge>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs text-muted-foreground font-mono shrink-0">
                      {count} <span className="text-muted-foreground/50">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent questions */}
        <div className="rounded-2xl bg-card border border-card-border shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent Questions</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
              <Link href="/questions">
                View all
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-foreground">No questions yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first question to start building your knowledge base</p>
              <Button asChild size="sm">
                <Link href="/questions/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add First Question
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((q, i) => {
                const cfg = DIFFICULTY_CONFIG[q.difficulty];
                return (
                  <li
                    key={q.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <Link href={`/questions/${q.id}`}>
                      <a className="flex-1 min-w-0 text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {q.title}
                      </a>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px] px-1.5 py-0 bg-muted text-muted-foreground hidden sm:flex">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className={cn("text-[11px] capitalize border px-2 py-0.5", cfg.cls)}>
                        {q.difficulty}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quick actions — only if empty */}
        {stats.questions === 0 && stats.groups === 0 && (
          <div className="p-5 rounded-2xl border-2 border-dashed border-border">
            <p className="text-sm font-semibold mb-3 text-foreground">Quick start</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/groups">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  Create a Group
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/questions/new">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add a Question
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

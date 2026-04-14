import { useEffect, useState } from "react";
import { Link } from "wouter";
import { db } from "@/lib/db";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FolderOpen, BarChart3, Plus, Clock } from "lucide-react";
import type { Question } from "@/lib/db";

const DIFFICULTY_COLOR = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

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
      const sorted = [...questions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
      setRecent(sorted);
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user ? `Welcome back, ${user.name} ${user.avatar}` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">Track your interview preparation progress</p>
        </div>
        <Button asChild data-testid="button-add-question">
          <Link href="/questions/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Questions", value: stats.questions, icon: BookOpen, color: "text-primary" },
          { label: "Groups", value: stats.groups, icon: FolderOpen, color: "text-violet-500" },
          { label: "Categories", value: stats.categories, icon: BarChart3, color: "text-cyan-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Difficulty breakdown */}
      {stats.questions > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Difficulty Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {[
                { label: "Easy", value: stats.easy, pct: stats.questions ? Math.round((stats.easy / stats.questions) * 100) : 0, color: "bg-emerald-500" },
                { label: "Medium", value: stats.medium, pct: stats.questions ? Math.round((stats.medium / stats.questions) * 100) : 0, color: "bg-amber-500" },
                { label: "Hard", value: stats.hard, pct: stats.questions ? Math.round((stats.hard / stats.questions) * 100) : 0, color: "bg-red-500" },
              ].map(({ label, value, pct, color }) => (
                <div key={label} className="flex-1" data-testid={`difficulty-${label.toLowerCase()}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-sm text-muted-foreground">{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            <Clock className="h-4 w-4 inline mr-2" />
            Recently Updated
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/questions">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No questions yet.</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/questions/new">Add your first question</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((q) => (
                <li key={q.id} className="py-3 flex items-center justify-between gap-4">
                  <Link href={`/questions/${q.id}`}>
                    <a className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                      {q.title}
                    </a>
                  </Link>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 capitalize ${DIFFICULTY_COLOR[q.difficulty]}`}
                  >
                    {q.difficulty}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

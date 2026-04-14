import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQuestions, type QuestionFilters } from "@/store/useStore";
import { db } from "@/lib/db";
import type { Group, Category } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Trash2, Pencil, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<("easy" | "medium" | "hard")[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filters: QuestionFilters = {
    search,
    difficulty: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    groupId: selectedGroup || undefined,
    categoryId: selectedCategory || undefined,
  };

  const { questions, total, allTags, totalPages, pageSize, deleteQuestion } = useQuestions(filters, page);

  useEffect(() => {
    db.groups.toArray().then(setGroups);
    db.categories.toArray().then(setCategories);
  }, []);

  const filteredCategories = selectedGroup
    ? categories.filter((c) => c.groupId === selectedGroup)
    : categories;

  const resetFilters = () => {
    setSearch("");
    setSelectedDifficulties([]);
    setSelectedTags([]);
    setSelectedGroup("");
    setSelectedCategory("");
    setPage(1);
  };

  const hasFilters = search || selectedDifficulties.length > 0 || selectedTags.length > 0 || selectedGroup || selectedCategory;

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteQuestion(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteQuestion]);

  const toggleDifficulty = (d: "easy" | "medium" | "hard") => {
    setSelectedDifficulties((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    setPage(1);
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Questions</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} question{total !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild data-testid="button-new-question">
          <Link href="/questions/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Search questions, answers, tags..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        {/* Difficulty filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="filter-difficulty">
              <Filter className="h-4 w-4 mr-2" />
              Difficulty {selectedDifficulties.length > 0 && `(${selectedDifficulties.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by difficulty</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DIFFICULTIES.map((d) => (
              <DropdownMenuCheckboxItem
                key={d}
                checked={selectedDifficulties.includes(d)}
                onCheckedChange={() => toggleDifficulty(d)}
                className="capitalize"
              >
                {d}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="filter-tags">
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto">
              <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allTags.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t}
                  checked={selectedTags.includes(t)}
                  onCheckedChange={() => toggleTag(t)}
                >
                  {t}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Group filter */}
        <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v === "all" ? "" : v); setSelectedCategory(""); setPage(1); }}>
          <SelectTrigger className="w-40" data-testid="filter-group">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        {filteredCategories.length > 0 && (
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-44" data-testid="filter-category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} data-testid="button-reset-filters">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No questions found</p>
          <p className="text-sm mt-1">{hasFilters ? "Try adjusting your filters" : "Add your first question to get started"}</p>
          {!hasFilters && (
            <Button className="mt-4" asChild>
              <Link href="/questions/new">Add Question</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              data-testid={`question-card-${q.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <Link href={`/questions/${q.id}`}>
                  <a className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                    {q.title}
                  </a>
                </Link>
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {q.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {q.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{q.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <Badge
                variant="secondary"
                className={`shrink-0 capitalize text-xs border ${DIFFICULTY_COLORS[q.difficulty]}`}
              >
                {q.difficulty}
              </Badge>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/questions/${q.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(q.id)}
                  data-testid={`button-delete-${q.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

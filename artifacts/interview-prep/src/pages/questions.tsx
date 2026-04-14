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
import {
  Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  Trash2, Pencil, X, BookOpen, ChevronsLeft, ChevronsRight,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const DIFFICULTY_CONFIG = {
  easy:   "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard:   "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<("easy" | "medium" | "hard")[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const { questions, total, allTags, totalPages, deleteQuestion } = useQuestions(filters, page, pageSize);

  useEffect(() => {
    db.groups.toArray().then(setGroups);
    db.categories.toArray().then(setCategories);
  }, []);

  const filteredCategories = selectedGroup ? categories.filter((c) => c.groupId === selectedGroup) : categories;
  const hasFilters = !!(search || selectedDifficulties.length > 0 || selectedTags.length > 0 || selectedGroup || selectedCategory);
  const activeFilterCount =
    (selectedDifficulties.length > 0 ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0) +
    (selectedGroup ? 1 : 0) +
    (selectedCategory ? 1 : 0);

  const resetFilters = () => {
    setSearch(""); setSelectedDifficulties([]); setSelectedTags([]);
    setSelectedGroup(""); setSelectedCategory(""); setPage(1);
  };

  const handleDelete = useCallback(async () => {
    if (deleteId) { await deleteQuestion(deleteId); setDeleteId(null); }
  }, [deleteId, deleteQuestion]);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky header ─────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border shrink-0">
        {/* Title row */}
        <div className="px-8 pt-5 pb-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Questions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total > 0
                ? `${startItem}–${endItem} of ${total} question${total !== 1 ? "s" : ""}${hasFilters ? " (filtered)" : ""}`
                : hasFilters ? "No matches" : "No questions yet"}
            </p>
          </div>
          <Button asChild data-testid="button-new-question" size="sm">
            <Link href="/questions/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Question
            </Link>
          </Button>
        </div>

        {/* Filter bar */}
        <div className="px-8 pb-3 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              data-testid="input-search"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" data-testid="filter-difficulty">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuLabel className="text-xs">Difficulty</DropdownMenuLabel>
              {DIFFICULTIES.map((d) => (
                <DropdownMenuCheckboxItem
                  key={d}
                  checked={selectedDifficulties.includes(d)}
                  onCheckedChange={() => {
                    setSelectedDifficulties((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
                    setPage(1);
                  }}
                  className="capitalize text-sm"
                >
                  {d}
                </DropdownMenuCheckboxItem>
              ))}
              {allTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Tags</DropdownMenuLabel>
                  {allTags.slice(0, 12).map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t}
                      checked={selectedTags.includes(t)}
                      onCheckedChange={() => {
                        setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
                        setPage(1);
                      }}
                      className="text-sm"
                    >
                      #{t}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group */}
          <Select value={selectedGroup || "all"} onValueChange={(v) => { setSelectedGroup(v === "all" ? "" : v); setSelectedCategory(""); setPage(1); }}>
            <SelectTrigger className="w-36 h-9 text-sm" data-testid="filter-group">
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Category */}
          {filteredCategories.length > 0 && (
            <Select value={selectedCategory || "all"} onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-40 h-9 text-sm" data-testid="filter-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={resetFilters} data-testid="button-reset-filters">
              <X className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* ── Scrollable question list ───────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <BookOpen className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-semibold text-foreground">No questions found</p>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5">
              {hasFilters ? "Try adjusting your filters or search term" : "Add your first question to get started"}
            </p>
            {!hasFilters && (
              <Button asChild>
                <Link href="/questions/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Question
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {questions.map((q) => (
              <div
                key={q.id}
                data-testid={`question-card-${q.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/20 transition-all duration-150 group"
              >
                {/* Difficulty indicator dot */}
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  q.difficulty === "easy" ? "bg-emerald-500" :
                  q.difficulty === "medium" ? "bg-amber-500" : "bg-red-500"
                )} />

                {/* Question title */}
                <Link
                  href={`/questions/${q.id}`}
                  className="flex-1 min-w-0 text-[14px] font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 pr-2"
                >
                  {q.title}
                </Link>

                {/* Tags */}
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  {q.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      #{tag}
                    </span>
                  ))}
                  {q.tags.length > 3 && (
                    <span className="text-[11px] text-muted-foreground/70">+{q.tags.length - 3}</span>
                  )}
                </div>

                {/* Difficulty badge */}
                <Badge
                  variant="secondary"
                  className={cn("shrink-0 capitalize text-[11px] border px-2 py-0.5", DIFFICULTY_CONFIG[q.difficulty])}
                >
                  {q.difficulty}
                </Badge>

                {/* Hover actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                    <Link href={`/questions/${q.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
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

        {/* ── Pagination bar ─────────────────────────── */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
            {/* Per-page control */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs" data-testid="select-page-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page info + navigation */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                title="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                data-testid="button-prev-page"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>

      {/* Delete dialog */}
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

import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { db, type Question, type Group, type Category } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash2, Code, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock, InlineCode } from "@/components/CodeBlock";
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
  easy:   { label: "Easy",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" },
  medium: { label: "Medium", cls: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400" },
  hard:   { label: "Hard",   cls: "bg-red-500/10 text-red-600 border-red-500/25 dark:text-red-400" },
};

/** Custom renderers: fenced code blocks → shared CodeBlock component */
const markdownComponents = {
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    const code = String(children ?? "").replace(/\n$/, "");
    if (!lang) {
      return <InlineCode>{children}</InlineCode>;
    }
    return (
      <div className="my-5">
        <CodeBlock code={code} language={lang} />
      </div>
    );
  },
};

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("answer");

  useEffect(() => {
    async function load() {
      const q = await db.questions.get(id);
      if (!q) { setLoading(false); return; }
      setQuestion(q);
      const [cat, grp] = await Promise.all([
        db.categories.get(q.categoryId),
        db.groups.get(q.groupId),
      ]);
      setCategory(cat ?? null);
      setGroup(grp ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!question) return;
    await db.questions.delete(question.id);
    setLocation("/questions");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-8">
        <p className="text-lg font-medium">Question not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/questions">Back to questions</Link>
        </Button>
      </div>
    );
  }

  const diff = DIFFICULTY_CONFIG[question.difficulty];
  const hasCode = question.codeExamples.length > 0;

  return (
    /**
     * Layout: the outer div fills the full height of <main>.
     * Three shrink-0 header bands + one flex-1 scroll area.
     * ALL sticky behaviour is achieved by them being outside the scroll container —
     * no `position: sticky` is needed.
     */
    <div className="flex flex-col h-full">

      {/* ── Band 1: nav bar ─────────────────────────────────── */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm px-8 py-2.5 flex items-center justify-between gap-4 z-10">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/questions">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Questions
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild data-testid="button-edit-question">
            <Link href={`/questions/${question.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:border-destructive/50"
            onClick={() => setDeleteOpen(true)}
            data-testid="button-delete-question"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Band 2: question title + metadata ───────────────── */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm px-8 py-4 z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold leading-snug text-foreground mb-2.5">
            {question.title}
          </h1>
          <div className="flex items-center flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className={cn("capitalize border text-xs px-2.5 py-0.5 font-semibold", diff.cls)}
            >
              {diff.label}
            </Badge>
            {group && (
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                {group.name}
              </Badge>
            )}
            {category && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {category.name}
              </Badge>
            )}
            {question.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-primary/8 text-primary border-primary/20 font-medium"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/*
        Tabs wraps everything below band 2.
        TabsList lives in Band 3 (outside scroll).
        TabsContent lives in the scrollable area.
      */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        {/* ── Band 3: tab switcher ─────────────────────────── */}
        <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm px-8 py-2.5 z-10">
          <div className="max-w-3xl mx-auto">
            <TabsList className="h-9 gap-0.5 bg-muted/70 p-1 rounded-xl border border-border/60">
              <TabsTrigger value="answer" className="rounded-lg text-[13px] px-4 h-7">
                Short Answer
              </TabsTrigger>
              <TabsTrigger value="explanation" className="rounded-lg text-[13px] px-4 h-7">
                Explanation
              </TabsTrigger>
              {hasCode && (
                <TabsTrigger value="code" className="rounded-lg text-[13px] px-4 h-7">
                  <Code className="h-3.5 w-3.5 mr-1.5" />
                  Code ({question.codeExamples.length})
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        {/* ── Scrollable content area ──────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-6">

            {/* Short Answer */}
            <TabsContent value="answer" className="mt-0 focus-visible:outline-none">
              {question.shortAnswer ? (
                <div className="p-5 rounded-xl bg-card border border-border text-[15px] leading-relaxed text-foreground">
                  {question.shortAnswer}
                </div>
              ) : (
                <EmptyState message="No short answer provided." questionId={question.id} />
              )}
            </TabsContent>

            {/* Explanation — Markdown */}
            <TabsContent value="explanation" className="mt-0 focus-visible:outline-none">
              {question.explanation ? (
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="px-6 py-5 prose prose-sm dark:prose-invert max-w-none prose-content
                    prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
                    prose-h2:text-[1.1rem] prose-h2:mt-7 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                    prose-h3:text-[1rem] prose-h3:mt-5 prose-h3:mb-2
                    prose-p:leading-[1.8] prose-p:text-[14.5px] prose-p:text-foreground/90
                    prose-li:text-[14.5px] prose-li:leading-[1.8] prose-li:text-foreground/90
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-hr:border-border
                    prose-blockquote:border-l-primary prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                    prose-table:text-[13.5px]
                  ">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents as Record<string, unknown>}
                    >
                      {question.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <EmptyState message="No detailed explanation provided." questionId={question.id} />
              )}
            </TabsContent>

            {/* Code Examples */}
            {hasCode && (
              <TabsContent value="code" className="mt-0 space-y-4 focus-visible:outline-none">
                {question.codeExamples.map((example) => (
                  <CodeBlock
                    key={example.id}
                    title={example.title}
                    language={example.language}
                    code={example.code}
                  />
                ))}
              </TabsContent>
            )}

            {/* Source link */}
            {question.source && (
              <div className="mt-8 pt-5 border-t border-border">
                <a
                  href={question.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                  data-testid="link-source"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Source / Reference
                </a>
              </div>
            )}

            <div className="h-12" />
          </div>
        </div>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ message, questionId }: { message: string; questionId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-muted-foreground italic mb-3">{message}</p>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/questions/${questionId}/edit`}>Add one</Link>
      </Button>
    </div>
  );
}

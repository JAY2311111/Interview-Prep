import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { db, type Question, type Group, type Category } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Trash2, Code, ExternalLink, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  easy:   { label: "Easy",   cls: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" },
  medium: { label: "Medium", cls: "bg-amber-500/12 text-amber-600 border-amber-500/25 dark:text-amber-400" },
  hard:   { label: "Hard",   cls: "bg-red-500/12 text-red-600 border-red-500/25 dark:text-red-400" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-[11px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground/90 transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ title, language, code }: { title: string; language: string; code: string }) {
  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sidebar-foreground/80">{title || "Code"}</span>
          <span className="px-1.5 py-0.5 rounded bg-sidebar-accent/50 text-sidebar-foreground/50 font-mono text-[10px]">{language}</span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-8">
        <p className="text-lg font-medium">Question not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/questions">Back to questions</Link>
        </Button>
      </div>
    );
  }

  const diff = DIFFICULTY_CONFIG[question.difficulty];

  return (
    <div className="min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-8 py-3 flex items-center justify-between gap-4">
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Title block */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-tight text-foreground mb-4">{question.title}</h1>
          <div className="flex items-center flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={cn("capitalize border text-xs px-2.5 py-0.5 font-medium", diff.cls)}
            >
              {diff.label}
            </Badge>
            {group && (
              <Badge variant="outline" className="text-xs font-medium">
                📁 {group.name}
              </Badge>
            )}
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            )}
            {question.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-primary/8 text-primary border-primary/20">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Tabs */}
        <Tabs defaultValue="answer">
          <TabsList className="mb-6 h-10 gap-0.5 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="answer" className="rounded-lg text-sm">Short Answer</TabsTrigger>
            <TabsTrigger value="explanation" className="rounded-lg text-sm">Explanation</TabsTrigger>
            {question.codeExamples.length > 0 && (
              <TabsTrigger value="code" className="rounded-lg text-sm">
                <Code className="h-3.5 w-3.5 mr-1.5" />
                Code ({question.codeExamples.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Answer tab */}
          <TabsContent value="answer">
            {question.shortAnswer ? (
              <div className="p-5 rounded-xl bg-card border border-border">
                <p className="text-foreground leading-relaxed text-[15px]">{question.shortAnswer}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p className="text-sm italic">No short answer provided.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={`/questions/${question.id}/edit`}>Add one</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Explanation tab */}
          <TabsContent value="explanation">
            {question.explanation ? (
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-content
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                  prose-p:leading-relaxed prose-p:text-[14.5px]
                  prose-li:text-[14.5px] prose-li:leading-relaxed
                  prose-strong:font-semibold
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p className="text-sm italic">No detailed explanation provided.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={`/questions/${question.id}/edit`}>Add one</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Code tab */}
          {question.codeExamples.length > 0 && (
            <TabsContent value="code" className="space-y-4">
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
        </Tabs>

        {/* Source link */}
        {question.source && (
          <div className="mt-8 pt-6 border-t border-border">
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
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

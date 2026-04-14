import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { db, type Question, type Group, type Category } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2, Code, ExternalLink } from "lucide-react";
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

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Question not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/questions">Back to questions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/questions">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{question.title}</h1>
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className={`capitalize ${DIFFICULTY_COLORS[question.difficulty]}`}>
              {question.difficulty}
            </Badge>
            {group && (
              <Badge variant="outline" className="text-xs">
                {group.name}
              </Badge>
            )}
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            )}
            {question.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild data-testid="button-edit-question">
            <Link href={`/questions/${question.id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            data-testid="button-delete-question"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="answer">
        <TabsList>
          <TabsTrigger value="answer">Answer</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
          {question.codeExamples.length > 0 && (
            <TabsTrigger value="code">
              <Code className="h-3.5 w-3.5 mr-1.5" />
              Code ({question.codeExamples.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="answer" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {question.shortAnswer ? (
                <p className="text-foreground leading-relaxed">{question.shortAnswer}</p>
              ) : (
                <p className="text-muted-foreground italic">No short answer provided.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explanation" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {question.explanation ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.explanation}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No detailed explanation provided.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {question.codeExamples.length > 0 && (
          <TabsContent value="code" className="mt-4 space-y-4">
            {question.codeExamples.map((example) => (
              <Card key={example.id}>
                <CardHeader className="py-3 px-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{example.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs font-mono">{example.language}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="overflow-x-auto p-4 text-sm font-mono text-foreground bg-muted/50 rounded-b-lg">
                    <code>{example.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {/* Source */}
      {question.source && (
        <div className="mt-6">
          <a
            href={question.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            data-testid="link-source"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Source / Reference
          </a>
        </div>
      )}

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

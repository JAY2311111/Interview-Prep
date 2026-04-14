import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, type Group, type Category } from "@/lib/db";
import { generateId, now } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Code, Lightbulb, FileText, Link2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const codeExampleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  language: z.string().min(1, "Language is required"),
  code: z.string().min(1, "Code is required"),
});

const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  groupId: z.string().min(1, "Group is required"),
  categoryId: z.string().min(1, "Category is required"),
  shortAnswer: z.string().optional(),
  explanation: z.string().optional(),
  source: z.string().optional(),
  codeExamples: z.array(codeExampleSchema),
  tagsInput: z.string().optional(),
});

type FormValues = z.infer<typeof questionSchema>;

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "go", "rust",
  "c++", "c#", "ruby", "swift", "kotlin", "sql", "bash",
  "html", "css", "json", "yaml", "other",
];

const DIFFICULTY_COLORS = {
  easy:   "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard:   "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
};

function FormSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

export default function QuestionFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"answer" | "explanation" | "code">("answer");
  const isEdit = !!id;

  const form = useForm<FormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      difficulty: "medium",
      groupId: "",
      categoryId: "",
      shortAnswer: "",
      explanation: "",
      source: "",
      codeExamples: [],
      tagsInput: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "codeExamples" });
  const selectedGroup = form.watch("groupId");
  const filteredCategories = allCategories.filter((c) => c.groupId === selectedGroup);

  useEffect(() => {
    db.groups.toArray().then(setGroups);
    db.categories.toArray().then(setAllCategories);
  }, []);

  useEffect(() => {
    if (!id) return;
    db.questions.get(id).then((q) => {
      if (!q) return;
      form.reset({
        title: q.title,
        difficulty: q.difficulty,
        groupId: q.groupId,
        categoryId: q.categoryId,
        shortAnswer: q.shortAnswer ?? "",
        explanation: q.explanation ?? "",
        source: q.source ?? "",
        codeExamples: q.codeExamples,
        tagsInput: q.tags.join(", "),
      });
      setTagsList(q.tags);
    });
  }, [id, form]);

  const parseTags = (input: string) =>
    input.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const tags = parseTags(values.tagsInput ?? "");
      const questionData = {
        title: values.title,
        difficulty: values.difficulty,
        groupId: values.groupId,
        categoryId: values.categoryId,
        shortAnswer: values.shortAnswer || undefined,
        explanation: values.explanation || undefined,
        source: values.source || undefined,
        codeExamples: values.codeExamples,
        tags,
      };
      if (isEdit && id) {
        await db.questions.update(id, { ...questionData, updatedAt: now() });
        setLocation(`/questions/${id}`);
      } else {
        const newId = generateId();
        await db.questions.add({ id: newId, ...questionData, createdAt: now(), updatedAt: now() });
        setLocation(`/questions/${newId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-8 py-3 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href={isEdit && id ? `/questions/${id}` : "/questions"}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {isEdit ? "Back to question" : "Questions"}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLocation(isEdit && id ? `/questions/${id}` : "/questions")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            form="question-form"
            data-testid="button-submit"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Question"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold mb-7">{isEdit ? "Edit Question" : "New Question"}</h1>

        <Form {...form}>
          <form id="question-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* ─ Question basics ─ */}
            <FormSection icon={FileText} title="Question">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Title *</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-title"
                        placeholder="e.g. What is the difference between == and === in JavaScript?"
                        className="text-[15px] h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Difficulty selector — visual buttons */}
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Difficulty *</FormLabel>
                    <div className="flex gap-2">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => field.onChange(d)}
                          data-testid={`difficulty-${d}`}
                          className={cn(
                            "flex-1 py-2 rounded-lg border-2 text-sm font-semibold capitalize transition-all duration-150",
                            field.value === d
                              ? DIFFICULTY_COLORS[d]
                              : "border-border text-muted-foreground hover:border-border/80"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Group *</FormLabel>
                      <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("categoryId", ""); }}>
                        <FormControl>
                          <SelectTrigger data-testid="select-group" className="h-10">
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Category *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!selectedGroup}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category" className="h-10">
                            <SelectValue placeholder={selectedGroup ? "Select category" : "Pick group first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name="tagsInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                      <Tag className="h-3 w-3" />Tags
                    </FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-tags"
                        placeholder="javascript, closures, es6  (comma separated)"
                        className="h-10"
                        {...field}
                        onChange={(e) => { field.onChange(e); setTagsList(parseTags(e.target.value)); }}
                      />
                    </FormControl>
                    {tagsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagsList.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs bg-primary/8 text-primary border-primary/20 px-2">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <Separator />

            {/* ─ Content tabs ─ */}
            <div>
              {/* Tab headers */}
              <div className="flex gap-0.5 mb-4 bg-muted/60 p-1 rounded-xl w-fit">
                {[
                  { id: "answer", label: "Short Answer", icon: Lightbulb },
                  { id: "explanation", label: "Explanation (MD)", icon: FileText },
                  { id: "code", label: `Code (${fields.length})`, icon: Code },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id as typeof activeTab)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      activeTab === id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Short answer */}
              {activeTab === "answer" && (
                <FormField
                  control={form.control}
                  name="shortAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          data-testid="input-short-answer"
                          placeholder="A concise, one-paragraph answer that covers the key points..."
                          rows={5}
                          className="text-[14.5px] leading-relaxed resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Explanation markdown editor */}
              {activeTab === "explanation" && (
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="rounded-xl border border-border overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                            Markdown editor — supports **bold**, *italic*, `code`, headers, lists, tables
                          </div>
                          <Textarea
                            data-testid="input-explanation"
                            placeholder={"## Overview\n\nExplain the concept here...\n\n## Example\n\n```js\n// code example\n```"}
                            rows={14}
                            className="font-mono text-sm leading-relaxed resize-y border-0 rounded-none focus-visible:ring-0 bg-background"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Code examples */}
              {activeTab === "code" && (
                <div className="space-y-4">
                  {fields.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                      <Code className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No code examples yet</p>
                      <p className="text-xs mt-1">Add snippets to illustrate your answer</p>
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <div key={field.id} className="code-block">
                      <div className="code-block-header">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FormField
                            control={form.control}
                            name={`codeExamples.${index}.title`}
                            render={({ field }) => (
                              <FormItem className="flex-1 min-w-0">
                                <FormControl>
                                  <input
                                    placeholder="Example title"
                                    className="bg-transparent outline-none text-sidebar-foreground/80 placeholder:text-sidebar-foreground/30 w-full font-mono text-xs"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`codeExamples.${index}.language`}
                            render={({ field }) => (
                              <FormItem className="shrink-0">
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-6 text-[10px] border-sidebar-border/50 bg-sidebar-accent/30 text-sidebar-foreground/70 px-2 rounded gap-1 w-auto min-w-[80px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {LANGUAGES.map((l) => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="ml-3 text-sidebar-foreground/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`codeExamples.${index}.code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder={"// Your code here..."}
                                rows={8}
                                className="font-mono text-sm leading-loose resize-y border-0 rounded-none bg-transparent text-[hsl(216_28%_88%)] placeholder:text-sidebar-foreground/20 focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="px-4 pb-2 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ id: generateId(), title: "", language: "javascript", code: "" })}
                    data-testid="button-add-code-example"
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Code Example
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Source URL */}
            <FormSection icon={Link2} title="Source / Reference">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        data-testid="input-source"
                        placeholder="https://developer.mozilla.org/..."
                        type="url"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <div className="h-4" />
          </form>
        </Form>
      </div>
    </div>
  );
}

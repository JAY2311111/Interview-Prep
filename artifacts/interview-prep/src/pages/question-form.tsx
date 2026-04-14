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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, X, Code } from "lucide-react";

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

const LANGUAGES = ["javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "swift", "kotlin", "sql", "bash", "html", "css", "other"];

export default function QuestionFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
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
    input
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

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
        await db.questions.add({
          id: newId,
          ...questionData,
          createdAt: now(),
          updatedAt: now(),
        });
        setLocation(`/questions/${newId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/questions">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Question" : "Add Question"}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic info */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Title *</FormLabel>
                <FormControl>
                  <Input data-testid="input-title" placeholder="e.g. What is the difference between == and === in JavaScript?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group *</FormLabel>
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("categoryId", ""); }}>
                    <FormControl>
                      <SelectTrigger data-testid="select-group">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
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
                  <FormLabel>Category *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedGroup}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tagsInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-tags"
                    placeholder="e.g. javascript, closures, es6"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setTagsList(parseTags(e.target.value));
                    }}
                  />
                </FormControl>
                {tagsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tagsList.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shortAnswer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Answer</FormLabel>
                <FormControl>
                  <Textarea
                    data-testid="input-short-answer"
                    placeholder="A concise, one-paragraph answer..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Explanation (Markdown supported)</FormLabel>
                <FormControl>
                  <Textarea
                    data-testid="input-explanation"
                    placeholder="## Deep Dive&#10;&#10;Explain in detail..."
                    rows={8}
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source / Reference URL</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-source"
                    placeholder="https://..."
                    type="url"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Code examples */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                <Code className="h-4 w-4 inline mr-1" />
                Code Examples
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: generateId(), title: "", language: "javascript", code: "" })}
                data-testid="button-add-code-example"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Example
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="py-3 px-4 border-b border-border">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`codeExamples.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Example title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`codeExamples.${index}.language`}
                          render={({ field }) => (
                            <FormItem>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LANGUAGES.map((l) => (
                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <FormField
                      control={form.control}
                      name={`codeExamples.${index}.code`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="// Your code here..."
                              rows={6}
                              className="font-mono text-sm rounded-t-none border-0 border-t-0 resize-y bg-muted/30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={saving} data-testid="button-submit">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Question"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={isEdit && id ? `/questions/${id}` : "/questions"}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

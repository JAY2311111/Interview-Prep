import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGroups } from "@/store/useStore";
import { useCategories } from "@/store/useStore";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, FolderOpen, ChevronDown, Tag } from "lucide-react";
import { useEffect } from "react";
import type { Group, Category } from "@/lib/db";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;
type CategoryForm = z.infer<typeof categorySchema>;

export default function GroupsPage() {
  const { groups, createGroup, updateGroup, deleteGroup } = useGroups();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  // Group dialog
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; editing?: Group }>({ open: false });
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  // Category dialog
  const [catDialog, setCatDialog] = useState<{ open: boolean; groupId?: string; editing?: Category }>({ open: false });
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const groupForm = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "" },
  });

  const catForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    async function loadCounts() {
      const counts: Record<string, number> = {};
      for (const g of groups) {
        counts[g.id] = await db.questions.where("groupId").equals(g.id).count();
      }
      setQuestionCounts(counts);
    }
    loadCounts();
  }, [groups]);

  const openGroupCreate = () => {
    groupForm.reset({ name: "", description: "" });
    setGroupDialog({ open: true });
  };

  const openGroupEdit = (g: Group) => {
    groupForm.reset({ name: g.name, description: g.description ?? "" });
    setGroupDialog({ open: true, editing: g });
  };

  const submitGroup = async (values: GroupForm) => {
    if (groupDialog.editing) {
      await updateGroup(groupDialog.editing.id, values);
    } else {
      await createGroup(values.name, values.description);
    }
    setGroupDialog({ open: false });
  };

  const openCatCreate = (groupId: string) => {
    catForm.reset({ name: "", description: "" });
    setCatDialog({ open: true, groupId });
  };

  const openCatEdit = (cat: Category) => {
    catForm.reset({ name: cat.name, description: cat.description ?? "" });
    setCatDialog({ open: true, editing: cat });
  };

  const submitCategory = async (values: CategoryForm) => {
    if (catDialog.editing) {
      await updateCategory(catDialog.editing.id, values);
    } else if (catDialog.groupId) {
      await createCategory(catDialog.groupId, values.name, values.description);
    }
    setCatDialog({ open: false });
  };

  const getCategoriesForGroup = (groupId: string) =>
    categories.filter((c) => c.groupId === groupId);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Groups & Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize your questions by topic</p>
        </div>
        <Button onClick={openGroupCreate} data-testid="button-add-group">
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No groups yet</p>
          <p className="text-sm mt-1">Create a group like "React" or "JavaScript" to organize your questions</p>
          <Button className="mt-4" onClick={openGroupCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Group
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const groupCategories = getCategoriesForGroup(group.id);
            return (
              <Collapsible key={group.id} defaultOpen>
                <Card data-testid={`group-card-${group.id}`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            {group.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {questionCounts[group.id] ?? 0} Q
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {groupCategories.length} cat
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); openGroupEdit(group); }}
                            data-testid={`button-edit-group-${group.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteGroupId(group.id); }}
                            data-testid={`button-delete-group-${group.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2 mb-3">
                        {groupCategories.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2 pl-1">No categories yet</p>
                        ) : (
                          groupCategories.map((cat) => (
                            <div
                              key={cat.id}
                              data-testid={`category-row-${cat.id}`}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 group"
                            >
                              <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{cat.name}</span>
                                {cat.description && (
                                  <span className="text-xs text-muted-foreground">— {cat.description}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openCatEdit(cat)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteCatId(cat.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCatCreate(group.id)}
                        data-testid={`button-add-category-${group.id}`}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Category
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Group dialog */}
      <Dialog open={groupDialog.open} onOpenChange={(open) => setGroupDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{groupDialog.editing ? "Edit Group" : "Create Group"}</DialogTitle>
          </DialogHeader>
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(submitGroup)} className="space-y-4">
              <FormField
                control={groupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. React, JavaScript, System Design" data-testid="input-group-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={groupForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGroupDialog({ open: false })}>Cancel</Button>
                <Button type="submit" data-testid="button-save-group">
                  {groupDialog.editing ? "Save" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={catDialog.open} onOpenChange={(open) => setCatDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catDialog.editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form onSubmit={catForm.handleSubmit(submitCategory)} className="space-y-4">
              <FormField
                control={catForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hooks, Closures, Promises" data-testid="input-category-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={catForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCatDialog({ open: false })}>Cancel</Button>
                <Button type="submit" data-testid="button-save-category">
                  {catDialog.editing ? "Save" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete group confirm */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all categories and questions in this group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => { if (deleteGroupId) { await deleteGroup(deleteGroupId); setDeleteGroupId(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete category confirm */}
      <AlertDialog open={!!deleteCatId} onOpenChange={(open) => !open && setDeleteCatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all questions in this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => { if (deleteCatId) { await deleteCategory(deleteCatId); setDeleteCatId(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

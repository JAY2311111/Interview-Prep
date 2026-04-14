import { useState, useEffect, useCallback } from "react";
import { db, type User, type Group, type Category, type Question, type AppSettings } from "@/lib/db";
import { generateId, now } from "@/lib/utils";

export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    db.users.toArray().then((users) => {
      setUser(users[0] ?? null);
    });
  }, []);

  const createUser = useCallback(async (name: string, avatar: string) => {
    const newUser: User = {
      id: generateId(),
      name,
      avatar,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.users.add(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const updateUser = useCallback(async (updates: Partial<Omit<User, "id" | "createdAt">>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: now() };
    await db.users.put(updated);
    setUser(updated);
    return updated;
  }, [user]);

  return { user, createUser, updateUser };
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);

  const load = useCallback(async () => {
    const all = await db.groups.orderBy("createdAt").toArray();
    setGroups(all);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createGroup = useCallback(async (name: string, description?: string) => {
    const group: Group = {
      id: generateId(),
      name,
      description,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.groups.add(group);
    await load();
    return group;
  }, [load]);

  const updateGroup = useCallback(async (id: string, updates: Partial<Omit<Group, "id" | "createdAt">>) => {
    await db.groups.update(id, { ...updates, updatedAt: now() });
    await load();
  }, [load]);

  const deleteGroup = useCallback(async (id: string) => {
    // Cascade: delete categories and questions
    const cats = await db.categories.where("groupId").equals(id).toArray();
    const catIds = cats.map((c) => c.id);
    await db.questions.where("groupId").equals(id).delete();
    for (const cid of catIds) {
      await db.categories.delete(cid);
    }
    await db.groups.delete(id);
    await load();
  }, [load]);

  return { groups, createGroup, updateGroup, deleteGroup, reload: load };
}

export function useCategories(groupId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);

  const load = useCallback(async () => {
    let query = db.categories.orderBy("createdAt");
    const all = await query.toArray();
    setCategories(groupId ? all.filter((c) => c.groupId === groupId) : all);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const createCategory = useCallback(async (groupId: string, name: string, description?: string) => {
    const cat: Category = {
      id: generateId(),
      groupId,
      name,
      description,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.categories.add(cat);
    await load();
    return cat;
  }, [load]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Omit<Category, "id" | "groupId" | "createdAt">>) => {
    await db.categories.update(id, { ...updates, updatedAt: now() });
    await load();
  }, [load]);

  const deleteCategory = useCallback(async (id: string) => {
    // Cascade: delete questions
    await db.questions.where("categoryId").equals(id).delete();
    await db.categories.delete(id);
    await load();
  }, [load]);

  return { categories, createCategory, updateCategory, deleteCategory, reload: load };
}

export interface QuestionFilters {
  search?: string;
  difficulty?: ("easy" | "medium" | "hard")[];
  tags?: string[];
  groupId?: string;
  categoryId?: string;
}

const PAGE_SIZE = 20;

export function useQuestions(filters: QuestionFilters = {}, page = 1) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);

  const load = useCallback(async () => {
    let all = await db.questions.orderBy("createdAt").reverse().toArray();

    // Collect all tags
    const tagSet = new Set<string>();
    all.forEach((q) => q.tags.forEach((t) => tagSet.add(t)));
    setAllTags(Array.from(tagSet).sort());

    // Filter by group
    if (filters.groupId) {
      all = all.filter((q) => q.groupId === filters.groupId);
    }

    // Filter by category
    if (filters.categoryId) {
      all = all.filter((q) => q.categoryId === filters.categoryId);
    }

    // Filter by difficulty
    if (filters.difficulty && filters.difficulty.length > 0) {
      all = all.filter((q) => filters.difficulty!.includes(q.difficulty));
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      all = all.filter((q) => filters.tags!.every((t) => q.tags.includes(t)));
    }

    // Full-text search
    if (filters.search && filters.search.trim()) {
      const term = filters.search.toLowerCase();
      all = all.filter(
        (q) =>
          q.title.toLowerCase().includes(term) ||
          (q.shortAnswer?.toLowerCase().includes(term)) ||
          q.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    setTotal(all.length);
    const start = (page - 1) * PAGE_SIZE;
    setQuestions(all.slice(start, start + PAGE_SIZE));
  }, [filters.search, filters.difficulty, filters.tags, filters.groupId, filters.categoryId, page]);

  useEffect(() => { load(); }, [load]);

  const createQuestion = useCallback(async (data: Omit<Question, "id" | "createdAt" | "updatedAt">) => {
    const q: Question = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    await db.questions.add(q);
    await load();
    return q;
  }, [load]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<Omit<Question, "id" | "createdAt">>) => {
    await db.questions.update(id, { ...updates, updatedAt: now() });
    await load();
  }, [load]);

  const deleteQuestion = useCallback(async (id: string) => {
    await db.questions.delete(id);
    await load();
  }, [load]);

  const getQuestion = useCallback(async (id: string) => {
    return db.questions.get(id);
  }, []);

  return {
    questions,
    total,
    allTags,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestion,
    reload: load,
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    id: "settings",
    themeMode: "system",
    fontFamily: "Inter",
    fontSize: "medium",
  });

  useEffect(() => {
    db.settings.get("settings").then((s) => {
      if (s) setSettings(s);
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Omit<AppSettings, "id">>) => {
    const updated = { ...settings, ...updates };
    await db.settings.put(updated);
    setSettings(updated);
  }, [settings]);

  return { settings, updateSettings };
}

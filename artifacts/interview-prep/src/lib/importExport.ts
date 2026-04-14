import { db, type User, type Group, type Category, type Question } from "@/lib/db";
import { generateId, now } from "@/lib/utils";

export interface ExportData {
  version: number;
  exportedAt: number;
  user: User | null;
  groups: Group[];
  categories: Category[];
  questions: Question[];
}

export async function exportData(): Promise<ExportData> {
  const [users, groups, categories, questions] = await Promise.all([
    db.users.toArray(),
    db.groups.toArray(),
    db.categories.toArray(),
    db.questions.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    user: users[0] ?? null,
    groups,
    categories,
    questions,
  };
}

export function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateImportData(raw: unknown): raw is ExportData {
  if (!raw || typeof raw !== "object") return false;
  const data = raw as Record<string, unknown>;
  if (typeof data.version !== "number") return false;
  if (!Array.isArray(data.groups)) return false;
  if (!Array.isArray(data.categories)) return false;
  if (!Array.isArray(data.questions)) return false;
  return true;
}

export async function importData(data: ExportData, mode: "merge" | "replace") {
  if (mode === "replace") {
    await db.groups.clear();
    await db.categories.clear();
    await db.questions.clear();
  }

  // Re-id to avoid conflicts on merge
  const groupIdMap = new Map<string, string>();
  const categoryIdMap = new Map<string, string>();

  for (const g of data.groups) {
    if (mode === "merge") {
      const existing = await db.groups.where("name").equals(g.name).first();
      if (existing) {
        groupIdMap.set(g.id, existing.id);
        continue;
      }
    }
    const newId = generateId();
    groupIdMap.set(g.id, newId);
    await db.groups.put({ ...g, id: newId });
  }

  for (const c of data.categories) {
    const mappedGroupId = groupIdMap.get(c.groupId) ?? c.groupId;
    if (mode === "merge") {
      const existing = await db.categories
        .where("groupId")
        .equals(mappedGroupId)
        .filter((cat) => cat.name === c.name)
        .first();
      if (existing) {
        categoryIdMap.set(c.id, existing.id);
        continue;
      }
    }
    const newId = generateId();
    categoryIdMap.set(c.id, newId);
    await db.categories.put({ ...c, id: newId, groupId: mappedGroupId });
  }

  for (const q of data.questions) {
    const mappedCategoryId = categoryIdMap.get(q.categoryId) ?? q.categoryId;
    const mappedGroupId = groupIdMap.get(q.groupId) ?? q.groupId;
    if (mode === "merge") {
      const existing = await db.questions
        .where("categoryId")
        .equals(mappedCategoryId)
        .filter((ques) => ques.title === q.title)
        .first();
      if (existing) continue;
    }
    const newId = generateId();
    await db.questions.put({
      ...q,
      id: newId,
      categoryId: mappedCategoryId,
      groupId: mappedGroupId,
      codeExamples: (q.codeExamples ?? []).map((ce) => ({ ...ce, id: generateId() })),
    });
  }

  // Import user if replace mode
  if (mode === "replace" && data.user) {
    await db.users.clear();
    await db.users.add({ ...data.user, id: generateId(), updatedAt: now() });
  }
}

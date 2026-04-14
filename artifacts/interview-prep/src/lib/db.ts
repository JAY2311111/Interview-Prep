import Dexie, { type Table } from "dexie";

export interface User {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CodeExample {
  id: string;
  title: string;
  language: string;
  code: string;
}

export interface Question {
  id: string;
  categoryId: string;
  groupId: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  shortAnswer?: string;
  explanation?: string;
  codeExamples: CodeExample[];
  source?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  id: string;
  themeMode: "light" | "dark" | "system";
  fontFamily: string;
  fontSize: "small" | "medium" | "large";
}

export class InterviewPrepDB extends Dexie {
  users!: Table<User>;
  groups!: Table<Group>;
  categories!: Table<Category>;
  questions!: Table<Question>;
  settings!: Table<AppSettings>;

  constructor() {
    super("InterviewPrepDB");
    this.version(1).stores({
      users: "id, name, createdAt",
      groups: "id, name, createdAt",
      categories: "id, groupId, name, createdAt",
      questions: "id, categoryId, groupId, title, difficulty, createdAt, *tags",
      settings: "id",
    });
  }
}

export const db = new InterviewPrepDB();

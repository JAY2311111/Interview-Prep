import { createContext, useContext, useEffect, useState } from "react";
import { db, type User } from "@/lib/db";
import { generateId, now } from "@/lib/utils";

interface UserContextType {
  user: User | null | undefined;
  createUser: (name: string, avatar: string) => Promise<User>;
  updateUser: (updates: Partial<Omit<User, "id" | "createdAt">>) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: undefined,
  createUser: async () => ({ id: "", name: "", avatar: "", createdAt: 0, updatedAt: 0 }),
  updateUser: async () => {},
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    db.users.toArray().then((users) => {
      setUser(users[0] ?? null);
      setIsLoading(false);
    });
  }, []);

  const createUser = async (name: string, avatar: string): Promise<User> => {
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
  };

  const updateUser = async (updates: Partial<Omit<User, "id" | "createdAt">>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: now() };
    await db.users.put(updated);
    setUser(updated);
  };

  return (
    <UserContext.Provider value={{ user, createUser, updateUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

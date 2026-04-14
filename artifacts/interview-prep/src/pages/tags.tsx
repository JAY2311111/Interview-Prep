import { useState, useEffect } from "react";
import { Link } from "wouter";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

interface TagInfo {
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([]);

  useEffect(() => {
    async function load() {
      const questions = await db.questions.toArray();
      const map = new Map<string, number>();
      questions.forEach((q) => {
        q.tags.forEach((t) => {
          map.set(t, (map.get(t) ?? 0) + 1);
        });
      });
      const sorted = Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      setTags(sorted);
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-muted-foreground text-sm mt-1">{tags.length} unique tags across all questions</p>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No tags yet</p>
          <p className="text-sm mt-1">Tags are added when you create questions</p>
          <Button className="mt-4" asChild>
            <Link href="/questions/new">Add a Question</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(({ name, count }) => (
            <Link key={name} href={`/questions?tag=${encodeURIComponent(name)}`}>
              <a
                data-testid={`tag-${name}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{name}</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  {count}
                </Badge>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

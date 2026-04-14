import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-all duration-150",
        copied
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-[hsl(216_22%_55%)] hover:text-[hsl(216_22%_80%)] hover:bg-white/5"
      )}
      title="Copy code"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export function CodeBlock({ code, language = "plaintext", title, className }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!codeRef.current) return;
    codeRef.current.removeAttribute("data-highlighted");
    const lang = hljs.getLanguage(language) ? language : "plaintext";
    try {
      const result = hljs.highlight(code, { language: lang });
      codeRef.current.innerHTML = result.value;
    } catch {
      codeRef.current.textContent = code;
    }
  }, [code, language]);

  return (
    <div className={cn("rounded-xl overflow-hidden border border-[hsl(226_40%_18%)]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[hsl(226_44%_10%)] border-b border-[hsl(226_40%_17%)]">
        <div className="flex items-center gap-2 min-w-0">
          {/* Window dots */}
          <div className="flex gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(0_70%_55%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(38_80%_50%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(140_65%_45%)]" />
          </div>
          {title && (
            <span className="text-[12px] font-medium text-[hsl(216_22%_65%)] truncate ml-1">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {language && language !== "plaintext" && (
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[hsl(240_60%_65%)] bg-[hsl(240_40%_18%)] px-2 py-0.5 rounded">
              {language}
            </span>
          )}
          <CopyButton text={code} />
        </div>
      </div>
      {/* Code body */}
      <div className="bg-[hsl(226_44%_8%)] overflow-x-auto">
        <pre data-code-block className="p-5 text-[13px] leading-[1.8] font-mono m-0">
          <code ref={codeRef} className={`language-${language} hljs`} />
        </pre>
      </div>
    </div>
  );
}

/** Inline code element for Markdown */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-[hsl(240_30%_14%)] text-[hsl(240_80%_72%)] font-mono text-[0.82em] border border-[hsl(240_30%_22%)]">
      {children}
    </code>
  );
}

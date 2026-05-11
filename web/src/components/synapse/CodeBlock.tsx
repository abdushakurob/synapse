import React, { useMemo } from "react";
import Prism from "prismjs";

// Load languages we use in docs/landing.
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";

type SupportedLanguage = "typescript" | "javascript" | "json" | "bash";

export function CodeBlock({
  code,
  title,
  language,
}: {
  code: string;
  title: string;
  language: SupportedLanguage;
}) {
  const html = useMemo(() => {
    const grammar = Prism.languages[language] ?? Prism.languages.plain;
    return Prism.highlight(code, grammar, language);
  }, [code, language]);

  return (
    <div className="panel overflow-hidden mt-6 mb-12">
      <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{language}</span>
      </div>
      <pre className="syn-code overflow-x-auto p-6 font-mono text-[13.5px] leading-7 md:p-8">
        <code
          className={`language-${language}`}
          // Code strings are authored in-repo (not user input).
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}


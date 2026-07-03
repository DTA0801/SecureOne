"use client";

import { Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { DrawioEmbed } from "./DrawioEmbed";

function drawioTitleFromPath(assetPath: string): string {
  return (assetPath.split("/").pop() ?? "diagram").replace(/\.drawio$/i, "").replace(/-/g, " ");
}

function isDrawioCodeBlock(children: React.ReactNode): boolean {
  const child = Children.toArray(children)[0];
  if (!isValidElement<{ className?: string }>(child)) return false;
  return child.props.className?.includes("language-drawio") ?? false;
}

export function ConfluenceMarkdown({ content }: { content: string }) {
  return (
    <article className="confluence-prose min-w-0 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("/api/confluence/assets/")) {
              return (
                <a
                  href={href}
                  className="text-brand hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  {children}
                </a>
              );
            }
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="text-brand hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                className="text-brand hover:underline"
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-ui">
              <table className="w-full min-w-[480px] border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-ui bg-ui-elevated px-3 py-2 text-left font-semibold text-ui">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-ui px-3 py-2 align-top text-soft">{children}</td>
          ),
          pre: ({ children }) => {
            if (isDrawioCodeBlock(children)) return <>{children}</>;
            return (
              <pre className="my-4 overflow-x-auto rounded-lg border border-ui bg-black/5 p-4 text-sm dark:bg-white/5">
                {children}
              </pre>
            );
          },
          code: ({ className, children }) => {
            if (className?.includes("language-drawio")) {
              const assetPath = String(children).replace(/\n$/, "").trim();
              return <DrawioEmbed assetPath={assetPath} title={drawioTitleFromPath(assetPath)} />;
            }
            const inline = !className;
            if (inline) {
              return (
                <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

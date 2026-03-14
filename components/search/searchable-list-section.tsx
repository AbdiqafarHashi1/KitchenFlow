"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchableListSectionProps = {
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function SearchableListSection({
  placeholder = "Search...",
  className,
  emptyMessage = "No matching records.",
  children,
}: SearchableListSectionProps) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const { filteredChildren, searchableCount, matchedCount } = useMemo(() => {
    if (!normalized) {
      return {
        filteredChildren: children,
        searchableCount: countSearchableNodes(children),
        matchedCount: countSearchableNodes(children),
      };
    }

    return {
      filteredChildren: filterBySearch(children, normalized),
      searchableCount: countSearchableNodes(children),
      matchedCount: countMatches(children, normalized),
    };
  }, [children, normalized]);

  return (
    <div className={cn("space-y-3", className)}>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <div>{filteredChildren}</div>
      {normalized && searchableCount > 0 && matchedCount === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : null}
    </div>
  );
}

function filterBySearch(node: React.ReactNode, query: string): React.ReactNode {
  if (node === null || node === undefined || typeof node === "boolean") return null;
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node)) return node.map((child) => filterBySearch(child, query)).filter(Boolean);
  if (!React.isValidElement(node)) return node;

  const searchText = getSearchText(node);
  if (typeof searchText === "string") {
    return searchText.toLowerCase().includes(query) ? node : null;
  }

  const childNodes = node.props.children;
  if (!childNodes) return node;

  const filtered = filterBySearch(childNodes, query);
  return React.cloneElement(node, { ...node.props, children: filtered });
}

function countSearchableNodes(node: React.ReactNode): number {
  if (!node) return 0;
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + countSearchableNodes(child), 0);
  if (!React.isValidElement(node)) return 0;

  const searchText = getSearchText(node);
  if (typeof searchText === "string") return 1;

  return countSearchableNodes(node.props.children);
}

function countMatches(node: React.ReactNode, query: string): number {
  if (!node) return 0;
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + countMatches(child, query), 0);
  if (!React.isValidElement(node)) return 0;

  const searchText = getSearchText(node);
  if (typeof searchText === "string") {
    return searchText.toLowerCase().includes(query) ? 1 : 0;
  }

  return countMatches(node.props.children, query);
}

function getSearchText(node: React.ReactElement): string | undefined {
  const props = node.props as { [key: string]: unknown };
  return typeof props["data-search-text"] === "string" ? (props["data-search-text"] as string) : undefined;
}

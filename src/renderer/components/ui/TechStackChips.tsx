import { cn } from "../../lib/cn";

const HIGHLIGHT = new Set(["react", "typescript", "next.js", "node.js", "graphql"]);

export interface TechStackChipsProps {
  technologies: string[];
  max?: number;
  className?: string;
}

export function TechStackChips({ technologies, max, className }: TechStackChipsProps) {
  if (!technologies.length) {
    return <span className="text-xs text-gray-400">–</span>;
  }

  const visible = max ? technologies.slice(0, max) : technologies;
  const overflow = max ? Math.max(0, technologies.length - max) : 0;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visible.map((tech) => (
        <span
          key={tech}
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
            HIGHLIGHT.has(tech.toLowerCase())
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {tech}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center px-1 py-0.5 text-xs text-gray-400">
          +{overflow}
        </span>
      )}
    </div>
  );
}

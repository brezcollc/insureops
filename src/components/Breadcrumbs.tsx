import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

import { Badge } from '@/components/ui/badge';

export interface Props {
  title: string;
  hint?: string;
}

export default function JSONHelper({ title, hint }: Props) {
  return (
    <div className="flex items-start gap-2 text-xs text-purple-200/80">
      <Badge variant="outline" className="border-purple-500/30 text-purple-200 bg-transparent">JSON</Badge>
      <div>
        <div className="font-medium text-purple-100">{title}</div>
        {hint ? <div className="text-purple-300/80">{hint}</div> : null}
      </div>
    </div>
  );
}

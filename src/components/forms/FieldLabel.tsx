import { Label } from '@/components/ui/label';

interface FieldLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean;
}

export function FieldLabel({ children, required, className, ...props }: FieldLabelProps) {
  return (
    <Label className={`relative inline-block ${className || ''}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-0.5 absolute -top-0.5 -right-2.5">*</span>}
    </Label>
  );
}

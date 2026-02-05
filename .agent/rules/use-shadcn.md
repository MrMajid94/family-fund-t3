# UI Component Rules

## MANDATORY: Use shadcn/ui Components Only

**All UI elements in this project MUST use shadcn/ui components.** Do not use:
- Inline styles (`style={{}}`)
- Raw HTML elements for UI (buttons, inputs, cards, etc.)
- Other UI libraries (Material UI, Chakra, Ant Design, etc.)

---

## Available shadcn Components

Use these components from `@/components/ui/`:

### Layout & Containers
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Dialog`, `Sheet`, `Drawer`
- `Separator`, `ScrollArea`

### Forms & Inputs
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`
- `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`
- `Button`, `Toggle`, `Switch`
- `Calendar`, `DatePicker`

### Feedback
- `Alert`, `AlertDialog`
- `Toast`, `Sonner`
- `Progress`, `Skeleton`
- `Badge`, `Avatar`

### Navigation
- `Tabs`, `NavigationMenu`
- `Breadcrumb`, `Pagination`
- `DropdownMenu`, `ContextMenu`

### Data Display
- `Table`, `DataTable`
- `Accordion`, `Collapsible`
- `Tooltip`, `Popover`, `HoverCard`

---

## Example: Correct Usage

```tsx
// ✅ CORRECT - Using shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-xl font-bold">تسجيل الدخول</h1>
      </CardHeader>
      <CardContent>
        <Input placeholder="رقم الهاتف" />
        <Button className="w-full mt-4">دخول</Button>
      </CardContent>
    </Card>
  );
}
```

```tsx
// ❌ WRONG - Using inline styles
export function LoginForm() {
  return (
    <div style={{ padding: "2rem", backgroundColor: "#fff" }}>
      <input style={{ padding: "1rem" }} />
      <button style={{ background: "green" }}>دخول</button>
    </div>
  );
}
```

---

## Installing New Components

If a component is needed but not installed:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button card input form
```

---

## Styling with Tailwind

- Use Tailwind CSS classes for customization
- Use `cn()` utility for conditional classes
- Follow RTL guidelines in `shadcn-rtl.md`

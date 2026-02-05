# shadcn/ui RTL Implementation Guide

When using shadcn components in this project, **always follow these RTL guidelines**.

Reference: https://ui.shadcn.com/docs/rtl

---

## Configuration

Ensure `rtl: true` is set in `components.json`:

```json
{
  "rtl": true
}
```

---

## Class Transformations

Use **logical positioning classes** instead of physical ones:

| ❌ Physical (Don't Use) | ✅ Logical (Use This) |
|------------------------|----------------------|
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `slide-in-from-right` | `slide-in-from-end` |
| `slide-in-from-left` | `slide-in-from-start` |

---

## Portal Elements (Important!)

For components with portals (Popover, Tooltip, Dialog, etc.), **always pass `dir="rtl"`**:

```tsx
<Popover>
  <PopoverTrigger>فتح</PopoverTrigger>
  <PopoverContent dir="rtl">
    <div>المحتوى</div>
  </PopoverContent>
</Popover>
```

```tsx
<Tooltip>
  <TooltipTrigger>فتح</TooltipTrigger>
  <TooltipContent dir="rtl">
    <div>المحتوى</div>
  </TooltipContent>
</Tooltip>
```

---

## Icon Flipping

Directional icons must use `rtl:rotate-180` class:

```tsx
<ArrowRightIcon className="rtl:rotate-180" />
<ChevronLeftIcon className="rtl:rotate-180" />
<ChevronRightIcon className="rtl:rotate-180" />
```

---

## Components Requiring Manual RTL Support

These components need special attention:
- **Calendar** - See: https://ui.shadcn.com/docs/components/radix/calendar#rtl-support
- **Pagination** - See: https://ui.shadcn.com/docs/components/radix/pagination#rtl-support  
- **Sidebar** - See: https://ui.shadcn.com/docs/components/radix/sidebar#rtl-support

---

## DirectionProvider

Add the `direction` component and wrap the app with `DirectionProvider`:

```bash
pnpm dlx shadcn@latest add direction
```

---

## Migrating Existing Components

Run the RTL migration command:

```bash
pnpm dlx shadcn@latest migrate rtl [path]
```

If no path is provided, it migrates all files in the `ui` directory.

---

## Font Recommendations

Use fonts with proper Arabic support:
- **Noto Arabic** (pairs well with Inter/Geist)
- **Cairo**
- **Tajawal**

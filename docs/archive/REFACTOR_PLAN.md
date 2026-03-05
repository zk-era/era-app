# Phase 1 Refactor Plan: Foundation & Design System

## Industry Standards We're Following:
1. **Tailwind v4 CSS-first approach** - Design tokens as CSS variables
2. **Three-tier token system** - Primitive → Semantic → Component
3. **Shadcn/Radix pattern** - Composable primitives with full ownership
4. **Atomic design methodology** - Atoms → Molecules → Organisms

---

## 📐 Step 1: Design Tokens (30 mins)

### File: `tailwind.config.ts`
Extend with semantic color tokens following industry naming:

```typescript
colors: {
  // Brand
  era: {
    primary: '#ffffff',
    secondary: '#7b7b7b',
    tertiary: '#555555',
  },
  
  // Backgrounds (semantic naming)
  background: {
    DEFAULT: '#0a0a0a',
    secondary: '#1a1a1a',
    tertiary: '#2a2a2a',
    elevated: '#333333',
  },
  
  // Borders
  border: {
    DEFAULT: '#303030',
    hover: '#505050',
    active: '#606060',
  },
  
  // Status colors (keep existing)
  // accent, green-500, etc.
}

borderRadius: {
  // Standardize all border radius
  'era-sm': '0.5rem',   // 8px
  'era-md': '0.75rem',  // 12px  
  'era-lg': '1rem',     // 16px (our current rounded-2xl)
  'era-xl': '1.5rem',   // 24px
}
```

**Migration**: Replace all hardcoded colors:
- `bg-[#1a1a1a]` → `bg-background-secondary`
- `text-[#7b7b7b]` → `text-era-secondary`
- `border-[#303030]` → `border-border`
- `rounded-2xl` → `rounded-era-lg`

---

## 🔧 Step 2: Consolidate Formatting Utils (15 mins)

### Move to: `lib/utils/format.ts`
All existing formatters are good, just add the missing one:

```typescript
/**
 * Format number with commas for readability
 * Example: 1234567.89 → "1,234,567.89"
 */
export function formatWithCommas(value: string): string {
  if (!value) return "0";
  const parts = value.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
```

**Remove** duplicate from `AmountStep.tsx`

---

## 🧱 Step 3: UI Primitives Folder Structure

Following **shadcn/ui** pattern (industry standard):

```
components/
├── ui/                        # Atomic primitives (shadcn pattern)
│   ├── button.tsx            # All button variants
│   ├── container.tsx         # Reusable containers
│   ├── input.tsx             # Input field component
│   └── avatar.tsx            # Avatar with blockie support
├── shared/                    # Composed molecules
│   ├── SendHeader.tsx        # Shared header for all send steps
│   ├── RecipientChip.tsx     # Recipient display with blockie
│   └── StepContainer.tsx     # Wrapper for all steps
└── send/                      # Feature-specific organisms
    ├── AddressStep.tsx
    ├── TokenStep.tsx
    ├── AmountStep.tsx
    └── ConfirmStep.tsx
```

---

## 🎨 Step 4: Button Primitive (shadcn-inspired)

### File: `components/ui/button.tsx`

```typescript
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-era-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-white/90",
        secondary: "bg-background-secondary hover:bg-background-tertiary",
        ghost: "hover:bg-background-secondary",
        icon: "rounded-lg p-1 hover:bg-background-secondary",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-3 text-sm",
        lg: "px-6 py-4 text-base",
        icon: "size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Usage:**
```tsx
<Button variant="primary" size="lg">Confirm</Button>
<Button variant="icon"><X /></Button>
```

---

## 📦 Step 5: Container Primitive

### File: `components/ui/container.tsx`

```typescript
import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva(
  "flex items-center",
  {
    variants: {
      bg: {
        primary: "bg-background",
        secondary: "bg-background-secondary",
        tertiary: "bg-background-tertiary",
      },
      padding: {
        none: "",
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-6 py-4",
      },
      rounded: {
        md: "rounded-era-md",
        lg: "rounded-era-lg",
        xl: "rounded-era-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      bg: "secondary",
      padding: "md",
      rounded: "lg",
    },
  }
);

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, bg, padding, rounded, ...props }, ref) => {
    return (
      <div
        className={cn(containerVariants({ bg, padding, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

export { Container, containerVariants };
```

---

## 🎯 Step 6: SendHeader Component

### File: `components/shared/SendHeader.tsx`

```typescript
"use client";

import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SendHeaderProps {
  onBack?: () => void;
  onClose?: () => void;
  backHref?: string;
  closeHref?: string;
}

export function SendHeader({ 
  onBack, 
  onClose,
  backHref = "/",
  closeHref = "/",
}: SendHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {onBack ? (
        <Button variant="icon" onClick={onBack}>
          <ChevronLeft className="size-5 text-era-secondary" />
        </Button>
      ) : (
        <Link href={backHref}>
          <Button variant="icon">
            <ChevronLeft className="size-5 text-era-secondary" />
          </Button>
        </Link>
      )}
      
      <h1 className="text-lg font-bold">Send</h1>
      
      {onClose ? (
        <Button variant="icon" onClick={onClose}>
          <X className="size-5 text-era-secondary" />
        </Button>
      ) : (
        <Link href={closeHref}>
          <Button variant="icon">
            <X className="size-5 text-era-secondary" />
          </Button>
        </Link>
      )}
    </div>
  );
}
```

**Usage:**
```tsx
// Phase 1 (AddressStep) - links
<SendHeader backHref="/" closeHref="/" />

// Phase 2-4 - callbacks
<SendHeader onBack={handleBack} onClose={handleClose} />
```

---

## 👤 Step 7: RecipientChip Component

### File: `components/shared/RecipientChip.tsx`

```typescript
"use client";

import makeBlockie from "ethereum-blockies-base64";
import { Container } from "@/components/ui/container";

interface RecipientChipProps {
  address: string;           // For blockie generation
  displayName: string;       // ENS or truncated address
  size?: "sm" | "md" | "lg";
}

export function RecipientChip({ 
  address, 
  displayName, 
  size = "md" 
}: RecipientChipProps) {
  const blockie = makeBlockie(address);
  
  const avatarSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];
  
  return (
    <Container 
      bg="tertiary" 
      padding="sm"
      rounded="full"
      className="gap-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={blockie}
        alt=""
        width={avatarSize}
        height={avatarSize}
        className="rounded-full"
      />
      <span className="truncate text-sm font-medium text-white/70">
        {displayName}
      </span>
    </Container>
  );
}
```

**Usage:**
```tsx
<RecipientChip 
  address={recipientAddress} 
  displayName={truncatedRecipient}
  size="md"
/>
```

---

## 🚀 Implementation Order:

### ✅ **Today - Foundation (2-3 hours)**
1. ✅ Update `tailwind.config.ts` with design tokens
2. ✅ Move `formatWithCommas` to `lib/utils/format.ts`
3. ✅ Install `class-variance-authority` (for button variants)
4. ✅ Create `components/ui/button.tsx`
5. ✅ Create `components/ui/container.tsx`

### ✅ **Tomorrow - Shared Components (1-2 hours)**
6. ✅ Create `components/shared/SendHeader.tsx`
7. ✅ Create `components/shared/RecipientChip.tsx`

### ✅ **Day 3 - Migration (2-3 hours)**
8. ✅ Migrate `AddressStep.tsx` to use new components
9. ✅ Migrate `TokenStep.tsx`
10. ✅ Migrate `AmountStep.tsx`
11. ✅ Migrate `ConfirmStep.tsx`

### ✅ **Day 4 - Testing & Cleanup (1 hour)**
12. ✅ Test entire send flow end-to-end
13. ✅ Remove old inline code
14. ✅ Verify all colors/spacing consistent
15. ✅ Update any remaining hardcoded values

---

## 📊 Success Metrics:

**Before:**
- 450+ lines of duplicated code
- 80+ hardcoded color values
- 40+ hardcoded border-radius values
- No reusable primitives

**After:**
- ~150 lines in reusable components
- 0 hardcoded colors (all tokens)
- 0 hardcoded border-radius
- 5+ reusable primitives

**Developer Experience:**
- New step component: 50 lines → 20 lines
- Button styling: 8-line className → 2 props
- Color change: 1 token update → updates everywhere

---

## 🔄 Future Phases (After Phase 1):

**Phase 2: State Management**
- Add Zustand for send flow
- Extract validation hooks
- Create error boundaries

**Phase 3: Quality**
- Unit tests for utils
- Integration tests for flow
- Accessibility audit

**Phase 4: Polish**
- Storybook setup
- Performance optimization
- Analytics integration

---

Ready to start? Let's begin with Step 1: Design Tokens! 🚀

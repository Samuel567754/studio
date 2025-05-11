import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 transition-all duration-300 ease-in-out", // Added transition
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border [&>svg]:text-foreground",
        destructive:
          "border-transparent text-[hsl(var(--alert-destructive-fg-raw))] bg-gradient-to-br from-[hsl(var(--alert-destructive-bg-start-raw))] to-[hsl(var(--alert-destructive-bg-end-raw))] [&>svg]:text-[hsl(var(--alert-destructive-icon-color-raw))]",
        success:
          "border-transparent text-[hsl(var(--alert-success-fg-raw))] bg-gradient-to-br from-[hsl(var(--alert-success-bg-start-raw))] to-[hsl(var(--alert-success-bg-end-raw))] [&>svg]:text-[hsl(var(--alert-success-icon-color-raw))]",
        info:
          "border-transparent text-[hsl(var(--alert-info-fg-raw))] bg-gradient-to-br from-[hsl(var(--alert-info-bg-start-raw))] to-[hsl(var(--alert-info-bg-end-raw))] [&>svg]:text-[hsl(var(--alert-info-icon-color-raw))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed whitespace-normal break-words", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

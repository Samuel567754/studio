"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full border-l-4", // Added border-l-4 base style
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground border-l-[hsl(var(--muted-foreground))]", // Specific left border for default
        destructive:
          "destructive group border-transparent bg-[hsl(var(--toast-destructive-bg))] text-[hsl(var(--toast-destructive-fg))] border-l-[hsl(var(--toast-destructive-border-l))]",
        success:
          "success group border-transparent bg-[hsl(var(--toast-success-bg))] text-[hsl(var(--toast-success-fg))] border-l-[hsl(var(--toast-success-border-l))]",
        info:
          "info group border-transparent bg-[hsl(var(--toast-info-bg))] text-[hsl(var(--toast-info-fg))] border-l-[hsl(var(--toast-info-border-l))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Destructive variant: ensure text and borders are visible on the destructive toast background
      "group-[.destructive]:border-[hsl(var(--toast-destructive-fg))]/40 group-[.destructive]:hover:border-[hsl(var(--toast-destructive-fg))]/30 group-[.destructive]:hover:bg-[hsl(var(--toast-destructive-fg))]/10 group-[.destructive]:text-[hsl(var(--toast-destructive-fg))] group-[.destructive]:focus:ring-[hsl(var(--toast-destructive-fg))]",
      // Success variant: ensure text and borders are visible on the success toast background
      "group-[.success]:border-[hsl(var(--toast-success-fg))]/40 group-[.success]:hover:border-[hsl(var(--toast-success-fg))]/30 group-[.success]:hover:bg-[hsl(var(--toast-success-fg))]/10 group-[.success]:text-[hsl(var(--toast-success-fg))] group-[.success]:focus:ring-[hsl(var(--toast-success-fg))]",
      // Info variant: ensure text and borders are visible on the info toast background
      "group-[.info]:border-[hsl(var(--toast-info-fg))]/40 group-[.info]:hover:border-[hsl(var(--toast-info-fg))]/30 group-[.info]:hover:bg-[hsl(var(--toast-info-fg))]/10 group-[.info]:text-[hsl(var(--toast-info-fg))] group-[.info]:focus:ring-[hsl(var(--toast-info-fg))]",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      // Destructive variant: ensure icon is visible on the destructive toast background
      "group-[.destructive]:text-[hsl(var(--toast-destructive-fg))]/70 group-[.destructive]:hover:text-[hsl(var(--toast-destructive-fg))] group-[.destructive]:focus:ring-[hsl(var(--toast-destructive-fg))] group-[.destructive]:focus:ring-offset-[hsl(var(--toast-destructive-bg))]",
      // Success variant: ensure icon is visible on the success toast background
      "group-[.success]:text-[hsl(var(--toast-success-fg))]/70 group-[.success]:hover:text-[hsl(var(--toast-success-fg))] group-[.success]:focus:ring-[hsl(var(--toast-success-fg))] group-[.success]:focus:ring-offset-[hsl(var(--toast-success-bg))]",
      // Info variant: ensure icon is visible on the info toast background
      "group-[.info]:text-[hsl(var(--toast-info-fg))]/70 group-[.info]:hover:text-[hsl(var(--toast-info-fg))] group-[.info]:focus:ring-[hsl(var(--toast-info-fg))] group-[.info]:focus:ring-offset-[hsl(var(--toast-info-bg))]",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

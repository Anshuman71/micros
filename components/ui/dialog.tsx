"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within Dialog")
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open: open ?? false, onOpenChange: onOpenChange ?? (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export function DialogTrigger({ children, asChild, ...props }: DialogTriggerProps) {
  const { onOpenChange } = useDialog()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        onOpenChange(true)
        children.props.onClick?.(e)
      },
    } as any)
  }

  return (
    <button {...props} onClick={() => onOpenChange(true)}>
      {children}
    </button>
  )
}

interface DialogPortalProps {
  children: React.ReactNode
}

export function DialogPortal({ children }: DialogPortalProps) {
  const { open } = useDialog()

  if (!open) return null

  return <>{children}</>
}

interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  const { onOpenChange } = useDialog()

  return (
    <div className={cn("fixed inset-0 z-50 bg-black/50", className)} onClick={() => onOpenChange(false)} {...props} />
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn("bg-card rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto", className)}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn("sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between", className)}
      {...props}
    />
  )
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn("text-2xl font-bold text-foreground", className)} {...props} />
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn("text-sm text-foreground/60", className)} {...props} />
}

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DialogClose({ className, children, ...props }: DialogCloseProps) {
  const { onOpenChange } = useDialog()

  return (
    <button
      className={cn("text-foreground/60 hover:text-foreground transition-colors", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children || (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}

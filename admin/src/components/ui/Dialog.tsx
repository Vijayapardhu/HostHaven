import * as React from "react"
import { X } from "lucide-react"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export interface DialogContentProps {
  children?: React.ReactNode
  className?: string
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  return (
    <div className={`bg-white rounded-xl shadow-xl max-h-[80vh] overflow-y-auto ${className}`}>
      {children}
    </div>
  )
}

export interface DialogHeaderProps {
  children?: React.ReactNode
  className?: string
}

export function DialogHeader({ children, className = "" }: DialogHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 border-b ${className}`}>
      {children}
    </div>
  )
}

export interface DialogTitleProps {
  children?: React.ReactNode
  className?: string
}

export function DialogTitle({ children, className = "" }: DialogTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>
  )
}

export interface DialogCloseProps {
  onClick?: () => void
}

export function DialogClose({ onClick }: DialogCloseProps) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-lg hover:bg-slate-100"
    >
      <X className="w-5 h-5 text-slate-500" />
    </button>
  )
}

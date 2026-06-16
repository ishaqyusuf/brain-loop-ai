import * as React from "react"

import { cn } from "@/lib/utils"

function Form({ ...props }: React.ComponentProps<"form">) {
  return <form data-slot="form" {...props} />
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-item"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function FormControl({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-control"
      className={cn("min-w-0", className)}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-message"
      className={cn("text-sm text-destructive", className)}
      {...props}
    />
  )
}

export { Form, FormControl, FormDescription, FormItem, FormMessage }

"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-[28px] group-[.toaster]:p-6 group-[.toaster]:gap-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-base",
          actionButton: "group-[.toast]:bg-[#FFC30D] group-[.toast]:text-black group-[.toast]:rounded-full group-[.toast]:px-6 group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-full",
          title: "group-[.toast]:text-lg group-[.toast]:font-semibold",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-6 text-[#FFC30D]" />,
        info: <InfoIcon className="size-6 text-[#FFC30D]" />,
        warning: <TriangleAlertIcon className="size-6 text-[#FFC30D]" />,
        error: <OctagonXIcon className="size-6 text-red-500" />,
        loading: <Loader2Icon className="size-6 animate-spin text-[#FFC30D]" />,
      }}
      {...props}
    />
  )
}

export { Toaster }

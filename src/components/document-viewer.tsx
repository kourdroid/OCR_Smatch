'use client'

import { useMemo } from 'react'
import { FileText, Image as ImageIcon } from 'lucide-react'

export default function DocumentViewer({ url, type }: { url?: string; type?: string }) {
  const kind = useMemo(() => {
    const t = (type || '').toLowerCase()
    if (t.includes('pdf')) return 'pdf'
    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('webp')) return 'image'
    return 'unknown'
  }, [type])

  if (!url) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    )
  }

  if (kind === 'pdf') {
    return (
      <object data={url} type="application/pdf" className="w-full h-full">
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground">Open PDF</a>
      </object>
    )
  }

  if (kind === 'image') {
    return (
      <div className="p-4">
        <img src={url} alt="Document" className="w-full h-auto rounded-md" />
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center text-center">
      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">Preview not supported</p>
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 text-sm underline">Open Original</a>
    </div>
  )
}

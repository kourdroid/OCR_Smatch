'use client'

import { useMemo, useState, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Document } from '@/types/document'
import { SchemaValidationResult } from '@/types/document-schema'
import { documentSchemaService } from '@/lib/document-schema'

export default function DocumentReviewForm({ document }: { document: Document }) {
  const id = useId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    documentNumber: document.documentNumber || '',
    amount: document.amount || 0,
    currency: document.currency || '',
    supplier: document.supplier || '',
    channel: document.channel || '',
    fileType: document.fileType || '',
  })

  const status = document.status

  const validation = useMemo(() => {
    try {
      return documentSchemaService.validateDocument(document.payload || {}, document.type)
    } catch {
      return { missingRequired: [], invalidFields: [], isValid: true, score: 0 } as SchemaValidationResult
    }
  }, [document.payload, document.type])

  const flagged = useMemo(() => {
    const set = new Set<string>([
      ...((validation?.missingRequired as string[]) || []),
      ...((validation?.invalidFields as string[]) || []),
    ])
    return set
  }, [validation])

  const disabled = status === 'extracted'

  const update = (key: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const onApprove = async () => {
    setIsSubmitting(true)
    const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (!url) {
      toast.error('Webhook not configured')
      setIsSubmitting(false)
      return
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_document',
          id: document.id,
          updates: form,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Document updated')
    } catch {
      toast.error('Update failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClass = (name: string) =>
    `bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#FFC30D] ${flagged.has(name) ? 'border-amber-500 focus-visible:ring-amber-500' : ''
    }`

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Review & Edit</h3>
        {flagged.size > 0 && (
          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 bg-amber-50">
            {flagged.size} issues
          </Badge>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={disabled ? undefined : `${id}-documentNumber`} className="text-gray-700">Document Number</Label>
          {disabled ? (
            <p className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">{form.documentNumber || '—'}</p>
          ) : (
            <Input id={`${id}-documentNumber`} value={form.documentNumber} onChange={(e) => update('documentNumber', e.target.value)} className={fieldClass('document_number')} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={disabled ? undefined : `${id}-amount`} className="text-gray-700">Amount</Label>
            {disabled ? (
              <p className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">{form.amount || 0}</p>
            ) : (
              <Input id={`${id}-amount`} type="number" step="0.01" value={form.amount} onChange={(e) => update('amount', Number(e.target.value))} className={fieldClass('amount')} />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={disabled ? undefined : `${id}-currency`} className="text-gray-700">Currency</Label>
            {disabled ? (
              <p className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 uppercase">{form.currency || '—'}</p>
            ) : (
              <Input id={`${id}-currency`} value={form.currency} onChange={(e) => update('currency', e.target.value)} className={fieldClass('currency')} />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={disabled ? undefined : `${id}-supplier`} className="text-gray-700">Supplier</Label>
          {disabled ? (
            <p className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">{form.supplier || '—'}</p>
          ) : (
            <Input id={`${id}-supplier`} value={form.supplier} onChange={(e) => update('supplier', e.target.value)} className={fieldClass('supplier')} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label id={`${id}-channel-label`} className="text-gray-700">Channel</Label>
            <p aria-labelledby={`${id}-channel-label`} className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 capitalize">{form.channel || '—'}</p>
          </div>
          <div className="space-y-2">
            <Label id={`${id}-filetype-label`} className="text-gray-700">File Type</Label>
            <p aria-labelledby={`${id}-filetype-label`} className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 uppercase">{form.fileType || '—'}</p>
          </div>
        </div>
      </div>

      {status === 'needs review' && (
        <div className="pt-4">
          <Button
            className="w-full bg-[#FFC30D] text-black hover:bg-[#E6B00C] font-medium rounded-full h-11"
            onClick={onApprove}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve & Save
          </Button>
        </div>
      )}
    </div>
  )
}

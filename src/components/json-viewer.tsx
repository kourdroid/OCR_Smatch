/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

type NodePath = string

function typeOf(value: any): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'unknown' {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'object') return 'object'
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'unknown'
}

function summarize(value: any): string {
  const t = typeOf(value)
  if (t === 'array') return `${value.length} items`
  if (t === 'object') return `${Object.keys(value).length} keys`
  if (t === 'string') return `${value.length} chars`
  if (t === 'number' || t === 'boolean' || t === 'null') return String(value)
  return ''
}

function KeyBadge({ label }: { label: string }) {
  return <Badge variant="outline" className="text-xs">{label}</Badge>
}

function TypeBadge({ value }: { value: any }) {
  const t = typeOf(value)
  const variant = t === 'object' || t === 'array' ? 'secondary' : 'default'
  return <Badge variant={variant as any} className="text-xs uppercase">{t}</Badge>
}

function ValueCell({ value }: { value: any }) {
  const t = typeOf(value)
  if (t === 'string') return <span className="text-xs break-words">{value}</span>
  if (t === 'number' || t === 'boolean') return <span className="text-xs text-muted-foreground">{String(value)}</span>
  if (t === 'null') return <span className="text-xs text-muted-foreground">null</span>
  return <span className="text-xs text-muted-foreground">{summarize(value)}</span>
}

const isExpandable = (v: any) => ['object', 'array'].includes(typeOf(v))

interface JSONNodeProps {
  value: any
  path: NodePath
  label: string
  depth?: number
  expanded: Record<NodePath, boolean>
  onToggle: (path: NodePath, open: boolean) => void
  visibleCount: Record<NodePath, number>
  onShowMore: (path: NodePath, total: number) => void
}

// JSONNode is defined outside JSONViewer to prevent re-creation on every render,
// which causes full DOM subtree unmounting/remounting.
const JSONNode = ({ value, path, label, depth = 0, expanded, onToggle, visibleCount, onShowMore }: JSONNodeProps) => {
  const t = typeOf(value)
  const indent = depth * 16
  const isOpen = !!expanded[path]
  const showCount = visibleCount[path] ?? 25

  if (!isExpandable(value)) {
    return (
      <div className="flex items-center gap-3 py-2" style={{ paddingLeft: indent }}>
        <KeyBadge label={label} />
        <TypeBadge value={value} />
        <ValueCell value={value} />
      </div>
    )
  }

  const entries = t === 'object' ? Object.entries(value) : value.map((v: any, idx: number) => [String(idx), v])
  const total = entries.length

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => onToggle(path, open)}
    >
      <div className="space-y-2" style={{ paddingLeft: indent }}>
        <div className="flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {isOpen ? 'Collapse' : 'Expand'}
            </Button>
          </CollapsibleTrigger>
          <KeyBadge label={label} />
          <TypeBadge value={value} />
          <span className="text-xs text-muted-foreground">{summarize(value)}</span>
        </div>
        <CollapsibleContent>
          <div className="mt-2 border-l pl-3 space-y-1">
            {entries.slice(0, showCount).map(([k, v]: [string, any]) => (
              <JSONNode
                key={k}
                value={v}
                path={`${path}.${k}`}
                label={k}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                visibleCount={visibleCount}
                onShowMore={onShowMore}
              />
            ))}
            {total > showCount && (
              <div className="pt-2">
                <Button size="sm" variant="ghost" onClick={() => onShowMore(path, total)}>Show more</Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function JSONViewer({ data }: { data: any }) {
  const [expanded, setExpanded] = useState<Record<NodePath, boolean>>({})
  const [visibleCount, setVisibleCount] = useState<Record<NodePath, number>>({})
  const [query, setQuery] = useState('')
  const [selectedPath, setSelectedPath] = useState<NodePath>('')

  const toggle = (path: NodePath, open: boolean) => {
    setExpanded(prev => ({ ...prev, [path]: open }))
    if (open) setSelectedPath(path)
  }

  const showMore = (path: NodePath, total: number) => {
    const current = visibleCount[path] ?? 25
    const next = Math.min(current + 25, total)
    setVisibleCount(prev => ({ ...prev, [path]: next }))
  }


  const PathBar = useMemo(() => {
    if (!selectedPath) return null
    const parts = selectedPath.split('.')
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>{p}</span>
            {i < parts.length - 1 && <span className="text-muted-foreground">›</span>}
          </span>
        ))}
      </div>
    )
  }, [selectedPath])

  const rootPath = 'root'

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search keys" className="max-w-sm" />
          {PathBar}
        </div>
        <div className="space-y-2">
          <JSONNode
            value={data}
            path={rootPath}
            label={typeOf(data) === 'array' ? 'Array' : 'Object'}
            expanded={expanded}
            onToggle={toggle}
            visibleCount={visibleCount}
            onShowMore={showMore}
          />
        </div>
      </CardContent>
    </Card>
  )
}

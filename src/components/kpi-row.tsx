'use client'

import { FileText, Zap, Clock, TrendingUp } from 'lucide-react'
import { KPIData } from '@/types/document'
import { formatProcessingTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface KPIRowProps {
  data: KPIData
}

export function KPIRow({ data }: KPIRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Documents Today */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Documents Today
          </CardTitle>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.documentsToday}</div>
          <Badge variant="secondary" className="mt-2 text-green-600 bg-green-50 dark:bg-green-900/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12% from yesterday
          </Badge>
        </CardContent>
      </Card>

      {/* Automatic Extraction Rate */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Automatic Extraction Rate
          </CardTitle>
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.extractionRate}%</div>
          <Badge variant="secondary" className="mt-2 text-green-600 bg-green-50 dark:bg-green-900/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            +2.1% this week
          </Badge>
        </CardContent>
      </Card>

      {/* Average Processing Time */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Processing Time
            <span className="ml-1 text-xs text-muted-foreground/70">(last 10 docs)</span>
          </CardTitle>
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatProcessingTime(data.avgProcessingTime)}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Processing time = arrival to structured data
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
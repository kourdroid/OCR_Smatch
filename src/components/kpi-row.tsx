'use client'

import { DollarSign, FileText, AlertTriangle } from 'lucide-react'
import { KPIData } from '@/types/document'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCompactNumber } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface KPIRowProps {
  data: KPIData
}

export function KPIRow({ data }: KPIRowProps) {
  const formatter = new Intl.NumberFormat('en-US')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Value Processed */}
      <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm max-w-[496px] h-[180px]">
        <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
          <div className="flex items-center gap-6">
            <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center">
              <DollarSign className="h-[56px] w-[56px] text-black" />
            </div>
            <div className="flex flex-col justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-[48px] font-extrabold text-black leading-none" title={formatter.format(data.valueProcessed || 0)}>{formatCompactNumber(data.valueProcessed || 0)}</div>
                </TooltipTrigger>
                <TooltipContent>{formatter.format(data.valueProcessed || 0)}</TooltipContent>
              </Tooltip>
              <div className="text-sm text-gray-700">Value Processed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Processed */}
      <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm max-w-[496px] h-[180px]">
        <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
          <div className="flex items-center gap-6">
            <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center">
              <FileText className="h-[56px] w-[56px] text-black" />
            </div>
            <div className="flex flex-col justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-[48px] font-extrabold text-black leading-none" title={formatter.format(data.documentsProcessed || 0)}>{formatCompactNumber(data.documentsProcessed || 0)}</div>
                </TooltipTrigger>
                <TooltipContent>{formatter.format(data.documentsProcessed || 0)}</TooltipContent>
              </Tooltip>
              <div className="text-sm text-gray-700">Document Processed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mismatched Documents */}
      <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm max-w-[496px] h-[180px]">
        <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
          <div className="flex items-center gap-6">
            <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center">
              <AlertTriangle className="h-[56px] w-[56px] text-black" />
            </div>
            <div className="flex flex-col justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-[48px] font-extrabold text-black leading-none" title={formatter.format(data.mismatchedDocuments || 0)}>{formatCompactNumber(data.mismatchedDocuments || 0)}</div>
                </TooltipTrigger>
                <TooltipContent>{formatter.format(data.mismatchedDocuments || 0)}</TooltipContent>
              </Tooltip>
              <div className="text-sm text-gray-700">Mismatched Documents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

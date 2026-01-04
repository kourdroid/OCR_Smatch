'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/language-context'
import { useAuthStore } from '@/stores/auth-store'
import { LogOut, User, Mail, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { language, setLanguage, t } = useLanguage()
  const { profile, signOut } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('profile.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* User Info Section */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-xl">
              {profile?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="space-y-1">
              <h4 className="font-medium leading-none">{profile?.email?.split('@')[0] || 'User'}</h4>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Role Display */}
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('profile.role')}</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  {profile?.is_admin ? t('profile.admin') : t('profile.member')}
                </span>
              </div>
            </div>

            {/* Language Selector */}
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('profile.language')}</Label>
              <Select
                value={language}
                onValueChange={(val: 'EN' | 'FR') => setLanguage(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('profile.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="FR">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button variant="destructive" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t('profile.signOut')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

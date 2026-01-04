"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Eye, EyeOff } from "lucide-react"
import { supabase, isSupabaseAvailable } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

const isEmailValid = (value: string) => /.+@.+\..+/.test(value)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [infoMsg, setInfoMsg] = useState("")
  const canUseSupabase = isSupabaseAvailable()
  const { fetchProfile } = useAuthStore()
  const [activeBar, setActiveBar] = useState(1)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const id = setInterval(() => {
      setActiveBar((p) => (p + 1) % 3)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const handleSignIn = async () => {
    if (!canUseSupabase || !supabase) return
    if (!isEmailValid(email) || password.length < 6) {
      setErrorMsg(t('login.errorInvalid'))
      return
    }
    setLoading(true)
    setErrorMsg("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      await fetchProfile()
      router.replace("/")
    } else {
      setErrorMsg(error.message || t('login.errorGeneric'))
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!canUseSupabase) return
    if (!isEmailValid(email) || password.length < 6) {
      setErrorMsg(t('login.errorInvalid'))
      return
    }
    setLoading(true)
    setErrorMsg("")
    setInfoMsg("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json?.error || t('login.errorGeneric'))
        setLoading(false)
        return
      }

      // Handle email confirmation case
      if (json.message) {
        setInfoMsg(json.message)
        setLoading(false)
        return
      }

      // If we have a session, sign in was successful
      if (json.session) {
        await fetchProfile()
        router.replace("/")
      } else {
        // No session but user created - need to sign in
        if (!supabase) {
          setErrorMsg(t('login.errorGeneric'))
          setLoading(false)
          return
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setErrorMsg(signInError.message || t('login.errorGeneric'))
        } else {
          await fetchProfile()
          router.replace("/")
        }
      }
    } catch (e: any) {
      setErrorMsg(e?.message || t('login.errorGeneric'))
    }
    setLoading(false)
  }

  return (
    <div className="h-screen w-screen bg-white">
      <div className="w-full h-screen px-[21px] py-[18px] rounded-[26px] bg-white">

        <div className="flex justify-center gap-6 h-full">

          {/* Cover section */}
          <div className="flex justify-center h-full w-full max-w-[900px] rounded-[29px] overflow-hidden relative" style={{ backgroundImage: 'url("/Images/login cover.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="flex w-full absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_53.24%,#0a0a0a_100%)]" />
            <div className="relative w-full z-10 flex flex-col h-full pt-[52px] pr-[52px] pb-[41px] pl-[60px]">
              <div className="flex items-center justify-between gap-4 sm:flex-nowrap">
                <p className="text-white text-2xl font-semibold">Smatch</p>
                <button onClick={() => router.push("/signup")} className="border border-white text-white rounded-md px-4 py-2 text-sm font-semibold">{t('login.signUp')}</button>
              </div>
              <div className="mt-auto">
                <p className="text-white text-[36px] font-bold text-center">{t('login.heroTitle')}</p>
                <p className="mt-6 mx-auto w-[580px] text-center text-white/70 text-[24px] font-light">{t('login.heroSubtitle')}</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <span className={(activeBar === 0 ? "h-[7px] bg-white" : "h-[4px] bg-white/30") + " w-[78px] rounded-full"} />
                  <span className={(activeBar === 1 ? "h-[7px] bg-white" : "h-[4px] bg-white/30") + " w-[78px] rounded-full"} />
                  <span className={(activeBar === 2 ? "h-[7px] bg-white" : "h-[4px] bg-white/30") + " w-[78px] rounded-full"} />
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="flex flex-col w-full h-full pt-[52px] pr-[52px] pb-[41px] pl-[60px]">
            <div className="flex items-center justify-between">
              <p className="text-[32px] font-semibold">{t('login.title')}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-end justify-between border-2 border-black rounded-[8px] px-[13px] py-[11px] w-[73px] h-[46px]">
                    <span className="text-sm font-semibold">{language}</span>
                    <ChevronDown className="w-3 h-3 self-end" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('EN')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('FR')}>Français</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col items-center justify-between px-4 my-auto  sm:px-6">
              <p className="text-[48px] font-bold">{t('login.welcome')}</p>
              <p className="mt-6 text-[24px] font-light text-[#7d7d7d]">{t('login.subtitle')}</p>
              <Input id="email" type="email" placeholder={t('login.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className=" mt-[61px] w-full max-w-[560px] sm:max-w-[620px] md:max-w-[662px] h-[56px] sm:h-[64px] md:h-[72px] rounded-[8px] border border-[#d3d3d3] bg-white px-6 sm:px-7 md:px-8 text-[20px] font-light placeholder:text-[#7d7d7d]" />
              <div className="relative w-full max-w-[560px] sm:max-w-[620px] md:max-w-[662px] mt-[31px]">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder={t('login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-[56px] sm:h-[64px] md:h-[72px] rounded-[8px] border border-[#d3d3d3] bg-white px-6 sm:px-7 md:px-8 text-[20px] font-light placeholder:text-[#7d7d7d] pr-12" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7d7d7d]">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}
              {infoMsg && <p className="mt-1 text-sm text-blue-600">{infoMsg}</p>}
              <div className="mt-[39px] w-full max-w-[560px] sm:max-w-[620px] md:max-w-[662px]">
                <Button onClick={handleSignIn} disabled={loading || !canUseSupabase} className="w-full h-[64px] rounded-lg bg-[#ffc30d] text-black text-[18px] font-semibold hover:bg-[#e5ad08]">{loading ? t('common.loading') : t('login.signIn')}</Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

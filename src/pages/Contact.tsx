import { useEffect, useState } from 'react'
import { LifeBuoy, Mail, MessageSquare, Phone, Send, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { CenterPageAd } from '../components/CenterPageAd'

type FeedbackState = {
  type: 'success' | 'error'
  text: string
}

export function Contact() {
  const { user, profile, t } = useApp()

  // Поля форми зворотного зв'язку.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Технічні стани форми.
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  useEffect(() => {
    // Якщо користувач уже увійшов, одразу підставляємо його дані у форму,
    // але не перетираємо те, що він уже встиг надрукувати вручну.
    if (profile?.full_name) {
      setName((current) => current || profile.full_name || '')
    }

    if (user?.email) {
      setEmail((current) => current || user.email || '')
    }

    if (profile?.phone) {
      setPhone((current) => current || profile.phone || '')
    }
  }, [profile?.full_name, profile?.phone, user?.email])

  const resetForm = () => {
    // Після успішної відправки очищаємо тільки зміст звернення.
    // Контактні дані лишаємо, щоб користувачу не довелося вводити їх ще раз.
    setSubject('')
    setMessage('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setFeedback({
        type: 'error',
        text: t('contact.requiredFields'),
      })
      return
    }

    setSending(true)

    try {
      // Зберігаємо звернення в базі, щоб команда підтримки могла відповісти
      // без втрати повідомлення після перезавантаження сторінки.
      const { error } = await supabase.from('feedback_messages').insert({
        sender_id: user?.id || null,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'new',
        is_read: false,
      })

      if (error) {
        throw error
      }

      setFeedback({
        type: 'success',
        text: t('contact.successMessage'),
      })

      resetForm()
    } catch (submitError) {
      console.error('Помилка надсилання зворотного звʼязку:', submitError)
      setFeedback({
        type: 'error',
        text: t('contact.errorMessage'),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="py-8 pb-24 lg:pb-8">
        {/* Верхній інформаційний блок сторінки. */}
        <section className="glass-panel p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/42 bg-[rgba(248,250,252,0.70)] px-4 py-2 text-sm font-semibold text-[#64748b]">
            <LifeBuoy className="h-4 w-4" />
            <span>{t('contact.eyebrow')}</span>
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-[#2f2a24] md:text-5xl">
            {t('contact.title')}
          </h1>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigateTo('/')}
              type="button"
              className="btn-secondary rounded-full"
            >
              {t('contact.homeButton')}
            </button>

            {!user && (
              <button
                onClick={() => navigateTo('/login')}
                type="button"
                className="btn-primary rounded-full"
              >
                {t('contact.loginButton')}
              </button>
            )}
          </div>
        </section>

        <CenterPageAd page="default" className="my-6" />

        <section className="mt-6">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-extrabold text-[#2f2a24]">
              {t('contact.formTitle')}
            </h2>

            {feedback && (
              <div
                className={`mt-5 rounded-[20px] px-4 py-3 text-sm ${
                  feedback.type === 'error'
                    ? 'border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] text-[#a44a3a]'
                    : 'border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] text-[#3d7a52]'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                    <User className="h-4 w-4" />
                    <span>{t('contact.nameLabel')}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="input-glass"
                    placeholder={t('contact.namePlaceholder')}
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                    <Mail className="h-4 w-4" />
                    <span>{t('contact.emailLabel')}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input-glass"
                    placeholder={t('contact.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                  <Phone className="h-4 w-4" />
                  <span>{t('contact.phoneLabel')}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="input-glass"
                  placeholder={t('contact.phonePlaceholder')}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5f5a54]">
                  <MessageSquare className="h-4 w-4" />
                  <span>{t('contact.subjectLabel')}</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="input-glass"
                  placeholder={t('contact.subjectPlaceholder')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
                  {t('contact.messageLabel')}
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={7}
                  className="input-glass min-h-[180px] resize-y"
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? t('contact.sending') : t('contact.submitButton')}
                </button>
              </div>
            </form>
          </div>
        </section>
    </div>
  )
}

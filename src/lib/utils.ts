import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function generateSubmissionReference(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `NIRF-${year}${month}${day}-${random}`
}

export function normalizeRegisterNumber(regNo: string): string {
  return regNo.trim().toUpperCase().replace(/\s+/g, '')
}

export function isValidMobileNumber(number: string | null | undefined): boolean {
  if (!number) return false
  const cleaned = String(number).replace(/[\s\-\(\)]/g, '')
  return /^\+?\d{10,13}$/.test(cleaned)
}

export function formatMobileNumber(number: string | null | undefined): string {
  if (!number) return 'N/A'
  const cleaned = String(number).replace(/[\s\-\(\)]/g, '')
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  return cleaned.startsWith('+') ? cleaned : `+91${cleaned}`
}

export function generateWhatsAppLink(number: string, message: string): string {
  const cleanNumber = formatMobileNumber(number).replace('+', '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const ITEMS_PER_PAGE = 25

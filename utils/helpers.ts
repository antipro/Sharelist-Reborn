import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (timestamp: number, locale: string = 'en-US') => {
  return new Date(timestamp).toLocaleDateString(locale);
};
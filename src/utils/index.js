// src/utils/index.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

// Tailwind class merger
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date in Uzbek
export function formatDate(date, pattern = 'dd.MM.yyyy HH:mm') {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, pattern);
}

// Format relative time in Uzbek
export function timeAgo(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Hozirgina';
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days < 7) return `${days} kun oldin`;
  return formatDate(date, 'dd.MM.yyyy');
}

// Sanitize HTML input to prevent XSS
export function sanitizeInput(input) {
  if (typeof window === 'undefined') {
    return input.replace(/<[^>]*>/g, '').trim();
  }
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Validate URL
export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

// Validate IP address
export function isValidIP(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Validate email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Get risk color class
export function getRiskColor(score) {
  if (score <= 10) return 'text-green-400';
  if (score <= 30) return 'text-blue-400';
  if (score <= 60) return 'text-yellow-400';
  if (score <= 80) return 'text-orange-400';
  return 'text-red-400';
}

export function getRiskBgColor(score) {
  if (score <= 10) return 'bg-green-500/20 border-green-500/30';
  if (score <= 30) return 'bg-blue-500/20 border-blue-500/30';
  if (score <= 60) return 'bg-yellow-500/20 border-yellow-500/30';
  if (score <= 80) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

export function getRiskLabel(score) {
  if (score <= 10) return 'Xavfsiz';
  if (score <= 30) return 'Past xavf';
  if (score <= 60) return "O'rta xavf";
  if (score <= 80) return 'Yuqori xavf';
  return 'Kritik';
}

// Truncate text
export function truncate(text, length = 100) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bayt';
  const k = 1024;
  const sizes = ['Bayt', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Generate random ID
export function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`;
}

// Extract domain from URL
export function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Rate limiter (in-memory)
const rateLimitMap = new Map();
export function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }

  const requests = rateLimitMap.get(key).filter(time => time > windowStart);
  rateLimitMap.set(key, requests);

  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  return true;
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Calculate XP for level
export function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForNextLevel(level) {
  return (level * level) * 100;
}

// Get greeting based on time
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Xayrli tun';
  if (hour < 12) return 'Xayrli tong';
  if (hour < 17) return 'Xayrli kun';
  if (hour < 21) return 'Xayrli kech';
  return 'Xayrli tun';
}

// Mask sensitive data
export function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  return `${local.charAt(0)}***@${domain}`;
}

export function maskIP(ip) {
  if (!ip) return '';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip;
}

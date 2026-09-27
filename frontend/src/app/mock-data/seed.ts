/**
 * Deterministic helpers for generating mock data. All generated dates are
 * relative to "today" so the demo always looks current.
 */
import { todayIso } from '../shared/utils/date.util';

export type Rng = () => number;

/** mulberry32 — tiny seeded PRNG so data is stable between reloads. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TODAY = todayIso();

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

export function weighted<T>(rng: Rng, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export const MALE_NAMES = [
  'Adithya',
  'Arjun',
  'Akhil',
  'Abhinav',
  'Aswin',
  'Basil',
  'Christo',
  'Deepak',
  'Fahad',
  'Farhan',
  'Gautham',
  'Irfan',
  'Jishnu',
  'Kiran',
  'Midhun',
  'Muhammed',
  'Navaneeth',
  'Nihal',
  'Pranav',
  'Rahul',
  'Rohit',
  'Sachin',
  'Sanjay',
  'Shaheer',
  'Sharon',
  'Sidharth',
  'Sreehari',
  'Vaishakh',
  'Vivek',
  'Yadhu',
  'Anand',
  'Ebin',
  'Jerin',
  'Ameen',
  'Karthik',
  'Harikrishnan',
  'Aravind',
  'Joel',
  'Alan',
  'Hisham',
] as const;

export const FEMALE_NAMES = [
  'Aishwarya',
  'Anagha',
  'Anjana',
  'Aparna',
  'Athira',
  'Ayisha',
  'Devika',
  'Diya',
  'Fathima',
  'Gopika',
  'Hiba',
  'Keerthana',
  'Lakshmi',
  'Malavika',
  'Meenakshi',
  'Nandana',
  'Neha',
  'Nidhi',
  'Parvathy',
  'Revathy',
  'Riya',
  'Sana',
  'Sneha',
  'Sreya',
  'Swathi',
  'Theertha',
  'Varsha',
  'Anu',
  'Ann Maria',
  'Jasmine',
  'Liya',
  'Nimisha',
  'Shilpa',
  'Amrutha',
  'Krishnapriya',
  'Haritha',
  'Rinsha',
  'Nazrin',
  'Gayathri',
  'Aleena',
] as const;

export const SURNAMES = [
  'Nair',
  'Menon',
  'Pillai',
  'Kurup',
  'Varghese',
  'Thomas',
  'Joseph',
  'George',
  'Mathew',
  'Abraham',
  'Kumar',
  'Krishnan',
  'Das',
  'Rajan',
  'Mohan',
  'Suresh',
  'Babu',
  'Ali',
  'Rahman',
  'Hussain',
  'Basheer',
  'Shaji',
  'Jose',
  'Paul',
  'Chandran',
  'Gopinath',
  'Warrier',
  'Unnikrishnan',
  'Raj',
  'Sebastian',
] as const;

export const CITIES = [
  'Kochi',
  'Thrissur',
  'Kozhikode',
  'Thiruvananthapuram',
  'Kannur',
  'Kottayam',
  'Palakkad',
  'Malappuram',
  'Alappuzha',
  'Kollam',
  'Aluva',
  'Perinthalmanna',
  'Tirur',
  'Kakkanad',
] as const;

export const LOCALITIES = [
  'MG Road',
  'Edappally',
  'Palarivattom',
  'Kaloor',
  'Vyttila',
  'Panampilly Nagar',
  'Kadavanthra',
  'Thrikkakara',
  'Ayyanthole',
  'Mavoor Road',
  'Pattom',
  'Kowdiar',
  'Civil Station',
  'Chevayur',
] as const;

export const QUALIFICATIONS = [
  'B.Tech Computer Science',
  'B.Sc Computer Science',
  'BCA',
  'MCA',
  'B.Com',
  'B.Tech Electronics',
  'Plus Two (Science)',
  'BBA',
  'M.Sc Mathematics',
  'Diploma in Computer Engineering',
  'B.A English',
] as const;

export const OCCUPATIONS = [
  'Business',
  'Government Employee',
  'Teacher',
  'Engineer',
  'Farmer',
  'Gulf (UAE)',
  'Bank Employee',
  'Homemaker',
  'KSEB Employee',
  'Contractor',
  'Nurse',
  'Retired',
] as const;

export const EMAIL_DOMAINS = [
  'gmail.com',
  'gmail.com',
  'gmail.com',
  'yahoo.co.in',
  'outlook.com',
  'rediffmail.com',
] as const;

/** `+91 98470 12345` */
export function phoneNumber(rng: Rng): string {
  const lead = pick(rng, ['9', '8', '7', '6']);
  const digits = Array.from({ length: 9 }, () => int(rng, 0, 9)).join('');
  const all = lead + digits;
  return `+91 ${all.slice(0, 5)} ${all.slice(5)}`;
}

export function emailFor(rng: Rng, name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');
  const suffix = chance(rng, 0.45) ? String(int(rng, 7, 99)) : '';
  return `${base}${suffix}@${pick(rng, EMAIL_DOMAINS)}`;
}

export function personName(rng: Rng, gender: 'Male' | 'Female'): string {
  const first = pick(rng, gender === 'Male' ? MALE_NAMES : FEMALE_NAMES);
  return `${first} ${pick(rng, SURNAMES)}`;
}

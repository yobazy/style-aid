import type { Scenario } from '../types'

export const scenarioPresets: Scenario[] = [
  {
    id: 'work',
    name: 'Work',
    description: 'Polished outfits for office days, meetings, and dinners after work.',
    dressCodes: ['Business Casual', 'Smart Casual', 'Formal'],
    seasons: ['Spring', 'Summer', 'Fall', 'Winter', 'All-season'],
    requirements: [
      { category: 'Tops', minCount: 1 },
      { category: 'Bottoms', minCount: 1 },
      { category: 'Shoes', minCount: 1 },
      { category: 'Bags', minCount: 1 },
    ],
  },
  {
    id: 'going-out',
    name: 'Going Out',
    description: 'Looks for dinner, cocktails, events, and any night you want to feel styled.',
    dressCodes: ['Smart Casual', 'Formal'],
    seasons: ['Spring', 'Summer', 'Fall', 'Winter', 'All-season'],
    requirements: [
      { category: 'Tops', minCount: 1 },
      { category: 'Bottoms', minCount: 1 },
      { category: 'Shoes', minCount: 1 },
      { category: 'Jewelry', minCount: 1 },
    ],
  },
  {
    id: 'weekend',
    name: 'Weekend',
    description: 'Easy off-duty outfits that still feel intentional.',
    dressCodes: ['Casual', 'Smart Casual'],
    seasons: ['Spring', 'Summer', 'Fall', 'Winter', 'All-season'],
    requirements: [
      { category: 'Tops', minCount: 1 },
      { category: 'Bottoms', minCount: 1 },
      { category: 'Shoes', minCount: 1 },
    ],
  },
  {
    id: 'date-night',
    name: 'Date Night',
    description: 'A more elevated look with room for personality.',
    dressCodes: ['Smart Casual', 'Formal'],
    seasons: ['Spring', 'Summer', 'Fall', 'Winter', 'All-season'],
    requirements: [
      { category: 'Tops', minCount: 1 },
      { category: 'Bottoms', minCount: 1 },
      { category: 'Shoes', minCount: 1 },
      { category: 'Accessories', minCount: 1 },
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Comfortable but pulled-together outfits that can handle long days.',
    dressCodes: ['Casual', 'Smart Casual', 'Business Casual'],
    seasons: ['Spring', 'Summer', 'Fall', 'Winter', 'All-season'],
    requirements: [
      { category: 'Tops', minCount: 1 },
      { category: 'Bottoms', minCount: 1 },
      { category: 'Shoes', minCount: 1 },
      { category: 'Bags', minCount: 1 },
    ],
  },
]

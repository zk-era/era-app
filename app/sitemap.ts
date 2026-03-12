import { MetadataRoute } from 'next'

/**
 * Dynamic Sitemap Generation
 * 
 * This runs at build time to generate sitemap.xml for SEO.
 * Add new routes here as the app grows.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://demo.zkera.xyz'
  const lastModified = new Date()

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/send`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/swap`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/receive`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}

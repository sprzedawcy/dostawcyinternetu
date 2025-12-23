// components/SEOHead.tsx
// Komponent do osadzenia w Metadata Next.js

import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dostawcyinternetu.pl';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  
  // Article specific
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  
  // Product specific
  price?: number;
  currency?: string;
  availability?: 'instock' | 'outofstock';
}

export function generateSEOMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  price,
  currency = 'PLN',
  availability
}: SEOHeadProps): Metadata {
  const url = `${BASE_URL}${path}`;
  const ogImage = image || `${BASE_URL}/og-default.jpg`;
  
  const metadata: Metadata = {
    title,
    description,
    
    // Robots
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    
    // Canonical
    alternates: {
      canonical: url,
    },
    
    // Open Graph
    openGraph: {
      title,
      description,
      url,
      siteName: 'DostawcyInternetu.pl',
      type: type === 'article' ? 'article' : 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'pl_PL',
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    
    // Other
    authors: author ? [{ name: author }] : undefined,
    keywords: tags,
  };
  
  // Article specific
  if (type === 'article' && metadata.openGraph) {
    (metadata.openGraph as any).article = {
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined,
      section,
      tags,
    };
  }
  
  // Product specific
  if (type === 'product' && price !== undefined && metadata.openGraph) {
    (metadata.openGraph as any).product = {
      price: {
        amount: price,
        currency,
      },
      availability: availability === 'instock' ? 'in stock' : 'out of stock',
    };
  }
  
  return metadata;
}

// =====================================================
// HELPER: Meta tagi jako string (dla custom head)
// =====================================================

export function generateMetaTags(props: SEOHeadProps): string {
  const url = `${BASE_URL}${props.path}`;
  const ogImage = props.image || `${BASE_URL}/og-default.jpg`;
  
  return `
    <title>${props.title}</title>
    <meta name="description" content="${props.description}" />
    <meta name="robots" content="${props.noindex ? 'noindex, nofollow' : 'index, follow'}" />
    <link rel="canonical" href="${url}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${props.title}" />
    <meta property="og:description" content="${props.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="DostawcyInternetu.pl" />
    <meta property="og:type" content="${props.type || 'website'}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="pl_PL" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${props.title}" />
    <meta name="twitter:description" content="${props.description}" />
    <meta name="twitter:image" content="${ogImage}" />
    
    ${props.author ? `<meta name="author" content="${props.author}" />` : ''}
    ${props.tags ? `<meta name="keywords" content="${props.tags.join(', ')}" />` : ''}
    
    ${props.type === 'article' ? `
    <meta property="article:published_time" content="${props.publishedTime}" />
    ${props.modifiedTime ? `<meta property="article:modified_time" content="${props.modifiedTime}" />` : ''}
    ${props.author ? `<meta property="article:author" content="${props.author}" />` : ''}
    ${props.section ? `<meta property="article:section" content="${props.section}" />` : ''}
    ` : ''}
  `.trim();
}


"use server";

import { z } from "zod";
import * as cheerio from 'cheerio';

const FormSchema = z.object({
  mangaName: z.string().min(1, "Manga name is required."),
  chapterNumber: z.string().min(1, "Chapter number is required.").refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Chapter number must be a positive integer.",
  }),
});

export interface ScrapedImage {
  url: string;
  name: string;
}

export interface ScrapeResult {
  success: boolean;
  images?: ScrapedImage[];
  message?: string;
  error?: string;
  constructedUrl?: string;
}

async function fetchAndParseMangaPage(url: string): Promise<ScrapedImage[]> {
  try {
    console.log(`Fetching HTML from URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      // It's possible the site blocks requests without more specific headers or has bot detection.
      // Adding a timeout could also be useful for production scenarios.
    });

    if (!response.ok) {
      console.error(`HTTP error ${response.status} fetching ${url}`);
      if (response.status === 404) {
        return []; 
      }
      throw new Error(`Failed to fetch manga page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const images: ScrapedImage[] = [];
    
    let imageElements = $('img.loading[data-src]');

    if (imageElements.length === 0) {
      imageElements = $('img.loading[src]');
    }
    if (imageElements.length === 0) {
      imageElements = $('img.wp-manga-chapter-img[data-src]');
    }
    if (imageElements.length === 0) {
      imageElements = $('img.wp-manga-chapter-img[src]');
    }
    if (imageElements.length === 0) {
        imageElements = $('.reading-content img[data-src], .entry-content img[data-src], #readerarea img[data-src], div.container-chapter-reader img[data-src]');
    }
    if (imageElements.length === 0) {
        imageElements = $('.reading-content img[src], .entry-content img[src], #readerarea img[src], div.container-chapter-reader img[src]');
    }
    // Final fallback: any image with data-src or src that looks like a chapter image based on path
    if (imageElements.length === 0) {
      $('img[data-src], img[src]').each((index, element) => {
        const src = $(element).attr('data-src') || $(element).attr('src');
        if (src && (src.includes('/uploads/') || src.includes('/chapter') || src.includes('/manga'))) {
            // Heuristic: If image src contains common paths for manga images, add it.
            // This is a bit broad and might need refinement.
            if(!imageElements.is(element)) { // Avoid adding duplicates if already found by previous selectors
              imageElements = imageElements.add(element);
            }
        }
      });
    }


    imageElements.each((index, element) => {
      let imageUrl = $(element).attr('data-src') || $(element).attr('src');
      if (imageUrl) {
        imageUrl = imageUrl.trim();
        if (imageUrl.startsWith('//')) {
          imageUrl = `https:${imageUrl}`;
        } else if (imageUrl.startsWith('/')) {
            try {
                const siteUrl = new URL(url);
                imageUrl = `${siteUrl.protocol}//${siteUrl.hostname}${imageUrl}`;
            } catch (e) {
                console.warn(`Could not form absolute URL from relative path: ${imageUrl} using base ${url}`);
                return; // Skip this image if URL construction fails
            }
        }
        
        // Validate URL before proceeding
        try {
            new URL(imageUrl);
        } catch (e) {
            console.warn(`Invalid image URL found: ${imageUrl}`);
            return; // Skip invalid URL
        }

        let extension = '.jpg'; // Default extension
        try {
          const parsedUrl = new URL(imageUrl);
          const pathname = parsedUrl.pathname;
          const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (lastSegment.includes('.')) {
            const extCandidate = lastSegment.substring(lastSegment.lastIndexOf('.')).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extCandidate)) {
              extension = extCandidate;
            }
          }
        } catch (e) {
          console.warn(`Could not parse image URL for extension: ${imageUrl}, using default .jpg`);
        }
        
        images.push({
          url: imageUrl,
          name: `page_${index + 1}${extension}`,
        });
      }
    });

    if (images.length === 0) {
        console.log(`No images found on ${url} matching any of the specified selectors.`);
    }

    return images;

  } catch (error) {
    console.error(`Error in fetchAndParseMangaPage for ${url}:`, error);
    if (error instanceof Error) {
        throw new Error(`Scraping failed for ${url}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred during scraping of ${url}`);
  }
}

export async function getMangaChapterImages(
  prevState: ScrapeResult | undefined,
  formData: FormData
): Promise<ScrapeResult> {
  const validatedFields = FormSchema.safeParse({
    mangaName: formData.get("mangaName"),
    chapterNumber: formData.get("chapterNumber"),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    let errorMessage = "Invalid input: ";
    if (errors.mangaName) errorMessage += `Manga Name: ${errors.mangaName.join(', ')}. `;
    if (errors.chapterNumber) errorMessage += `Chapter Number: ${errors.chapterNumber.join(', ')}. `;
    
    return {
      success: false,
      error: errorMessage.trim(),
    };
  }

  const { mangaName, chapterNumber } = validatedFields.data;

  const sanitizedMangaName = mangaName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, '');
  
  const constructedUrl = `https://manhwa18.cc/webtoon/${sanitizedMangaName}/chapter-${chapterNumber}`;

  try {
    const images = await fetchAndParseMangaPage(constructedUrl);

    if (images.length === 0) {
      return {
        success: false,
        error: "No images found. The manga/chapter might not exist, the page has no images, or the scraper couldn't identify them. Check the console for more details.",
        constructedUrl,
      };
    }

    return {
      success: true,
      images,
      message: `Successfully fetched ${images.length} images.`,
      constructedUrl,
    };
  } catch (error) {
    console.error("Scraping error in getMangaChapterImages:", error);
    let errorMessage = "An unexpected error occurred while fetching images.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
      constructedUrl,
    };
  }
}


"use server";

import { z } from "zod";
import * as cheerio from 'cheerio';

const FormSchema = z.object({
  mangaName: z.string().min(1, "Manga name is required."),
  startChapterNumber: z.string()
    .min(1, "Start chapter number is required.")
    .refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
      message: "Start chapter number must be a positive integer.",
    }),
  endChapterNumber: z.string()
    .optional()
    .transform(val => (val === "" ? undefined : val)) // Treat empty string as undefined for optional validation
    .refine(val => val === undefined || (!isNaN(parseInt(val)) && parseInt(val) > 0), {
      message: "End chapter number must be a positive integer if provided.",
    }),
}).refine(data => {
  if (data.endChapterNumber && data.startChapterNumber) {
    const start = parseInt(data.startChapterNumber);
    const end = parseInt(data.endChapterNumber);
    // This check assumes individual field validations for positive integers have passed
    if (!isNaN(start) && !isNaN(end)) {
        return end >= start;
    }
  }
  return true;
}, {
  message: "End chapter must be greater than or equal to start chapter.",
  path: ["endChapterNumber"],
});

export interface ScrapedImage {
  url: string;
  name: string; // e.g., solo-leveling_chapter_1_page_1.jpg
  mangaName: string;
  chapterNumber: number;
}

export interface ScrapeResult {
  success: boolean;
  images?: ScrapedImage[];
  message?: string;
  error?: string;
  constructedUrl?: string; // Will be a URL for single chapter, or a descriptive string for a range
}

async function fetchAndParseMangaPage(sanitizedMangaName: string, chapterNumber: number, url: string): Promise<ScrapedImage[]> {
  try {
    console.log(`Fetching HTML from URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`HTTP error ${response.status} fetching ${url}`);
      if (response.status === 404) {
        return [];
      }
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const images: ScrapedImage[] = [];

    let imageElements = $('img.loading[data-src], img.loading[src]');
    if (imageElements.length === 0) {
      imageElements = $('img.wp-manga-chapter-img[data-src], img.wp-manga-chapter-img[src]');
    }
    if (imageElements.length === 0) {
        imageElements = $('.reading-content img[data-src], .entry-content img[data-src], #readerarea img[data-src], div.container-chapter-reader img[data-src], .reading-content img[src], .entry-content img[src], #readerarea img[src], div.container-chapter-reader img[src]');
    }
    if (imageElements.length === 0) {
      $('img[data-src], img[src]').each((_index, element) => {
        const dataSrc = $(element).attr('data-src');
        const srcAttr = $(element).attr('src');
        const checkSrc = dataSrc || srcAttr;
        if (checkSrc && (checkSrc.includes('/uploads/') || checkSrc.includes('/chapter') || checkSrc.includes('/manga'))) {
            if(!imageElements.is(element)) {
              imageElements = imageElements.add(element);
            }
        }
      });
    }

    imageElements.each((index, element) => {
      const potentialDataSrc = $(element).attr('data-src')?.trim();
      const potentialSrc = $(element).attr('src')?.trim();
      let imageUrl: string | undefined;

      const looksLikeHttpOrRelativeUrl = (s?: string): boolean => {
        if (!s) return false;
        return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//') || s.startsWith('/');
      };

      if (potentialDataSrc && looksLikeHttpOrRelativeUrl(potentialDataSrc)) {
        imageUrl = potentialDataSrc;
      } else if (potentialSrc && looksLikeHttpOrRelativeUrl(potentialSrc)) {
        imageUrl = potentialSrc;
      } else if (potentialDataSrc) {
        imageUrl = potentialDataSrc;
      } else if (potentialSrc) {
        imageUrl = potentialSrc;
      } else {
        return; 
      }

      if (imageUrl.startsWith('//')) {
        imageUrl = `https:${imageUrl}`;
      } else if (imageUrl.startsWith('/')) {
          try {
              const pageUrl = new URL(url);
              imageUrl = `${pageUrl.protocol}//${pageUrl.hostname}${imageUrl}`;
          } catch (e) {
              console.warn(`Could not form absolute URL from relative path: '${imageUrl}' using base '${url}'. data-src: '${potentialDataSrc}', src: '${potentialSrc}'. Error: ${e instanceof Error ? e.message : String(e)}`);
              return;
          }
      }

      try {
          new URL(imageUrl);
      } catch (e) {
          console.warn(`Invalid or unusable image URL after processing: '${imageUrl}'. Original data-src: '${potentialDataSrc}', original src: '${potentialSrc}'. Error: ${e instanceof Error ? e.message : String(e)}`);
          return;
      }

      let extension = '.jpg';
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
        name: `${sanitizedMangaName}_chapter_${chapterNumber}_page_${index + 1}${extension}`,
        mangaName: sanitizedMangaName,
        chapterNumber: chapterNumber,
      });
    });

    if (images.length === 0) {
        console.log(`No images found on ${url} matching any of the specified selectors or criteria.`);
    }
    return images;

  } catch (error) {
    console.error(`Error in fetchAndParseMangaPage for ${url}:`, error);
    return [];
  }
}

export async function getMangaChapterImages(
  prevState: ScrapeResult | undefined,
  formData: FormData
): Promise<ScrapeResult> {
  const validatedFields = FormSchema.safeParse({
    mangaName: formData.get("mangaName"),
    startChapterNumber: formData.get("startChapterNumber"),
    endChapterNumber: formData.get("endChapterNumber"),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    let errorMessage = "Invalid input: ";
    if (errors.mangaName) errorMessage += `Manga Name: ${errors.mangaName.join(', ')}. `;
    if (errors.startChapterNumber) errorMessage += `Start Chapter: ${errors.startChapterNumber.join(', ')}. `;
    if (errors.endChapterNumber) errorMessage += `End Chapter: ${errors.endChapterNumber.join(', ')}. `;
    if (validatedFields.error.flatten().formErrors.length > 0) {
      errorMessage += `${validatedFields.error.flatten().formErrors.join('. ')}. `;
    }
    return {
      success: false,
      error: errorMessage.trim(),
    };
  }

  const { mangaName, startChapterNumber, endChapterNumber } = validatedFields.data;

  const sanitizedMangaName = mangaName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, '');

  const startChap = parseInt(startChapterNumber);
  const endChap = endChapterNumber ? parseInt(endChapterNumber) : startChap;

  let finalConstructedUrlMessage: string;
  if (startChap === endChap) {
    finalConstructedUrlMessage = `https://manhwa18.cc/webtoon/${sanitizedMangaName}/chapter-${startChap}`;
  } else {
    finalConstructedUrlMessage = `Chapters ${startChap}-${endChap} for '${mangaName}'`;
  }

  try {
    let allImages: ScrapedImage[] = [];
    let successfulChaptersCount = 0;
    const chapterFetchErrors: string[] = [];

    for (let currentChapter = startChap; currentChapter <= endChap; currentChapter++) {
      const constructedUrl = `https://manhwa18.cc/webtoon/${sanitizedMangaName}/chapter-${currentChapter}`;
      console.log(`Attempting to fetch chapter: ${currentChapter} from ${constructedUrl}`);
      try {
        const chapterImages = await fetchAndParseMangaPage(sanitizedMangaName, currentChapter, constructedUrl);
        if (chapterImages.length > 0) {
          allImages = allImages.concat(chapterImages);
          successfulChaptersCount++;
        } else {
           console.log(`No images found for chapter ${currentChapter} at ${constructedUrl}`);
        }
      } catch (e: any) {
        console.error(`Critical error fetching or parsing chapter ${currentChapter}: ${e.message}`);
        chapterFetchErrors.push(`Chapter ${currentChapter}: ${e.message}`);
      }
    }

    if (allImages.length === 0) {
      let errorMsg = "No images found for the specified chapter(s). ";
      if(chapterFetchErrors.length > 0) {
        errorMsg += `Encountered errors: ${chapterFetchErrors.join("; ")}`;
      } else if (startChap !== endChap) {
        errorMsg += `Scanned chapters ${startChap}-${endChap}. The chapters might not exist or the site structure changed.`;
      } else {
        errorMsg += `The chapter might not exist, the page has no images, or the scraper couldn't identify them.`;
      }
      return {
        success: false,
        error: errorMsg,
        constructedUrl: finalConstructedUrlMessage,
      };
    }
    
    let successMessage = `Successfully fetched ${allImages.length} images from ${successfulChaptersCount} chapter(s).`;
    if (endChap - startChap + 1 > successfulChaptersCount) {
        successMessage += ` (${(endChap - startChap + 1) - successfulChaptersCount} chapter(s) in range could not be fetched or had no images).`
    }


    return {
      success: true,
      images: allImages,
      message: successMessage,
      constructedUrl: finalConstructedUrlMessage,
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
      constructedUrl: finalConstructedUrlMessage,
    };
  }
}

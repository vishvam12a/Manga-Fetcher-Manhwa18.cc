"use server";

import { z } from "zod";

const FormSchema = z.object({
  mangaName: z.string().min(1, "Manga name is required."),
  chapterNumber: z.string().min(1, "Chapter number is required.").refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Chapter number must be a positive integer.",
  }),
});

export interface ScrapedImage {
  url: string;
  name: string; // e.g., page_1.jpg
}

export interface ScrapeResult {
  success: boolean;
  images?: ScrapedImage[];
  message?: string;
  error?: string;
  constructedUrl?: string;
}

// Simulate fetching and parsing. In a real scenario, this would involve HTTP requests and HTML parsing.
async function fetchAndParseMangaPage(url: string): Promise<ScrapedImage[]> {
  console.log(`Simulating scraping for URL: ${url}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate finding images. Let's say we find 5-15 images.
  const numImages = Math.floor(Math.random() * 11) + 5; // 5 to 15 images
  const images: ScrapedImage[] = [];

  // Special case for testing "not found" or errors
  if (url.includes("example-manga-not-found")) {
      return [];
  }
  if (url.includes("example-manga-fetch-error")) {
    throw new Error("Simulated network error fetching manga page.");
  }

  for (let i = 1; i <= numImages; i++) {
    // Generate placeholder image URLs
    const width = Math.floor(Math.random() * 200) + 700; // 700-900
    const height = Math.floor(Math.random() * 400) + 1000; // 1000-1400
    images.push({
      url: `https://placehold.co/${width}x${height}.png`,
      name: `page_${i}.png`,
    });
  }
  
  return images;
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
    // Extracting a more user-friendly error message
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

  // Basic sanitization for mangaName: lowercase, replace spaces with hyphens, remove non-alphanumeric except hyphens.
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
        error: "No images found. The manga/chapter might not exist, or the page has no images.",
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
    console.error("Scraping error:", error);
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

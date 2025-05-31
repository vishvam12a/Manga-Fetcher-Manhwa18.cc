"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import NextImage from "next/image"; // Renamed to avoid conflict with Lucide icon
import { getMangaChapterImages, type ScrapeResult, type ScrapedImage } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";

const initialState: ScrapeResult | undefined = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fetching...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Get Images
        </>
      )}
    </Button>
  );
}

export function MangaDownloaderForm() {
  const [state, formAction] = useFormState(getMangaChapterImages, initialState);
  const [displayedImages, setDisplayedImages] = useState<ScrapedImage[]>([]);

  useEffect(() => {
    if (state?.success && state.images) {
      setDisplayedImages(state.images);
    } else if (state && !state.success) { // Clear images on error
      setDisplayedImages([]);
    }
    // Do not clear on initial undefined state
  }, [state]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">Manga Chapter Downloader</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter the manga name and chapter number to fetch images.
          {state?.constructedUrl && (
            <p className="text-xs mt-1">Attempted URL: <a href={state.constructedUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{state.constructedUrl}</a></p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="mangaName" className="block text-sm font-medium text-foreground">Manga Name</label>
            <Input
              id="mangaName"
              name="mangaName"
              type="text"
              placeholder="e.g., solo-leveling or example-manga-not-found"
              required
              className="bg-input border-border placeholder:text-muted-foreground text-foreground focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="chapterNumber" className="block text-sm font-medium text-foreground">Chapter Number</label>
            <Input
              id="chapterNumber"
              name="chapterNumber"
              type="number"
              placeholder="e.g., 123"
              required
              min="1"
              className="bg-input border-border placeholder:text-muted-foreground text-foreground focus:ring-ring"
            />
          </div>
          <SubmitButton />
        </form>

        {state && !state.success && state.error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state && state.success && state.message && (
           <Alert variant="default" className="mt-6 bg-primary/10 border-primary/30">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Success</AlertTitle>
            <AlertDescription className="text-primary/80">{state.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {displayedImages.length > 0 && (
        <CardFooter className="flex flex-col items-center mt-6 pt-6 border-t border-border">
          <h3 className="text-xl font-headline mb-4 text-foreground">Fetched Images:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {displayedImages.map((image, index) => (
              <Card key={index} className="overflow-hidden bg-secondary shadow-md">
                <CardHeader className="p-3 text-center border-b border-border">
                  <CardTitle className="text-sm font-medium text-secondary-foreground truncate">{image.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 aspect-[2/3] relative bg-muted flex items-center justify-center">
                  <NextImage
                    src={image.url}
                    alt={image.name}
                    width={300}
                    height={450}
                    className="object-contain w-full h-full"
                    data-ai-hint="manga comic"
                    unoptimized={image.url.startsWith('https://placehold.co')}
                  />
                   <a
                    href={image.url}
                    download={image.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 p-2 bg-accent text-accent-foreground rounded-full hover:bg-accent/80 transition-colors shadow-lg"
                    title={`Download ${image.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardFooter>
      )}
      {!state?.images && (!state || state?.success === undefined || (state?.success === false && !displayedImages.length)) && ( // Show initial hint or if no images and not a success state
        <CardFooter className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <ImageIcon size={48} className="mb-2" />
            <p>Enter manga details above to see images here.</p>
        </CardFooter>
      )}
    </Card>
  );
}


"use client";

import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import NextImage from "next/image";
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
  const [state, formAction] = useActionState(getMangaChapterImages, initialState);
  const [displayedImages, setDisplayedImages] = useState<ScrapedImage[]>([]);

  useEffect(() => {
    if (state?.success && state.images) {
      setDisplayedImages(state.images);
    } else if (state && !state.success) {
      setDisplayedImages([]);
    }
  }, [state]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">Manga Chapter Downloader</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter the manga name and chapter(s) to fetch images.
          {state?.constructedUrl && (
             <p className="text-xs mt-1">
              {state.constructedUrl.startsWith("http")
                ? <>Attempted URL: <a href={state.constructedUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{state.constructedUrl}</a></>
                : <>Attempted: {state.constructedUrl}</>
              }
            </p>
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
              placeholder="e.g., solo-leveling"
              required
              className="bg-input border-border placeholder:text-muted-foreground text-foreground focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startChapterNumber" className="block text-sm font-medium text-foreground">Start Chapter</label>
              <Input
                id="startChapterNumber"
                name="startChapterNumber"
                type="number"
                placeholder="e.g., 123"
                required
                min="1"
                className="bg-input border-border placeholder:text-muted-foreground text-foreground focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endChapterNumber" className="block text-sm font-medium text-foreground">End Chapter (Optional)</label>
              <Input
                id="endChapterNumber"
                name="endChapterNumber"
                type="number"
                placeholder="e.g., 125"
                min="1"
                className="bg-input border-border placeholder:text-muted-foreground text-foreground focus:ring-ring"
              />
            </div>
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
          <h3 className="text-xl font-headline mb-4 text-foreground">Fetched Images ({displayedImages.length}):</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {displayedImages.map((image, index) => (
              <Card key={`${image.mangaName}-${image.chapterNumber}-${image.name}-${index}`} className="overflow-hidden bg-secondary shadow-md">
                <CardHeader className="p-3 text-center border-b border-border">
                  <CardTitle className="text-sm font-medium text-secondary-foreground truncate" title={image.name}>
                    {image.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 aspect-[2/3] relative bg-muted flex items-center justify-center">
                  <NextImage
                    src={image.url}
                    alt={image.name}
                    width={300} 
                    height={450} 
                    className="object-contain w-full h-full"
                    data-ai-hint="manga comic"
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
      {!state?.images && (!state || state?.success === undefined || (state?.success === false && !displayedImages.length)) && (
        <CardFooter className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <ImageIcon size={48} className="mb-2" />
            <p>Enter manga details above to see images here.</p>
        </CardFooter>
      )}
    </Card>
  );
}

    
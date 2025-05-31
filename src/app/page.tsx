import { MangaDownloaderForm } from "@/components/manga-downloader-form";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 md:p-12 bg-background text-foreground pt-10 sm:pt-16">
      <div className="container mx-auto max-w-4xl w-full">
        <MangaDownloaderForm />
      </div>
      <Toaster />
    </main>
  );
}

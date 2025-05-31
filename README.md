
# MangaDloader - Manga Chapter Downloader

MangaDloader is a web application built with Next.js that allows users to fetch and view images from manga chapters available on certain websites. Users can specify a manga title and a chapter number (or a range of chapters) to download the corresponding images.

## Features

- **Fetch Manga Images:** Enter a manga name and chapter number(s) to retrieve images.
- **Chapter Range Support:** Download images from a single chapter or a range of chapters.
- **Image Preview:** View fetched images directly in the browser.
- **Direct Download Links:** Each image card provides a direct download link.
- **Responsive Design:** The application is designed to work on various screen sizes.

## Technology Stack

This project is built with the following technologies:

- **Next.js:** A React framework for building server-side rendered and static web applications.
- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **ShadCN UI:** A collection of re-usable UI components.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Lucide React:** A library for beautiful and consistent icons.
- **Cheerio:** A fast, flexible, and lean implementation of core jQuery designed specifically for the server to parse HTML.
- **Genkit (Firebase):** For potential future AI-powered features (not actively used for core functionality yet).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation & Running

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002` (or another port if 9002 is in use).

4.  **Build for production:**
    ```bash
    npm run build
    ```

5.  **Start the production server:**
    ```bash
    npm run start
    ```

## Web Scraping Disclaimer

This application relies on web scraping to fetch manga images from external websites. The structure of these websites can change without notice, which may break the scraping functionality. If the scraper stops working, it will likely need to be updated to adapt to the new website structure. Please use responsibly and be mindful of the terms of service of the websites you are scraping from.

## Contributing

Feel Free To Contribute



import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Comparison Tool - Advanced Insurance Policy Analysis",
  description: "Advanced document comparison tool for insurance policy analysis and reporting",
  keywords: ["insurance", "document comparison", "policy analysis", "comparison tool"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/lucide@latest" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function initLucideIcons() {
                if (typeof lucide !== 'undefined') {
                  try {
                    lucide.createIcons();
                  } catch (e) {
                    console.warn('Lucide initialization warning:', e);
                  }
                }
              }
              
              // Initialize icons when DOM is ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initLucideIcons);
              } else {
                initLucideIcons();
              }
              
              // Reinitialize icons on DOM changes (with debouncing)
              let timeout;
              const observer = new MutationObserver(() => {
                clearTimeout(timeout);
                timeout = setTimeout(initLucideIcons, 100);
              });
              
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
            `
          }}
        />
      </body>
    </html>
  );
}
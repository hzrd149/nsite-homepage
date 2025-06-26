export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export async function getOpenGraphData(
  url: string,
): Promise<OpenGraphData | null> {
  try {
    const cached = localStorage.getItem(`og_cache_${url}`);
    if (cached) return JSON.parse(cached) as OpenGraphData;

    const data = await fetchOpenGraphData(url);
    localStorage.setItem(`og_cache_${url}`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error reading OG cache:", error);
    return null;
  }
}

export async function fetchOpenGraphData(
  url: string,
): Promise<OpenGraphData | null> {
  try {
    // Note: This will likely face CORS issues in production
    // You may need to use a proxy service or implement server-side fetching
    const response = await fetch(url, {
      mode: "cors",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const ogData: OpenGraphData = {};

    // Extract Open Graph meta tags
    const metaTags = doc.querySelectorAll('meta[property^="og:"]');
    metaTags.forEach((tag) => {
      const property = tag.getAttribute("property");
      const content = tag.getAttribute("content");

      if (property && content) {
        switch (property) {
          case "og:title":
            ogData.title = content;
            break;
          case "og:description":
            ogData.description = content;
            break;
          case "og:image":
            ogData.image = content;
            break;
          case "og:url":
            ogData.url = content;
            break;
        }
      }
    });

    // Fallback to standard HTML tags if OG tags aren't available
    if (!ogData.title) {
      const titleTag = doc.querySelector("title");
      if (titleTag) ogData.title = titleTag.textContent || undefined;
    }

    if (!ogData.description) {
      const descTag = doc.querySelector('meta[name="description"]');
      if (descTag)
        ogData.description = descTag.getAttribute("content") || undefined;
    }

    return ogData;
  } catch (error) {
    console.error("Failed to fetch Open Graph data:", error);
    return null;
  }
}

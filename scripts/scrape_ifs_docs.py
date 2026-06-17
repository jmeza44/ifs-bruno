#!/usr/bin/env python3
"""
Scrape IFS Cloud docs and save as markdown files.

Usage:
    python scrape_ifs_docs.py <url> [--out <output_dir>] [--delay <seconds>] [--headed] [--depth <n>]

Example:
    python scrape_ifs_docs.py https://docs.ifs.com/techdocs/25r1/040_tailoring/300_extensibility/ --out ifs-docs/extensibility --depth 3
"""

import argparse
import asyncio
import re
import sys
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from markdownify import markdownify
from playwright.async_api import async_playwright, Page


def url_to_path(url: str, base_url: str, out_dir: Path) -> Path:
    """
    Mirror the URL path structure as folders/files under out_dir.

    /300_extensibility/                            -> index.md
    /300_extensibility/010_get_started/            -> get-started/index.md
    /300_extensibility/010_get_started/100_api_doc -> get-started/api-doc.md
    """
    base_path = urlparse(base_url).path.rstrip("/")
    page_path = urlparse(url).path.rstrip("/")
    relative = page_path[len(base_path):].strip("/")

    if not relative:
        return out_dir / "index.md"

    segments = relative.split("/")
    clean = [re.sub(r"^\d+_", "", s).replace("_", "-") for s in segments]

    # Every segment becomes a folder; the last segment becomes index.md inside it
    return out_dir.joinpath(*clean) / "index.md"


def is_captcha_page(soup: BeautifulSoup) -> bool:
    title = soup.select_one("title")
    return title is not None and "verify" in title.get_text().lower()


async def fetch_page(page: Page, url: str) -> BeautifulSoup | None:
    try:
        await page.goto(url, wait_until="networkidle", timeout=30000)
        soup = BeautifulSoup(await page.content(), "html.parser")

        if is_captcha_page(soup):
            print("  [CAPTCHA] Solve the CAPTCHA in the browser window, then press Enter here...")
            input()
            await page.wait_for_load_state("networkidle", timeout=15000)
            soup = BeautifulSoup(await page.content(), "html.parser")

        return soup
    except Exception as e:
        print(f"  [WARN] Could not fetch {url}: {e}", file=sys.stderr)
        return None


def extract_article(soup: BeautifulSoup) -> str | None:
    article = soup.select_one("article")
    if not article:
        return None

    for a in article.select("a[href*='#']"):
        if a.get_text(strip=True) == "¶":
            a.decompose()

    return markdownify(str(article), heading_style="ATX", strip=["script", "style"])


def collect_child_links(soup: BeautifulSoup, page_url: str, base_url: str) -> list[str]:
    """Return direct child links of page_url that are still under base_url."""
    base_path = urlparse(base_url).path.rstrip("/")
    page_path = urlparse(page_url).path.rstrip("/")
    found: list[str] = []
    seen: set[str] = set()

    def harvest(scope) -> None:
        for a in scope.find_all("a", href=True):
            href = a["href"]
            if href.startswith(("?", "#", "javascript:")):
                continue
            absolute = urljoin(page_url, href)
            parsed = urlparse(absolute)
            path = parsed.path.rstrip("/")

            # Must stay under base_url
            if not path.startswith(base_path + "/"):
                continue
            # Must be a direct child of the current page
            rel = path[len(page_path):]
            if not rel.startswith("/"):
                continue
            if rel.count("/") != 1:
                continue

            clean = parsed._replace(fragment="", query="").geturl().rstrip("/") + "/"
            if clean in seen:
                continue
            seen.add(clean)
            found.append(clean)

    nav = soup.select_one("nav") or soup.select_one(".md-nav") or soup.select_one(".toc")
    article = soup.select_one("article")

    if nav:
        harvest(nav)
    if not found and article:
        harvest(article)
    if not found:
        harvest(soup)

    return found


async def scrape(base_url: str, out_dir: Path, delay: float = 0.5, headed: bool = False, max_depth: int = 2) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=not headed)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # BFS queue: (url, depth)
        queue: deque[tuple[str, int]] = deque()
        queue.append((base_url, 0))
        visited: set[str] = {base_url}
        total = 0

        while queue:
            url, depth = queue.popleft()
            print(f"[{depth}] Fetching: {url}")

            soup = await fetch_page(page, url)
            if not soup:
                continue

            content = extract_article(soup)
            if content:
                dest = url_to_path(url, base_url, out_dir)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(content, encoding="utf-8")
                print(f"  -> {dest}")
                total += 1
            else:
                print("  [SKIP] No article found.")

            if depth < max_depth:
                for child_url in collect_child_links(soup, url, base_url):
                    if child_url not in visited:
                        visited.add(child_url)
                        queue.append((child_url, depth + 1))

            if queue:
                await asyncio.sleep(delay)

        await browser.close()

    print(f"\nDone. {total} pages saved.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape IFS docs to markdown.")
    parser.add_argument("url", help="Base URL to scrape")
    parser.add_argument("--out", default="ifs-docs", help="Output directory (default: ifs-docs)")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between requests in seconds (default: 0.5)")
    parser.add_argument("--headed", action="store_true", help="Run browser in headed mode — required for CAPTCHAs")
    parser.add_argument("--depth", type=int, default=2, help="Max depth to crawl from the base URL (default: 2)")
    args = parser.parse_args()

    base_url = args.url.rstrip("/") + "/"
    out_dir = Path(args.out)

    asyncio.run(scrape(base_url, out_dir, delay=args.delay, headed=args.headed, max_depth=args.depth))


if __name__ == "__main__":
    main()

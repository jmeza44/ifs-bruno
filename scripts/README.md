# scrape_ifs_docs.py

Crawls an IFS Cloud documentation URL and saves each page as a Markdown file, mirroring the URL structure as folders. Handles CAPTCHAs interactively when they appear.

## Quick start

```bash
# Install dependencies
pip install playwright beautifulsoup4 markdownify
playwright install chromium

# Scrape a section (depth 3 = three levels deep)
python scripts/scrape_ifs_docs.py https://docs.ifs.com/techdocs/25r1/040_tailoring/300_extensibility/ \
  --out ifs-docs/extensibility \
  --depth 3
```

Output lands in `ifs-docs/extensibility/` as `index.md` files nested to match the URL tree.

## Options

| Flag       | Default      | Description                                               |
| ---------- | ------------ | --------------------------------------------------------- |
| `url`      | _(required)_ | Base URL to start crawling from                           |
| `--out`    | `ifs-docs`   | Output directory                                          |
| `--depth`  | `2`          | How many levels deep to follow links                      |
| `--delay`  | `0.5`        | Seconds to wait between requests                          |
| `--headed` | off          | Show the browser window — required when a CAPTCHA appears |

## CAPTCHA handling

If the site shows a CAPTCHA, the script pauses and prompts you to solve it in the browser window, then press Enter to continue. Run with `--headed` so the window is visible.

## URL → file path mapping

The numeric prefixes are stripped and underscores become hyphens:

| URL path                                         | File                           |
| ------------------------------------------------ | ------------------------------ |
| `/300_extensibility/`                            | `index.md`                     |
| `/300_extensibility/010_get_started/`            | `get-started/index.md`         |
| `/300_extensibility/010_get_started/100_api_doc` | `get-started/api-doc/index.md` |

## Notes

- Only pages with an `<article>` element produce output; nav-only pages are skipped.
- The crawler uses BFS, so shallower pages are always saved before deeper ones.
- Link discovery prefers `<nav>` → `<article>` → full page, in that order.

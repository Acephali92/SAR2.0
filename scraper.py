import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin, urlparse
import time
from markdownify import markdownify as md
import re

# Konfiguration
BASE_URL = "https://www.stoppramstein.de"
OUTPUT_DIR = "stoppramstein_content"
USER_AGENT = "Mozilla/5.0 (compatible; ITSystemBot/1.0; +http://example.com/bot)"

# Erstellen des Ausgabeordners, falls nicht vorhanden
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_soup(url):
    """Ruft eine URL ab und gibt das BeautifulSoup-Objekt zurück."""
    try:
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.content, 'html.parser')
    except Exception as e:
        print(f"Fehler beim Abrufen von {url}: {e}")
        return None

def clean_filename(url):
    """Erstellt einen dateisystemfreundlichen Namen aus der URL."""
    path = urlparse(url).path
    filename = path.strip("/").replace("/", "_")
    if not filename:
        filename = "index"
    # Entferne ungültige Zeichen
    return re.sub(r'[^\w\-_\.]', '', filename) + ".md"

def extract_content(soup):
    """
    Sucht nach dem Hauptinhalt basierend auf gängigen WordPress-Klassen.
    Priorität: .entry-content -> article -> main -> body
    """
    # Störfaktoren entfernen (Navigation, Sidebar, Footer, Skripte)
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    # Versuch 1: Spezifische Klasse (oft bei WordPress verwendet)
    content = soup.find(class_="entry-content")
    
    # Versuch 2: Article Tag
    if not content:
        content = soup.find("article")

    # Versuch 3: Main Tag
    if not content:
        content = soup.find("main")

    # Fallback: Body (wenn gar nichts anderes greift)
    if not content:
        content = soup.body

    return content

def main():
    print(f"Starte Scraper für {BASE_URL}...")
    
    # 1. Hauptseite abrufen
    soup = get_soup(BASE_URL)
    if not soup:
        return

    # 2. Alle internen Links sammeln
    links_to_scrape = set()
    for a_tag in soup.find_all("a", href=True):
        href = a_tag['href']
        full_url = urljoin(BASE_URL, href)
        
        # Nur Links auf derselben Domain und keine Dateien (PDF, JPG etc.)
        parsed_base = urlparse(BASE_URL)
        parsed_url = urlparse(full_url)
        
        if parsed_base.netloc == parsed_url.netloc:
            # Einfacher Filter gegen Bilder/PDFs
            if not any(full_url.lower().endswith(ext) for ext in ['.pdf', '.jpg', '.png', '.zip']):
                links_to_scrape.add(full_url)

    print(f"{len(links_to_scrape)} Unterseiten gefunden. Beginne Extraktion...")

    # 3. Jede Seite scrapen
    for index, url in enumerate(links_to_scrape):
        print(f"[{index+1}/{len(links_to_scrape)}] Bearbeite: {url}")
        
        page_soup = get_soup(url)
        if not page_soup:
            continue

        # Inhalt extrahieren
        content_element = extract_content(page_soup)
        
        if content_element:
            # Titel extrahieren (für den Header der Markdown-Datei)
            title = page_soup.title.string if page_soup.title else "Ohne Titel"
            
            # HTML zu Markdown konvertieren
            markdown_text = md(str(content_element), heading_style="ATX")
            
            # Metadaten oben hinzufügen
            final_content = f"# {title}\n\nOriginal URL: {url}\n\n---\n\n{markdown_text}"
            
            # Speichern
            filename = clean_filename(url)
            file_path = os.path.join(OUTPUT_DIR, filename)
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(final_content)
        else:
            print(f"   WARNUNG: Kein Hauptinhalt gefunden für {url}")

        # WICHTIG: Höflich bleiben und den Server nicht überlasten
        time.sleep(1)

    print(f"\nFertig! Alle Dateien wurden im Ordner '{OUTPUT_DIR}' gespeichert.")

if __name__ == "__main__":
    main()
# scrapers/spiders/ebay_spider.py

import scrapy
from scrapers.items import EbayItem
from urllib.parse import quote_plus
import re
import json
import datetime
import time
import statistics

# Codes ANSI pour la coloration (optionnel)
RESET = "\033[0m"
BOLD = "\033[1m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"

class EbaySpider(scrapy.Spider):
    name = "ebay_spider"

    def __init__(self, keyword=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Initialisation des compteurs et du temps de démarrage
        self.product_count = 0
        self.page_count = 0
        self.start_time = datetime.datetime.now()
        self.new_count = 0
        self.used_count = 0
        self.prices = []

        # En-tête de démarrage et configuration de la démo
        print(f"{BOLD}{YELLOW}==========================================")
        print("   Starting eBay scraper for 'Funko Pop Doctor Doom #561'")
        print("==========================================")
        print(f"{RESET}\n")
        
        config = {
            "Download Delay": 1.5,
            "Randomize Download Delay": True,
            "AutoThrottle Enabled": True,
            "AutoThrottle Start Delay": 1.0,
            "AutoThrottle Max Delay": 5.0,
            "Target Concurrency": 2.0,
            "Demo Mode": True
        }
        print(f"{BOLD}Configuration:{RESET}")
        for key, value in config.items():
            print(f" - {key}: {value}")
        print("")
        
        # Note sur l'utilisation des proxys et User-Agents
        print(f"{BOLD}{CYAN}Proxy Rotation: Enabled | User-Agent Rotation: Enabled{RESET}\n")

        # Choix du ZIP code (90210 pour Beverly Hills)
        zip_code = "90210"
        self.keyword = keyword or "Funko Pop Doctor Doom #561"
        self.start_urls = [
            f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(self.keyword)}&_stpos={zip_code}"
        ]

    custom_settings = {
        "DOWNLOAD_DELAY": 1.5,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 1.0,
        "AUTOTHROTTLE_MAX_DELAY": 5.0,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 2.0,
        "DEMO_MODE": True
    }

    def parse(self, response):
        self.page_count += 1
        page_start = time.time()
        print(f"\n{BOLD}=== Retrieving product listings from eBay (Page {self.page_count}) ==={RESET}\n")
        
        results = response.xpath('//li[contains(@class, "s-item")]')
        found_this_page = 0

        for product in results:
            found_this_page += 1
            item = EbayItem()

            # Extraction et nettoyage du titre
            title_parts = product.xpath(".//h3[contains(@class,'s-item__title')]//text()").getall()
            title_parts = [t.strip() for t in title_parts if t.strip()]
            if title_parts:
                if title_parts[0] in ("New Listing", "Sponsored", "New listing"):
                    title_text = " ".join(title_parts[1:]).strip()
                else:
                    title_text = " ".join(title_parts).strip()
            else:
                title_text = ""
            title_text = re.sub(r"\s*\|\s*ebay\s*$", "", title_text, flags=re.IGNORECASE).strip()
            item["title"] = title_text

            # Extraction du prix
            price_str = product.xpath('.//span[contains(@class, "s-item__price")]//text()').get()
            if price_str:
                match = re.search(r'[\d,.]+', price_str)
                item["price"] = float(match.group(0).replace(",", "")) if match else 0.0
            else:
                item["price"] = 0.0

            # Extraction de l'état (condition)
            condition = product.xpath('.//span[@class="SECONDARY_INFO"]/text()').get()
            item["item_condition"] = condition.strip() if condition else ""

            # Extraction des URLs (détail et image)
            detail_url = product.xpath('.//a[@class="s-item__link"]/@href').get()
            item["item_url"] = detail_url if detail_url else ""
            image_url = product.xpath('.//img[contains(@class, "s-item__image-img")]/@src').get()
            item["image_url"] = image_url if image_url else ""

            if item["item_url"]:
                # Ajout forcé du paramètre de position (_stpos=90210)
                forced_url = item["item_url"] + ("&" if "?" in item["item_url"] else "?") + "_stpos=90210"
                yield scrapy.Request(
                    forced_url,
                    callback=self.parse_item,
                    meta={'item': item},
                    dont_filter=True
                )
            else:
                yield item

        page_elapsed = time.time() - page_start
        print(f"{GREEN}[INFO] Page {self.page_count} processed in {page_elapsed:.2f} seconds{RESET}")
        print(f"{GREEN}[INFO] Found {found_this_page} products on this page{RESET}\n")

        # Pagination
        next_page_url = response.xpath("//a[@aria-label='Suivant' or @aria-label='Next']/@href").get()
        if next_page_url:
            yield scrapy.Request(url=next_page_url, callback=self.parse)

    def parse_item(self, response):
        print(f"\n{BOLD}=== Processing product detail page ==={RESET}")
        item = response.meta.get("item", EbayItem())

        # Extraction de l'item_id initial
        original_url = item.get("item_url", "")
        original_item_id = None
        if original_url:
            try:
                original_item_id = original_url.split("/itm/")[1].split("?")[0]
            except Exception as e:
                print(f"{RED}[WARNING] Failed to extract initial item_id from URL {original_url}: {e}{RESET}")

        # Mise à jour de l'URL (version finale)
        item["item_url"] = response.url

        # Détection d'une annonce terminée
        ended_message = " ".join(response.xpath('//div[@data-testid="d-statusmessage"]//text()').getall()).strip()
        if ended_message:
            ended_message_lower = ended_message.lower()
            if any(phrase in ended_message_lower for phrase in [
                "this listing sold on", "bidding ended on",
                "this listing was ended by the seller", "item sold on"]):
                item["ended"] = True
            else:
                item["ended"] = False
        else:
            item["ended"] = False

        # Extraction de l'item_id final
        try:
            final_item_id = response.url.split("/itm/")[1].split("?")[0]
            item["item_id"] = final_item_id
        except Exception as e:
            print(f"{RED}[WARNING] Failed to extract item_id from URL: {response.url} ({e}){RESET}")
            item["item_id"] = ""

        # Vérification d'une redirection
        if original_item_id and final_item_id and original_item_id != final_item_id:
            print(f"{CYAN}[NOTE] Redirection detected (original: {original_item_id}, final: {final_item_id}). Marking as ended.{RESET}")
            item["ended"] = True

        # Titre de secours si absent
        if not item.get("title"):
            fallback_title = (response.xpath('//meta[@property="og:title"]/@content').get() or
                              response.xpath('//title/text()').get() or "")
            fallback_title = re.sub(r"\s*\|\s*ebay\s*$", "", fallback_title, flags=re.IGNORECASE).strip()
            item["title"] = fallback_title

        # Filtrer les pages d'erreur
        if item["title"].strip().lower() == "error page":
            print(f"{RED}[INFO] Skipping product due to error page: {response.url}{RESET}")
            return

        # Ignorer les listings à variations multiples
        multi_variation_button = response.xpath(
            '//button[contains(@class, "listbox-button__control") and contains(@class, "btn--form") and @value="Select"]'
        )
        if multi_variation_button:
            print(f"{RED}[INFO] Skipping multi-variation listing: {item['title']} - URL: {response.url}{RESET}")
            return

        # Normalisation de l'état : "New" ou "Used"
        raw_condition = item.get("item_condition", "").strip().lower()
        item["normalized_condition"] = "New" if "new" in raw_condition else "Used"

        # Vérifier si le produit est signé
        item["signed"] = "signed" in item["title"].lower()

        # Déterminer si le produit est dans sa boîte
        if item["normalized_condition"] == "New":
            item["in_box"] = True
        else:
            title_lower = item["title"].lower()
            in_box_keywords = ["in box", "with box", "nib", "mib"]
            out_box_keywords = ["loose", "oob", "no box", "out of box", "ex-box"]
            if any(kw in title_lower for kw in in_box_keywords) and not any(kw in title_lower for kw in out_box_keywords):
                item["in_box"] = True
            elif any(kw in title_lower for kw in out_box_keywords):
                item["in_box"] = False
            else:
                item["in_box"] = True

        # Filtrer les bundles et listings multi-figure
        title_lower = item["title"].lower()
        if item["title"].count("#") > 1:
            print(f"{RED}[INFO] Skipping multi-figure listing: {item['title']} - URL: {response.url}{RESET}")
            return
        if any(kw in title_lower for kw in ["lot", "bundle", "set"]):
            print(f"{RED}[INFO] Skipping bundle listing: {item['title']} - URL: {response.url}{RESET}")
            return

        # Mise à jour de l'image via meta (si disponible)
        try:
            meta_img = response.xpath('//meta[@property="og:image"]/@content').get()
            if meta_img:
                item["image_url"] = meta_img.strip()
        except Exception as e:
            print(f"{RED}[ERROR] Error extracting image URL: {e}{RESET}")

        # Extraction du nom du vendeur
        try:
            seller_name = (response.xpath('//span[@class="mbg-nw"]/text()').get() or
                           response.xpath('//div[contains(@class,"info__about-seller")]/a/span/text()').get())
            item["seller_username"] = seller_name.strip() if seller_name else ""
        except Exception as e:
            print(f"{RED}[ERROR] Error extracting seller username: {e}{RESET}")
            item["seller_username"] = ""

        # Détermination du type d'annonce
        bid_button = response.xpath("//*[starts-with(@id, 'bidBtn_btn')]").get()
        bin_button = response.xpath("//*[starts-with(@id, 'binBtn_btn')]").get()
        countdown = response.xpath("//*[contains(@id, 'vi-cdown')]").get()
        if bid_button or countdown:
            item["listing_type"] = "Auction + BIN" if bin_button else "Auction"
        else:
            item["listing_type"] = "Fixed Price"

        # Extraction du nombre d'enchères
        if item["listing_type"] in ["Auction", "Auction + BIN"]:
            try:
                bid_container = response.xpath('//div[@data-testid="x-bid-count"]')
                bids_text = bid_container.xpath('.//span/text()').re_first(r'(\d+)')
                item["bids_count"] = int(bids_text) if bids_text else 0
            except Exception as e:
                print(f"{RED}[ERROR] Error extracting bids_count: {e}{RESET}")
                item["bids_count"] = 0
        else:
            item["bids_count"] = None

        # Extraction du temps restant
        try:
            raw_texts = response.css('.ux-timer__text::text').getall()
            if raw_texts:
                item["time_remaining"] = (raw_texts[1].strip() if len(raw_texts) >= 2
                                          else raw_texts[0].replace("Ends in", "").strip())
            else:
                item["time_remaining"] = None
        except Exception as e:
            print(f"{RED}[ERROR] Error extracting time_remaining: {e}{RESET}")
            item["time_remaining"] = None

        # Pour les enchères avec BIN, extraire le prix BIN
        if item["listing_type"] == "Auction + BIN":
            bin_price_str = response.css('div[data-testid="x-bin-price"] span.ux-textspans::text').get()
            if bin_price_str:
                match = re.search(r'[\d,.]+', bin_price_str)
                item["buy_it_now_price"] = float(match.group(0).replace(",", "")) if match else None
            else:
                item["buy_it_now_price"] = None
        else:
            item["buy_it_now_price"] = None

        # Extraction de la catégorie
        try:
            ld_json = response.xpath('//script[@type="application/ld+json"]/text()').get()
            if ld_json:
                data = json.loads(ld_json)
                if isinstance(data, list):
                    for entry in data:
                        if entry.get("@type") == "BreadcrumbList":
                            data = entry
                            break
                if data.get("@type") == "BreadcrumbList":
                    elements = data.get("itemListElement", [])
                    categories = [element.get("name", "").strip() for element in elements if element.get("name", "").strip().lower() != "ebay"]
                    item["category"] = " > ".join(categories)
                else:
                    item["category"] = ""
            else:
                item["category"] = ""
        except Exception as e:
            print(f"{RED}[ERROR] Error extracting category: {e}{RESET}")
            item["category"] = ""

        # Incrémenter les compteurs et collecter les stats
        self.product_count += 1
        if item["normalized_condition"] == "New":
            self.new_count += 1
        else:
            self.used_count += 1
        if item.get("price", 0) > 0:
            self.prices.append(item["price"])

        # Arrêt de la démo après 30 produits
        if self.product_count > 30:
            print(f"\n{BOLD}{YELLOW}=== Demo limit reached: 30 products processed. Stopping the scraper. ==={RESET}\n")
            self.crawler.engine.close_spider(self, reason="Demo limit reached")
            return

        # Construction du résumé synthétique pour la démo
        display_title = item.get("title", "N/A")
        if len(display_title) > 50:
            display_title = display_title[:50] + "..."
        truncated_url = response.url if len(response.url) <= 80 else response.url[:80] + "..."
        summary = (
            f"{BOLD}Product {self.product_count}/30:{RESET}\n"
            f"  Title     : {display_title}\n"
            f"  Type      : {item.get('listing_type', 'N/A')}\n"
            f"  Price     : ${item.get('price', 0):.2f}\n"
            f"  Condition : {item.get('normalized_condition', 'N/A')}\n"
            f"  In Box    : {'Yes' if item.get('in_box', False) else 'No'}\n"
        )
        if item["listing_type"] == "Auction":
            summary += (
                f"  Bids      : {item.get('bids_count', 0)}\n"
                f"  Time Left : {item.get('time_remaining', 'N/A')}\n"
            )
        elif item["listing_type"] == "Auction + BIN":
            summary += (
                f"  BIN Price : ${item.get('buy_it_now_price', 'N/A')}\n"
                f"  Bids      : {item.get('bids_count', 0)}\n"
                f"  Time Left : {item.get('time_remaining', 'N/A')}\n"
            )
        summary += f"  URL       : {truncated_url}\n"

        print(f"\n{GREEN}=== Product Summary ==={RESET}")
        print(summary)
        print(f"{GREEN}=======================\n{RESET}")
    
        yield item

    def closed(self, reason):
        end_time = datetime.datetime.now()
        elapsed = (end_time - self.start_time).total_seconds()
        rate = self.product_count / (elapsed / 60) if elapsed > 0 else 0
        print(f"\n{BOLD}{YELLOW}==========================================")
        print("            Scraping Completed")
        print("==========================================")
        print(f"[INFO] Reason for closure : {reason}")
        print(f"[INFO] Total products processed : {self.product_count}")
        print(f"[INFO] Total pages crawled      : {self.page_count}")
        print(f"[INFO] Execution time           : {elapsed:.2f} seconds")
        print(f"[INFO] Processing rate          : {rate:.2f} products/min")
        if self.prices:
            minimum = min(self.prices)
            maximum = max(self.prices)
            avg = statistics.mean(self.prices)
            print(f"[INFO] Price stats              : min=${minimum:.2f}, max=${maximum:.2f}, avg=${avg:.2f}")
        else:
            print("[INFO] No price stats available (no valid prices found)")
        print(f"[INFO] Condition summary        : New={self.new_count}, Used={self.used_count}")
        print(f"=========================================={RESET}\n")

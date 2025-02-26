# scrapers/spiders/ebay_spider.py

import scrapy
from scrapers.items import EbayItem
from urllib.parse import quote_plus
import re
import json
import datetime

class EbaySpider(scrapy.Spider):
    name = "ebay_spider"

    def __init__(self, keyword=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Initialize product counter
        self.product_count = 0
        # Track start time
        self.start_time = datetime.datetime.now()
        # Log start message
        self.logger.info("Starting eBay scraper for 'Funko Pop Doctor Doom #561'...")
        # Choisis un ZIP code US, par exemple 90210 (Beverly Hills)
        zip_code = "90210"

        if keyword:
            # Ajout de _stpos=ZIPCODE dans l'URL
            self.start_urls = [
                f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(keyword)}&_stpos={zip_code}"
            ]
        else:
            # Mot-clé par défaut
            self.start_urls = [
                f"https://www.ebay.com/sch/i.html?_nkw=smartphone&_stpos={zip_code}"
            ]

    custom_settings = {
        "DOWNLOAD_DELAY": 1.5,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 1.0,
        "AUTOTHROTTLE_MAX_DELAY": 5.0,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 2.0

    }

    def parse(self, response):
        """Extrait les informations essentielles depuis la page de résultats eBay."""
        results = response.xpath('//li[contains(@class, "s-item")]')
        for product in results:
            item = EbayItem()

            # Extraction du titre
            title_parts = product.xpath(".//h3[contains(@class,'s-item__title')]//text()").getall()
            title_parts = [t.strip() for t in title_parts if t.strip()]
            if title_parts:
                if title_parts[0] in ("New Listing", "Sponsored", "New listing"):
                    title_text = " ".join(title_parts[1:]).strip()
                else:
                    title_text = " ".join(title_parts).strip()
            else:
                title_text = ""

            # Supprime "| eBay" à la fin, en ignorant la casse et les espaces
            title_text = re.sub(r"\s*\|\s*ebay\s*$", "", title_text, flags=re.IGNORECASE).strip()
            item["title"] = title_text

            # Extraction du prix
            price_str = product.xpath('.//span[contains(@class, "s-item__price")]//text()').get()
            if price_str:
                match = re.search(r'[\d,.]+', price_str)
                if match:
                    item["price"] = float(match.group(0).replace(",", ""))
                else:
                    item["price"] = 0.0
            else:
                item["price"] = 0.0

            # Extraction de l'état du produit
            condition = product.xpath('.//span[@class="SECONDARY_INFO"]/text()').get()
            item["item_condition"] = condition.strip() if condition else ""



            # Extraction des URL et de l'image
            detail_url = product.xpath('.//a[@class="s-item__link"]/@href').get()
            item["item_url"] = detail_url if detail_url else ""
            image_url = product.xpath('.//img[contains(@class, "s-item__image-img")]/@src').get()
            item["image_url"] = image_url if image_url else ""

            if item["item_url"]:
                # Forcer l'ajout de _stpos=90210 sur l'URL du détail
                forced_url = item["item_url"]
                if "?" in forced_url:
                    forced_url += "&_stpos=90210"
                else:
                    forced_url += "?_stpos=90210"

                yield scrapy.Request(
                    forced_url,
                    callback=self.parse_item,
                    meta={'item': item},
                    dont_filter=True
                )
            else:
                yield item


        # Pagination
        next_page_url = response.xpath("//a[@aria-label='Suivant' or @aria-label='Next']/@href").get()
        if next_page_url:
            yield scrapy.Request(url=next_page_url, callback=self.parse)

    def parse_item(self, response):
        """Extracts item details and logs a detailed summary from the product page."""
        item = response.meta.get("item", EbayItem())
    
        # Récupérer l'URL initiale passée dans le meta et en extraire l'item_id initial
        original_url = item.get("item_url", "")
        original_item_id = None
        if original_url:
            try:
                original_item_id = original_url.split("/itm/")[1].split("?")[0]
            except Exception as e:
                self.logger.warning(f"Failed to extract initial item_id from URL {original_url}: {e}")

        # Update URL with the final response URL (after redirects)
        item["item_url"] = response.url

        # Detect if listing has ended
        ended_message = " ".join(response.xpath('//div[@data-testid="d-statusmessage"]//text()').getall()).strip()
        self.logger.debug("Extracted ended message: %r", ended_message)
        if ended_message:
            ended_message_lower = ended_message.lower()
            if ("this listing sold on" in ended_message_lower
                or "bidding ended on" in ended_message_lower
                or "this listing was ended by the seller" in ended_message_lower
                or "item sold on" in ended_message_lower):
                item["ended"] = True
            else:
                item["ended"] = False
        else:
            item["ended"] = False
        self.logger.debug("Final value for 'ended': %s", item["ended"])

        # Extract final item_id from response.url
        final_item_id = None
        try:
            final_item_id = response.url.split("/itm/")[1].split("?")[0]
            item["item_id"] = final_item_id
        except Exception as e:
            self.logger.warning(f"Failed to extract item_id from URL: {response.url} ({e})")
            item["item_id"] = ""

        # Mark listing as ended if item_id redirected
        if original_item_id and final_item_id and original_item_id != final_item_id:
            self.logger.info(f"Redirection detected: original_item_id={original_item_id} vs final_item_id={final_item_id}. Marking as ended.")
            item["ended"] = True

        # Fallback title if absent
        if not item.get("title"):
            title = response.xpath('//meta[@property="og:title"]/@content').get() or response.xpath('//title/text()').get() or ""
            title = re.sub(r"\s*\|\s*ebay\s*$", "", title, flags=re.IGNORECASE).strip()
            item["title"] = title

        # Skip error pages
        if item["title"].strip().lower() == "error page":
            self.logger.info(f"Skipping product due to error page: {response.url}")
            return

        # Skip multi-variation listings
        multi_variation_button = response.xpath(
            '//button[contains(@class, "listbox-button__control") and '
            'contains(@class, "btn--form") and @value="Select"]'
        )
        if multi_variation_button:
            self.logger.info(f"Skipping multi-variation listing: {item['title']} - URL: {response.url}")
            return

        # Normalize condition to "New" or "Used"
        raw_condition = item.get("item_condition", "").strip().lower()
        if "new" in raw_condition:
            item["normalized_condition"] = "New"
        else:
            item["normalized_condition"] = "Used"

        # Check for signed items
        if "signed" in item["title"].lower():
            item["signed"] = True
        else:
            item["signed"] = False

        # Determine if item is in box
        if item["normalized_condition"] == "New":
            item["in_box"] = True
        else:
            title_lower = item["title"].lower()
            in_box_keywords = ["in box", "with box", "nib", "mib"]
            out_box_keywords = ["loose", "oob", "no box", "out of box", "ex-box"]
            if any(keyword in title_lower for keyword in in_box_keywords) and not any(keyword in title_lower for keyword in out_box_keywords):
                item["in_box"] = True
            elif any(keyword in title_lower for keyword in out_box_keywords) and not any(keyword in title_lower for keyword in out_box_keywords):
                item["in_box"] = False
            else:
                item["in_box"] = True

        # Filter out bundles and multi-figure listings
        title_lower = item["title"].lower()
        if item["title"].count("#") > 1:
            self.logger.info(f"Skipping multi-figure listing: {item['title']} - URL: {response.url}")
            return
        bundle_keywords = ["lot", "bundle", "set"]
        if any(keyword in title_lower for keyword in bundle_keywords):
            self.logger.info(f"Skipping bundle listing: {item['title']} - URL: {response.url}")
            return

        # Update image URL if available
        try:
            image_url = response.xpath('//meta[@property="og:image"]/@content').get()
            if image_url:
                item["image_url"] = image_url.strip()
        except Exception as e:
            self.logger.error(f"Error extracting image URL: {e}")

        # Extract seller username
        try:
            seller_name = response.xpath('//span[@class="mbg-nw"]/text()').get() or \
                          response.xpath('//div[contains(@class,"info__about-seller")]/a/span/text()').get()
            item["seller_username"] = seller_name.strip() if seller_name else ""
        except Exception as e:
            self.logger.error(f"Error extracting seller username: {e}")
            item["seller_username"] = ""

        # Determine listing type
        bid_button = response.xpath("//*[starts-with(@id, 'bidBtn_btn')]").get()
        bin_button = response.xpath("//*[starts-with(@id, 'binBtn_btn')]").get()
        countdown = response.xpath("//*[contains(@id, 'vi-cdown')]").get()
        if bid_button or countdown:
            if bin_button:
                item["listing_type"] = "Auction + BIN"
            else:
                item["listing_type"] = "Auction"
        else:
            item["listing_type"] = "Fixed Price"
        self.logger.debug(f"Listing type: {item.get('listing_type')}")

        # Extract bids count for auctions
        if item["listing_type"] in ["Auction", "Auction + BIN"]:
            try:
                bid_container = response.xpath('//div[@data-testid="x-bid-count"]')
                bids_text = bid_container.xpath('.//span/text()').re_first(r'(\d+)')
                item["bids_count"] = int(bids_text) if bids_text else 0
            except Exception as e:
                self.logger.error(f"Error extracting bids_count: {e}")
                item["bids_count"] = 0
        else:
            item["bids_count"] = None

        # Extract time remaining
        try:
            raw_texts = response.css('.ux-timer__text::text').getall()
            if raw_texts:
                if len(raw_texts) >= 2:
                    item["time_remaining"] = raw_texts[1].strip()
                else:
                    item["time_remaining"] = raw_texts[0].replace("Ends in", "").strip()
            else:
                item["time_remaining"] = None
        except Exception as e:
            self.logger.error(f"Error extracting time_remaining: {e}")
            item["time_remaining"] = None

        # Extract Buy It Now price for Auction + BIN
        if item["listing_type"] == "Auction + BIN":
            bin_price_str = response.css('div[data-testid="x-bin-price"] span.ux-textspans::text').get()
            if bin_price_str:
                match = re.search(r'[\d,.]+', bin_price_str)
                if match:
                    item["buy_it_now_price"] = float(match.group(0).replace(",", ""))
                else:
                    item["buy_it_now_price"] = None
            else:
                item["buy_it_now_price"] = None
        else:
            item["buy_it_now_price"] = None

        # Extract category (unchanged)
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
                    items = data.get("itemListElement", [])
                    categories = []
                    for element in items:
                        name = element.get("name", "").strip()
                        if name and name.lower() != "ebay":
                            categories.append(name)
                    item["category"] = " > ".join(categories)
                else:
                    item["category"] = ""
            else:
                item["category"] = ""
        except Exception as e:
            self.logger.error(f"Error extracting category: {e}")
            item["category"] = ""

        # Increment product counter for valid items
        self.product_count += 1

        # Construct enhanced summary
        display_title = item.get("title", "N/A")
        if len(display_title) > 50:
            display_title = display_title[:50] + "..."

        truncated_url = response.url if len(response.url) <= 80 else response.url[:80] + "..."

        # Base summary fields
        summary = (
            f"Product {self.product_count}/30 :\n"  # Placeholder total of 30 for demo
            f"- Title: {display_title}\n"
            f"- Type: {item.get('listing_type', 'N/A')}\n"
            f"- Price: ${item.get('price', 0):.2f}\n"
            f"- Condition: {item.get('normalized_condition', 'N/A')}\n"
            f"- In Box: {'Yes' if item.get('in_box', False) else 'No'}\n"
        )

        # Add auction-specific fields
        if item["listing_type"] == "Auction":
            summary += (
                f"- Bids: {item.get('bids_count', 0)}\n"
                f"- Time Remaining: {item.get('time_remaining', 'N/A')}\n"
            )
        elif item["listing_type"] == "Auction + BIN":
            summary += (
                f"- BIN Price: ${item.get('buy_it_now_price', 'N/A')}\n"
                f"- Bids: {item.get('bids_count', 0)}\n"
                f"- Time Remaining: {item.get('time_remaining', 'N/A')}\n"
            )

        # Add URL
        summary += f"- URL: {truncated_url}"

        # Log the summary
        self.logger.info("\n=== Product Summary ===\n%s\n=======================\n", summary)
    
        yield item

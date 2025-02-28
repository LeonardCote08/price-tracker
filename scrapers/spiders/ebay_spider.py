# scrapers/spiders/ebay_spider.py

import scrapy
from scrapers.items import EbayItem
from urllib.parse import quote_plus
import re
import json
import datetime
import time
import statistics

# ANSI codes for color and styling
RESET = "\033[0m"
BOLD = "\033[1m"
BLUE = "\033[38;2;21;149;235m"
TURQUOISE = "\033[38;2;64;189;191m"
RED = "\033[38;2;206;71;96m"
GREEN = "\033[38;2;75;179;82m"
YELLOW = "\033[38;2;255;204;0m"

# Box drawing characters
TOP_LEFT = "╔"
TOP_RIGHT = "╗"
BOTTOM_LEFT = "╚"
BOTTOM_RIGHT = "╝"
HORIZONTAL = "═"
VERTICAL = "║"
LEFT_T = "╠"
RIGHT_T = "╣"
TOP_T = "╦"
BOTTOM_T = "╩"
CROSS = "╬"
VERT_RIGHT = "├"
VERT_LEFT = "┤"

def shorten_text(text, max_length=50):
    """Return the shortened text if it exceeds max_length characters."""
    return text if len(text) <= max_length else text[:max_length - 3] + "..."

def draw_box_line(left_char, middle_char, right_char, width=80):
    """Draw a horizontal box line with specified characters."""
    return f"{left_char}{middle_char * (width - 2)}{right_char}"

def draw_header(title, width=80):
    """Draw a section header with a title."""
    title_centered = title.center(width - 2)
    return (
        f"{LEFT_T}{HORIZONTAL * (width - 2)}{RIGHT_T}\n"
        f"{VERTICAL}{BOLD}{BLUE}{title_centered}{RESET} {VERTICAL}"
    )

def draw_content_line(content, width=80):
    """Draw a content line with left and right borders."""
    # Ensure content fits within the width
    available_space = width - 3  # 2 for VERTICAL chars, 1 for space
    if len(content) > available_space:
        content = content[:available_space - 3] + "..."
    return f"{VERTICAL}{content}{' ' * (width - len(content) - 2)}{VERTICAL}"

def format_price(price):
    """Format a price with dollar sign and proper alignment."""
    return f"${price:.2f}"

class EbaySpider(scrapy.Spider):
    name = "ebay_spider"

    def __init__(self, keyword=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Initialize counters and start time
        self.product_count = 0        # Total products attempted
        self.processed_count = 0      # Successfully scraped products
        self.ignored_count = 0        # Products ignored/skipped
        self.page_count = 0
        self.start_time = datetime.datetime.now()
        self.new_count = 0
        self.used_count = 0
        self.prices = []
        self.demo_limit_reached = False  # To stop after a demo limit
        self.demo_limit = 5
        self.box_width = 80  # Default box width

        # Start the display with the top box
        print(f"{BLUE}{draw_box_line(TOP_LEFT, HORIZONTAL, TOP_RIGHT, self.box_width)}", flush=True)
        print(f"{VERTICAL}{BOLD}{BLUE}{'PRICETRACKER'.center(self.box_width - 2)}{RESET}{BLUE}{VERTICAL}", flush=True)
        
        # Keyword section header
        print(draw_header("SEARCH PARAMETERS", self.box_width), flush=True)
        
        # Set the keyword
        self.keyword = keyword or "Funko Pop Marvel Iron Man #1424 -17 -990 -916 -591 -Venomized"
        print(draw_content_line(f"Keyword: {self.keyword}", self.box_width), flush=True)

        # Configuration section header
        print(draw_header("CONFIGURATION", self.box_width), flush=True)
        
        # Display configuration in a more structured way
        print(draw_content_line(f"Download Delay        : 1.5s", self.box_width), flush=True)
        print(draw_content_line(f"AutoThrottle          : ✓ ENABLED", self.box_width), flush=True)
        print(draw_content_line(f" ├─ Initial Delay     : 1.0s", self.box_width), flush=True)
        print(draw_content_line(f" └─ Maximum Delay     : 5.0s", self.box_width), flush=True)
        print(draw_content_line(f"Proxy Rotation        : ✓ ENABLED", self.box_width), flush=True)
        print(draw_content_line(f"User-Agent Rotation   : ✓ ENABLED", self.box_width), flush=True)
        print(draw_content_line(f"Anti-blocking Delays  : ✓ ENABLED", self.box_width), flush=True)
        print(draw_content_line(f"Demo Mode             : ✓ ENABLED", self.box_width), flush=True)

        # Product scraping section header
        print(draw_header("PRODUCT EXTRACTION", self.box_width), flush=True)

        # Set up the start URLs
        zip_code = "90210"  # Beverly Hills ZIP code
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
        
        # Page header within the box - with magnifying glass emoji
        print(draw_content_line(f"🔍 RETRIEVING PRODUCTS (Page {self.page_count})", self.box_width), flush=True)

        results = response.xpath('//li[contains(@class, "s-item")]')
        found_this_page = 0
        
        for product in results:
            found_this_page += 1
            item = EbayItem()

            # Extract and clean title
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

            # Extract price
            price_str = product.xpath('.//span[contains(@class, "s-item__price")]//text()').get()
            if price_str:
                match = re.search(r'[\d,.]+', price_str)
                item["price"] = float(match.group(0).replace(",", "")) if match else 0.0
            else:
                item["price"] = 0.0

            # Extract condition
            condition = product.xpath('.//span[@class="SECONDARY_INFO"]/text()').get()
            item["item_condition"] = condition.strip() if condition else ""

            # Extract URLs (detail and image)
            detail_url = product.xpath('.//a[@class="s-item__link"]/@href').get()
            item["item_url"] = detail_url if detail_url else ""
            image_url = product.xpath('.//img[contains(@class, "s-item__image-img")]/@src').get()
            item["image_url"] = image_url if image_url else ""

            if item["item_url"]:
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
        
        # Page summary within the box
        print(draw_content_line(f"Page {self.page_count} processed in {page_elapsed:.2f} seconds", self.box_width), flush=True)
        print(draw_content_line(f"{found_this_page} products found on this page", self.box_width), flush=True)

        next_page_url = response.xpath("//a[@aria-label='Next']/@href").get()
        if next_page_url:
            yield scrapy.Request(url=next_page_url, callback=self.parse)

    def parse_item(self, response):
        if self.demo_limit_reached:
            return

        # Increment attempted product counter
        self.product_count += 1
        prod_num = self.product_count  # Save product number for summary

        item = response.meta.get("item", EbayItem())
        original_url = item.get("item_url", "")
        original_item_id = None
        if original_url:
            try:
                original_item_id = original_url.split("/itm/")[1].split("?")[0]
            except Exception:
                pass
        item["item_url"] = response.url

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

        try:
            final_item_id = response.url.split("/itm/")[1].split("?")[0]
            item["item_id"] = final_item_id
        except Exception:
            item["item_id"] = ""

        if original_item_id and final_item_id and original_item_id != final_item_id:
            item["ended"] = True

        if not item.get("title"):
            fallback_title = (response.xpath('//meta[@property="og:title"]/@content').get() or
                              response.xpath('//title/text()').get() or "")
            fallback_title = re.sub(r"\s*\|\s*ebay\s*$", "", fallback_title, flags=re.IGNORECASE).strip()
            item["title"] = fallback_title

        # Check for error pages (eBay Home or error page)
        if item["title"].strip().lower() in ["ebay home", "error page"]:
            reason = "Product page not found"
            print(draw_content_line(f"[{prod_num:02d}/{self.demo_limit}] {RED}✖ Skipping - {reason}{RESET}", self.box_width), flush=True)
            self.ignored_count += 1
            return

        multi_variation_button = response.xpath(
            '//button[contains(@class, "listbox-button__control") and contains(@class, "btn--form") and @value="Select"]'
        )
        if multi_variation_button:
            reason = "Multi-variation listing"
            print(draw_content_line(f"[{prod_num:02d}/{self.demo_limit}] {RED}✖ Skipping - {reason}{RESET}", self.box_width), flush=True)
            self.ignored_count += 1
            return

        raw_condition = item.get("item_condition", "").strip().lower()
        item["normalized_condition"] = "New" if "new" in raw_condition else "Used"
        item["signed"] = "signed" in item["title"].lower()

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

        title_lower = item["title"].lower()
        if item["title"].count("#") > 1:
            reason = "Multi-figure listing"
            print(draw_content_line(f"[{prod_num:02d}/{self.demo_limit}] {RED}✖ Skipping - {reason}{RESET}", self.box_width), flush=True)
            self.ignored_count += 1
            return
        if any(kw in title_lower for kw in ["lot", "bundle", "set"]):
            reason = "Bundle listing"
            print(draw_content_line(f"[{prod_num:02d}/{self.demo_limit}] {RED}✖ Skipping - {reason}{RESET}", self.box_width), flush=True)
            self.ignored_count += 1
            return

        try:
            meta_img = response.xpath('//meta[@property="og:image"]/@content').get()
            if meta_img:
                item["image_url"] = meta_img.strip()
        except Exception:
            pass

        try:
            seller_name = (response.xpath('//span[@class="mbg-nw"]/text()').get() or
                           response.xpath('//div[contains(@class,"info__about-seller")]/a/span/text()').get())
            item["seller_username"] = seller_name.strip() if seller_name else ""
        except Exception:
            item["seller_username"] = ""

        bid_button = response.xpath("//*[starts-with(@id, 'bidBtn_btn')]").get()
        bin_button = response.xpath("//*[starts-with(@id, 'binBtn_btn')]").get()
        countdown = response.xpath("//*[contains(@id, 'vi-cdown')]").get()
        if bid_button or countdown:
            item["listing_type"] = "Auction + BIN" if bin_button else "Auction"
        else:
            item["listing_type"] = "Fixed Price"

        if item["listing_type"] in ["Auction", "Auction + BIN"]:
            try:
                bid_container = response.xpath('//div[@data-testid="x-bid-count"]')
                bids_text = bid_container.xpath('.//span/text()').re_first(r'(\d+)')
                item["bids_count"] = int(bids_text) if bids_text else 0
            except Exception:
                item["bids_count"] = 0
        else:
            item["bids_count"] = None

        try:
            raw_texts = response.css('.ux-timer__text::text').getall()
            if raw_texts:
                item["time_remaining"] = (raw_texts[1].strip() if len(raw_texts) >= 2
                                          else raw_texts[0].replace("Ends in", "").strip())
            else:
                item["time_remaining"] = None
        except Exception:
            item["time_remaining"] = None

        if item["listing_type"] == "Auction + BIN":
            bin_price_str = response.css('div[data-testid="x-bin-price"] span.ux-textspans::text').get()
            if bin_price_str:
                match = re.search(r'[\d,.]+', bin_price_str)
                item["buy_it_now_price"] = float(match.group(0).replace(",", "")) if match else None
            else:
                item["buy_it_now_price"] = None
        else:
            item["buy_it_now_price"] = None

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
                    categories = [element.get("name", "").strip() for element in elements 
                                  if element.get("name", "").strip().lower() != "ebay"]
                    item["category"] = " > ".join(categories)
                else:
                    item["category"] = ""
            else:
                item["category"] = ""
        except Exception:
            item["category"] = ""

        # Update condition counters and price stats (only for processed products)
        if item["normalized_condition"] == "New":
            self.new_count += 1
        else:
            self.used_count += 1
        if item.get("price", 0) > 0:
            self.prices.append(item["price"])
        self.processed_count += 1

        # Display product info in the compact format seen in screenshots
        title_display = shorten_text(item.get("title", "N/A"), 50)
        
        # Success case - green checkmark and title on one line
        print(draw_content_line(f"[{prod_num:02d}/{self.demo_limit}] {GREEN}✓ {title_display}{RESET}", self.box_width), flush=True)
        # Price on the next line with a dollar sign
        print(draw_content_line(f"    $ {item.get('price', 0):.2f}", self.box_width), flush=True)

        # Check if demo limit reached
        if self.product_count >= self.demo_limit and not self.demo_limit_reached:
            print(draw_content_line(f"{YELLOW}⚠ Demo limit reached: {self.demo_limit} products processed. Stopping scraper.{RESET}", self.box_width), flush=True)
            self.demo_limit_reached = True
            self.crawler.engine.close_spider(self, reason="Demo limit reached")
            return

        yield item

    def closed(self, reason):
        reason = reason or "shutdown"
        end_time = datetime.datetime.now()
        elapsed = (end_time - self.start_time).total_seconds()
        rate = self.product_count / (elapsed / 60) if elapsed > 0 else 0

        # Draw line separator before summary
        print(f"{BLUE}{draw_box_line(LEFT_T, HORIZONTAL, RIGHT_T, self.box_width)}", flush=True)
        
        # Summary header
        print(draw_header("EXTRACTION SUMMARY", self.box_width), flush=True)
        
        # Display summary statistics in a structured way
        print(draw_content_line(f"Reason for closure      : {reason}", self.box_width), flush=True)
        print(draw_content_line(f"Products attempted      : {self.product_count}", self.box_width), flush=True)
        print(draw_content_line(f"Successfully processed  : {self.processed_count}", self.box_width), flush=True)
        print(draw_content_line(f"Ignored products        : {self.ignored_count}", self.box_width), flush=True)
        print(draw_content_line(f"Pages crawled           : {self.page_count}", self.box_width), flush=True)
        print(draw_content_line(f"Execution time          : {elapsed:.2f} seconds", self.box_width), flush=True)
        print(draw_content_line(f"Processing rate         : {rate:.2f} products/min", self.box_width), flush=True)
        
        # Price statistics section with chart emoji
        print(draw_content_line(f"📊 PRICE STATISTICS", self.box_width), flush=True)
        if self.prices:
            minimum = min(self.prices)
            maximum = max(self.prices)
            avg = statistics.mean(self.prices)
            print(draw_content_line(f" ├─ Minimum             : ${minimum:.2f}", self.box_width), flush=True)
            print(draw_content_line(f" ├─ Maximum             : ${maximum:.2f}", self.box_width), flush=True)
            print(draw_content_line(f" └─ Average             : ${avg:.2f}", self.box_width), flush=True)
        else:
            print(draw_content_line(f" └─ No price statistics available (no valid prices found)", self.box_width), flush=True)
        
        # Condition summary section with box emoji
        print(draw_content_line(f"📦 PRODUCT CONDITIONS", self.box_width), flush=True)
        print(draw_content_line(f" ├─ New                 : {self.new_count}", self.box_width), flush=True)
        print(draw_content_line(f" └─ Used                : {self.used_count}", self.box_width), flush=True)
        
        # Close the box
        print(f"{BLUE}{draw_box_line(BOTTOM_LEFT, HORIZONTAL, BOTTOM_RIGHT, self.box_width)}{RESET}", flush=True)
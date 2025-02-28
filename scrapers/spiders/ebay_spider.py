# scrapers/spiders/ebay_spider.py

import scrapy
from scrapers.items import EbayItem
from urllib.parse import quote_plus
import re
import json
import datetime
import time
import statistics

# ANSI codes for color
RESET = "\033[38;2;241;241;242m"
BOLD = "\033[1m"
BLUE = "\033[38;2;21;149;235m"
TURQUOISE = "\033[38;2;64;189;191m"
GREEN = "\033[38;2;80;200;120m"
RED = "\033[38;2;206;71;96m"
YELLOW = "\033[38;2;255;204;0m"

def shorten_url(url, max_length=60):
    """Return the shortened URL if it exceeds max_length characters."""
    return url if len(url) <= max_length else url[:max_length] + "..."

def shorten_text(text, max_length=45):
    """Return the shortened text if it exceeds max_length characters."""
    if not text:
        return "N/A"
    return text if len(text) <= max_length else text[:max_length - 3] + "..."

# Function to calculate visible length (ignoring ANSI sequences)
def visible_length(text):
    """Calculate the visible length of text (ignoring ANSI color codes)."""
    # Pattern to match ANSI escape sequences
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return len(ansi_escape.sub('', text))

# Box drawing characters
TOP_LEFT = "╔"
TOP_RIGHT = "╗"
BOTTOM_LEFT = "╚"
BOTTOM_RIGHT = "╝"
HORIZONTAL = "═"
VERTICAL = "║"

# Sub-box drawing characters
SUB_TOP_LEFT = "┌"
SUB_TOP_RIGHT = "┐"
SUB_BOTTOM_LEFT = "└"
SUB_BOTTOM_RIGHT = "┘"
SUB_HORIZONTAL = "─"
SUB_VERTICAL = "│"

# Main header box (70 chars wide)
def main_header_box(title):
    width = 70
    top_border = f"{BOLD}{BLUE}{TOP_LEFT}{HORIZONTAL * (width - 2)}{TOP_RIGHT}{RESET}"
    title_line = f"{BOLD}{BLUE}{VERTICAL}{title.center(width - 2)}{VERTICAL}{RESET}"
    bottom_border = f"{BOLD}{BLUE}{BOTTOM_LEFT}{HORIZONTAL * (width - 2)}{BOTTOM_RIGHT}{RESET}"
    return f"{top_border}\n{title_line}\n{bottom_border}"

# Sub header box (70 chars wide)
def sub_header_box(title):
    width = 70
    top_border = f"{BOLD}{TURQUOISE}{SUB_TOP_LEFT}{SUB_HORIZONTAL * (width - 2)}{SUB_TOP_RIGHT}{RESET}"
    title_line = f"{BOLD}{TURQUOISE}{SUB_VERTICAL}{title.center(width - 2)}{SUB_VERTICAL}{RESET}"
    bottom_border = f"{BOLD}{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * (width - 2)}{SUB_BOTTOM_RIGHT}{RESET}"
    return f"{top_border}\n{title_line}\n{bottom_border}"

# Alert box for notifications (70 chars wide)
def alert_box(title, icon="⚠️", color=YELLOW):
    width = 70
    top_border = f"{BOLD}{color}{icon} {HORIZONTAL * (width - 4)} {icon}{RESET}"
    content = f"{BOLD}{color}{title.center(width)}{RESET}"
    bottom_border = f"{BOLD}{color}{icon} {HORIZONTAL * (width - 4)} {icon}{RESET}"
    return f"{top_border}\n{content}\n{bottom_border}"

# Improved section box with precise width control
def section_box(title, lines, width=66):
    result = []
    
    # Add the title in the top border
    if title:
        title_part = f" {title} "
        left_padding = title_part
        right_padding = SUB_HORIZONTAL * (width - len(title_part))
    else:
        left_padding = ""
        right_padding = SUB_HORIZONTAL * width
    
    result.append(f"{TURQUOISE}{SUB_TOP_LEFT}{left_padding}{right_padding}{SUB_TOP_RIGHT}{RESET}")
    
    # Add content lines with proper padding
    for line in lines:
        # Calculate visible content length
        content = f"{RESET}{line}"
        visible_content_length = visible_length(content)
        
        # Calculate padding needed
        padding = width - visible_content_length
        result.append(f"{TURQUOISE}{SUB_VERTICAL}{content}{' ' * padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
    
    # Add bottom border
    result.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
    
    return "\n".join(result)

# Simplified product box with all information in one section
def product_box(product_num, total, success, item):
    if not success:
        reason = item.get("filter_reason", "Unknown reason")
        return f"{RED}PRODUCT [{product_num:02}/{total}] ❌ FILTERED: {reason}{RESET}"
    
    box_width = 70
    inner_width = box_width - 4  # For borders and spacing
    
    # Prepare main product info
    header = f"{GREEN}PRODUCT [{product_num:02}/{total}] ✅{RESET}"
    display_title = shorten_text(item.get("title", "N/A"), 55)
    price = item.get('price', 0)
    price_str = f"${price:.2f}" if isinstance(price, float) else "N/A"
    
    # Start the box
    lines = []
    lines.append(f"{TURQUOISE}{SUB_TOP_LEFT}{SUB_HORIZONTAL * (box_width - 2)}{SUB_TOP_RIGHT}{RESET}")
    
    # Add header with proper padding
    header_padding = box_width - visible_length(f" {header}") - 2
    lines.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET} {header}{' ' * header_padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
    
    # Add title with proper padding
    title_line = f"  Title      : {BOLD}{display_title}{RESET}"
    title_padding = box_width - visible_length(f" {title_line}") - 2
    lines.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET} {title_line}{' ' * title_padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
    
    # Add price with proper padding
    price_line = f"  Price      : {BOLD}{price_str}{RESET}"
    price_padding = box_width - visible_length(f" {price_line}") - 2
    lines.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET} {price_line}{' ' * price_padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
    
    # Listing details subheader - format it similar to the desired output
    details_title = " Listing Details "
    details_line_content = f"  {TURQUOISE}{details_title}{SUB_HORIZONTAL * (box_width - 6 - len(details_title))}{RESET}"
    details_line_padding = box_width - visible_length(f" {details_line_content}") - 2
    lines.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET} {details_line_content}{' ' * details_line_padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
    
    # Add all listing details in one section
    details_lines = []
    
    # Basic details
    details_lines.append(f"  Condition  : {item.get('normalized_condition', 'N/A')}")
    details_lines.append(f"  Type       : {item.get('listing_type', 'N/A')}")
    
    # Add seller username
    seller_username = shorten_text(item.get('seller_username', 'N/A'), 35)
    details_lines.append(f"  Seller     : {seller_username}")
    
    # Add item ID
    item_id = shorten_text(item.get('item_id', 'N/A'), 35)
    details_lines.append(f"  Item ID    : {item_id}")
    
    # Add auction-specific details
    if item.get("listing_type") == "Auction":
        details_lines.append(f"  Bids       : {item.get('bids_count', 0)}")
        details_lines.append(f"  Time Left  : {item.get('time_remaining', 'N/A')}")
    elif item.get("listing_type") == "Auction + BIN":
        bin_price = item.get('buy_it_now_price')
        bin_price_str = f"${bin_price:.2f}" if isinstance(bin_price, float) else "N/A"
        details_lines.append(f"  BIN Price  : {bin_price_str}")
        details_lines.append(f"  Bids       : {item.get('bids_count', 0)}")
        details_lines.append(f"  Time Left  : {item.get('time_remaining', 'N/A')}")
    
    # Add all details with proper padding
    for detail in details_lines:
        detail_padding = box_width - visible_length(f" {detail}") - 2
        lines.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET} {detail}{' ' * detail_padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
    
    # Close the box
    lines.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * (box_width - 2)}{SUB_BOTTOM_RIGHT}{RESET}")
    
    return "\n".join(lines)

def create_progress_bar(value, total, width=30, char="█"):
    """Create a visual progress bar."""
    percent = value / total if total > 0 else 0
    bar_width = int(width * percent)
    return char * bar_width + " " * (width - bar_width)

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
        self.max_products = 30   # For display purposes
        
        # Startup header
        print(main_header_box("PRICETRACKER"), flush=True)
        print(f"\n{BOLD}🔍 Keyword:{RESET} Funko Pop Doctor Doom #561\n", flush=True)
        
        # Configuration section
        print(main_header_box("CONFIGURATION"), flush=True)
        config = {
            "Download Delay": 1.5,
            "AutoThrottle Start Delay": 1.0,
            "AutoThrottle Max Delay": 5.0,
            "Proxy Rotation": "Enabled",
            "User-Agent Rotation": "Enabled",
            "Anti-blocking delays": "Enabled",
            "Demo Mode": True
        }
        
        # Network settings section
        network_lines = [
            f"  Download Delay       : {config['Download Delay']}s",
            f"  Proxy Rotation       : {config['Proxy Rotation']}",
            f"  User-Agent Rotation  : {config['User-Agent Rotation']}",
            f"  Anti-blocking Delays : {config['Anti-blocking delays']}"
        ]
        
        # Throttle control section
        throttle_lines = [
            f"  AutoThrottle         : ON",
            f"  Initial Delay        : {config['AutoThrottle Start Delay']}s",
            f"  Maximum Delay        : {config['AutoThrottle Max Delay']}s"
        ]
        
        # Mode section
        mode_lines = [
            f"  Demo Mode            : {config['Demo Mode']}  (5 product limit)"
        ]
        
        print("\n" + section_box("Network Settings", network_lines), flush=True)
        print("\n" + section_box("Throttle Control", throttle_lines), flush=True)
        print("\n" + section_box("Mode", mode_lines), flush=True)
        print("", flush=True)

        # Product scraping section
        print(main_header_box("PRODUCT SCRAPING"), flush=True)
        print("", flush=True)
        
        zip_code = "90210"  # Beverly Hills ZIP code
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
        
        # Page header
        page_header = sub_header_box(f"RETRIEVING PRODUCTS (Page {self.page_count}/?)")
        print(page_header, flush=True)
        
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
        
        width = 66  # Width of the box
        
        # Create page summary box with correct width for all elements
        summary_title = "Page Summary"
        # Create the box top
        summary_box = []
        title_part = f" {summary_title} "
        summary_box.append(f"{TURQUOISE}{SUB_TOP_LEFT}{title_part}{SUB_HORIZONTAL * (width - len(title_part))}{SUB_TOP_RIGHT}{RESET}")
        
        # Add content with correct padding
        line1 = f"  ⏱️  Page processed in {page_elapsed:.2f} seconds"
        line2 = f"  📊 Found {found_this_page} products on this page"
        
        padding1 = width - visible_length(line1)
        padding2 = width - visible_length(line2)
        
        summary_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line1}{' ' * padding1}{TURQUOISE}{SUB_VERTICAL}{RESET}")
        summary_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line2}{' ' * padding2}{TURQUOISE}{SUB_VERTICAL}{RESET}")
        
        # Add the bottom of the box
        summary_box.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
        
        print("\n".join(summary_box), flush=True)
        print("", flush=True)

        next_page_url = response.xpath("//a[@aria-label='Suivant' or @aria-label='Next']/@href").get()
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
            except Exception as e:
                print(f"{BOLD}{RED}[WARNING] Failed to extract initial item_id from URL {shorten_url(original_url)}: {e}{RESET}", flush=True)
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
        except Exception as e:
            print(f"{BOLD}{RED}[WARNING] Failed to extract item_id from URL: {shorten_url(response.url)} ({e}){RESET}", flush=True)
            item["item_id"] = ""

        if original_item_id and final_item_id and original_item_id != final_item_id:
            print(f"{BOLD}{RED}[NOTE] Redirection detected (original: {original_item_id}, final: {final_item_id}). Marking as ended.{RESET}", flush=True)
            item["ended"] = True

        if not item.get("title"):
            fallback_title = (response.xpath('//meta[@property="og:title"]/@content').get() or
                              response.xpath('//title/text()').get() or "")
            fallback_title = re.sub(r"\s*\|\s*ebay\s*$", "", fallback_title, flags=re.IGNORECASE).strip()
            item["title"] = fallback_title

        # Check for error pages (eBay Home or error page)
        if item["title"].strip().lower() in ["ebay home", "error page"]:
            item["filter_reason"] = "Content unavailable (page not found)"
            print(product_box(prod_num, self.max_products, False, item), flush=True)
            self.ignored_count += 1
            return

        multi_variation_button = response.xpath(
            '//button[contains(@class, "listbox-button__control") and contains(@class, "btn--form") and @value="Select"]'
        )
        if multi_variation_button:
            item["filter_reason"] = "Multi-variation listing excluded"
            print(product_box(prod_num, self.max_products, False, item), flush=True)
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
            item["filter_reason"] = "Multi-figure listing excluded"
            print(product_box(prod_num, self.max_products, False, item), flush=True)
            self.ignored_count += 1
            return
        if any(kw in title_lower for kw in ["lot", "bundle", "set"]):
            item["filter_reason"] = "Bundle listing excluded"
            print(product_box(prod_num, self.max_products, False, item), flush=True)
            self.ignored_count += 1
            return

        try:
            meta_img = response.xpath('//meta[@property="og:image"]/@content').get()
            if meta_img:
                item["image_url"] = meta_img.strip()
        except Exception as e:
            print(f"{BOLD}{RED}[ERROR] Error extracting image URL: {e}{RESET}", flush=True)

        try:
            seller_name = (response.xpath('//span[@class="mbg-nw"]/text()').get() or
                           response.xpath('//div[contains(@class,"info__about-seller")]/a/span/text()').get())
            item["seller_username"] = seller_name.strip() if seller_name else ""
        except Exception as e:
            print(f"{BOLD}{RED}[ERROR] Error extracting seller username: {e}{RESET}", flush=True)
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
            except Exception as e:
                print(f"{BOLD}{RED}[ERROR] Error extracting bids_count: {e}{RESET}", flush=True)
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
        except Exception as e:
            print(f"{BOLD}{RED}[ERROR] Error extracting time_remaining: {e}{RESET}", flush=True)
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
        except Exception as e:
            print(f"{BOLD}{RED}[ERROR] Error extracting category: {e}{RESET}", flush=True)
            item["category"] = ""

        # Update condition counters and price stats (only for processed products)
        if item["normalized_condition"] == "New":
            self.new_count += 1
        else:
            self.used_count += 1
        if item.get("price", 0) > 0:
            self.prices.append(item["price"])
        self.processed_count += 1

        # Display product info with the new format
        print(product_box(prod_num, self.max_products, True, item), flush=True)
        print("", flush=True)
        
        if self.product_count >= self.demo_limit and not self.demo_limit_reached:
            print(alert_box("DEMO LIMIT REACHED: 5 PRODUCTS PROCESSED", "⚠️"), flush=True)
            print(alert_box("STOPPING THE SCRAPER", "🛑", RED), flush=True)
            print("", flush=True)
            self.demo_limit_reached = True
            self.crawler.engine.close_spider(self, reason="Demo limit reached")
            return
            
        yield item

    def closed(self, reason):
        reason = reason or "shutdown"
        end_time = datetime.datetime.now()
        elapsed = (end_time - self.start_time).total_seconds()
        rate = self.product_count / (elapsed / 60) if elapsed > 0 else 0

        # Display final summary
        print(main_header_box("SCRAPING COMPLETED"), flush=True)
        
        # Summary section - create custom box with correct width
        width = 66
        summary_title = "Summary"
        summary_box = []
        
        # Create box top with title
        title_part = f" {summary_title} "
        summary_box.append(f"{TURQUOISE}{SUB_TOP_LEFT}{title_part}{SUB_HORIZONTAL * (width - len(title_part))}{SUB_TOP_RIGHT}{RESET}")
        
        # Add content lines with correct padding
        summary_lines = [
            f"  Reason for closure       : {reason}",
            f"  Total products attempted : {self.product_count}",
            f"  Successfully processed   : {self.processed_count}",
            f"  Filtered products        : {self.ignored_count}",
            f"  Total pages crawled      : {self.page_count}",
            f"  Execution time           : {elapsed:.2f} seconds",
            f"  Processing rate          : {rate:.2f} products/min"
        ]
        
        for line in summary_lines:
            padding = width - visible_length(line)
            summary_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line}{' ' * padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
        
        # Add box bottom
        summary_box.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
        
        print("\n" + "\n".join(summary_box), flush=True)
        print("", flush=True)

        # Price statistics
        price_stats_box = sub_header_box("PRICE STATISTICS")
        print(price_stats_box, flush=True)
        
        if self.prices:
            minimum = min(self.prices)
            maximum = max(self.prices)
            avg = statistics.mean(self.prices)
            
            # Create custom stats box with correct width
            stats_box = []
            
            # Create box top (without title in this case)
            stats_box.append(f"{TURQUOISE}{SUB_TOP_LEFT}{SUB_HORIZONTAL * width}{SUB_TOP_RIGHT}{RESET}")
            
            # Add price stats with correct padding
            price_lines = [
                f"  ↓ Minimum price  : ${minimum:.2f}",
                f"  ↑ Maximum price  : ${maximum:.2f}",
                f"  ~ Average price  : ${avg:.2f}"
            ]
            
            for line in price_lines:
                padding = width - visible_length(line)
                stats_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line}{' ' * padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
            
            # Add box bottom
            stats_box.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
            
            print("\n".join(stats_box), flush=True)
        else:
            # Create custom box for no stats
            no_stats_box = []
            no_stats_box.append(f"{TURQUOISE}{SUB_TOP_LEFT}{SUB_HORIZONTAL * width}{SUB_TOP_RIGHT}{RESET}")
            
            line = f"  No price stats available (no valid prices found)"
            padding = width - visible_length(line)
            no_stats_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line}{' ' * padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
            
            no_stats_box.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
            
            print("\n".join(no_stats_box), flush=True)
            
        print("", flush=True)

        # Condition summary with visual bars
        condition_box = sub_header_box("CONDITION SUMMARY")
        print(condition_box, flush=True)
        
        total = self.new_count + self.used_count
        if total > 0:
            new_percent = (self.new_count / total * 100)
            used_percent = (self.used_count / total * 100)
            
            new_bar = create_progress_bar(self.new_count, total, 30)
            used_bar = create_progress_bar(self.used_count, total, 30)
            
            # Create custom condition box with correct width
            condition_summary_box = []
            condition_summary_box.append(f"{TURQUOISE}{SUB_TOP_LEFT}{SUB_HORIZONTAL * width}{SUB_TOP_RIGHT}{RESET}")
            
            condition_lines = [
                f"  New  : {new_bar} {self.new_count} ({new_percent:.1f}%)",
                f"  Used : {used_bar} {self.used_count} ({used_percent:.1f}%)"
            ]
            
            for line in condition_lines:
                padding = width - visible_length(line)
                condition_summary_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line}{' ' * padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
            
            condition_summary_box.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
            
            print("\n".join(condition_summary_box), flush=True)
        else:
            # Create custom box for no condition stats
            no_condition_box = []
            no_condition_box.append(f"{TURQUOISE}{SUB_TOP_LEFT}{SUB_HORIZONTAL * width}{SUB_TOP_RIGHT}{RESET}")
            
            line = f"  No condition stats available (no items processed)"
            padding = width - visible_length(line)
            no_condition_box.append(f"{TURQUOISE}{SUB_VERTICAL}{RESET}{line}{' ' * padding}{TURQUOISE}{SUB_VERTICAL}{RESET}")
            
            no_condition_box.append(f"{TURQUOISE}{SUB_BOTTOM_LEFT}{SUB_HORIZONTAL * width}{SUB_BOTTOM_RIGHT}{RESET}")
            
            print("\n".join(no_condition_box), flush=True)
            
        print("", flush=True)
# scrapers/spiders/ebay_spider.py

import scrapy
from scrapers.items import EbayItem
from urllib.parse import quote_plus
import re
import json
from urllib.parse import quote_plus
from scrapy.exceptions import DropItem

class EbaySpider(scrapy.Spider):
    name = "ebay_spider"

    def __init__(self, keyword=None, mode="active", *args, **kwargs):
        super().__init__(*args, **kwargs)
        zip_code = "90210"  # Code postal par défaut (optionnel, peut être ajusté)
        if mode == "ended":
            self.start_urls = [
                f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(keyword)}&_sacat=0&_from=R40&_trksid=p2334524.m570.l1313&rt=nc&_odkw={quote_plus('<Funko Pop Doctor Doom>')}&LH_Complete=1&LH_Sold=1&_stpos={zip_code}"
            ]
        else:
            self.start_urls = [f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(keyword)}&_stpos={zip_code}"]
        self.keyword = keyword

    custom_settings = {
        "DOWNLOAD_DELAY": 2.0,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 2.0,
        "AUTOTHROTTLE_MAX_DELAY": 10.0,
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
        """Extrait l'ID, le vendeur, la catégorie et les nouveaux champs depuis la page détaillée, y compris pour les annonces terminées."""
        item = response.meta.get("item", EbayItem())
        item["item_url"] = response.url

        # Log de l'URL de la page de détail
        self.logger.debug("URL de détail utilisée: %s", response.url)

        # Log d'un extrait de la réponse (pour voir le contenu brut)
        self.logger.debug("Extrait de la réponse: %s", response.text[:500])

        # --- Détection améliorée d'une annonce terminée ---
        ended_message = " ".join(response.xpath('//div[@data-testid="d-statusmessage"]//text()').getall()).strip()
        self.logger.debug("Ended message extrait : %r", ended_message)

        # Liste élargie des phrases indicatives d'une annonce terminée
        ended_phrases = [
            "this listing sold on", "bidding ended on", "this listing was ended by the seller",
            "item sold on", "listing ended", "item closed", "no longer available", "sale completed",
            "ended", "sold out", "final sale"
        ]
    
        # Vérification si l'une des phrases est présente dans ended_message
        if ended_message:
            ended_message_lower = ended_message.lower()
            item["ended"] = any(phrase in ended_message_lower for phrase in ended_phrases)
        else:
            item["ended"] = False

        # Vérification supplémentaire via des éléments HTML spécifiques (par exemple, badge "Ended")
        if not item["ended"]:
            ended_badge = response.xpath('//span[contains(text(), "Ended")]').get()
            if ended_badge:
                item["ended"] = True

        self.logger.debug("Valeur finale pour 'ended': %s", item["ended"])

        # --- Extraction de l'ID (item_id) ---
        try:
            item_id = response.url.split("/itm/")[1].split("?")[0]
            item["item_id"] = item_id
        except Exception as e:
            self.logger.warning(f"Impossible d'extraire l'item_id de l'URL: {response.url} ({e})")
            item["item_id"] = ""

        # --- Extraction du titre avec fallback ---
        if not item.get("title"):
            title = response.xpath('//meta[@property="og:title"]/@content').get() or response.xpath('//title/text()').get() or ""
            title = re.sub(r"\s*\|\s*ebay\s*$", "", title, flags=re.IGNORECASE).strip()
            item["title"] = title

        # --- Ignorer les listings multi-variation ---
        multi_variation_button = response.xpath(
            '//button[contains(@class, "listbox-button__control") and '
            'contains(@class, "btn--form") and @value="Select"]'
        )
        if multi_variation_button:
            self.logger.info(f"Ignoring multi-variation listing with MPN: Select: {item['title']}")
            return

        # --- Normalisation de la condition ---
        raw_condition = item.get("item_condition", "").strip().lower()
        if "new" in raw_condition:
            item["normalized_condition"] = "New"
        else:
            item["normalized_condition"] = "Used"

        # --- Détection de la signature dans le titre ---
        if "signed" in item["title"].lower():
            item["signed"] = True
        else:
            item["signed"] = False

        # Détermination de la présence de la boîte
        if item["normalized_condition"] == "New":
            item["in_box"] = True
        else:
            # Pour les articles "Used", cherchez des indices dans le titre
            title_lower = item["title"].lower()
            in_box_keywords = ["in box", "with box", "nib", "mib"]
            out_box_keywords = ["loose", "oob", "no box", "out of box", "ex-box"]
            if any(keyword in title_lower for keyword in in_box_keywords) and not any(keyword in title_lower for keyword in out_box_keywords):
                item["in_box"] = True
            elif any(keyword in title_lower for keyword in out_box_keywords):
                item["in_box"] = False
            else:
                item["in_box"] = None  # Inconnu si aucune indication

        # --- Filtrage des bundles ---
        title_lower = item["title"].lower()
        if item["title"].count("#") > 1:
            self.logger.info(f"Ignoring multi-figure listing: {item['title']}")
            raise DropItem(f"Multi-figure listing: {item['title']}")
        bundle_keywords = ["lot", "bundle", "set"]
        if any(keyword in title_lower for keyword in bundle_keywords):
            self.logger.info(f"Ignoring bundle due to keyword in title: {item['title']}")
            raise DropItem(f"Bundle listing: {item['title']}")

        # --- Mise à jour de l'image via meta si disponible ---
        try:
            image_url = response.xpath('//meta[@property="og:image"]/@content').get()
            if image_url:
                item["image_url"] = image_url.strip()
        except Exception as e:
            self.logger.error(f"Erreur lors de l'extraction de l'URL de l'image: {e}")

        # --- Extraction du vendeur ---
        try:
            seller_name = response.xpath('//span[@class="mbg-nw"]/text()').get() or \
                          response.xpath('//div[contains(@class,"info__about-seller")]/a/span/text()').get()
            item["seller_username"] = seller_name.strip() if seller_name else ""
        except Exception as e:
            self.logger.error(f"Error extracting seller username: {e}")
            item["seller_username"] = ""

        # --- Extraction du type d'annonce (listing_type) ---
        if item["ended"]:
            item["listing_type"] = "ended"  # Type spécial pour les annonces terminées
        else:
            bid_button = response.xpath("//*[starts-with(@id, 'bidBtn_btn')]").get()
            bin_button = response.xpath("//*[starts-with(@id, 'binBtn_btn')]").get()
            countdown = response.xpath("//*[contains(@id, 'vi-cdown')]").get()
            if bid_button or countdown:
                if bin_button:
                    item["listing_type"] = "auction_with_bin"
                else:
                    item["listing_type"] = "auction"
            else:
                item["listing_type"] = "fixed_price"
        self.logger.info(f"DEBUG: listing_type = {item.get('listing_type')}")

        # --- Extraction du nombre d'enchères (bids_count) ---
        if item["listing_type"] in ["auction", "auction_with_bin"] and not item["ended"]:
            try:
                bid_container = response.xpath('//div[@data-testid="x-bid-count"]')
                bids_text = bid_container.xpath('.//span/text()').re_first(r'(\d+)')
                item["bids_count"] = int(bids_text) if bids_text else 0
            except Exception as e:
                self.logger.error(f"Error extracting bids_count: {e}")
                item["bids_count"] = 0
        else:
            item["bids_count"] = None

        # --- Extraction du temps restant (time_remaining) ---
        if not item["ended"] and item["listing_type"] in ["auction", "auction_with_bin"]:
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
        else:
            item["time_remaining"] = None

        # --- Extraction du prix Buy It Now (buy_it_now_price) ---
        if item["listing_type"] == "auction_with_bin" and not item["ended"]:
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

        # --- Extraction du prix pour les annonces actives ou terminées ---
        if item["ended"]:
            # Pour les annonces terminées, essayer d'extraire le prix final de vente
            try:
                # Liste de sélecteurs pour trouver le prix final
                price_selectors = [
                    '//span[contains(text(), "Sold for")]/following-sibling::span/text()',  # Texte "Sold for" suivi d'un span
                    '//div[@data-testid="x-sold-price"]//span/text()',                     # Conteneur spécifique pour prix vendu
                    '//span[@class="ux-textspans ux-textspans--primary"]/text()',          # Classe commune pour les prix
                    '//div[contains(@class, "ux-labels-values")]//span[contains(text(), "Sold for")]/following-sibling::span/text()',  # Structure alternative
                    '//span[contains(text(), "Winning bid")]/following-sibling::span/text()',  # Pour les enchères gagnées
                    '//div[@data-testid="x-final-price"]//span/text()'                    # Autre conteneur possible
                ]
        
                final_price_str = None
                for selector in price_selectors:
                    final_price_str = response.xpath(selector).get()
                    self.logger.debug(f"Tentative avec sélecteur {selector}: {final_price_str}")
                    if final_price_str:
                        break
        
                if final_price_str:
                    # Nettoyer et convertir le prix en float
                    match = re.search(r'[\d,.]+', final_price_str.strip())
                    if match:
                        item["price"] = float(match.group(0).replace(",", ""))
                        self.logger.debug(f"Prix final extrait: {item['price']}")
                    else:
                        item["price"] = None
                        self.logger.warning(f"Format de prix invalide: {final_price_str}")
                else:
                    item["price"] = None
                    self.logger.warning(f"Aucun prix trouvé pour l'annonce terminée: {item['item_url']}")
            except Exception as e:
                self.logger.error(f"Erreur lors de l'extraction du prix final pour l'annonce terminée: {e}")
                item["price"] = None
        else:
            # Pour les annonces actives, extraire le prix actuel (logique inchangée)
            try:
                price_str = response.css('span.ux-textspans.ux-textspans--primary::text').get() or \
                            response.css('div[data-testid="x-bin-price"] span.ux-textspans::text').get()
                if price_str:
                    match = re.search(r'[\d,.]+', price_str)
                    if match:
                        item["price"] = float(match.group(0).replace(",", ""))
                    else:
                        item["price"] = None
                else:
                    item["price"] = None
            except Exception as e:
                self.logger.error(f"Error extracting price: {e}")
                item["price"] = None

        # --- Gestion des valeurs par défaut pour les champs manquants ---
        if item["price"] is None:
            self.logger.warning(f"Prix non trouvé pour l'article: {item['item_url']}")
            item["price"] = 0.0  # Valeur par défaut appliquée uniquement à la fin

        # --- Extraction de la catégorie via JSON‑LD ou XPath ---
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
            self.logger.error(f"Erreur lors de l'extraction de la catégorie: {e}")
            item["category"] = ""

        # --- Gestion des valeurs par défaut pour les champs manquants ---
        if item["price"] is None:
            self.logger.warning(f"Price not found for item: {item['item_url']}")
            item["price"] = 0.0  # Valeur par défaut

        if item["bids_count"] is None and item["listing_type"] in ["auction", "auction_with_bin"]:
            item["bids_count"] = 0

        yield item



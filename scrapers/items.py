# scrapers/items.py

import scrapy

class EbayItem(scrapy.Item):
    # Champs pour la table product
    item_id = scrapy.Field()          # Identifiant unique eBay
    title = scrapy.Field()            # Nom du produit
    price = scrapy.Field()            # Prix relevé (pour l'historique)
    item_condition = scrapy.Field()   # État du produit (neuf, occasion, etc.)
    item_url = scrapy.Field()         # URL du produit
    image_url = scrapy.Field()        # URL de l'image principale
    shipping_cost = scrapy.Field()    # Frais d'expédition
    seller_username = scrapy.Field()  # Nom du vendeur
    category = scrapy.Field()         # Catégorie eBay
    bids_count = scrapy.Field()       # Nombre d'enchères (pour les auctions)
    time_remaining = scrapy.Field()   # Temps restant de l'enchère (texte brut)
    listing_type = scrapy.Field()     # Type d'annonce ("auction", "auction_with_bin", "fixed_price")
    buy_it_now_price = scrapy.Field()
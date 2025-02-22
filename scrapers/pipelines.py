from scrapy.exceptions import DropItem
from core.category_mapping import map_category, extract_leaf_category
from core.db_connection import get_connection

class MySQLPipeline:
    def open_spider(self, spider):
        try:
            self.conn = get_connection()
            self.cursor = self.conn.cursor()
            spider.logger.info("Ouverture de la connexion MySQL.")
        except Exception as e:
            spider.logger.error(f"Erreur de connexion à la DB: {e}")

    def close_spider(self, spider):
        try:
            self.cursor.close()
            self.conn.close()
            spider.logger.info("Fermeture de la connexion MySQL.")
        except Exception as e:
            spider.logger.error(f"Erreur lors de la fermeture de la DB: {e}")

    def process_item(self, item, spider):
        # --- Filtrage des bundles ---
        title = item.get("title", "")
        title_lower = title.lower()
        if title.count("#") > 1 or any(keyword in title_lower for keyword in ["lot", "bundle", "set"]):
            spider.logger.info(f"Drop item bundle: {title}")
            raise DropItem(f"Item bundle dropped: {title}")

        # Suite du traitement...
        # Vérifie si le produit existe déjà via item_id
        select_sql = "SELECT product_id FROM product WHERE item_id = %s"
        self.cursor.execute(select_sql, (item.get("item_id"),))
        result = self.cursor.fetchone()

        if result:
            product_db_id = result[0]
            spider.logger.info(f"Produit existant trouvé avec l'id {product_db_id}")

            update_sql = """
                UPDATE product
                SET title = %s, 
                    item_condition = %s,
                    normalized_condition = %s,
                    signed = %s,
                    in_box = %s,
                    listing_type = %s, 
                    bids_count = %s, 
                    time_remaining = %s,
                    buy_it_now_price = %s,
                    ended = %s,
                    url = %s
                WHERE product_id = %s
            """
            try:
                self.cursor.execute(update_sql, (
                    item.get("title", ""),
                    item.get("item_condition", ""),
                    item.get("normalized_condition", ""),
                    item.get("signed", False),
                    item.get("in_box"),
                    item.get("listing_type", ""),
                    item.get("bids_count"),
                    item.get("time_remaining"),
                    item.get("buy_it_now_price"),
                    item.get("ended", False),
                    item.get("item_url", ""),
                    product_db_id
                ))
                self.conn.commit()
                spider.logger.info(f"Produit {product_db_id} mis à jour.")
            except Exception as e:
                spider.logger.error(f"Erreur lors de la mise à jour du produit: {e}")

        else:
            insert_product_sql = """
                INSERT INTO product 
                (item_id, title, item_condition, normalized_condition, signed, in_box, url, image_url, seller_username, category, 
                 listing_type, bids_count, time_remaining, buy_it_now_price, ended)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            product_values = (
                item.get("item_id", ""),
                item.get("title", ""),
                item.get("item_condition", ""),
                item.get("normalized_condition", ""),
                item.get("signed", False),
                item.get("in_box"),
                item.get("item_url", ""),
                item.get("image_url", ""),
                item.get("seller_username", ""),
                item.get("category", ""),
                item.get("listing_type", ""),
                item.get("bids_count"),
                item.get("time_remaining"),
                item.get("buy_it_now_price"),
                item.get("ended", False)
            )

            try:
                self.cursor.execute(insert_product_sql, product_values)
                self.conn.commit()
                product_db_id = self.cursor.lastrowid
                spider.logger.info(f"Nouveau produit inséré avec l'id {product_db_id}")
            except Exception as e:
                spider.logger.error(f"Erreur lors de l'insertion du produit: {e}")
                return item

        # Mapping de la catégorie et mise à jour du champ category_id
        scraped_category = item.get("category", "")
        mapped_category_id = map_category(scraped_category)
        if mapped_category_id:
            update_cat_sql = "UPDATE product SET category_id = %s WHERE product_id = %s"
            try:
                self.cursor.execute(update_cat_sql, (mapped_category_id, product_db_id))
                self.conn.commit()
                spider.logger.info(f"Produit {product_db_id} mis à jour avec category_id {mapped_category_id}")
            except Exception as e:
                spider.logger.error(f"Erreur lors de la mise à jour du category_id: {e}")
        else:
            spider.logger.info(f"Aucun mapping trouvé pour la catégorie: {scraped_category}")

        # Insertion du relevé de prix dans la table price_history, incluant buy_it_now_price
        insert_price_sql = """
            INSERT INTO price_history (product_id, price, buy_it_now_price, date_scraped)
            VALUES (%s, %s, %s, NOW())
        """
        try:
            self.cursor.execute(insert_price_sql, (product_db_id, item.get("price", 0), item.get("buy_it_now_price")))
            self.conn.commit()
            spider.logger.info(f"Historique de prix inséré pour le produit {product_db_id}")
        except Exception as e:
            spider.logger.error(f"Erreur lors de l'insertion de l'historique de prix: {e}")

        return item

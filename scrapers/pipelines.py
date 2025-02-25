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



        # Juste avant le if product_db_id:
        product_db_id = None
        select_sql = "SELECT product_id FROM product WHERE item_id = %s"
        self.cursor.execute(select_sql, (item.get("item_id"),))
        row_itemid = self.cursor.fetchone()
        if row_itemid:
            product_db_id = row_itemid[0]


        # 4) UPDATE si product_db_id existe, sinon INSERT
        if product_db_id:
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
                    url = %s,
                    image_url = %s,
                    seller_username = %s,
                    category = %s
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
                    item.get("image_url", ""),
                    item.get("seller_username", ""),
                    item.get("category", ""),
                    product_db_id
                ))
                self.conn.commit()
                spider.logger.info(f"Produit {product_db_id} mis à jour.")
            except Exception as e:
                spider.logger.error(f"Erreur lors de la mise à jour du produit: {e}")

        else:
            # INSERT
            insert_product_sql = """
                INSERT INTO product 
                (item_id, title, item_condition, normalized_condition, signed, in_box, url, image_url,
                 seller_username, category, listing_type, bids_count, time_remaining, buy_it_now_price, ended)
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

        # 5) Mapping de la catégorie et mise à jour du champ category_id
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

        # Vérifie si le prix n'est pas identique à la dernière entrée
                # Vérifie si le prix n'est pas identique ET si c'est le même jour
        select_last_price_sql = """
            SELECT price, DATE(date_scraped)
            FROM price_history
            WHERE product_id = %s
            ORDER BY date_scraped DESC
            LIMIT 1
        """
        self.cursor.execute(select_last_price_sql, (product_db_id,))
        last_row = self.cursor.fetchone()

        if last_row is not None:
            last_price_in_db, last_date_in_db = last_row
            current_price = item.get("price", 0)

            # (A) Vérification du prix
            if float(last_price_in_db) == float(current_price):
                # (B) Vérification de la date
                from datetime import date
                today_str = str(date.today())  # ex: '2025-03-10'
                if str(last_date_in_db) == today_str:
                    spider.logger.info(
                        f"[SKIP] Prix identique ({current_price}) et déjà inséré aujourd'hui "
                        f"pour le produit {product_db_id}."
                    )
                    return item



        # 6) Insertion du relevé de prix dans la table price_history
        insert_price_sql = """
            INSERT INTO price_history 
            (product_id, price, buy_it_now_price, bids_count, time_remaining, date_scraped)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """
        try:
            self.cursor.execute(insert_price_sql, (
                product_db_id,
                item.get("price", 0),
                item.get("buy_it_now_price"),
                item.get("bids_count"),
                item.get("time_remaining")
            ))
            self.conn.commit()
            spider.logger.info(f"Historique de prix inséré pour le produit {product_db_id}")
        except Exception as e:
            spider.logger.error(f"Erreur lors de l'insertion de l'historique de prix: {e}")

        return item

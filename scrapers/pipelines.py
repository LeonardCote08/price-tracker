# scrapers/pipelines.py
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
        # Vérifie si le produit existe déjà via item_id
        select_sql = "SELECT product_id FROM product WHERE item_id = %s"
        self.cursor.execute(select_sql, (item.get("item_id"),))
        result = self.cursor.fetchone()

        if result:
            product_db_id = result[0]
            spider.logger.info(f"Produit existant trouvé avec l'id {product_db_id}")

            # <-- ICI on met à jour le titre pour écraser l'ancien
            update_sql = """
                UPDATE product
                SET title = %s, listing_type = %s, bids_count = %s, time_remaining = %s
                WHERE product_id = %s
            """
            try:
                self.cursor.execute(update_sql, (item["title"], item.get("listing_type", ""), item.get("bids_count"), item.get("time_remaining"), product_db_id))
                self.conn.commit()
                spider.logger.info(f"Titre mis à jour pour le produit {product_db_id}")
            except Exception as e:
                spider.logger.error(f"Erreur lors de la mise à jour du titre: {e}")

        else:
            insert_product_sql = """
                INSERT INTO product 
                (item_id, title, item_condition, url, image_url, seller_username, category, listing_type, bids_count, time_remaining)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            product_values = (
                item.get("item_id", ""),
                item.get("title", ""),
                item.get("item_condition", ""),
                item.get("item_url", ""),
                item.get("image_url", ""),
                item.get("seller_username", ""),
                item.get("category", ""),
                item.get("listing_type", ""),
                item.get("bids_count"),
                item.get("time_remaining")
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
            update_sql = "UPDATE product SET category_id = %s WHERE product_id = %s"
            try:
                self.cursor.execute(update_sql, (mapped_category_id, product_db_id))
                self.conn.commit()
                spider.logger.info(f"Produit {product_db_id} mis à jour avec category_id {mapped_category_id}")
            except Exception as e:
                spider.logger.error(f"Erreur lors de la mise à jour du category_id: {e}")
        else:
            spider.logger.info(f"Aucun mapping trouvé pour la catégorie: {scraped_category}")

        # Insertion du relevé de prix dans la table price_history
        insert_price_sql = """
            INSERT INTO price_history (product_id, price)
            VALUES (%s, %s)
        """
        try:
            self.cursor.execute(insert_price_sql, (product_db_id, item.get("price", 0)))
            self.conn.commit()
            spider.logger.info(f"Historique de prix inséré pour le produit {product_db_id}")
        except Exception as e:
            spider.logger.error(f"Erreur lors de l'insertion de l'historique de prix: {e}")

        return item

# scrapers/pipelines.py

from core.db_connection import get_connection
import logging

logger = logging.getLogger(__name__)

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
        # Vérifier si le produit existe déjà via item_id
        select_sql = "SELECT product_id FROM product WHERE item_id = %s"
        self.cursor.execute(select_sql, (item.get("item_id"),))
        result = self.cursor.fetchone()

        if result:
            product_db_id = result[0]
            spider.logger.info(f"Produit existant trouvé avec l'id {product_db_id}")
        else:
            # Insertion du produit dans la table product
            insert_product_sql = """
                INSERT INTO product 
                (item_id, title, item_condition, url, image_url, shipping_cost, seller_username, category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            product_values = (
                item.get("item_id", ""),
                item.get("title", ""),
                item.get("item_condition", ""),
                item.get("item_url", ""),
                item.get("image_url", ""),
                item.get("shipping_cost"),
                item.get("seller_username", ""),
                item.get("category", "")
            )
            try:
                self.cursor.execute(insert_product_sql, product_values)
                self.conn.commit()
                product_db_id = self.cursor.lastrowid
                spider.logger.info(f"Nouveau produit inséré avec l'id {product_db_id}")
            except Exception as e:
                spider.logger.error(f"Erreur lors de l'insertion du produit: {e}")
                return item

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

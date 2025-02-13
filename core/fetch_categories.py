# core/fetch_categories.py

from core.db_connection import get_connection
from core.ebay_taxonomy import (
    get_oauth_token,
    get_default_category_tree_id,
    get_category_tree
)

def store_categories_recursively(node, cursor, parent_id=None, level=0):
    category_id = node["category"]["categoryId"]
    category_name = node["category"]["categoryName"]

    sql = """
    INSERT INTO category (ebay_id, name, parent_ebay_id, level)
    VALUES (%s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE name=%s, parent_ebay_id=%s, level=%s
    """
    cursor.execute(sql, (
        category_id, category_name, parent_id, level,
        category_name, parent_id, level
    ))
    
    children = node.get("childCategoryTreeNodes", [])
    for child in children:
        store_categories_recursively(child, cursor, category_id, level+1)


def main():
    # 1) Récupérer l'ID d'arbre de catégories
    tree_id, tree_version = get_default_category_tree_id("EBAY_US")
    print("Category tree ID:", tree_id, "| Version:", tree_version)

    # 2) Obtenir l'arbre de catégories
    tree_data = get_category_tree(tree_id)
    print("Récupération de l'arbre de catégories terminée.")

    # 3) Ouvrir la connexion DB et insérer en base
    conn = get_connection()
    cursor = conn.cursor()

    root_node = tree_data["rootCategoryNode"]
    store_categories_recursively(root_node, cursor)

    conn.commit()
    cursor.close()
    conn.close()
    print("Insertion des catégories terminée.")

if __name__ == "__main__":
    main()

# core/fetch_categories.py

from core.ebay_taxonomy import (
    get_oauth_token,
    get_default_category_tree_id,
    get_category_tree
)

def main():
    # 1) Récupérer un token OAuth2
    token = get_oauth_token()
    print("Access Token récupéré :", token[:50], "...")
    
    # 2) Récupérer l'ID de l'arbre de catégories par défaut pour EBAY_US
    tree_id, tree_version = get_default_category_tree_id("EBAY_US")
    print("categoryTreeId pour EBAY_US =", tree_id)
    print("categoryTreeVersion =", tree_version)
    
    # 3) Récupérer l'arbre complet des catégories à partir de l'ID obtenu
    tree_data = get_category_tree(tree_id)
    print("Arbre de catégories eBay (extrait) :")
    print(tree_data)

if __name__ == "__main__":
    main()

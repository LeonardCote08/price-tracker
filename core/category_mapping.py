# core/category_mapping.py

from core.db_connection import get_connection
import difflib

def get_category_id_by_exact_name(category_name):
    """
    Recherche une catégorie dont le nom correspond exactement.
    """
    conn = get_connection()
    cursor = conn.cursor()
    sql = "SELECT category_id FROM category WHERE LOWER(name) = LOWER(%s) LIMIT 1"
    cursor.execute(sql, (category_name,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return row[0]
    return None

def get_category_id_by_similarity(category_name, cutoff=0.8):
    """
    Recherche une catégorie dans la table qui ressemble beaucoup à 'category_name'
    en utilisant difflib (distance de similarité).
    """
    conn = get_connection()
    cursor = conn.cursor()
    # Récupérer tous les noms de catégories et leurs IDs
    sql = "SELECT category_id, name FROM category"
    cursor.execute(sql)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    # Créer une liste des noms en minuscule
    candidates = {name.lower(): cat_id for cat_id, name in results}
    # Utiliser difflib pour trouver la meilleure correspondance
    best_match = difflib.get_close_matches(category_name.lower(), candidates.keys(), n=1, cutoff=cutoff)
    if best_match:
        return candidates[best_match[0]]
    return None

def extract_leaf_category(category_str):
    """
    Extrait le dernier segment de la chaîne de catégorie en ignorant
    les segments qui commencent par "See more".
    Exemple :
      "Electronics > Video Games & Consoles > Video Games > See more Banana Prince …"
      -> "Video Games"
    """
    segments = [seg.strip() for seg in category_str.split(">")]
    filtered_segments = [seg for seg in segments if not seg.lower().startswith("see more")]
    return filtered_segments[-1] if filtered_segments else category_str


def map_category(category_str):
    """
    Retourne l'ID de la catégorie correspondant à category_str en travaillant
    uniquement avec le dernier segment pertinent.
    """
    if not category_str:
        return None
    leaf_category = extract_leaf_category(category_str)
    cat_id = get_category_id_by_exact_name(leaf_category)
    if cat_id:
        return cat_id
    cat_id = get_category_id_by_similarity(leaf_category)
    return cat_id


if __name__ == '__main__':
    print(map_category("Electronics > Video Games & Consoles > Video Games > See more Banana Prince Nintendo NES Famicom English Ins..."

))

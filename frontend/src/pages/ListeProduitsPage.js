// frontend/src/pages/ListeProduitsPage.js
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faInfoCircle,
    faSearch,
    faArrowUp,
    faArrowDown,
    faCircleCheck,
    faSortAmountUp,
    faSortAmountDown,
    faChartLine,
    faFilter,
    faTag,
    faSpinner,
    faSliders,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

// Nombre initial de produits à afficher
const INITIAL_ITEMS_COUNT = 24;
// Nombre de produits à ajouter à chaque chargement
const ITEMS_INCREMENT = 12;

function ListeProduitsPage() {
    // Liste complète de produits récupérés depuis l'API
    const [produits, setProduits] = useState([]);
    // Dictionnaire qui associe product_id -> "up"/"down"/"stable"
    const [trendById, setTrendById] = useState({});
    // Filtre courant : "all", "up", "down", "stable"
    const [trendFilter, setTrendFilter] = useState('all');
    // Terme de recherche
    const [searchTerm, setSearchTerm] = useState('');
    // Option de tri
    const [sortOption, setSortOption] = useState('default');
    // Nombre de produits à afficher
    const [displayCount, setDisplayCount] = useState(INITIAL_ITEMS_COUNT);
    // Indique si tous les produits sont affichés
    const [allDisplayed, setAllDisplayed] = useState(false);
    // Indique si on est en train de charger plus de produits
    const [loadingMore, setLoadingMore] = useState(false);
    // État pour afficher/masquer le dropdown de tri
    const [showSortOptions, setShowSortOptions] = useState(false);
    // État pour le panneau de filtres avancés
    const [showFilters, setShowFilters] = useState(false);

    // États de chargement / erreur
    const [loading, setLoading] = useState(true);
    const [trendsLoading, setTrendsLoading] = useState(true); // Nouvel état pour le chargement des tendances
    const [error, setError] = useState(null);

    // État pour les statistiques
    const [stats, setStats] = useState({
        count: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        risingCount: 0,
        fallingCount: 0,
        stableCount: 0
    });

    // Références pour les éléments DOM
    const loaderRef = useRef(null);
    const sortDropdownRef = useRef(null);

    const scrollKey = `productsList_${trendFilter}_${searchTerm}_${sortOption}`;
    useScrollRestoration(scrollKey);

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setShowSortOptions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // 1) Charger tous les produits (sans filtre "active"/"ended")
    useEffect(() => {
        setLoading(true);
        fetchProduits()
            .then(data => {
                setProduits(data);
                setLoading(false);

                // Extraire des statistiques de base
                if (data.length > 0) {
                    const prices = data.map(p => p.price).filter(p => p !== null && p !== undefined);
                    setStats(prev => ({
                        ...prev,
                        count: data.length,
                        avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
                        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
                        maxPrice: prices.length > 0 ? Math.max(...prices) : 0
                    }));
                }
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
                setTrendsLoading(false); // Assurez-vous que trendsLoading est mis à false en cas d'erreur
            });
    }, []);

    // 2) Pour chaque produit, récupérer la tendance via /api/produits/:id/price-trend
    useEffect(() => {
        let risingCount = 0;
        let fallingCount = 0;
        let stableCount = 0;

        const fetchTrends = async () => {
            // Définir trendsLoading à true avant de commencer
            setTrendsLoading(true);

            for (const prod of produits) {
                try {
                    const response = await fetch(`/api/produits/${prod.product_id}/price-trend`);
                    const data = await response.json();
                    // data.trend = "up"/"down"/"stable"
                    setTrendById(prev => ({
                        ...prev,
                        [prod.product_id]: data.trend
                    }));

                    // Mettre à jour les compteurs de tendance
                    if (data.trend === 'up') risingCount++;
                    else if (data.trend === 'down') fallingCount++;
                    else stableCount++;
                } catch (err) {
                    console.error('Erreur trend', err);
                }
            }

            // Mettre à jour les statistiques une fois toutes les tendances récupérées
            setStats(prev => ({
                ...prev,
                risingCount,
                fallingCount,
                stableCount
            }));

            // Marquer le chargement des tendances comme terminé
            setTrendsLoading(false);
        };

        if (produits.length > 0) {
            fetchTrends();
        } else {
            setTrendsLoading(false); // Pas de produits, donc pas besoin de charger les tendances
        }
    }, [produits]);

    // Fonction pour gérer le tri des produits
    const sortProducts = (products, option) => {
        switch (option) {
            case 'price-asc':
                return [...products].sort((a, b) => a.price - b.price);
            case 'price-desc':
                return [...products].sort((a, b) => b.price - a.price);
            case 'date-desc':
                return [...products].sort((a, b) => {
                    const dateA = a.last_scraped_date ? new Date(a.last_scraped_date) : new Date(0);
                    const dateB = b.last_scraped_date ? new Date(b.last_scraped_date) : new Date(0);
                    return dateB - dateA;
                });
            case 'date-asc':
                return [...products].sort((a, b) => {
                    const dateA = a.last_scraped_date ? new Date(a.last_scraped_date) : new Date(0);
                    const dateB = b.last_scraped_date ? new Date(b.last_scraped_date) : new Date(0);
                    return dateA - dateB;
                });
            default:
                return products;
        }
    };

    // Fonction pour afficher le label du tri sélectionné
    const getSortLabel = (option) => {
        switch (option) {
            case 'price-asc':
                return 'Price: Low to High';
            case 'price-desc':
                return 'Price: High to Low';
            case 'date-desc':
                return 'Recently Updated';
            case 'date-asc':
                return 'Oldest First';
            default:
                return 'Default';
        }
    };

    // 3) Filtrer et trier les produits
    const filteredAndSortedProducts = useMemo(() => {
        // D'abord appliquer le filtre de tendance
        let filtered = produits.filter(prod => {
            const productTrend = trendById[prod.product_id];
            if (!productTrend) {
                return trendFilter === 'all';
            }
            if (trendFilter === 'all') return true;
            return productTrend === trendFilter;
        });

        // Ensuite appliquer le filtre de recherche
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(prod =>
                prod.title.toLowerCase().includes(term) ||
                (prod.seller_username && prod.seller_username.toLowerCase().includes(term))
            );
        }

        // Enfin appliquer le tri
        return sortProducts(filtered, sortOption);
    }, [produits, trendById, trendFilter, searchTerm, sortOption]);

    // Récupérer les produits à afficher (basé sur displayCount)
    const displayedProducts = useMemo(() => {
        return filteredAndSortedProducts.slice(0, displayCount);
    }, [filteredAndSortedProducts, displayCount]);

    // Observer pour l'infinite scroll
    const observer = useRef();
    const lastProductElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !allDisplayed) {
                loadMoreProducts();
            }
        }, { threshold: 0.5 });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, allDisplayed]);

    // Fonction pour charger plus de produits
    const loadMoreProducts = () => {
        if (loadingMore || allDisplayed) return;

        setLoadingMore(true);

        // Simuler un délai pour montrer le chargement (peut être supprimé en production)
        setTimeout(() => {
            setDisplayCount(prev => {
                const newCount = prev + ITEMS_INCREMENT;
                if (newCount >= filteredAndSortedProducts.length) {
                    setAllDisplayed(true);
                    return filteredAndSortedProducts.length;
                }
                return newCount;
            });
            setLoadingMore(false);
        }, 300);
    };

    // Réinitialiser l'état de l'affichage lors d'un changement de filtre ou de recherche
    useEffect(() => {
        setDisplayCount(INITIAL_ITEMS_COUNT);
        setAllDisplayed(filteredAndSortedProducts.length <= INITIAL_ITEMS_COUNT);
    }, [filteredAndSortedProducts.length]);

    // Effacer la recherche
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Toggle des filtres avancés
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Rendu du contenu de la carte des tendances à la hausse
    const renderRisingContent = () => {
        if (trendsLoading) {
            return (
                <div className="stat-content loading-content">
                    <div className="loading-animation">
                        <FontAwesomeIcon icon={faSpinner} className="loading-icon" spin />
                    </div>
                    <div className="stat-label">Calculating</div>
                </div>
            );
        }

        return (
            <div className="stat-content">
                <div className="stat-value">{stats.risingCount}</div>
                <div className="stat-label">Rising</div>
            </div>
        );
    };

    // Rendu du contenu de la carte des tendances à la baisse
    const renderFallingContent = () => {
        if (trendsLoading) {
            return (
                <div className="stat-content loading-content">
                    <div className="loading-animation">
                        <FontAwesomeIcon icon={faSpinner} className="loading-icon" spin />
                    </div>
                    <div className="stat-label">Calculating</div>
                </div>
            );
        }

        return (
            <div className="stat-content">
                <div className="stat-value">{stats.fallingCount}</div>
                <div className="stat-label">Falling</div>
            </div>
        );
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
        </div>
    );

    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="products-page-container">
            {/* En-tête avec bannière et statistiques */}
            <div className="page-header">
                <div className="info-banner">
                    <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                    <p>Currently tracking Funko Pop Doctor Doom #561 on eBay. More items to come soon!</p>
                </div>

                {/* Section des statistiques améliorée */}
                <div className="stats-dashboard">
                    <div className="stat-card">
                        <div className="stat-icon-container">
                            <FontAwesomeIcon icon={faTag} className="stat-icon" />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.count}</div>
                            <div className="stat-label">Products</div>
                        </div>
                    </div>

                    <div className="stat-card trend-up">
                        <div className="stat-icon-container">
                            <FontAwesomeIcon icon={faArrowUp} className="stat-icon" />
                        </div>
                        {renderRisingContent()}
                    </div>

                    <div className="stat-card trend-down">
                        <div className="stat-icon-container">
                            <FontAwesomeIcon icon={faArrowDown} className="stat-icon" />
                        </div>
                        {renderFallingContent()}
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon-container">
                            <FontAwesomeIcon icon={faChartLine} className="stat-icon" />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">${stats.avgPrice.toFixed(2)}</div>
                            <div className="stat-label">Avg Price</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nouvelle UI pour la recherche et les filtres */}
            <div className="enhanced-search-section">
                <div className="search-filters-container">
                    {/* Barre de recherche améliorée */}
                    <div className="enhanced-search-container">
                        <FontAwesomeIcon icon={faSearch} className="enhanced-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by title or seller..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setDisplayCount(INITIAL_ITEMS_COUNT);
                                setAllDisplayed(false);
                            }}
                            className="enhanced-search-input"
                        />
                        {searchTerm && (
                            <button className="clear-search-btn" onClick={clearSearch}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown de tri amélioré */}
                    <div className="enhanced-sort-container" ref={sortDropdownRef}>
                        <button
                            className="sort-button"
                            onClick={() => setShowSortOptions(!showSortOptions)}
                        >
                            <FontAwesomeIcon
                                icon={sortOption.includes('desc') ? faSortAmountDown : faSortAmountUp}
                                className="sort-icon"
                            />
                            <span>{getSortLabel(sortOption)}</span>
                        </button>

                        {showSortOptions && (
                            <div className="sort-options-dropdown">
                                <div
                                    className={`sort-option ${sortOption === 'default' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortOption('default');
                                        setShowSortOptions(false);
                                    }}
                                >
                                    Default
                                </div>
                                <div
                                    className={`sort-option ${sortOption === 'price-asc' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortOption('price-asc');
                                        setShowSortOptions(false);
                                    }}
                                >
                                    Price: Low to High
                                </div>
                                <div
                                    className={`sort-option ${sortOption === 'price-desc' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortOption('price-desc');
                                        setShowSortOptions(false);
                                    }}
                                >
                                    Price: High to Low
                                </div>
                                <div
                                    className={`sort-option ${sortOption === 'date-desc' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortOption('date-desc');
                                        setShowSortOptions(false);
                                    }}
                                >
                                    Recently Updated
                                </div>
                                <div
                                    className={`sort-option ${sortOption === 'date-asc' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortOption('date-asc');
                                        setShowSortOptions(false);
                                    }}
                                >
                                    Oldest First
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bouton pour filtres avancés */}
                    <button
                        className={`filter-advanced-button ${showFilters ? 'active' : ''}`}
                        onClick={toggleFilters}
                    >
                        <FontAwesomeIcon icon={faSliders} className="filter-icon" />
                        <span>Filters</span>
                    </button>
                </div>

                {/* Nouvelle section de filtres */}
                {showFilters && (
                    <div className="enhanced-filter-panel">
                        <div className="filter-header">
                            <FontAwesomeIcon icon={faFilter} className="filter-panel-icon" />
                            <h3>Filter by trend</h3>
                        </div>

                        <div className="trend-filter-buttons">
                            <button
                                className={`enhanced-filter-button ${trendFilter === 'all' ? 'selected' : ''}`}
                                onClick={() => {
                                    setTrendFilter('all');
                                    setDisplayCount(INITIAL_ITEMS_COUNT);
                                    setAllDisplayed(false);
                                }}
                            >
                                <FontAwesomeIcon icon={faCircleCheck} className="filter-button-icon" />
                                <span>All</span>
                            </button>
                            <button
                                className={`enhanced-filter-button ${trendFilter === 'up' ? 'selected' : ''}`}
                                onClick={() => {
                                    setTrendFilter('up');
                                    setDisplayCount(INITIAL_ITEMS_COUNT);
                                    setAllDisplayed(false);
                                }}
                                disabled={trendsLoading}
                            >
                                <FontAwesomeIcon icon={faArrowUp} className="filter-button-icon up" />
                                <span>Price Rising</span>
                            </button>
                            <button
                                className={`enhanced-filter-button ${trendFilter === 'down' ? 'selected' : ''}`}
                                onClick={() => {
                                    setTrendFilter('down');
                                    setDisplayCount(INITIAL_ITEMS_COUNT);
                                    setAllDisplayed(false);
                                }}
                                disabled={trendsLoading}
                            >
                                <FontAwesomeIcon icon={faArrowDown} className="filter-button-icon down" />
                                <span>Price Falling</span>
                            </button>
                            <button
                                className={`enhanced-filter-button ${trendFilter === 'stable' ? 'selected' : ''}`}
                                onClick={() => {
                                    setTrendFilter('stable');
                                    setDisplayCount(INITIAL_ITEMS_COUNT);
                                    setAllDisplayed(false);
                                }}
                                disabled={trendsLoading}
                            >
                                <FontAwesomeIcon icon={faChartLine} className="filter-button-icon" />
                                <span>Price Stable</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Résultats de la recherche et message sur le nombre de résultats */}
            <div className="results-info">
                {searchTerm && (
                    <p className="search-results">
                        Found {filteredAndSortedProducts.length} results for "{searchTerm}"
                    </p>
                )}
                {!searchTerm && trendFilter !== 'all' && (
                    <p className="filter-results">
                        Showing {filteredAndSortedProducts.length} {trendFilter === 'up' ? 'rising' : trendFilter === 'down' ? 'falling' : 'stable'} products
                    </p>
                )}
                {filteredAndSortedProducts.length > 0 && (
                    <p className="showing-results">
                        Showing {Math.min(displayCount, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
                    </p>
                )}
            </div>

            {/* Grille de produits */}
            <div className="produits-grid">
                {displayedProducts.length > 0 ? (
                    displayedProducts.map((p, index) => {
                        // Si c'est le dernier élément, ajouter la référence
                        if (index === displayedProducts.length - 1) {
                            return (
                                <div ref={lastProductElementRef} key={p.product_id}>
                                    <ProduitCard produit={p} />
                                </div>
                            );
                        } else {
                            return <ProduitCard key={p.product_id} produit={p} />;
                        }
                    })
                ) : (
                    <p className="no-results">No products found matching your criteria</p>
                )}
            </div>

            {/* Indicateur de chargement pour l'infinite scroll */}
            {loadingMore && (
                <div className="load-more-indicator" ref={loaderRef}>
                    <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
                    <span>Loading more products...</span>
                </div>
            )}

            {/* Message "Plus de produits" quand tout est affiché */}
            {allDisplayed && filteredAndSortedProducts.length > INITIAL_ITEMS_COUNT && (
                <div className="all-products-loaded">
                    <span>All products loaded</span>
                </div>
            )}
        </div>
    );
}

export default ListeProduitsPage;
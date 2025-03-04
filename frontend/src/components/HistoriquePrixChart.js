// frontend/src/components/HistoriquePrixChart.js
import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const HistoriquePrixChart = ({ dates, prices, trend }) => {
    const chartRef = useRef(null);

    // Vérifier si les données sont disponibles
    const hasData = dates && prices && dates.length > 0 && prices.length > 0;

    // Déterminer les couleurs en fonction de la tendance
    const getColors = () => {
        switch (trend) {
            case 'up':
                return {
                    borderColor: '#2ECC71',
                    backgroundColor: 'rgba(46, 204, 113, 0.25)',
                    pointBackgroundColor: '#2ECC71',
                    pointBorderColor: '#2ECC71',
                    pointHoverBorderColor: '#2ECC71'
                };
            case 'down':
                return {
                    borderColor: '#E74C3C',
                    backgroundColor: 'rgba(231, 76, 60, 0.25)',
                    pointBackgroundColor: '#E74C3C',
                    pointBorderColor: '#E74C3C',
                    pointHoverBorderColor: '#E74C3C'
                };
            default:
                return {
                    borderColor: '#1595EB',
                    backgroundColor: 'rgba(21, 149, 235, 0.25)',
                    pointBackgroundColor: '#1595EB',
                    pointBorderColor: '#1595EB',
                    pointHoverBorderColor: '#1595EB'
                };
        }
    };

    const colors = getColors();

    // Créer un gradient pour le remplissage
    useEffect(() => {
        if (!hasData || !chartRef.current) return;

        const chart = chartRef.current;
        const ctx = chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);

        if (trend === 'up') {
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.6)');
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0.05)');
        } else if (trend === 'down') {
            gradient.addColorStop(0, 'rgba(231, 76, 60, 0.6)');
            gradient.addColorStop(1, 'rgba(231, 76, 60, 0.05)');
        } else {
            gradient.addColorStop(0, 'rgba(21, 149, 235, 0.6)');
            gradient.addColorStop(1, 'rgba(21, 149, 235, 0.05)');
        }

        // Mettre à jour le dataset avec le gradient
        if (chart.data && chart.data.datasets && chart.data.datasets.length > 0) {
            chart.data.datasets[0].backgroundColor = gradient;
            chart.update();
        }
    }, [hasData, trend, chartRef]);

    // Calculer les données pour un aspect ratio plus équilibré
    const getOptimalAspectRatio = () => {
        // Plus de points = graphique plus large
        if (dates.length > 20) return 2;
        if (dates.length > 10) return 1.8;
        return 1.5; // Valeur par défaut pour moins de points
    };

    const data = {
        labels: dates,
        datasets: [
            {
                label: 'Price ($)',
                data: prices,
                borderColor: colors.borderColor,
                backgroundColor: colors.backgroundColor, // Sera remplacé par le gradient
                fill: true,
                tension: 0.35, // Courbes plus lisses
                pointRadius: (ctx) => {
                    // Points plus gros au début et à la fin, plus petits entre les deux
                    const index = ctx.dataIndex;
                    const count = ctx.dataset.data.length;
                    if (index === 0 || index === count - 1) {
                        return 6;
                    }
                    // Points plus espacés pour les grands ensembles de données
                    if (count > 20 && index % Math.ceil(count / 10) !== 0) {
                        return 0; // Cacher la plupart des points pour un graphique plus propre
                    }
                    return 4;
                },
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
                pointBorderColor: colors.pointBorderColor,
                borderWidth: 3,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderWidth: 3,
                pointHoverBorderColor: colors.pointHoverBorderColor,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: getOptimalAspectRatio(), // Aspect ratio amélioré pour éviter l'effet écrasé
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#F5F5F5',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 20
                }
            },
            title: {
                display: false,
                text: 'Price History',
                color: '#F5F5F5',
                font: {
                    size: 18
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(45, 69, 92, 0.95)',
                titleColor: '#F5F5F5',
                bodyColor: '#F5F5F5',
                borderColor: colors.borderColor,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 6,
                bodyFont: {
                    size: 14
                },
                titleFont: {
                    size: 16,
                    weight: 'bold'
                },
                callbacks: {
                    label: function (context) {
                        return `Price: $${context.parsed.y.toFixed(2)}`;
                    }
                },
                animation: {
                    duration: 150
                },
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    color: '#F5F5F5',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: { top: 10 }
                },
                ticks: {
                    color: '#F5F5F5',
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 12
                    },
                    // Fonction pour limiter le nombre de ticks affichés si beaucoup de données
                    callback: function (value, index, values) {
                        if (values.length > 10) {
                            // Afficher seulement certaines dates pour éviter l'encombrement
                            if (index === 0 || index === values.length - 1 || index % Math.ceil(values.length / 8) === 0) {
                                return this.getLabelForValue(value);
                            }
                            return '';
                        }
                        return this.getLabelForValue(value);
                    }
                },
                grid: {
                    color: 'rgba(245, 245, 245, 0.1)',
                    tickLength: 8
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Price in $',
                    color: '#F5F5F5',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: { bottom: 10 }
                },
                ticks: {
                    color: '#F5F5F5',
                    font: {
                        size: 12
                    },
                    callback: function (value) {
                        return '$' + value.toFixed(2);
                    }
                },
                grid: {
                    color: 'rgba(245, 245, 245, 0.1)',
                    tickLength: 8
                },
                beginAtZero: false,
                // Calculer automatiquement les min/max pour avoir un meilleur aspect ratio vertical
                suggestedMin: function () {
                    if (!prices || prices.length === 0) return 0;
                    const min = Math.min(...prices);
                    // Ajouter 10-15% de marge en bas pour éviter l'effet écrasé
                    return min * 0.85;
                }(),
                suggestedMax: function () {
                    if (!prices || prices.length === 0) return 100;
                    const max = Math.max(...prices);
                    // Ajouter 10-15% de marge en haut pour éviter l'effet écrasé
                    return max * 1.15;
                }()
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        animations: {
            tension: {
                duration: 1000,
                easing: 'linear'
            },
            radius: {
                duration: 400,
                easing: 'linear'
            }
        },
        elements: {
            line: {
                borderShadowColor: 'rgba(0, 0, 0, 0.5)',
                borderShadowBlur: 10,
                borderCapStyle: 'round',
                borderJoinStyle: 'round'
            },
            point: {
                radius: 0,
                hitRadius: 10,
                hoverRadius: 8,
                animation: {
                    duration: 800,
                    easing: 'easeOutCubic'
                }
            }
        },
        layout: {
            padding: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            }
        },
        // Animations améliorées pour l'ensemble du graphique
        transitions: {
            active: {
                animation: {
                    duration: 300
                }
            }
        }
    };

    if (!hasData) {
        return (
            <div className="no-data-chart">
                <p>No price history data available</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '350px', position: 'relative' }}> {/* Hauteur augmentée */}
            <Line data={data} options={options} ref={chartRef} />
        </div>
    );
};

export default HistoriquePrixChart;
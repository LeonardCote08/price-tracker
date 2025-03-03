// frontend/src/components/HistoriquePrixChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const HistoriquePrixChart = ({ dates, prices, trend }) => {
    const data = {
        labels: dates,
        datasets: [
            {
                label: 'Price ($)',
                data: prices,
                borderColor: trend === 'up' ? '#2ECC71' : trend === 'down' ? '#E74C3C' : '#1595EB',
                backgroundColor: trend === 'up'
                    ? 'rgba(46, 204, 113, 0.2)'
                    : trend === 'down'
                        ? 'rgba(231, 76, 60, 0.2)'
                        : 'rgba(21, 149, 235, 0.2)',
                fill: true,
                tension: 0.25, // Augmenté pour des courbes plus lisses
                pointRadius: (ctx) => {
                    // Points plus gros au début et à la fin, plus petits entre les deux
                    const index = ctx.dataIndex;
                    const count = ctx.dataset.data.length;
                    if (index === 0 || index === count - 1) {
                        return 6;
                    }
                    return 4;
                },
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
                pointBorderColor: trend === 'up' ? '#2ECC71' : trend === 'down' ? '#E74C3C' : '#1595EB',
                borderWidth: 3,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderWidth: 3,
                pointHoverBorderColor: trend === 'up' ? '#2ECC71' : trend === 'down' ? '#E74C3C' : '#1595EB',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                display: false, // Supprimé car vous avez déjà un titre séparé
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
                backgroundColor: 'rgba(45, 69, 92, 0.9)',
                titleColor: '#F5F5F5',
                bodyColor: '#F5F5F5',
                borderColor: trend === 'up' ? '#2ECC71' : trend === 'down' ? '#E74C3C' : '#1595EB',
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
                }
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
                beginAtZero: false, // Pour un meilleur zoom sur les données
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
            }
        },
        elements: {
            line: {
                // Effet d'ombre portée sur la ligne
                borderShadowColor: 'rgba(0, 0, 0, 0.5)',
                borderShadowBlur: 10,
                borderCapStyle: 'round',
                borderJoinStyle: 'round'
            }
        },
        layout: {
            padding: {
                top: 10,
                right: 15,
                bottom: 10,
                left: 15
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default HistoriquePrixChart;
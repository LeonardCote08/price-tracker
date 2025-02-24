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
                backgroundColor: trend === 'up' ? 'rgba(46, 204, 113, 0.2)' : trend === 'down' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(21, 149, 235, 0.2)',
                fill: true,
                tension: 0.2,
                pointRadius: 5,
                pointBackgroundColor: '#fff',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#F5F5F5' } },
            title: { display: true, text: 'Price History', color: '#F5F5F5' },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: '#2D455C',
                titleColor: '#F5F5F5',
                bodyColor: '#F5F5F5',
            },
        },
        scales: {
            x: { title: { display: true, text: 'Date', color: '#F5F5F5' }, ticks: { color: '#F5F5F5' }, grid: { color: 'rgba(245, 245, 245, 0.1)' } },
            y: { title: { display: true, text: 'Price in $', color: '#F5F5F5' }, ticks: { color: '#F5F5F5' }, grid: { color: 'rgba(245, 245, 245, 0.1)' } },
        },
    };

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default HistoriquePrixChart;
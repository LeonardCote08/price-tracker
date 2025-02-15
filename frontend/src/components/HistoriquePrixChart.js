import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const HistoriquePrixChart = ({ dates, prices }) => {
    const data = {
        labels: dates,
        datasets: [
            {
                label: 'Price ($)',
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Price History' },
        },
        scales: {
            x: { title: { display: true, text: 'Date' } },
            y: { title: { display: true, text: 'Price in $' } },
        },
    };

    return (
        <div style={{ width: '100%', height: '250px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default HistoriquePrixChart;

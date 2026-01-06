import React from 'react';
import './Snowfall.css';

const Snowfall = () => {
    // Generate 100 snowflakes for a more visible effect
    const snowflakes = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        size: Math.random() * 8 + 4 + 'px',
        left: Math.random() * 100 + '%',
        delay: Math.random() * 20 + 's',
        duration: Math.random() * 12 + 10 + 's',
        opacity: Math.random() * 0.4 + 0.15,
        swayAmount: Math.random() * 200 - 100 + 'px',
        type: Math.random() > 0.3 ? 'circle' : 'icon',
        icon: ['❄', '✧', '•', '*'][Math.floor(Math.random() * 4)]
    }));

    return (
        <div className="snowfall-container">
            {snowflakes.map(snow => (
                <div
                    key={snow.id}
                    className={`snowflake ${snow.type}`}
                    style={{
                        width: snow.type === 'circle' ? snow.size : 'auto',
                        height: snow.type === 'circle' ? snow.size : 'auto',
                        left: snow.left,
                        animationDelay: snow.delay,
                        animationDuration: snow.duration,
                        opacity: snow.opacity,
                        fontSize: snow.type === 'icon' ? snow.size : 'inherit',
                        '--sway': snow.swayAmount
                    }}
                >
                    {snow.type === 'icon' ? snow.icon : null}
                </div>
            ))}
        </div>
    );
};

export default Snowfall;

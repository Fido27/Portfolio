import React from 'react';

export const AILoad = () => {
  // Generate the particle elements dynamically
  const particles = Array.from({ length: 13 }, (_, index) => (
    <div key={index} style={getParticleStyle(index + 1)} className="particle"></div>
  ));

  return (
    <div style={containerStyle}>
      {particles}
    </div>
  );
};

const containerStyle = {
  '--uib-size': '100px',
  '--uib-color': 'white',
  '--uib-speed': '2.75s',
  position: 'relative',
  height: 'var(--uib-size)',
  width: 'var(--uib-size)',
  animation: 'rotate calc(var(--uib-speed) * 4) linear infinite',
};

const getParticleStyle = (nth: number) => {
  const delays = [0, -0.4, -0.9, -0.5, -0.3, -0.2, -0.6, -0.7, -0.1, -0.8, -1.2, -0.5, -0.2];
  const rotations = [8, 36, 72, 90, 144, 180, 216, 252, 300, 324, 335, 290, 240];

  return {
    position: 'absolute',
    top: '0%',
    left: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    transform: `rotate(${rotations[nth - 1]}deg)`,
    '--uib-delay': `${delays[nth - 1]}s`,
  };
};

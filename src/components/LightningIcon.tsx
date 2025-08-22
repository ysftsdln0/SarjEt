import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const LightningIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
      fill={color}
      stroke={color}
      strokeWidth="1"
    />
  </Svg>
);

export default LightningIcon;

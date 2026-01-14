import React, { useMemo } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';

const PEDESTRIAN_WIDTH = 15;
const PEDESTRIAN_HEIGHT = 24;
const SPACING = 35;
const ROTATION = 20; 

export default function WalkingBackground() {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  
  const pedestrians = useMemo(() => {
    const items = [];
    const cols = Math.ceil(windowWidth / SPACING) + 1;
    const rows = Math.ceil(windowHeight / SPACING) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        items.push({
          id: `${row}-${col}`,
          x: col * SPACING,
          y: row * SPACING,
          opacity: 0.1,
        });
      }
    }
    return items;
  }, [windowWidth, windowHeight]);

  return (
    <View style={styles.container}>
      {pedestrians.map((item) => (
        <Image
          key={item.id}
          source={require('../assets/images/walking-pedestrian.png')}
          style={[
            styles.pedestrian,
            {
              left: item.x,
              top: item.y,
              opacity: item.opacity,
              transform: [{ rotate: `${ROTATION}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#B3D9FF',
    overflow: 'hidden',
  },
  pedestrian: {
    position: 'absolute',
    width: PEDESTRIAN_WIDTH,
    height: PEDESTRIAN_HEIGHT,
    tintColor: '#000',
  },
});


import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the main component
AppRegistry.registerComponent('App', () => App);

// In newer react-native-web, runApplication is the standard entry point
const rootTag = document.getElementById('root');
if (rootTag) {
  (AppRegistry as any).runApplication('App', {
    initialProps: {},
    rootTag,
  });
}

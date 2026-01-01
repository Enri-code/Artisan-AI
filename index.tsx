import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the main Artisan AI component
AppRegistry.registerComponent('App', () => App);

// In the browser context, we mount to the #root element
const rootTag = document.getElementById('root');

if (rootTag) {
  // runApplication handles the complex task of injecting RNW styles 
  // and initializing the React root for the application.
  (AppRegistry as any).runApplication('App', {
    initialProps: {},
    rootTag,
  });
}

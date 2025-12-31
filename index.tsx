import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

// Explicitly register and run for web environment
AppRegistry.registerComponent('App', () => App);

const rootTag = document.getElementById('root');
if (rootTag) {
  (AppRegistry as any).runApplication('App', {
    initialProps: {},
    rootTag,
  });
}
import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the application component
AppRegistry.registerComponent('App', () => App);

// Get the root element from the DOM
const rootTag = document.getElementById('root');

if (rootTag) {
  // Using runApplication is the recommended way for react-native-web to handle 
  // root mounting and automatic style sheet injection.
  (AppRegistry as any).runApplication('App', {
    initialProps: {},
    rootTag,
  });
}

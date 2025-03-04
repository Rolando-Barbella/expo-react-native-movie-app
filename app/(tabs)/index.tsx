import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import LikeMoviesScreen from '../screens/LikeMoviesScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Movies App',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('LikeMovies')}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="heart-outline" size={24} color="black" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ title: 'Movie Details' }}
        />
        <Stack.Screen
          name="LikeMovies"
          component={LikeMoviesScreen}
          options={{ title: 'Favorite Movies' }}
        />
      </Stack.Navigator>
    </>
  );
}

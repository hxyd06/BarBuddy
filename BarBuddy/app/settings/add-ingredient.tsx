import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const router = useRouter();
//Define category names as in database
const categories = [
    'Beer/Cider',
    'Wine',
    'Spirits',
    'Liqueurs',
    'Mixers',
    'Household',
    'Syrups',
    'Bitters',
    'Fruits/Vegetables',
    'Herbs/Spices',
    'Garnish',
  ];  

  //Set category names and their images
  const categoryImages: { [key: string]: any } = {
    'Beer/Cider': require('@/assets/images/beer_cider.webp'),
    'Wine': require('@/assets/images/wine.jpg'),
    'Spirits': require('@/assets/images/spirits.jpg'),
    'Liqueurs': require('@/assets/images/liqueurs.jpg'),
    'Mixers': require('@/assets/images/mixers.jpg'),
    'Household': require('@/assets/images/household.jpg'),
    'Syrups': require('@/assets/images/syrups.jpg'),
    'Bitters': require('@/assets/images/bitters.jpg'),
    'Fruits/Vegetables': require('@/assets/images/fruit_vegetable.jpg'),
    'Herbs/Spices': require('@/assets/images/herb_spice.jpg'),
    'Garnish': require('@/assets/images/garnish.jpg'),
  };

//Add ingredient screen
export default function addIngredientScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add an ingredient</Text>
      </View>
      {/* List of ingredient categories */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={{ padding: 10 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => router.push({
                pathname: '/settings/[category]',
                params: { category: item },
              })}              
          >
            <Image source={categoryImages[item]} style={styles.image}/>
            <Text style={styles.categoryText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

//Stylesheet
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
      backgroundColor: '#5c5c99',
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 15,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },      
    image: {
        width: '100%',
        height: 120,
        borderRadius: 10,
        marginBottom: 5,
        resizeMode: 'cover',
      },      
    categoryCard: {
      width: '48%',
      marginBottom: 20,
      alignItems: 'center',
    },
    placeholder: {
      width: '100%',
      height: 120,
      backgroundColor: '#ccc',
      borderRadius: 10,
      marginBottom: 5,
    },
    categoryText: {
      fontWeight: '500',
      textAlign: 'center',
    },
  });

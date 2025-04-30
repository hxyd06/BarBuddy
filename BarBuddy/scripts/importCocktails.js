const axios = require('axios');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  deleteDoc
} = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYbrOstXgo5golek9f37ty6zQ94CXzSnM",
  authDomain: "barbuddy-fc0b7.firebaseapp.com",
  projectId: "barbuddy-fc0b7",
  storageBucket: "barbuddy-fc0b7.firebasestorage.app",
  messagingSenderId: "688668097101",
  appId: "1:688668097101:web:3f425bf89105e630e8ba04"
};

// Initialize Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// API config
const API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';
const API_KEY = null; 
const apiKeyParam = API_KEY ? `?api_key=${API_KEY}` : '';

// 🧹 Delete all existing cocktails
async function clearCocktailsCollection() {
  console.log('Deleting all existing cocktails...');
  const snapshot = await getDocs(collection(db, 'cocktails'));
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'cocktails', docSnap.id));
    console.log(`Deleted: ${docSnap.id}`);
  }
  console.log('All cocktails deleted.\n');
}

// 🧾 Fetch all cocktails from TheCocktailDB
async function fetchAllCocktails() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let allCocktails = [];

  console.log('Fetching cocktails from TheCocktailDB API...');
  for (const letter of alphabet) {
    try {
      const res = await axios.get(`${API_BASE_URL}/search.php?f=${letter}${apiKeyParam}`);
      if (res.data.drinks) {
        allCocktails = [...allCocktails, ...res.data.drinks];
        console.log(`Fetched ${res.data.drinks.length} cocktails for '${letter}'`);
      }
    } catch (error) {
      console.error(`Error fetching '${letter}':`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`Total fetched: ${allCocktails.length}\n`);
  return allCocktails;
}

// 🛠 Format drink
function formatCocktailData(cocktail) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = cocktail[`strIngredient${i}`];
    const meas = cocktail[`strMeasure${i}`];
    if (ing) {
      ingredients.push({
        name: ing.trim(),
        measure: meas ? meas.trim() : '',
      });
    }
  }

  return {
    name: cocktail.strDrink,
    image: cocktail.strDrinkThumb,
    category: cocktail.strCategory,
    alcoholic: cocktail.strAlcoholic === 'Alcoholic',
    glass: cocktail.strGlass,
    instructions: cocktail.strInstructions,
    ingredients,
    dateAdded: new Date(),
    source: 'TheCocktailDB'
  };
}

// 🔁 Import all cocktails
async function importCocktailsToFirestore() {
  const cocktails = await fetchAllCocktails();
  let addedCount = 0;

  console.log('Importing to Firestore...\n');
  for (const cocktail of cocktails) {
    try {
      const formattedData = formatCocktailData(cocktail);

      // Create custom ID (e.g. "blackrussian", "longislandicedtea")
      const docId = cocktail.strDrink.toLowerCase().replace(/[^a-z0-9]/g, '');
      await setDoc(doc(db, 'cocktails', docId), formattedData);

      console.log(`Upserted: ${formattedData.name} (ID: ${docId})`);
      addedCount++;

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error saving ${cocktail.strDrink}:`, error.message);
    }
  }

  console.log(`\nImport complete! Total added/updated: ${addedCount}`);
}

// 🚀 Main function
(async () => {
  await clearCocktailsCollection();
  await importCocktailsToFirestore();
})();

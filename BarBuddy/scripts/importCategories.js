console.log('Script started');

const axios = require('axios');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// TheCocktailDB API
const API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';
const API_KEY = null;
const apiKeyParam = API_KEY ? `?api_key=${API_KEY}` : '';

// 🧹 Delete all categories
async function clearCategoriesCollection() {
  console.log('Deleting existing categories...');
  const snapshot = await getDocs(collection(db, 'categories'));
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'categories', docSnap.id));
    console.log(`Deleted: ${docSnap.id}`);
  }
  console.log('Categories cleared.\n');
}

// 🌱 Fetch and import categories
async function importCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/list.php?c=list${apiKeyParam}`);
    const rawCategories = response.data.drinks;

    if (!rawCategories || rawCategories.length === 0) {
      console.log('No categories found.');
      return;
    }

    console.log(`Fetched ${rawCategories.length} categories from API.\n`);

    for (const item of rawCategories) {
      const name = item.strCategory;
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const categoryData = {
        name,
        image: null,
        dateAdded: new Date(),
        source: 'TheCocktailDB'
      };

      await setDoc(doc(db, 'categories', id), categoryData);
      console.log(`Upserted: ${name} (ID: ${id})`);
    }

    console.log('\nCategory import complete!');
  } catch (error) {
    console.error('Error importing categories:', error.message);
  }
}

// 🚀 Main
(async () => {
  await clearCategoriesCollection();
  await importCategories();
})();

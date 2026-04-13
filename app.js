import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createContext, useContext, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

const PRODUCTS_DB = [
  { id: 'p1', name: 'Гречка', caloriesPer100g: 330 },
  { id: 'p2', name: 'Рис білий', caloriesPer100g: 360 },
  { id: 'p3', name: 'Вівсянка', caloriesPer100g: 389 },
  { id: 'p4', name: 'Рис бурий', caloriesPer100g: 345 },
  { id: 'p5', name: 'Хліб цільнозерновий', caloriesPer100g: 250 },
  { id: 'p6', name: 'Картопля', caloriesPer100g: 77 },
  { id: 'p7', name: 'Куряче філе', caloriesPer100g: 110 },
  { id: 'p8', name: 'Яйце куряче', caloriesPer100g: 155 },
  { id: 'p9', name: 'Яловичина', caloriesPer100g: 220 },
  { id: 'p10', name: 'Сир кисломолочний', caloriesPer100g: 121 },
  { id: 'p11', name: 'Йогурт натуральний', caloriesPer100g: 63 },
  { id: 'p12', name: 'Стейк лосося', caloriesPer100g: 206 },
  { id: 'p13', name: 'Помідор', caloriesPer100g: 18 },
  { id: 'p14', name: 'Огірок', caloriesPer100g: 15 },
  { id: 'p15', name: 'Брокколі', caloriesPer100g: 34 },
  { id: 'p16', name: 'Морква', caloriesPer100g: 41 },
  { id: 'p17', name: 'Шпинат', caloriesPer100g: 23 },
  { id: 'p18', name: 'Банан', caloriesPer100g: 89 },
  { id: 'p19', name: 'Яблуко', caloriesPer100g: 52 },
  { id: 'p20', name: 'Лохина', caloriesPer100g: 57 },
  { id: 'p21', name: 'Мигдаль', caloriesPer100g: 579 },
  { id: 'p22', name: 'Волоські горіхи', caloriesPer100g: 654 },
  { id: 'p23', name: 'Оливкова олія', caloriesPer100g: 884 },
  { id: 'p24', name: 'Чорний шоколад', caloriesPer100g: 546 },
];

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [meals, setMeals] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedMeals = await AsyncStorage.getItem('meals');
        const storedWeight = await AsyncStorage.getItem('weightHistory');
        if (storedMeals) setMeals(JSON.parse(storedMeals));
        if (storedWeight) setWeightHistory(JSON.parse(storedWeight));
      } catch (error) {}
    };
    loadData();
  }, []);

  useEffect(() => { AsyncStorage.setItem('meals', JSON.stringify(meals)); }, [meals]);
  useEffect(() => { AsyncStorage.setItem('weightHistory', JSON.stringify(weightHistory)); }, [weightHistory]);

  const addMeal = (name, totalCalories) => {
    const newMeal = { id: Date.now().toString(), name, calories: Math.round(totalCalories) };
    setMeals([newMeal, ...meals]);
  };

  const deleteMeal = (id) => setMeals(meals.filter(meal => meal.id !== id));

  const addWeight = (weightValue) => {
    const date = new Date().toLocaleDateString('uk-UA');
    const newWeight = { id: Date.now().toString(), value: parseFloat(weightValue), date };
    setWeightHistory([newWeight, ...weightHistory]);
  };

  const deleteWeight = (id) => setWeightHistory(weightHistory.filter(w => w.id !== id));

  return (
    <AppContext.Provider value={{ meals, addMeal, deleteMeal, weightHistory, addWeight, deleteWeight }}>
      {children}
    </AppContext.Provider>
  );
};

const HomeScreen = ({ navigation }) => {
  const { meals, deleteMeal } = useContext(AppContext);
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const dailyGoal = 2000; 

  const renderMeal = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.calories} ккал</Text>
      </View>
      <TouchableOpacity onPress={() => deleteMeal(item.id)}>
        <Text style={styles.deleteIcon}>❌</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Спожито за сьогодні:</Text>
        <Text style={styles.statsCalories}>
          {totalCalories} / <Text style={styles.statsGoal}>{dailyGoal} ккал</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Weight')}>
        <Text style={styles.secondaryButtonText}>⚖️ Моя вага (історія)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Історія прийомів їжі:</Text>
      {meals.length === 0 ? (
        <Text style={styles.emptyText}>Ви ще нічого не їли сьогодні 🍽️</Text>
      ) : (
        <FlatList data={meals} keyExtractor={item => item.id} renderItem={renderMeal} showsVerticalScrollIndicator={false} />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMeal')}>
        <Text style={styles.fabText}>+ Додати їжу</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const AddMealScreen = ({ navigation }) => {
  const { addMeal } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [grams, setGrams] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = PRODUCTS_DB.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProduct = (product) => {
    setSearchQuery(product.name);
    setSelectedProduct(product);
  };

  const handleSave = () => {
    if (!searchQuery || !grams) {
      Alert.alert('Помилка', 'Введіть назву продукту та його вагу.');
      return;
    }

    let productData = null;

    if (selectedProduct && selectedProduct.name === searchQuery) {
      productData = selectedProduct;
    } else {
      const dbProduct = PRODUCTS_DB.find(p => p.name.toLowerCase() === searchQuery.trim().toLowerCase());
      if (dbProduct) {
        productData = dbProduct;
      }
    }

    if (!productData) {
      Alert.alert('Помилка', 'Цього продукту немає в базі. Вкажіть його калорійність вручну.');
      return;
    }

    const totalCalories = (productData.caloriesPer100g * parseFloat(grams)) / 100;
    
    addMeal(`${productData.name} (${grams}г)`, totalCalories);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Пошук продукту (або введіть свій):</Text>
        <TextInput
          style={styles.input}
          placeholder="Напр. Гречка"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setSelectedProduct(null); 
          }}
        />

        {searchQuery.length > 0 && !selectedProduct && filteredProducts.length > 0 && (
          <ScrollView 
            style={styles.dropdown} 
            nestedScrollEnabled={true} 
            keyboardShouldPersistTaps="handled"
          >
            {filteredProducts.map(item => (
              <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => handleSelectProduct(item)}>
                <Text style={styles.dropdownText}>{item.name} ({item.caloriesPer100g} ккал/100г)</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Вага порції (в грамах):</Text>
        <TextInput
          style={styles.input}
          placeholder="Напр. 150"
          value={grams}
          onChangeText={setGrams}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>РОЗРАХУВАТИ ТА ДОДАТИ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const WeightScreen = () => {
  const { weightHistory, addWeight, deleteWeight } = useContext(AppContext);
  const [weightInput, setWeightInput] = useState('');

  const handleAddWeight = () => {
    if (!weightInput) { Alert.alert('Помилка', 'Введіть вашу вагу'); return; }
    addWeight(weightInput);
    setWeightInput('');
  };

  const renderWeightItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{item.value} кг</Text>
        <Text style={styles.cardSubtitle}>Дата: {item.date}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteWeight(item.id)}>
        <Text style={styles.deleteIcon}>❌</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Поточна вага (кг):</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Напр. 65.5"
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="numeric"
          />
          <TouchableOpacity style={[styles.primaryButton, { marginLeft: 10, marginTop: 0, paddingVertical: 14 }]} onPress={handleAddWeight}>
            <Text style={styles.primaryButtonText}>ЗБЕРЕГТИ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Історія зважувань:</Text>
      {weightHistory.length === 0 ? (
        <Text style={styles.emptyText}>Ви ще не додавали записів ваги.</Text>
      ) : (
        <FlatList data={weightHistory} keyExtractor={item => item.id} renderItem={renderWeightItem} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{ 
              headerStyle: { backgroundColor: '#9c2a3e' }, 
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' }
            }}>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Щоденник харчування' }} />
            <Stack.Screen name="AddMeal" component={AddMealScreen} options={{ title: 'Додати страву' }} />
            <Stack.Screen name="Weight" component={WeightScreen} options={{ title: 'Історія ваги' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  statsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15, elevation: 3 },
  statsTitle: { fontSize: 16, color: '#6b7280', marginBottom: 8 },
  statsCalories: { fontSize: 32, fontWeight: 'bold', color: '#9c2a3e' },
  statsGoal: { fontSize: 18, color: '#9ca3af' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 10, marginBottom: 10, marginLeft: 4 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 30, fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  cardSubtitle: { fontSize: 14, color: '#be185d', marginTop: 4, fontWeight: 'bold' },
  deleteIcon: { fontSize: 20 },
  fab: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#9c2a3e', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, elevation: 5 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#fce7f3', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  secondaryButtonText: { color: '#9c2a3e', fontWeight: 'bold', fontSize: 16 },
  form: { padding: 10, backgroundColor: '#fff', borderRadius: 12, marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 5, marginLeft: 4 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  primaryButton: { backgroundColor: '#9c2a3e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginTop: -10, marginBottom: 15, maxHeight: 150, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownText: { fontSize: 14, color: '#4b5563' }
});
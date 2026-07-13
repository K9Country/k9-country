import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import type { Property } from '../../types/property';

type SearchRadius = 5 | 10 | 25 | 50 | 100;

const radiusOptions: SearchRadius[] = [5, 10, 25, 50, 100];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedRadius, setSelectedRadius] =
    useState<SearchRadius>(25);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProperties = useMemo(() => {
    if (!normalizedQuery) {
      return properties;
    }

    return properties.filter((property) => {
      const searchableText = [
        property.name,
        property.short_description,
        property.city,
        property.state,
        property.postal_code,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [normalizedQuery, properties]);

  const loadProperties = useCallback(async () => {
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('properties')
      .select(
        `
          id,
          host_id,
          name,
          short_description,
          city,
          state,
          postal_code,
          price_per_hour,
          acreage,
          is_fully_fenced,
          fence_height_feet,
          instant_book,
          average_rating,
          review_count,
          hero_image_url,
          is_published,
          created_at,
          updated_at
        `
      )
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setProperties([]);
      return;
    }

    setProperties((data ?? []) as Property[]);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await loadProperties();
      } catch {
        setErrorMessage(
          'We could not load properties. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [loadProperties]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadProperties();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUseCurrentLocation = () => {
    Alert.alert(
      'Location access',
      'Current-location searching will be connected when we add maps and device location.'
    );
  };

  const handleFilters = () => {
    Alert.alert(
      'Filters',
      'Fence, acreage, amenities, price, and availability filters will be added next.'
    );
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const location = `${item.city}, ${item.state}`;

    let fenceLabel = 'Not fully fenced';

    if (item.is_fully_fenced) {
      fenceLabel = item.fence_height_feet
        ? `${item.fence_height_feet}-ft fence`
        : 'Fully fenced';
    }

    const acreageLabel =
      item.acreage !== null
        ? `${item.acreage} acre${item.acreage === 1 ? '' : 's'}`
        : 'Acreage not listed';

    return (
      <Pressable
        accessibilityRole="button"
onPress={() =>
  Alert.alert(
    'Property Details',
    'This screen will be built in the next development step.'
  )
}
        style={({ pressed }) => [
          styles.propertyCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderIcon}>🌳</Text>

          <Text style={styles.imagePlaceholderText}>
            Property photo
          </Text>
        </View>

        <View style={styles.propertyContent}>
          <View style={styles.propertyHeader}>
            <View style={styles.propertyHeading}>
              <Text style={styles.propertyName}>{item.name}</Text>

              <Text style={styles.propertyLocation}>
                {location}
              </Text>
            </View>

            {item.instant_book ? (
              <View style={styles.instantBookBadge}>
                <Text style={styles.instantBookText}>
                  Instant Book
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            numberOfLines={2}
            style={styles.propertyDescription}
          >
            {item.short_description}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailText}>
              {acreageLabel}
            </Text>

            <Text style={styles.detailDot}>•</Text>

            <Text style={styles.detailText}>{fenceLabel}</Text>
          </View>

          <View style={styles.propertyFooter}>
            <Text style={styles.ratingText}>
              ★ {Number(item.average_rating).toFixed(1)}
              {item.review_count > 0
                ? ` (${item.review_count})`
                : ' (New)'}
            </Text>

            <Text style={styles.priceText}>
              ${Number(item.price_per_hour).toFixed(0)}
              <Text style={styles.priceUnit}> / hour</Text>
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#263A24" />

          <Text style={styles.stateText}>
            Finding private spaces...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>
                ← Dashboard
              </Text>
            </Pressable>

            <Text style={styles.eyebrow}>DISCOVER</Text>

            <Text style={styles.title}>
              Find a private space
            </Text>

            <Text style={styles.subtitle}>
              Search for peaceful outdoor properties where your
              family and dog can enjoy exclusive access.
            </Text>

            <View style={styles.searchPanel}>
              <Text style={styles.inputLabel}>
                Where do you want to go?
              </Text>

              <TextInput
                accessibilityLabel="Search by city, ZIP code, or property name"
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="City, ZIP code, or property name"
                placeholderTextColor="#8A877D"
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />

              <Pressable
                accessibilityRole="button"
                onPress={handleUseCurrentLocation}
                style={styles.locationButton}
              >
                <Text style={styles.locationButtonText}>
                  ◎ Use my current location
                </Text>
              </Pressable>

              <Text style={styles.radiusLabel}>
                Search radius
              </Text>

              <View style={styles.radiusRow}>
                {radiusOptions.map((radius) => {
                  const isSelected = selectedRadius === radius;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={radius}
                      onPress={() => setSelectedRadius(radius)}
                      style={[
                        styles.radiusButton,
                        isSelected &&
                          styles.radiusButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radiusButtonText,
                          isSelected &&
                            styles.radiusButtonTextSelected,
                        ]}
                      >
                        {radius} mi
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.resultsHeading}>
              <Text style={styles.resultsTitle}>
                {filteredProperties.length}{' '}
                {filteredProperties.length === 1
                  ? 'space'
                  : 'spaces'}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={handleFilters}
                style={styles.filterButton}
              >
                <Text style={styles.filterButtonText}>
                  Filters
                </Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🐾</Text>

            <Text style={styles.emptyTitle}>
              {errorMessage
                ? 'Unable to load properties'
                : normalizedQuery
                  ? 'No matching spaces found'
                  : 'Private spaces are coming soon'}
            </Text>

            <Text style={styles.emptyDescription}>
              {errorMessage
                ? errorMessage
                : normalizedQuery
                  ? 'Try another city, ZIP code, or property name.'
                  : 'Published K9 Country properties will appear here as hosts complete their listings.'}
            </Text>

            {errorMessage ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleRefresh}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>
                  Try Again
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#263A24"
          />
        }
        renderItem={renderProperty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const colors = {
  forest: '#263A24',
  olive: '#3D522C',
  cream: '#F4ECDD',
  warmWhite: '#FFFDF8',
  brown: '#8A4F17',
  muted: '#6D6A60',
  border: '#D7CBB8',
  lightGreen: '#E8ECDD',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },

  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 12,
  },

  backButtonText: {
    color: colors.forest,
    fontSize: 16,
    fontWeight: '800',
  },

  eyebrow: {
    color: colors.brown,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 7,
  },

  title: {
    color: colors.forest,
    fontSize: 31,
    fontWeight: '900',
    marginBottom: 10,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 22,
  },

  searchPanel: {
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },

  inputLabel: {
    color: colors.forest,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },

  searchInput: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.cream,
    color: colors.forest,
    fontSize: 16,
    paddingHorizontal: 15,
  },

  locationButton: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 4,
  },

  locationButtonText: {
    color: colors.brown,
    fontSize: 14,
    fontWeight: '800',
  },

  radiusLabel: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 10,
  },

  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  radiusButton: {
    minHeight: 38,
    minWidth: 57,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.warmWhite,
    paddingHorizontal: 12,
  },

  radiusButtonSelected: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },

  radiusButtonText: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '800',
  },

  radiusButtonTextSelected: {
    color: colors.warmWhite,
  },

  resultsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  resultsTitle: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: '900',
  },

  filterButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brown,
    borderRadius: 20,
    paddingHorizontal: 17,
  },

  filterButtonText: {
    color: colors.brown,
    fontSize: 14,
    fontWeight: '800',
  },

  propertyCard: {
    overflow: 'hidden',
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginBottom: 16,
  },

  imagePlaceholder: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },

  imagePlaceholderIcon: {
    fontSize: 42,
  },

  imagePlaceholderText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },

  propertyContent: {
    padding: 17,
  },

  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  propertyHeading: {
    flex: 1,
    paddingRight: 10,
  },

  propertyName: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: '900',
  },

  propertyLocation: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },

  instantBookBadge: {
    borderRadius: 12,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  instantBookText: {
    color: colors.olive,
    fontSize: 11,
    fontWeight: '900',
  },

  propertyDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  detailText: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '700',
  },

  detailDot: {
    color: colors.muted,
    marginHorizontal: 7,
  },

  propertyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  ratingText: {
    color: colors.brown,
    fontSize: 14,
    fontWeight: '800',
  },

  priceText: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: '900',
  },

  priceUnit: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 42,
    paddingBottom: 60,
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    color: colors.forest,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 15,
  },

  emptyDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 10,
  },

  retryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.brown,
    paddingHorizontal: 24,
    marginTop: 20,
  },

  retryButtonText: {
    color: colors.warmWhite,
    fontSize: 15,
    fontWeight: '800',
  },

  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  stateText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 14,
  },

  cardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
});
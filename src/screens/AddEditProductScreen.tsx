import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { productService, Product, Category, CreateProductData, UpdateProductData } from '../services/productService';
import { useAuthStore } from '../state/authStore';
import { MainStackParamList } from '../config/navigationTypes';
import { useTheme } from '../context/ThemeContext';
import { withNetworkErrorBoundary } from '../components/NetworkErrorBoundary';

type AddEditProductNavigationProp = StackNavigationProp<MainStackParamList>;

interface FormData {
  name: string;
  price: string;
  discountPrice: string;
  quantity: string;
  stock: string;
  category: string;
  description: string;
}

interface ProductImage {
  uri: string;
  type: string;
  name: string;
  imageId?: string;
}

interface AddEditProductScreenProps {
  product?: Product;
  onSave?: (product: Product) => void;
  onBack?: () => void;
}

const AddEditProductScreen: React.FC<AddEditProductScreenProps> = ({
  product,
  onSave,
  onBack,
}) => {
  const navigation = useNavigation<AddEditProductNavigationProp>();
  const route = useRoute();
  const { user, token, isAuthenticated } = useAuthStore();
  const { theme } = useTheme();
  
  const editingProduct = route.params?.product || product;
  const isEditing = !!editingProduct;

  const [formData, setFormData] = useState<FormData>({
    name: editingProduct?.name || '',
    price: editingProduct?.price?.toString() || '',
    discountPrice: editingProduct?.discountPrice?.toString() || '',
    quantity: editingProduct?.quantity || '1 kg',
    stock: editingProduct?.stock?.toString() || '',
    category: editingProduct?.category?._id || '',
    description: editingProduct?.description || '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(editingProduct?.category?._id || '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Image-related state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    updateFormData('category', categoryId);
    setShowCategoryModal(false);
  };

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await productService.getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data);
        // Set default category if none selected and not editing
        if (!selectedCategoryId && response.data.length > 0 && !isEditing) {
          setSelectedCategoryId(response.data[0]._id);
          updateFormData('category', response.data[0]._id);
        }
      } else {
        // Fallback to mock categories if API fails
        const mockCategories: Category[] = [
          { _id: 'cat1', name: 'Fruits', image: '' },
          { _id: 'cat2', name: 'Vegetables', image: '' },
          { _id: 'cat3', name: 'Dairy', image: '' },
          { _id: 'cat4', name: 'Bakery', image: '' },
        ];
        setCategories(mockCategories);
        if (!selectedCategoryId && !isEditing) {
          setSelectedCategoryId(mockCategories[0]._id);
          updateFormData('category', mockCategories[0]._id);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter product description');
      return false;
    }
    if (!formData.price.trim()) {
      Alert.alert('Error', 'Please enter product price');
      return false;
    }
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (formData.discountPrice && (isNaN(Number(formData.discountPrice)) || Number(formData.discountPrice) <= 0)) {
      Alert.alert('Error', 'Please enter a valid discount price');
      return false;
    }
    if (!formData.stock.trim()) {
      Alert.alert('Error', 'Please enter stock quantity');
      return false;
    }
    if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return false;
    }
    if (!formData.quantity.trim()) {
      Alert.alert('Error', 'Please enter product quantity/unit');
      return false;
    }
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!token || !isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to save products');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editingProduct) {
        // Update existing product
        const updateData: UpdateProductData = {
          name: formData.name.trim(),
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
          quantity: formData.quantity.trim(),
          stock: Number(formData.stock),
          category: selectedCategoryId,
          description: formData.description.trim(),
        };

        const response = await productService.updateProduct(editingProduct._id, updateData);
        
        if (response.success) {
          Alert.alert(
            'Success',
            'Product updated successfully! Changes are pending admin approval.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          throw new Error(response.message || 'Failed to update product');
        }
      } else {
        // Create new product
        // Get the first uploaded image's ID (if any)
        const firstImage = productImages.find(img => img.imageId);
        const imageUrl = firstImage?.imageId
          ? productService.getImageUrl(firstImage.imageId)
          : undefined;

        const createData: CreateProductData = {
          name: formData.name.trim(),
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
          quantity: formData.quantity.trim(),
          stock: Number(formData.stock),
          category: selectedCategoryId,
          description: formData.description.trim(),
          image: imageUrl, // Include image URL if available
        };

        console.log('📦 Creating product with data:', createData);

        const response = await productService.createProduct(createData);
        
        if (response.success) {
          Alert.alert(
            'Success',
            'Product created successfully! It will be reviewed by admin before going live.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          throw new Error(response.message || 'Failed to create product');
        }
      }
      
      if (onSave && editingProduct) {
        onSave(editingProduct);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  // Image picker functions
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take product photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose an option to add product image',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      handleImageResponse
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];

      if (!asset.uri || !asset.type || !asset.fileName) {
        Alert.alert('Error', 'Invalid image selected');
        return;
      }

      const newImage: ProductImage = {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName,
      };

      // Add to local state immediately for UI feedback
      setProductImages(prev => [...prev, newImage]);

      // Upload to server
      await uploadImage(newImage);
    }
  };

  const uploadImage = async (image: ProductImage) => {
    if (!token || !isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to upload images');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Fix: Pass uri and name separately as the service expects
      const response = await productService.uploadImage(image.uri, image.name);

      if (response.success && response.data) {
        // Update the image with server response
        setProductImages(prev =>
          prev.map(img =>
            img.uri === image.uri
              ? { ...img, imageId: response.data.imageId }
              : img
          )
        );

        console.log('✅ Image uploaded successfully:', response.data.imageUrl);
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Upload Error', error instanceof Error ? error.message : 'Network error. Please check your internet connection and try again.');

      // Remove the image from local state if upload failed
      setProductImages(prev => prev.filter(img => img.uri !== image.uri));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = async (imageToRemove: ProductImage) => {
    try {
      // If image has been uploaded to server, delete it
      if (imageToRemove.imageId && token && isAuthenticated) {
        await productService.deleteImage(imageToRemove.imageId);
      }

      // Remove from local state
      setProductImages(prev => prev.filter(img => img.uri !== imageToRemove.uri));
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'Failed to remove image');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Product Images Section */}
          <View style={styles.imageSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Product Images</Text>

            {/* Display existing images */}
            {productImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                {productImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.productImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(image)}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                    {!image.imageId && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Add Image Button */}
            <TouchableOpacity
              style={styles.addImageContainer}
              onPress={showImagePicker}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size={24} color="#3be340" />
              ) : (
                <Icon name="add-a-photo" size={48} color="#9ca3af" />
              )}
              <Text style={styles.addImageText}>
                {isUploadingImage ? 'Uploading...' : 'Add Images'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Name */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Product Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="e.g. Organic Bananas"
              placeholderTextColor={theme.colors.textMuted}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
            />
          </View>

          {/* Description */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="e.g. Freshly sourced from local farms..."
              placeholderTextColor={theme.colors.textMuted}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Category</Text>
            {isLoadingCategories ? (
              <View style={[styles.pickerContainer, { justifyContent: 'center', backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.pickerText, { marginLeft: 8, color: theme.colors.text }]}>Loading categories...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.pickerContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => setShowCategoryModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                  {categories.find(cat => cat._id === selectedCategoryId)?.name || 'Select Category'}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quantity/Unit */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Quantity/Unit (e.g., "1 kg", "500g", "1 piece")</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="e.g. 1 kg, 500g, 1 piece"
              placeholderTextColor={theme.colors.textMuted}
              value={formData.quantity}
              onChangeText={(text) => updateFormData('quantity', text)}
            />
          </View>

          {/* Price Row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Price</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="e.g. 2.99"
                placeholderTextColor={theme.colors.textMuted}
                value={formData.price}
                onChangeText={(text) => updateFormData('price', text)}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Discount Price</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="e.g. 2.49"
                placeholderTextColor={theme.colors.textMuted}
                value={formData.discountPrice}
                onChangeText={(text) => updateFormData('discountPrice', text)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Stock Quantity */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Stock Quantity</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="e.g. 500"
              placeholderTextColor={theme.colors.textMuted}
              value={formData.stock}
              onChangeText={(text) => updateFormData('stock', text)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || isLoadingCategories}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#112112" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Updating...' : 'Creating...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Product' : 'Create Product'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.categoryOption,
                    selectedCategoryId === category._id && [styles.categoryOptionSelected, { backgroundColor: theme.colors.primary + '20' }]
                  ]}
                  onPress={() => handleCategorySelect(category._id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    { color: theme.colors.text },
                    selectedCategoryId === category._id && [styles.categoryOptionTextSelected, { color: theme.colors.primary }]
                  ]}>
                    {category.name}
                  </Text>
                  {selectedCategoryId === category._id && (
                    <Icon name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 24,
  },
  imageSection: {
    marginBottom: 24,
  },
  addImageContainer: {
    height: 160,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
    gap: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#3be340',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3be340',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#112112',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Image picker styles
  imageScrollView: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionSelected: {
    backgroundColor: '#f0fdf4',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  categoryOptionTextSelected: {
    color: '#3be340',
    fontWeight: '500',
  },
});

export default withNetworkErrorBoundary(AddEditProductScreen, {
  showErrorOnOffline: false, // Let banner handle general offline state
});

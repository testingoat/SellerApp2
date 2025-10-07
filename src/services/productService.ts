import { httpClient } from './httpClient';
import { offlineCacheService } from './offlineCacheService';
import NetInfo from '@react-native-community/netinfo';

// Product interfaces
export interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: string;
  category: {
    _id: string;
    name: string;
  };
  description: string;
  stock: number;
  image: string;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected'; // Changed from approvalStatus to status
  rejectionReason?: string;
  sellerId: string;
  sellerName: string;
  createdBy: 'seller';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Category {
  _id: string;
  name: string;
  image: string;
}

export interface CreateProductData {
  name: string;
  price: number;
  discountPrice?: number;
  quantity: string;
  category: string;
  description?: string;
  stock?: number;
  image?: string; // Image URL from uploaded image
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  discountPrice?: number;
  quantity?: string;
  category?: string;
  description?: string;
  stock?: number;
  image?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  data?: {
    imageId: string;
    imageUrl: string;
    filename: string;
  };
  message: string;
}

class ProductService {
  // Get all products for the authenticated seller
  async getSellerProducts(): Promise<{ success: boolean; data?: Product[]; message?: string }> {
    try {
      console.log('📦 ProductService: Fetching seller products...');

      // Check network connectivity
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      // If offline, try to return cached data
      if (!isOnline) {
        console.log('📴 ProductService: Offline - attempting to load from cache...');
        const cachedProducts = await offlineCacheService.getCachedProducts();

        if (cachedProducts) {
          const cacheAge = await offlineCacheService.getCacheAge('@offline_cache_products');
          console.log(`✅ ProductService: Loaded ${cachedProducts.length} products from cache (${cacheAge} min old)`);
          return {
            success: true,
            data: cachedProducts,
            message: `Showing cached data (${cacheAge} min old)`
          };
        } else {
          console.log('❌ ProductService: No cached data available');
          return {
            success: false,
            message: 'No internet connection and no cached data available'
          };
        }
      }

      // Online - fetch from API
      const response = await httpClient.get('/seller/products');

      console.log(`✅ ProductService: Retrieved ${response.data?.length || 0} products`);

      // Debug: Log each product's status
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((product: Product) => {
          console.log(`🔍 ProductService: Product "${product.name}" has status: "${product.status}"`);
        });

        // Cache the products for offline use
        await offlineCacheService.cacheProducts(response.data);
        console.log('💾 ProductService: Products cached for offline use');
      }

      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to get seller products:', error);

      // On error, try to return cached data as fallback
      const cachedProducts = await offlineCacheService.getCachedProducts();
      if (cachedProducts) {
        const cacheAge = await offlineCacheService.getCacheAge('@offline_cache_products');
        console.log(`⚠️ ProductService: API failed, using cached data (${cacheAge} min old)`);
        return {
          success: true,
          data: cachedProducts,
          message: `Using cached data due to network error (${cacheAge} min old)`
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to retrieve products'
      };
    }
  }

  // Create a new product (will be pending approval)
  async createProduct(productData: CreateProductData): Promise<{ success: boolean; data?: Product; message?: string }> {
    try {
      console.log('➕ ProductService: Creating new product:', productData.name);
      const response = await httpClient.post('/seller/products', productData);
      
      console.log('✅ ProductService: Product created successfully (pending approval)');
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to create product:', error);
      return {
        success: false,
        message: error.message || 'Failed to create product'
      };
    }
  }

  // Update an existing product
  async updateProduct(productId: string, updateData: UpdateProductData): Promise<{ success: boolean; data?: Product; message?: string }> {
    try {
      console.log('📝 ProductService: Updating product:', productId);
      const response = await httpClient.put(`/seller/products/${productId}`, updateData);
      
      console.log('✅ ProductService: Product updated successfully');
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to update product:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product'
      };
    }
  }

  // Delete a product
  async deleteProduct(productId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🗑️ ProductService: Deleting product:', productId);
      const response = await httpClient.delete(`/seller/products/${productId}`);
      
      console.log('✅ ProductService: Product deleted successfully');
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to delete product:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete product'
      };
    }
  }

  // Toggle product active status (only for approved products)
  async toggleProductStatus(productId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔄 ProductService: Toggling product status:', productId, isActive);
      const response = await httpClient.put(`/seller/products/${productId}/status`, { isActive });
      
      console.log('✅ ProductService: Product status toggled successfully');
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to toggle product status:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product status'
      };
    }
  }

  // Get all categories for product creation
  async getCategories(): Promise<{ success: boolean; data?: Category[]; message?: string }> {
    try {
      console.log('📋 ProductService: Fetching categories...');

      // Check network connectivity
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      // If offline, try to return cached data
      if (!isOnline) {
        console.log('📴 ProductService: Offline - attempting to load categories from cache...');
        const cachedCategories = await offlineCacheService.getCachedCategories();

        if (cachedCategories) {
          console.log(`✅ ProductService: Loaded ${cachedCategories.length} categories from cache`);
          return {
            success: true,
            data: cachedCategories,
            message: 'Showing cached categories'
          };
        }
      }

      // Online - fetch from API
      const response = await httpClient.get('/seller/categories');

      console.log(`✅ ProductService: Retrieved ${response.data?.length || 0} categories`);

      // Cache the categories for offline use
      if (response.data && Array.isArray(response.data)) {
        await offlineCacheService.cacheCategories(response.data);
        console.log('💾 ProductService: Categories cached for offline use');
      }

      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to get categories:', error);

      // On error, try to return cached data as fallback
      const cachedCategories = await offlineCacheService.getCachedCategories();
      if (cachedCategories) {
        console.log('⚠️ ProductService: API failed, using cached categories');
        return {
          success: true,
          data: cachedCategories,
          message: 'Using cached categories due to network error'
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to retrieve categories'
      };
    }
  }

  // Upload product image
  async uploadImage(imageUri: string, fileName?: string): Promise<ImageUploadResponse> {
    try {
      console.log('📸 ProductService: Uploading image...', { imageUri, fileName });

      // Determine file type from URI or filename
      let fileType = 'image/jpeg'; // Default
      const extension = (fileName || imageUri).toLowerCase().split('.').pop();
      if (extension === 'png') {
        fileType = 'image/png';
      } else if (extension === 'webp') {
        fileType = 'image/webp';
      } else if (extension === 'jpg' || extension === 'jpeg') {
        fileType = 'image/jpeg';
      }

      // Create FormData for image upload
      const formData = new FormData();

      // React Native FormData requires this specific format
      formData.append('file', {
        uri: imageUri,
        type: fileType,
        name: fileName || `product_${Date.now()}.${extension || 'jpg'}`,
      } as any);

      console.log('📤 Uploading with FormData:', {
        uri: imageUri,
        type: fileType,
        name: fileName || `product_${Date.now()}.${extension || 'jpg'}`,
      });

      const response = await httpClient.post('/seller/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ ProductService: Image uploaded successfully', response);
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to upload image:', error);

      // Extract more detailed error information
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image';
      console.error('❌ Error details:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Delete product image
  async deleteImage(imageId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🗑️ ProductService: Deleting image:', imageId);

      const response = await httpClient.delete(`/seller/images/${imageId}`);

      console.log('✅ ProductService: Image deleted successfully');
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to delete image:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete image'
      };
    }
  }

  // Get image URL for display
  getImageUrl(imageId: string): string {
    return `${httpClient.getBaseURL()}/seller/images/${imageId}`;
  }

  // Helper method to get product status display info
  getProductStatusInfo(product: Product): {
    status: string;
    color: string;
    canEdit: boolean;
    canDelete: boolean;
    canToggle: boolean;
    message?: string;
  } {
    switch (product.status) {
      case 'pending':
        return {
          status: 'Pending Approval',
          color: '#FFA500', // Orange
          canEdit: true,
          canDelete: true,
          canToggle: false,
          message: 'Your product is awaiting admin approval'
        };
      case 'approved':
        return {
          status: product.isActive ? 'Active' : 'Inactive',
          color: product.isActive ? '#4CAF50' : '#757575', // Green or Gray
          canEdit: false,
          canDelete: false,
          canToggle: true,
          message: product.isActive ? 'Product is live and visible to customers' : 'Product is approved but inactive'
        };
      case 'rejected':
        return {
          status: 'Rejected',
          color: '#F44336', // Red
          canEdit: true,
          canDelete: true,
          canToggle: false,
          message: product.rejectionReason || 'Product was rejected by admin. Edit and resubmit.'
        };
      default:
        return {
          status: 'Unknown',
          color: '#757575',
          canEdit: false,
          canDelete: false,
          canToggle: false
        };
    }
  }

  // Helper method to check if product is visible to customers
  isVisibleToCustomers(product: Product): boolean {
    return product.status === 'approved' && product.isActive;
  }

  // Get filtered products by status
  getProductsByStatus(products: Product[], status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'): Product[] {
    switch (status) {
      case 'pending':
        return products.filter(p => p.status === 'pending');
      case 'approved':
        return products.filter(p => p.status === 'approved');
      case 'rejected':
        return products.filter(p => p.status === 'rejected');
      case 'active':
        return products.filter(p => p.status === 'approved' && p.isActive);
      case 'inactive':
        return products.filter(p => p.status === 'approved' && !p.isActive);
      default:
        return products;
    }
  }

  // Get product statistics
  getProductStats(products: Product[]): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    active: number;
    inactive: number;
    liveProducts: number;
  } {
    return {
      total: products.length,
      pending: products.filter(p => p.status === 'pending').length,
      approved: products.filter(p => p.status === 'approved').length,
      rejected: products.filter(p => p.status === 'rejected').length,
      active: products.filter(p => p.status === 'approved' && p.isActive).length,
      inactive: products.filter(p => p.status === 'approved' && !p.isActive).length,
      liveProducts: products.filter(p => this.isVisibleToCustomers(p)).length,
    };
  }
}

// Export singleton instance
export const productService = new ProductService();
export default productService;
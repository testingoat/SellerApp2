import { httpClient } from './httpClient';

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
      const response = await httpClient.get('/seller/products');

      console.log(`✅ ProductService: Retrieved ${response.data?.length || 0} products`);

      // Debug: Log each product's status
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((product: Product) => {
          console.log(`🔍 ProductService: Product "${product.name}" has status: "${product.status}"`);
        });
      }

      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to get seller products:', error);
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
      const response = await httpClient.get('/seller/categories');
      
      console.log(`✅ ProductService: Retrieved ${response.data?.length || 0} categories`);
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to get categories:', error);
      return {
        success: false,
        message: error.message || 'Failed to retrieve categories'
      };
    }
  }

  // Upload product image
  async uploadImage(imageUri: string, fileName?: string): Promise<ImageUploadResponse> {
    try {
      console.log('📸 ProductService: Uploading image...');

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg', // Default to JPEG
        name: fileName || `product_image_${Date.now()}.jpg`,
      } as any);

      const response = await httpClient.post('/seller/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ ProductService: Image uploaded successfully');
      return response;
    } catch (error: any) {
      console.error('❌ ProductService: Failed to upload image:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload image'
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
import { getRedisClient } from '../config/redis.js';
import prisma from '../config/prisma.js';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
};

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { wholesaleSellerId, productId, quantity, width, height, size, selectedFinishConfig } = req.body;

    // Validate required fields
    if (!wholesaleSellerId || !productId || !quantity) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId, productId, and quantity are required',
      });
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.json({
        success: false,
        message: 'quantity must be a positive number',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        wholesaleSellerId_productId: {
          wholesaleSellerId: parseInt(wholesaleSellerId),
          productId: parseInt(productId),
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity and customization if item already exists
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          ...(width !== undefined && { width: parseFloat(width) }),
          ...(height !== undefined && { height: parseFloat(height) }),
          ...(size && { size }),
          ...(selectedFinishConfig && { selectedFinishConfig }),
        },
        include: {
          product: true,
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          wholesaleSellerId: parseInt(wholesaleSellerId),
          productId: parseInt(productId),
          quantity,
          ...(width !== undefined && { width: parseFloat(width) }),
          ...(height !== undefined && { height: parseFloat(height) }),
          ...(size && { size }),
          ...(selectedFinishConfig && { selectedFinishConfig }),
        },
        include: {
          product: true,
        },
      });
    }

    // Invalidate cart cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: 'Product added to cart successfully',
      cartItem,
    });
  } catch (error) {
    console.log('[v0] Error adding to cart:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Place order
const placeOrder = async (req, res) => {
  try {
    const { wholesaleSellerId, shippingCost, shippingAddress, orderItems } = req.body;

    // Validate required fields
    if (!wholesaleSellerId || shippingCost === undefined || !shippingAddress || !orderItems) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId, shippingCost, shippingAddress, and orderItems are required',
      });
    }

    // Validate shippingCost
    if (typeof shippingCost !== 'number' || shippingCost < 0) {
      return res.json({
        success: false,
        message: 'shippingCost must be a non-negative number',
      });
    }

    // Validate shippingAddress is a valid object
    if (typeof shippingAddress !== 'object' || shippingAddress === null) {
      return res.json({
        success: false,
        message: 'shippingAddress must be a valid JSON object',
      });
    }

    // Validate orderItems is an array
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.json({
        success: false,
        message: 'orderItems must be a non-empty array',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Validate each order item and fetch product details
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of orderItems) {
      const { productId, quantity, width, height, size, selectedFinishConfig } = item;

      // Validate required fields for each item
      if (!productId || !quantity || width === undefined || height === undefined) {
        return res.json({
          success: false,
          message: 'Each order item must have productId, quantity, width, and height',
        });
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.json({
          success: false,
          message: 'Quantity must be a positive number',
        });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
      });

      if (!product) {
        return res.json({
          success: false,
          message: `Product with ID ${productId} not found`,
        });
      }

      // Calculate item total
      const itemTotal = product.basePrice * quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        totalPrice: itemTotal,
        width: parseFloat(width),
        height: parseFloat(height),
        size: size || {},
        selectedFinishConfig: selectedFinishConfig || {},
      });
    }

    // Calculate total with shipping
    const total = subtotal + shippingCost;
    const orderNumber = generateOrderNumber();

    // Create order and order items
    const order = await prisma.order.create({
      data: {
        wholesaleSellerId: parseInt(wholesaleSellerId),
        orderNumber,
        subtotal,
        shippingCost,
        total,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        shippingAddress,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Delete cart items after successful order creation
    await prisma.cartItem.deleteMany({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    // Invalidate cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${wholesaleSellerId}`);
      await redisClient.setEx(`order:${order.id}`, 3600, JSON.stringify(order));
    }

    res.json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    console.log('[v0] Error placing order:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Update cart item quantity
const updateQuantity = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    // Validate required fields
    if (!cartItemId || quantity === undefined) {
      return res.json({
        success: false,
        message: 'cartItemId and quantity are required',
      });
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.json({
        success: false,
        message: 'quantity must be a positive number',
      });
    }

    // Check if cart item exists
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(cartItemId) },
      include: { product: true },
    });

    if (!cartItem) {
      return res.json({
        success: false,
        message: 'Cart item not found',
      });
    }

    // Update quantity
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: parseInt(cartItemId) },
      data: {
        quantity: parseInt(quantity),
      },
      include: {
        product: true,
      },
    });

    // Invalidate cart cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${cartItem.wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: 'Quantity updated successfully',
      cartItem: updatedCartItem,
    });
  } catch (error) {
    console.log('[v0] Error updating quantity:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete cart item
const deleteCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.body;

    // Validate required fields
    if (!cartItemId) {
      return res.json({
        success: false,
        message: 'cartItemId is required',
      });
    }

    // Check if cart item exists
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(cartItemId) },
    });

    if (!cartItem) {
      return res.json({
        success: false,
        message: 'Cart item not found',
      });
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: parseInt(cartItemId) },
    });

    // Invalidate cart cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${cartItem.wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    console.log('[v0] Error deleting cart item:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders from all wholesale sellers (Admin function)
const getAllOrders = async (req, res) => {
  try {
    // Query all orders with seller and order items details
    const orders = await prisma.order.findMany({
      include: {
        wholesaleSeller: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phoneNumber: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      message: 'All orders retrieved successfully',
      orders,
      totalOrders: orders.length,
    });
  } catch (error) {
    console.log('[v0] Error getting all orders:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders for a specific wholesale seller
const getSellerOrders = async (req, res) => {
  try {
    const { wholesaleSellerId } = req.body;

    // Validate required fields
    if (!wholesaleSellerId) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId is required',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Query all orders for the specific seller
    const orders = await prisma.order.findMany({
      where: {
        wholesaleSellerId: parseInt(wholesaleSellerId),
      },
      include: {
        wholesaleSeller: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phoneNumber: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      message: `Orders for seller ${seller.name} retrieved successfully`,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        companyName: seller.companyName,
      },
      orders,
      totalOrders: orders.length,
    });
  } catch (error) {
    console.log('[v0] Error getting seller orders:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Reorder - adds all items from a previous order back to cart
const reorderFromOrder = async (req, res) => {
  try {
    const { orderNumber, wholesaleSellerId } = req.body;

    // Validate required fields
    if (!orderNumber || !wholesaleSellerId) {
      return res.json({
        success: false,
        message: 'orderNumber and wholesaleSellerId are required',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify the order belongs to the seller
    if (order.wholesaleSellerId !== parseInt(wholesaleSellerId)) {
      return res.json({
        success: false,
        message: 'This order does not belong to this seller',
      });
    }

    // Add each order item back to cart
    const addedCartItems = [];

    for (const orderItem of order.orderItems) {
      // Check if item already exists in cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          wholesaleSellerId_productId: {
            wholesaleSellerId: parseInt(wholesaleSellerId),
            productId: orderItem.productId,
          },
        },
      });

      let cartItem;

      if (existingCartItem) {
        // Update quantity and customization if item already exists
        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + orderItem.quantity,
            width: orderItem.width,
            height: orderItem.height,
            size: orderItem.size,
            selectedFinishConfig: orderItem.selectedFinishConfig,
          },
          include: {
            product: true,
          },
        });
      } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            wholesaleSellerId: parseInt(wholesaleSellerId),
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            width: orderItem.width,
            height: orderItem.height,
            size: orderItem.size,
            selectedFinishConfig: orderItem.selectedFinishConfig,
          },
          include: {
            product: true,
          },
        });
      }

      addedCartItems.push(cartItem);
    }

    // Invalidate cart cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: `Successfully added all items from order ${orderNumber} to cart`,
      order: {
        orderNumber: order.orderNumber,
        id: order.id,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        createdAt: order.createdAt,
      },
      cartItems: addedCartItems,
      totalItemsAdded: addedCartItems.length,
    });
  } catch (error) {
    console.log('[v0] Error reordering from order:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get seller's cart
const getSellerCart = async (req, res) => {
  try {
    const { wholesaleSellerId } = req.body;

    // Validate required fields
    if (!wholesaleSellerId) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId is required',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Get all cart items for the seller
    const cartItems = await prisma.cartItem.findMany({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total cart value
    let cartSubtotal = 0;
    const cartItemsWithTotals = cartItems.map((item) => {
      const itemTotal = item.product.basePrice * item.quantity;
      cartSubtotal += itemTotal;
      return {
        ...item,
        itemTotal,
      };
    });

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        companyName: seller.companyName,
      },
      cartItems: cartItemsWithTotals,
      cartSummary: {
        totalItems: cartItems.length,
        subtotal: cartSubtotal,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.log('[v0] Error getting seller cart:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { addToCart, placeOrder, updateQuantity, deleteCartItem, getAllOrders, getSellerOrders, reorderFromOrder, getSellerCart };

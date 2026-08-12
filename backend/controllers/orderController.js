import { getRedisClient } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { uploadToS3 } from '../config/s3.js';
import { createStripePaymentIntent, confirmStripePayment } from '../config/stripe.js';
import { chargeAuthorizeNet } from '../config/authorizeNet.js';
import { Resend } from 'resend';
import fs from 'fs';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to parse JSON safely
const parseJSON = (value) => {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  } catch (e) {
    return null;
  }
};

// Each active finish config option adds a flat surcharge to a product's base price.
// Mirrors the frontend calculation in OrderBanner.jsx (getConfigSurcharge):
// - boolean options add the surcharge only when set to true
// - other options add the surcharge whenever they hold a non-empty value
// This is computed server-side (never trusting a price sent by the client) so it
// can't be tampered with, and is the single source of truth used everywhere a
// cart/order item price is calculated.
const CONFIG_SURCHARGE = 2.5;

const calculateItemPrice = (product, selectedFinishConfig) => {
  if (!product?.finishConfig || typeof product.finishConfig !== 'object') {
    return product.basePrice;
  }

  const config = parseJSON(selectedFinishConfig) || selectedFinishConfig || {};

  const surcharge = Object.entries(product.finishConfig).reduce((total, [key, originalValue]) => {
    const currentValue = config[key] !== undefined ? config[key] : originalValue;
    const isBoolean = typeof originalValue === 'boolean';

    if (isBoolean) {
      return currentValue === true ? total + CONFIG_SURCHARGE : total;
    }

    const hasValue = currentValue !== '' && currentValue !== null && currentValue !== undefined;
    return hasValue ? total + CONFIG_SURCHARGE : total;
  }, 0);

  return product.basePrice + surcharge;
};

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
};

// Function to send order confirmation email
const sendOrderConfirmationEmail = async (sellerEmail, sellerName, order, lang = 'en') => {
  try {
    const language = lang === 'fr' ? 'fr' : 'en';
    const content = language === 'fr' ? {
      subject: `Confirmation de commande - ${order.orderNumber}`,
      title: 'Confirmation de commande',
      greeting: `Bonjour ${sellerName},`,
      intro: 'Merci pour votre commande ! Nous avons reçu votre paiement et votre commande est en cours de traitement.',
      details: 'Détails de la commande', date: 'Date de commande', method: 'Mode de paiement', status: 'Statut du paiement', paid: 'Payé',
      items: 'Articles commandés', product: 'Produit', quantity: 'Quantité', price: 'Prix', subtotal: 'Sous-total', shipping: 'Livraison', total: 'Total', address: 'Adresse de livraison', next: 'Quelle est la prochaine étape ?', nextText: 'Votre commande est en préparation. Vous recevrez une notification avec les informations de suivi dès son expédition.', regards: 'Cordialement,', support: 'Pour toute question concernant votre commande, contactez-nous à support@trading.printing.coop',
    } : {
      subject: `Order Confirmation - ${order.orderNumber}`,
      title: 'Order Confirmation', greeting: `Hi ${sellerName},`, intro: 'Thank you for your order! We have received your payment and your order is now being processed.',
      details: 'Order Details', date: 'Order Date', method: 'Payment Method', status: 'Payment Status', paid: 'Paid', items: 'Items Ordered', product: 'Product', quantity: 'Quantity', price: 'Price', subtotal: 'Subtotal', shipping: 'Shipping', total: 'Total', address: 'Shipping Address', next: "What's Next?", nextText: 'Your order is being prepared for shipment. You will receive a shipping notification with tracking information once your order ships.', regards: 'Best regards,', support: 'If you have any questions about your order, please contact us at support@trading.printing.coop',
    };
    const itemsHTML = order.orderItems
      .map((item) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; text-align: left;">${item.product?.name || 'Product'}</td>
          <td style="padding: 12px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right;">$${item.totalPrice?.toFixed(2) || '0.00'}</td>
        </tr>
      `)
      .join('');

    const response = await resend.emails.send({
      from: 'noreply@trading.printing.coop',
      to: sellerEmail,
subject: content.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #333;">${content.title}</h2>
          <p style="color: #666; font-size: 16px;">${content.greeting}</p>
          <p style="color: #666; font-size: 16px;">${content.intro}</p>
          
          <div style="margin: 30px 0; background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
<h3 style="color: #333; margin-top: 0;">${content.details}</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>${content.date}:</strong> ${new Date(order.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
            <p><strong>${content.method}:</strong> ${order.paymentMethod || 'Stripe'}</p>
            <p><strong>${content.status}:</strong> <span style="color: #28a745; font-weight: bold;">${content.paid}</span></p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #333;">${content.items}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
<th style="padding: 12px; text-align: left;">${content.product}</th>
                  <th style="padding: 12px; text-align: center;">${content.quantity}</th>
                  <th style="padding: 12px; text-align: right;">${content.price}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>

          <div style="margin: 30px 0; background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>${content.subtotal}:</span>
              <span>$${order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>${content.shipping}:</span>
              <span>$${order.shippingCost?.toFixed(2) || '0.00'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px;">
              <span>${content.total}:</span>
              <span>$${order.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #333;">${content.address}</h3>
            <p style="color: #666;">
              ${order.shippingAddress?.name || ''}<br/>
              ${order.shippingAddress?.address || ''}<br/>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipcode || ''}<br/>
              ${order.shippingAddress?.country || ''}
            </p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #e8f4f8; border-radius: 5px;">
            <p style="color: #333; margin: 0;">
<strong>${content.next}</strong><br/>
              ${content.nextText}
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 14px;">
${content.support}<br/>
              <strong>${content.regards}<br/>Trading & Printing Coop Team</strong>
            </p>
          </div>
        </div>
      `,
    });

    if (response.error) {
      console.error('[v0] Resend API error sending order confirmation:', response.error);
      return false;
    } else {
      console.log('[v0] Order confirmation email sent successfully to:', sellerEmail, 'Order:', order.orderNumber);
      return true;
    }
  } catch (error) {
    console.error('[v0] Error sending order confirmation email:', error.message);
    return false;
  }
};

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { wholesaleSellerId, productId, quantity, width, height, size, selectedFinishConfig, imageUrl, images: imageUrls } = req.body;

    // Validate required fields
    if (!wholesaleSellerId || !productId || quantity === undefined) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId, productId, and quantity are required',
      });
    }

    // Parse and validate numeric fields
    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.json({
        success: false,
        message: 'quantity must be a positive number',
      });
    }

    // Parse optional numeric fields
    const parsedWidth = width !== undefined ? parseFloat(width) : undefined;
    const parsedHeight = height !== undefined ? parseFloat(height) : undefined;
    
    // Parse optional JSON fields
    const parsedSize = parseJSON(size);
    const parsedFinishConfig = parseJSON(selectedFinishConfig);

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

    // Handle images - supports a plural images[] array (multi-image products like
    // OrderRigid, where the same image URL may repeat once per grid cell it fills)
    // as well as the original singular imageUrl (single-image products)
    let images = [];
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      images = imageUrls
        .filter((url) => typeof url === 'string' && url.trim() !== '')
        .map((url) => ({ url, uploadedAt: new Date() }));
      console.log('[v0] Using selected image URLs:', images.length);
    } else if (imageUrl) {
      // Image URL from ImageZone selection
      images.push({
        url: imageUrl,
        uploadedAt: new Date(),
      });
      console.log('[v0] Using selected image URL:', imageUrl);
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
      const updatedImages = images.length > 0 
        ? [...(existingCartItem.images || []), ...images]
        : existingCartItem.images;

      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + parsedQuantity,
          ...(parsedWidth !== undefined && { width: parsedWidth }),
          ...(parsedHeight !== undefined && { height: parsedHeight }),
          ...(parsedSize && { size: parsedSize }),
          ...(parsedFinishConfig && { selectedFinishConfig: parsedFinishConfig }),
          ...(images.length > 0 && { images: updatedImages }),
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
          quantity: parsedQuantity,
          ...(parsedWidth !== undefined && { width: parsedWidth }),
          ...(parsedHeight !== undefined && { height: parsedHeight }),
          ...(parsedSize && { size: parsedSize }),
          ...(parsedFinishConfig && { selectedFinishConfig: parsedFinishConfig }),
          ...(images.length > 0 && { images: images }),
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

    // Parse and validate shippingCost
    const parsedShippingCost = Number(shippingCost);
    if (Number.isNaN(parsedShippingCost) || parsedShippingCost < 0) {
      return res.json({
        success: false,
        message: 'shippingCost must be a non-negative number',
      });
    }

    // Parse shippingAddress if it's a string
    const parsedShippingAddress = parseJSON(shippingAddress) || shippingAddress;

    // Validate shippingAddress is a valid object
    if (typeof parsedShippingAddress !== 'object' || parsedShippingAddress === null) {
      return res.json({
        success: false,
        message: 'shippingAddress must be a valid JSON object',
      });
    }

    // Parse orderItems if it's a string
    let parsedOrderItems = orderItems;
    if (typeof orderItems === 'string') {
      parsedOrderItems = parseJSON(orderItems);
    }

    // Validate orderItems is an array
    if (!Array.isArray(parsedOrderItems) || parsedOrderItems.length === 0) {
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

    // Validate each order item and fetch product details and cart images
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of parsedOrderItems) {
      const { productId, quantity, width, height, size, selectedFinishConfig, cartItemId } = item;

      // Validate required fields for each item
      if (!productId || quantity === undefined || width === undefined || height === undefined) {
        return res.json({
          success: false,
          message: 'Each order item must have productId, quantity, width, and height',
        });
      }

      // Parse and validate quantity
      const itemQuantity = Number(quantity);
      if (Number.isNaN(itemQuantity) || itemQuantity <= 0) {
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

      // Fetch cart item images using wholesaleSellerId and productId combination
      let cartImages = [];
      const cartItem = await prisma.cartItem.findUnique({
        where: {
          wholesaleSellerId_productId: {
            wholesaleSellerId: parseInt(wholesaleSellerId),
            productId: parseInt(productId),
          },
        },
      });
      
      if (cartItem && cartItem.images) {
        cartImages = cartItem.images;
      }

      // Parse optional JSON fields for item
      const itemSize = parseJSON(size) || size || {};
      const itemFinishConfig = parseJSON(selectedFinishConfig) || selectedFinishConfig || {};

      // Calculate item total (base price + finish config surcharges, computed server-side)
      const itemTotal = calculateItemPrice(product, itemFinishConfig) * itemQuantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: parseInt(productId),
        quantity: itemQuantity,
        totalPrice: itemTotal,
        width: parseFloat(width),
        height: parseFloat(height),
        size: itemSize,
        selectedFinishConfig: itemFinishConfig,
        images: cartImages || [],
      });
    }

    // Calculate total with shipping
    const total = subtotal + parsedShippingCost;
    const orderNumber = generateOrderNumber();

    // Create order and order items
    const order = await prisma.order.create({
      data: {
        wholesaleSellerId: parseInt(wholesaleSellerId),
        orderNumber,
        subtotal,
        shippingCost: parsedShippingCost,
        total,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        shippingAddress: parsedShippingAddress,
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

    // Parse and validate quantity
    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
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
        quantity: parsedQuantity,
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
            images: orderItem.images || [],
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
            images: orderItem.images || [],
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

    // Calculate total cart value (base price + finish config surcharges, computed server-side)
    let cartSubtotal = 0;
    const cartItemsWithTotals = cartItems.map((item) => {
      const unitPrice = calculateItemPrice(item.product, item.selectedFinishConfig);
      const itemTotal = unitPrice * item.quantity;
      cartSubtotal += itemTotal;
      return {
        ...item,
        unitPrice,
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

// ---------------------------------------------------------------------------
// Stripe test payment flow
// ---------------------------------------------------------------------------

// Shared helper: validate order items and recompute totals from DB prices (server-side)
// This prevents the client from tampering with prices.
const buildOrderItemsFromDB = async (wholesaleSellerId, orderItems) => {
  let subtotal = 0;
  const orderItemsData = [];

  for (const item of orderItems) {
    const { productId, quantity, width, height, size, selectedFinishConfig } = item;

    if (!productId || quantity === undefined || width === undefined || height === undefined) {
      throw new Error('Each order item must have productId, quantity, width, and height');
    }

    const itemQuantity = Number(quantity);
    if (Number.isNaN(itemQuantity) || itemQuantity <= 0 || !Number.isInteger(itemQuantity)) {
      throw new Error('Quantity must be a positive integer');
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Fetch cart item images to copy into the order
    let cartImages = [];
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        wholesaleSellerId_productId: {
          wholesaleSellerId: parseInt(wholesaleSellerId),
          productId: parseInt(productId),
        },
      },
    });

    if (cartItem && cartItem.images) {
      cartImages = cartItem.images;
    }

    const itemSize = parseJSON(size) || size || {};
    const itemFinishConfig = parseJSON(selectedFinishConfig) || selectedFinishConfig || {};

    // Recompute price from the DB (base price + finish config surcharges), never trust the client
    const itemTotal = calculateItemPrice(product, itemFinishConfig) * itemQuantity;
    subtotal += itemTotal;

    orderItemsData.push({
      productId: parseInt(productId),
      quantity: itemQuantity,
      totalPrice: itemTotal,
      width: parseFloat(width),
      height: parseFloat(height),
      size: itemSize,
      selectedFinishConfig: itemFinishConfig,
      images: cartImages || [],
    });
  }

  return { subtotal, orderItemsData };
};

// Step 1: Create a Stripe Payment Intent. Total is computed server-side from DB prices.
const createStripePaymentIntentController = async (req, res) => {
  try {
    const { wholesaleSellerId, shippingCost, orderItems } = req.body;

    if (!wholesaleSellerId || shippingCost === undefined || !orderItems) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId, shippingCost, and orderItems are required',
      });
    }

    const parsedShippingCost = Number(shippingCost);
    if (Number.isNaN(parsedShippingCost) || parsedShippingCost < 0) {
      return res.json({ success: false, message: 'shippingCost must be a non-negative number' });
    }

    let parsedOrderItems = orderItems;
    if (typeof orderItems === 'string') {
      parsedOrderItems = parseJSON(orderItems);
    }
    if (!Array.isArray(parsedOrderItems) || parsedOrderItems.length === 0) {
      return res.json({ success: false, message: 'orderItems must be a non-empty array' });
    }

    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });
    if (!seller) {
      return res.json({ success: false, message: 'Wholesale seller not found' });
    }

    // Recompute total server-side
    const { subtotal } = await buildOrderItemsFromDB(wholesaleSellerId, parsedOrderItems);
    const total = subtotal + parsedShippingCost;

    // Create the Stripe Payment Intent
    const { clientSecret, paymentIntentId } = await createStripePaymentIntent(total);

    res.json({
      success: true,
      message: 'Payment Intent created',
      clientSecret,
      paymentIntentId,
      total,
    });
  } catch (error) {
    console.log('[v0] Error creating Stripe Payment Intent:', error.message);
    res.json({ success: false, message: error.message });
  }
};

// Step 2: Confirm the Stripe payment and, if successful, create the DB order + clear cart.
const confirmStripePaymentController = async (req, res) => {
  try {
    const { paymentIntentId, wholesaleSellerId, shippingCost, shippingAddress, orderItems, lang = 'en' } = req.body;

    if (!paymentIntentId || !wholesaleSellerId || shippingCost === undefined || !shippingAddress || !orderItems) {
      return res.json({
        success: false,
        message: 'paymentIntentId, wholesaleSellerId, shippingCost, shippingAddress, and orderItems are required',
      });
    }

    const parsedShippingCost = Number(shippingCost);
    if (Number.isNaN(parsedShippingCost) || parsedShippingCost < 0) {
      return res.json({ success: false, message: 'shippingCost must be a non-negative number' });
    }

    const parsedShippingAddress = parseJSON(shippingAddress) || shippingAddress;
    if (typeof parsedShippingAddress !== 'object' || parsedShippingAddress === null) {
      return res.json({ success: false, message: 'shippingAddress must be a valid JSON object' });
    }

    let parsedOrderItems = orderItems;
    if (typeof orderItems === 'string') {
      parsedOrderItems = parseJSON(orderItems);
    }
    if (!Array.isArray(parsedOrderItems) || parsedOrderItems.length === 0) {
      return res.json({ success: false, message: 'orderItems must be a non-empty array' });
    }

    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });
    if (!seller) {
      return res.json({ success: false, message: 'Wholesale seller not found' });
    }

    // Confirm the Stripe payment
    const paymentResult = await confirmStripePayment(paymentIntentId);

    if (paymentResult.status !== 'succeeded') {
      return res.json({
        success: false,
        message: `Payment not successful. Status: ${paymentResult.status}`,
      });
    }

    // Build order items again from DB (secure) and create the order
    const { subtotal, orderItemsData } = await buildOrderItemsFromDB(wholesaleSellerId, parsedOrderItems);
    const total = subtotal + parsedShippingCost;
    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        wholesaleSellerId: parseInt(wholesaleSellerId),
        orderNumber,
        subtotal,
        shippingCost: parsedShippingCost,
        total,
        paymentMethod: 'Stripe',
        paymentStatus: 'Paid',
        orderStatus: 'Processing',
        shippingAddress: parsedShippingAddress,
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

    // Clear cart after successful payment
    await prisma.cartItem.deleteMany({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${wholesaleSellerId}`);
      await redisClient.setEx(`order:${order.id}`, 3600, JSON.stringify(order));
    }

    // Send order confirmation email to the seller
    const sellerData = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
      select: { email: true, name: true },
    });

    if (sellerData) {
      await sendOrderConfirmationEmail(sellerData.email, sellerData.name, order, lang);
    }

    res.json({
      success: true,
      message: 'Payment successful and order placed',
      order,
      stripePaymentId: paymentIntentId,
    });
  } catch (error) {
    console.log('[v0] Error confirming Stripe payment:', error.message);
    res.json({ success: false, message: error.message });
  }
};

const chargeAuthorizeNetController = async (req, res) => {
  try {
    const { paymentNonce, wholesaleSellerId, shippingCost, shippingAddress, orderItems, lang = 'en' } = req.body;
    if (!paymentNonce || !wholesaleSellerId || shippingCost === undefined || !shippingAddress || !orderItems) {
      return res.json({ success: false, message: 'paymentNonce, wholesaleSellerId, shippingCost, shippingAddress, and orderItems are required' });
    }

    const parsedShippingCost = Number(shippingCost);
    const parsedShippingAddress = parseJSON(shippingAddress) || shippingAddress;
    const parsedItems = typeof orderItems === 'string' ? parseJSON(orderItems) : orderItems;
    if (!Number.isFinite(parsedShippingCost) || parsedShippingCost < 0 || !Array.isArray(parsedItems) || !parsedItems.length) {
      return res.json({ success: false, message: 'Invalid shipping cost or order items' });
    }
    if (!parsedShippingAddress || typeof parsedShippingAddress !== 'object') {
      return res.json({ success: false, message: 'shippingAddress must be a valid JSON object' });
    }

    const sellerId = parseInt(wholesaleSellerId);
    const seller = await prisma.wholesaleSeller.findUnique({ where: { id: sellerId } });
    if (!seller) return res.json({ success: false, message: 'Wholesale seller not found' });

    const { subtotal, orderItemsData } = await buildOrderItemsFromDB(sellerId, parsedItems);
    const total = subtotal + parsedShippingCost;
    const payment = await chargeAuthorizeNet({ amount: total, opaqueData: paymentNonce });
    const order = await prisma.order.create({
      data: {
        wholesaleSellerId: sellerId,
        orderNumber: generateOrderNumber(),
        subtotal,
        shippingCost: parsedShippingCost,
        total,
        paymentMethod: 'Authorize.net',
        paymentStatus: 'Paid',
        orderStatus: 'Processing',
        shippingAddress: parsedShippingAddress,
        orderItems: { create: orderItemsData },
      },
      include: { orderItems: { include: { product: true } } },
    });

    await prisma.cartItem.deleteMany({ where: { wholesaleSellerId: sellerId } });
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`cart:${sellerId}`);
      await redisClient.setEx(`order:${order.id}`, 3600, JSON.stringify(order));
    }
    const sellerData = await prisma.wholesaleSeller.findUnique({ where: { id: sellerId }, select: { email: true, name: true } });
    if (sellerData) await sendOrderConfirmationEmail(sellerData.email, sellerData.name, order, lang);

    return res.json({ success: true, message: 'Authorize.net payment successful and order placed', order, authorizeNetTransactionId: payment.transactionId });
  } catch (error) {
    console.log('[v0] Error processing Authorize.net payment:', error.message);
    return res.json({ success: false, message: error.message });
  }
};

export { addToCart, placeOrder, updateQuantity, deleteCartItem, getAllOrders, getSellerOrders, reorderFromOrder, getSellerCart, createStripePaymentIntentController, confirmStripePaymentController, chargeAuthorizeNetController };

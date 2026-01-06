import DataLayerManager from './dataLayerManager.js';
import GOOGLE_TAG_MANAGER_CONFIG from './dataLayerManager.config.js';
import TEMPLATE_GENERAL from './templates/general.json';
import TEMPLATE_PRODUCT from './templates/product.json';
import TEMPLATE_CART from './templates/cart.json';

const googleTagManager = new DataLayerManager(
  {
    ...TEMPLATE_GENERAL,
    ...TEMPLATE_PRODUCT,
    ...TEMPLATE_CART,
  },
  GOOGLE_TAG_MANAGER_CONFIG
);

window.dataLayer = window.dataLayer || [];
window.dataLayerManager = googleTagManager;

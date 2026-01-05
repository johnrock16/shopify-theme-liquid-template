window.dataLayerManager.pushToDataLayer('view_item', {
  "ecommerce": {
    "currency": "usd",
    "value": 14.99,
    "items": [
      {
        "item_id": 56012347401,
        "item_name": 'cool-shoes',
        "item_variant": "blue",
        "item_vendor": "awesome-company",
        "price": 14.99
      }
    ]
  }
});

console.log(window.dataLayer);
console.log(window.dataLayer[0]);

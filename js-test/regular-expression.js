/**
 * 
 */
var sku_variant = 'abc-xyz-123-4ff';
var res = sku_variant.match(/^([^-]+(?:-[^-]+)*)-([^-]+)$/);
console.log(JSON.stringify(res));


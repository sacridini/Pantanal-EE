/** 
* pantanal-ee.js
* Description: Estudos sobre o pantanal (sazonal)
* Eduardo Ribeiro Lacerda <elacerda@id.uff.br>
*/

// Carrega as imagens MODIS e o shapefile do bioma Pantanal dos meus assets
var modis = ee.ImageCollection("MODIS/006/MOD09A1");
var pantanal = ee.FeatureCollection("users/eduardolacerdageo/pantanal");

// Array contendo os anos que serão analisados
var anos = [2000, 2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010, 2011,
    2012, 2013, 2014, 2015, 2016, 2017];

// Função para cria o NDWI
function calc_ndwi(image) {
    var ndwi_image = image.normalizedDifference(['sur_refl_b04', 'sur_refl_b02']).rename('NDWI');
    var collection_with_ndwi = image.addBands(ndwi_image);
    return collection_with_ndwi;
}

// Arrays que conterão a coleção MODIS inicial + os NDWI criados pela função anterior
var ndwi_umido = [];
var ndwi_seco = [];

// Função para filtrar os dados para o período umido
var filtrar_umido = function (ano) {
    var image = ee.ImageCollection(modis
        .filterBounds(pantanal)
        .filterDate(ano.toString() + '-01-01', ano.toString() + '-04-30')
        .map(calc_ndwi));
    ndwi_umido.push(image);
};

// Função para filtrar os dados para o período seco
var filtrar_seco = function (ano) {
    var image = ee.ImageCollection(modis
        .filterBounds(pantanal)
        .filterDate(ano.toString() + '-05-01', ano.toString() + '-11-30')
        .map(calc_ndwi));
    ndwi_seco.push(image);
};

// Calcula a média de todos os valores dos pixels de forma sazonal para todos os anos.
var calc_mean_by_season = function (ic_season) {
    var image = ic_season.mean();
    return image;
};


// Chama das funções + visualização
anos.map(filtrar_umido);
anos.map(filtrar_seco);
print('Período Umido: ', ndwi_umido);
print('Período Seco: ', ndwi_seco);
var col_mean_umido = ndwi_umido.map(calc_mean_by_season);
var col_mean_seco = ndwi_seco.map(calc_mean_by_season);
// print(col_mean);
// Map.addLayer(col_mean_seco[1].select('NDWI'));
Map.addLayer(pantanal);

// Clip collection
var clip_ndwi_pantanal = function (collection) {
    var ndwi = collection.select('NDWI');
    var col_clip = ndwi.clip(pantanal);
    return col_clip;
};

// Apply clip
var umido_clip = col_mean_umido.map(clip_ndwi_pantanal);
var seco_clip = col_mean_seco.map(clip_ndwi_pantanal);

// Limiares (threshold)
var limiar_ndwi = function (collection) {
    var limiar = collection.updateMask(collection.gte(-0.4));
    return limiar;
}

// Apply threshold
var limiar_ndwi_umido = umido_clip.map(limiar_ndwi);
var limiar_ndwi_seco = seco_clip.map(limiar_ndwi);
Map.addLayer(limiar_ndwi_umido[1]);

// Exporta a image binaria - agua / nao-agua
Export.image.toDrive({
    image: limiar_ndwi_umido[1],
    description: 'limiar_ndwi_umido[1]',
    region: pantanal,
    scale: 500,
    maxPixels: 1e13
});


// Estatisticas:
// var teste = [];
// for (var i = 0; i < ndwi_umido.length; i++) {
//     var img_mean = col_mean_seco[i].select('NDWI').reduceRegions({
//         collection: pantanal,
//         reducer: ee.Reducer.mean(),
//         scale: 500,
//     });
//     teste.push(img_mean);
// }

// print(teste);
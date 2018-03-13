/** 
* pantanal-ee.js
* Description: Estudos sobre o pantanal
* Version: 0.0.2
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

// Array que conterá a coleção MODIS inicial + os NDWI criados pela função anterior
var ndwi_por_ano = [];
var filtrar_por_ano = function (ano) {
    var image = ee.ImageCollection(modis
        .filterBounds(pantanal)
        .filterDate(ano.toString() + '-01-01', ano.toString() + '-12-31')
        .map(calc_ndwi));
    ndwi_por_ano.push(image);
};

// Calcula a média de todos os valores dos pixels de forma anual para todos os anos.
var calc_mean_by_year = function (ic_ano) {
    var image = ic_ano.mean();
    return image;
};

// Chama das funções + visualização
anos.map(filtrar_por_ano);
// print(ndwi_por_ano);
var col_mean = ndwi_por_ano.map(calc_mean_by_year);
// print(col_mean);
Map.addLayer(col_mean[1].select('NDWI'));
Map.addLayer(pantanal);

// Adicionar funções de limiar
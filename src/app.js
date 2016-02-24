import 'babel-polyfill';
import L from 'leaflet';
import d3 from 'd3';
import topojson from 'topojson';
import queue from 'd3-queue';

let url = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
let osmAttrib='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
let osm = new L.TileLayer(url, {minZoom: 11, maxZoom: 18, attribution: osmAttrib});

let map = L.map('map').setView(new L.LatLng(33.755, -84.390), 11);

map.addLayer(osm);

let svg = d3.select(map.getPanes().overlayPane).append('svg'),
    g = svg.append('g').classed({'leaflet-zoom-hide': 1});

let neighborhoods,
    crimes;

let loadNeighborhoods = (callback) => {
  d3.json('neighborhoods.json', (err, data) => {
      saveNeighborhoods(err, data, callback);
  });
};

let saveNeighborhoods = (err, data, callback) => {
  if (err) {
    throw err;
  }
  neighborhoods = topojson.feature(data, data.objects.neighborhoods);
  console.log('neighborhoods', neighborhoods);
  callback(null);
}

let loadCrimes = (callback) => {
  d3.csv('atl-crime-data-2015.csv',  (err, data) => {
      saveCrimes(err, data, callback);
  });
};

let saveCrimes = (err, data, callback) => {
  if (err) {
    throw err;
  }
  crimes = data;
  console.log('crimes', crimes);
  callback(null);
};

let drawAll = () => {
  drawNeighborhoods();
  drawCrimeData();
};

let drawNeighborhoods = () => {
    console.log('drawing neighhborhoods', neighborhoods)
    let transform = d3.geo.transform({ point: projectPoint });

    let path = d3.geo.path()
        .projection(transform);

    console.log(neighborhoods.features)

    let neighborhood = g.selectAll('.neighborhood')
        .data(neighborhoods.features)
        .enter()
            .insert('path')
            .classed({ 'neighborhood': 1});

    map.on('viewreset', reset);

    reset();

    function reset() {
        let bounds = path.bounds(neighborhoods),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        svg.attr({
            'width': bottomRight[0] - topLeft[1],
            'height': bottomRight[1] - topLeft[1]
        })
        .style({
            'left': topLeft[0] + 'px',
            'top': topLeft[1] + 'px'
        });

        g.attr({ transform: `translate(${-topLeft[0]}, ${-topLeft[1]})`});

        neighborhood.attr('d', path);
    }
};

let drawCrimeData = () => {
  console.log('drawing crime')
};

let loadingQueue = queue.queue()
  .defer(loadNeighborhoods)
  .defer(loadCrimes)
  .awaitAll(drawAll);

function projectPoint(x, y) {
    let point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

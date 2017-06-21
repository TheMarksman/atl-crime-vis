import 'babel-polyfill';
import L from 'leaflet';
import d3 from 'd3';
import * as topojson from 'topojson';
import queue from 'd3-queue';
import _ from 'lodash';
import cal from 'cal-heatmap';

window.d3 = d3;

let crimeTypes = [
    'BURGLARY-NONRES',
    'LARCENY-FROM VEHICLE',
    'AUTO THEFT',
    'LARCENY-NON VEHICLE',
    'ROBBERY-PEDESTRIAN',
    'AGG ASSAULT',
    'BURGLARY-RESIDENCE',
    'ROBBERY-RESIDENCE',
    'HOMICIDE',
    'ROBBERY-COMMERCIAL',
    'RAPE'
  ];
let crimeColorScale = d3.scale.ordinal()
  .domain(crimeTypes)
  .range([
    '#b3de69',
    '#ccebc5',
    '#ffffb3',
    '#d9d9d9',
    '#bebada',
    '#fdb462',
    '#8dd3c7',
    '#fccde5',
    '#fb8072',
    '#80b1d3',
    '#bc80bd'
  ]);

let url = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
let osmAttrib = `&copy; <a href="http://www.openstreetmap.org/copyright">
  OpenStreetMap</a> contributors, &copy;
  <a href="http://cartodb.com/attributions">CartoDB</a>`;

let osm = new L.TileLayer(url, {
  minZoom: 11,
  maxZoom: 18,
  attribution: osmAttrib
});

let map = L.map('map').setView(new L.LatLng(33.755, -84.390), 11);

map.addLayer(osm);

let svg = d3.select(map.getPanes().overlayPane).append('svg');
let g = svg.append('g').classed({'leaflet-zoom-hide': 1});

let transform = d3.geo.transform({point: projectPoint});
let path = d3.geo.path()
  .projection(transform);

let neighborhoods;
let crimes;
let crimeFilter;

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
};

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
  drawLegend();
  update();
};

let drawNeighborhoods = () => {
  let neighborhood = g.selectAll('.neighborhood')
    .data(neighborhoods.features)
    .enter()
      .insert('path')
      .classed({neighborhood: 1});
};

let drawCrimeData = () => {
  console.log('drawing crime');

  let crime = g.selectAll('.crime')
    .data(crimes)
    .enter()
    .append('circle')
      .classed({crime: 1})
      .attr({r: 4})
      .style({
        fill(d) {
          return crimeColorScale(d.type);
        },
        display: 'none'
      });
};

let drawLegend = () => {
  let RECT_SIZE = 15;

  let legend = d3.select('.legend');

  legend.style({
    height: RECT_SIZE * crimeTypes.length + 10 * crimeTypes.length
  });

  let legendRow = legend.selectAll('.legend-row')
    .data(crimeTypes);

  let item = legendRow.enter().append('div')
    .classed({item: 1});

  item.on('click', d => {
    legend.selectAll('.item').style({'background-color': null});

    if (crimeFilter === d) {
      d3.select(this).style({'background-color': null});
      crimeFilter = undefined;
    } else {
      d3.select(this).style({'background-color': '#d3d3d3'});
      crimeFilter = d;
    }

    update();
  });

  item.append('div')
    .classed({'item-color': 1})
    .style({
      'background-color'(d) { return crimeColorScale(d); },
    });

  item.append('span')
    .classed({'item-text': 1})
    .text(d => d);
};

let update = () => {
  let bounds = path.bounds(neighborhoods);
  let topLeft = bounds[0];
  let bottomRight = bounds[1];

  svg.attr({
    width: bottomRight[0] - topLeft[1],
    height: bottomRight[1] - topLeft[1],
  })
  .style({
    left: topLeft[0] + 'px',
    top: topLeft[1] + 'px',
  });

  g.attr({transform: `translate(${-topLeft[0]}, ${-topLeft[1]})`});

  g.selectAll('.neighborhood')
    .attr({d: path});

  g.selectAll('.crime')
    .attr({
      opacity(d) { 
        return !_.isUndefined(crimeFilter) ? displayBasedOnFilter(d) : 1
      },
      transform(d) {
        let p = map.latLngToLayerPoint(new L.LatLng(d.y, d.x));
        return `translate(${p.x}, ${p.y})`;
      }
    });
};

let displayBasedOnFilter = (d) => {
  if (_.isUndefined(crimeFilter) || 
      crimeFilter === d.type) {
    return 1;
  }
  return 0;
}

let updateView = () => {
  let displayCrime = 'block';
  let displayNeighborhoods = 'none';

  if (map.getZoom() < 15) {
    displayCrime = 'none';
    displayNeighborhoods = 'block';
  }

  svg.selectAll('.crime')
    .style({
      display: displayCrime
    });

  svg.selectAll('.neighborhood')
  .style({
    display: displayNeighborhoods
  });
};

map.on('viewreset', update);
map.on('zoomend', updateView);

let loadingQueue = queue.queue()
  .defer(loadNeighborhoods)
  .defer(loadCrimes)
  .awaitAll(drawAll);

function projectPoint(x, y) {
  let point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}


// Initialize calendar
let calendar = new cal();

calendar.init({
  itemSelector: '.calendar',
  domain: 'month',
  subDomain: 'x_day',
  cellSize: 20, 
  subDomainTextFormat: '%d',
  range: 12,
});


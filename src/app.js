import 'babel-polyfill';
import L from 'leaflet';

let url = 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
let osmAttrib='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
let osm = new L.TileLayer(url, {minZoom: 11, maxZoom: 18, attribution: osmAttrib});

let map = L.map('map').setView(new L.LatLng(33.755, -84.390), 11);

map.addLayer(osm);

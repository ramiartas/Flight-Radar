import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature, { FeatureLike } from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { HttpClient } from '@angular/common/http';
import { Style, Icon } from 'ol/style';
import { StyleFunction } from 'ol/style/Style';
import { Geometry } from 'ol/geom';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  map: Map = new Map();
  airplaneIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 19" height="20" width="20" class="c0116"><path fill="#fff"  d="M15,6.8182L15,8.5l-6.5-1 l-0.3182,4.7727L11,14v1l-3.5-0.6818L4,15v-1l2.8182-1.7273L6.5,7.5L0,8.5V6.8182L6.5,4.5v-3c0,0,0-1.5,1-1.5s1,1.5,1,1.5v2.8182 L15,6.8182z"></path></svg>';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initMap();
    this.refreshAirplanes();
  }

  private initMap(): void {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });
  }

  private refreshAirplanes(): void {
    this.getAirplanes();
    setInterval(() => {
      this.getAirplanes();
    }, 1050);
  }

  private getAirplanes(): void {
    this.http.get<any>('https://api.adsb.lol/v2/ladd').subscribe(
      (data) => {
        this.addAirplanes(data.ac);
      },
      (error) => {
        console.log('Error fetching airplane data:', error);
      }
    );
  }

  private addAirplanes(airplanes: any[]): void {
    const airplaneFeatures = airplanes.map((airplane) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([airplane.lon, airplane.lat])),
        name: airplane.flight,
        rotation: airplane.track || 0,
        icon: this.airplaneIcon,
      });
      return feature;
    });

    const vectorSource = new VectorSource({
      features: airplaneFeatures,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.airplaneStyleFunction as StyleFunction,
    });

    const existingLayers = this.map.getLayers();
    existingLayers.forEach((layer) => {
      if (layer instanceof VectorLayer) {
        const layerSource = layer.getSource();
        layerSource.clear();
      }
    });

    this.map.addLayer(vectorLayer);
  }

  private airplaneStyleFunction: StyleFunction = (
    feature: FeatureLike
  ): Style => {
    const airplaneFeature = feature as Feature<Geometry>;

    const rotation = airplaneFeature.get('rotation');

    const style = new Style({
      image: new Icon({
        src:
          'data:image/svg+xml;charset=utf-8,' +
          encodeURIComponent(this.airplaneIcon),
        scale: 1,
        color: '#000000',
        rotation: (rotation * Math.PI) / 180,
      }),
    });

    return style;
  };
}

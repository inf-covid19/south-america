import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

@Component({
  selector: 'app-mapchart',
  templateUrl: './mapchart.component.html',
  styleUrls: ['./mapchart.component.css']
})
export class MapchartComponent implements OnInit, AfterViewInit, OnDestroy {
  uniqueId = 'id-' + Math.random().toString(36).substr(2, 16);

  svg: any;
  tipCountry: any;
  tipCounty: any;
  tipLineCountry: any;
  tipLineState: any;
  tipLineCounty: any;
  iniSelectedDay = '2020-01-01';
  minSelectedDay = '2020-02-23';
  endSelectedDay = '2020-03-24';
  maxSelectedDay = '2020-03-24';
  data = {
    };
  totalCountry = 0;
  totalState = 0;
  rankingStates = [];
  rankingCounties = [];
  listDatesStates = [];
  listDatesCounties = [];
  lineChartCountry = [];
  lineChartStates = [];
  lineChartCounties = [];

  counts = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000,
    10000000, 20000000, 50000000, 100000000, 200000000, 500000000, 1000000000, 2000000000, 5000000000, 10000000000, 20000000000, 50000000000,
    100000000000, 200000000000, 500000000000];

  countiesByStates = {AC: [], AL: [], AM: [], AP: [],  BA: [], CE: [], DF: [], ES: [], GO: [], MA: [],
    MG: [], MS: [], MT: [], PA: [],  PB: [], PE: [], PI: [], PR: [],  RJ: [], RN: [],  RO: [], RR: [], RS: [], SC: [],
    SE: [], SP: [], TO: []};

  closestMaxLegend = (goal) => {
    return this.counts.reduce(function(prev, curr) {
      return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    });
  }

  coloresGoogle = (n) => {
    const coloresG = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099',
      '#0099c6', '#dd4477', '#66aa00', '#b82e2e',
      '#316395', '#994499', '#22aa99', '#aaaa11',
      '#6633cc', '#e67300', '#8b0707', '#651067',
      '#329262', '#5574a6', '#3b3eac'];
    return coloresG[n % coloresG.length];
  }

  yFormat = d3.format('.2s');
  // dateFormat = d3.format('%Y/%m/%d');

  statesNames = {AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapâ',
    BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goaís', MA: 'Maranhão',
    MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará',
    PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
    RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina',
    SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins'};

  countiesNames = {};

  selectedState = 'RS';
  selectedCounty = '4314902';

  constructor() {
    d3.formatDefaultLocale({
      'decimal': ',',
      'thousands': '.',
      'grouping': [3],
      'currency': ['R$', '']
    });
  }


  ngOnInit() {
    const self = this;
    d3.dsv(',', './assets/csv/cases-brazil-states.csv', function(d) {
      if (d.date in self.data === false) {
        self.data[d.date] = {
          total: parseInt('0'),
          estados: {}
        }
        self.listDatesStates.push(d.date);
      }
      if (d.state !== 'TOTAL'){
        self.data[d.date]['total'] += parseInt(d.totalCases);
        self.data[d.date]['estados'][d.state] = {};
        self.data[d.date]['estados'][d.state]['total']= parseInt(d.totalCases);
        self.data[d.date]['estados'][d.state]['municipios']= {};
      }
    }).then(function(data) {
      d3.dsv(',', './assets/csv/cases-brazil-cities-ibge.csv', function(d) {
        let munId = d.ibgeID;
        if (d.ibgeID in self.data[d.date]['estados'][d.state]['municipios'] === false) {
          if (d.ibgeID.length < 4) {
            munId = d.city.split('/')[0];
          }
          self.data[d.date]['estados'][d.state]['municipios'][munId] = {};
        }
        if ( -1 === self.countiesByStates[d.state].indexOf(munId) ){
          self.countiesByStates[d.state].push(munId);
        }
        self.data[d.date]['estados'][d.state]['municipios'][munId]['total'] = parseInt(d.totalCases);
        self.countiesNames[munId] = d.city.split('/')[0];
        if ( -1 === self.listDatesCounties.indexOf(d.date) ) {
          self.listDatesCounties.push(d.date);
        }
      }).then(function(data) {
        self.listDatesStates.sort();
        self.listDatesCounties.sort();

        self.maxSelectedDay = self.listDatesStates[self.listDatesStates.length - 1];

        const parseDate = d3.timeParse('%Y-%m-%d');
        const formatTime = d3.timeFormat('%Y-%m-%d');

        self.listDatesStates = [];
        self.listDatesCounties = [];
        let i = 0;
        while (true) {
          const temp = d3.timeFormat('%Y-%m-%d')(d3.timeParse('%Y-%m-%d')(self.minSelectedDay).valueOf() + (24 * 60 * 60 * 1000) * i);
          self.listDatesStates.push(temp);
          if (temp === self.maxSelectedDay) { break; }
          i = i + 1;
        }
        i = 0;
        while (true) {
          const temp = d3.timeFormat('%Y-%m-%d')(d3.timeParse('%Y-%m-%d')(self.minSelectedDay).valueOf() + (24 * 60 * 60 * 1000) * i);
          self.listDatesCounties.push(temp);
          if (temp === self.maxSelectedDay) { break; }
          i = i + 1;
        }

        // tslint:disable-next-line:no-shadowed-variable
        for (let i = 3; i < self.listDatesStates.length; i++ ) {
          if ( typeof self.data[self.listDatesStates[i]] === 'undefined') {
            self.data[self.listDatesStates[i]] = self.data[self.listDatesStates[i-1]]
          }
        }

        self.loadRangeSliderTime();

        d3.select('#multipleStatesCheckBox').on('change', self.onStatesCheckBoxChange);
        d3.select('#multipleCountiesCheckBox').on('change', self.onCountiesCheckBoxChange);
      });
    });
  }

  loadRangeSliderTime = () => {
    const self = this;
    const parseDate = d3.timeParse('%Y-%m-%d');
    const formatTime = d3.timeFormat('%Y-%m-%d');
    const iniDate = new Date(parseDate(self.minSelectedDay)).valueOf();
    const endDate = new Date(parseDate(self.maxSelectedDay)).valueOf();

    let container = (d3.select('#date-slider').node() as any);
    container = container.parentNode.parentNode.getBoundingClientRect();
    const margin = { top: 0, right: 15, bottom: 35, left: 0 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const x = d3.scaleTime()
        .domain([iniDate, endDate])
        .rangeRound([margin.left, width - margin.right]);

    const xT = d3.scaleLinear().range([0, width]),
        yT = d3.randomNormal(height / 2, height / 8);

    const svg = d3.select('#date-slider')
        .attr('viewBox', '0 0 ' + (width) + ' ' + (height));

    svg.attr('width', width)
        // .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('g')
        .attr('class', 'axis axis--grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x)
            .ticks(d3.timeHour, 24)
            .tickSize(-height)
            .tickFormat(function() { return null; })
        )
        .selectAll('.tick')
        .classed('tick--minor', function(d) { return d.getHours(); });

    svg.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + height + ')')
        .attr('text-anchor', null)
        .selectAll('text')
        .attr('x', 6);

    const dataT = d3.range(800).map(Math.random);
    const circle = svg.append('g')
        .attr('class', 'circle')
        .selectAll('circle')
        .data(dataT)
        .enter().append('circle')
        .attr('transform', function(d) { return 'translate(' + xT(d) + ',' + yT() + ')'; })
        .attr('r', 0);

    const brush = d3.brushX()
        .extent([[0, 0], [width - margin.right, height]])
        .on('brush', onbrush)
        .on('end', brushended);

    const gBrush = svg.append('g')
        .attr('class', 'brush')
        .call(brush);

    const brushResizePath = function(d) {
      const e = +(d.type === 'e'),
          x = e ? 1 : -1,
          y = height;
      return 'M' + (.5 * x) + ',' + y + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6) + 'V' + (2 * y - 6) + 'A6,6 0 0 ' + e + ' ' +
          (.5 * x) + ',' + (2 * y) + 'Z' + 'M' + (2.5 * x) + ',' + (y + 8) + 'V' + (2 * y - 8) + 'M' + (4.5 * x) + ',' + (y + 8) + 'V' +
          (2 * y - 8);
    };

    const handle = gBrush.selectAll('.handle--custom')
        .data([{type: 'w'}, {type: 'e'}])
        .enter().append('path')
        .attr('class', 'handle--custom')
        .attr('stroke', '#eeeeee')
        .attr('fill', '#eeeeee')
        .attr('cursor', 'ew-resize')
        .attr('d', brushResizePath);

    function onbrush() {
      const s = d3.event.selection,
          d0 = d3.event.selection.map(x.invert),
          d1 = d0.map(d3.timeDay.round);

      if (d1[0] >= d1[1]) {
        d1[0] = d3.timeDay.floor(d0[0]);
        d1[1] = d3.timeDay.offset(d1[0]);
      }

        circle.classed('active', function(d) { return d0[0] <= d && d <= d0[1]; });
        handle.attr('display', null).attr('transform', function(d, i) { return 'translate(' + [ s[i], - height] + ')'; });

      d3.select('#label-date-ini').html('<text style="font-weight: 800">' + formatTime(d1[0]) + '</text>');
      d3.select('#label-date-end').html('<text style="font-weight: 800">' + formatTime(d1[1]) + '</text>');
    }

    function brushended() {
      if (!d3.event.sourceEvent) { return; } // Only transition after input.
      if (!d3.event.selection) { return; } // Ignore empty selections.
      const d0 = d3.event.selection.map(x.invert),
          d1 = d0.map(d3.timeDay.round);

      // If empty when rounded, use floor & ceil instead.
      if (d1[0] >= d1[1]) {
        d1[0] = d3.timeDay.floor(d0[0]);
        d1[1] = d3.timeDay.offset(d1[0]);
      }

      d3.select('#label-date-ini').html('<text style="font-weight: 800">' + formatTime(d1[0]) + '</text>');
      d3.select('#label-date-end').html('<text style="font-weight: 800">' + formatTime(d1[1]) + '</text>');
      d3.select(this).transition().call(d3.event.target.move, d1.map(x));
      self.iniSelectedDay = formatTime(d1[0]);
      self.endSelectedDay = formatTime(d1[1]);
      if (d3.select('#multipleStatesCheckBox').property('checked')) {
        self.loadWidgetCountry();
      } else {
        self.loadWidgetCountry(true);
      }
      if (d3.select('#multipleCountiesCheckBox').property('checked')) {
        self.loadWidgetState(self.selectedState);
      } else {
        self.loadWidgetState(self.selectedState, true);
      }
      self.loadCountryLineChart(self.iniSelectedDay, self.endSelectedDay);
    }

    gBrush.call(brush.move, [endDate - (24 * 60 * 60 * 1000) * 7, endDate].map(x));
    self.iniSelectedDay = formatTime(endDate - (24 * 60 * 60 * 1000) * 7);
    self.endSelectedDay = formatTime(endDate);
    self.loadWidgetCountry();
    self.loadWidgetState(self.selectedState);
    self.loadCountryLineChart(self.iniSelectedDay, self.endSelectedDay);
  }

  onStatesCheckBoxChange = () => {
    const self = this;
    if (d3.select('#multipleStatesCheckBox').property('checked')) {
      self.loadWidgetCountry();
    } else {
      self.loadWidgetCountry(true);
    }
  }

  onCountiesCheckBoxChange = () =>{
    const self = this;
    if (d3.select('#multipleCountiesCheckBox').property('checked')) {
      self.loadWidgetState(self.selectedState);
    } else {
      self.loadWidgetState(self.selectedState, true);
    }
  }

  getPlasmaList = (cant) => {
    const rangeColor = [];
    for (let i = 0; i < cant; i++) {
      rangeColor.push(d3.interpolateYlOrRd( i / (cant - 1) ));
    }
    return rangeColor;
  }


  formatThousandsSeperator = (n) => {
    return d3.format(',d')(n);
  }


  loadWidgetCountry = (justOneRecordState = false) => {
    const self = this;
    let container = (d3.select('#svg-country').node() as any);
    //
    if (container === (undefined || null) || container.parentNode === (undefined || null)) {
      return;
    }
    container = container.parentNode.parentNode.parentNode.getBoundingClientRect();
    const margin = { top: 5, right: 5, bottom: 35, left: 35 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    d3.select('#svg-country').selectAll('*').remove();

    self.svg = d3.select('#svg-country')
        .attr('viewBox', '0 0 ' + (container.width * 1.3) + ' ' + (container.height * 1.3));

    const TotalReport = d3.map();
    const TotalReportMS = d3.map();
    const path = d3.geoPath();

    let maxValue = 0;

    // const currDate = self.listDatesStates[self.listDatesStates.indexOf(self.iniSelectedDay) - 1];
    const currDate = self.iniSelectedDay;
    const promises = [
      d3.json('./assets/json/coduf.json'),
      new Promise((resolve) => {
        self.totalCountry = 0;
        self.rankingStates = [];
        // tslint:disable-next-line:forin
        for (const key in self.countiesByStates) {
        // for (const key in self.data[self.endSelectedDay]['estados']) {
          let valorEnd = 0, valorIni = 0;
          if (typeof self.data[self.iniSelectedDay] === 'undefined' ) {
            valorIni = 0;
          } else {
            valorIni = typeof self.data[currDate]['estados'][key] === 'undefined' ? 0 : self.data[currDate]['estados'][key].total;
          }
          if (typeof self.data[self.endSelectedDay] === 'undefined' ) {
            valorEnd = 0;
          } else {
            valorEnd = typeof self.data[self.endSelectedDay]['estados'][key] === 'undefined' ? 0 : self.data[self.endSelectedDay]['estados'][key].total;
          }

          // if (typeof valorEnd === 'undefined') { valorEnd = 0; }
          // if (typeof valorIni === 'undefined') { valorIni = 0; }
          TotalReport.set(key, Math.abs(valorEnd - valorIni));
          self.totalCountry += Math.abs(valorEnd - valorIni);
          // self.totalCountry += valorEnd;
          // if(self.iniSelectedDay === )
          maxValue = Math.max(maxValue, Math.abs(valorEnd - valorIni));
          self.rankingStates.push({region: key, name: self.statesNames[key], value: Math.abs(valorEnd - valorIni)});
        }
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    const newMaxVal = self.closestMaxLegend(maxValue / 1.5);
    const stepSize = newMaxVal / 10;
    const yLegend = d3.scaleLinear()
        .domain(d3.range(stepSize === 1 ? 1 : stepSize + 1, Math.max(stepSize * 10, 9), stepSize).reverse())
        .rangeRound([58, 88]);

    const colorRangePlasma = self.getPlasmaList(9);
    const color = d3.scaleThreshold().domain(d3.range(stepSize === 1 ? 1 : stepSize + 1, Math.max(stepSize * 10, 9), stepSize))
        .range(colorRangePlasma);

    const g = self.svg.append('g');

    self.svg.append('text')
        .attr('x', width / 1.7)
        .attr('y', 20)
        .attr('fill', '#aaaaaa')
        .attr('font-family', 'sans-serif')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text('BRASIL');

    g.selectAll('rect')
        .data(color.range().map((d) => {
          d = color.invertExtent(d);
          if (d[0] == null) { d[0] = yLegend.domain()[0]; }
          if (d[1] == null) { d[1] = yLegend.domain()[1]; }
          return d;
        }))
        .enter().append('rect')
        .attr('height', 26)
        .attr('x', -26 )
        .attr('y', (d) => yLegend(d[1]) - 13)
        .attr('width', 23)
        .attr('fill', (d) => color(d[1] - 1));

    /*legend title*/
    g.append('text')
        .attr('font-family', 'sans-serif')
        .attr('x', -42)
        .attr('y', 20)
        .attr('fill', '#aaaaaa')
        .attr('text-anchor', 'start')
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .text('Casos');

    let lastTick = 0;
    g.attr('transform', 'translate(50, ' + (height / 1.7) + ') scale(' + (0.5 * height / 200) + ')')
        .attr('class', 'legend')
        .call(d3.axisRight(yLegend)
            .tickSize(0)
            // tslint:disable-next-line:only-arrow-functions
            .tickFormat(function(y, i) {
              if (i > 8) { return ''; }
              if (i === 0) { return '≤' + (y - 1) + ''; }
              if (i === 8) { return '≥' + lastTick + ''; }
              lastTick = y;
              return (y - 1) + ''; })
            .tickValues(color.domain()))
        .select('.domain')
        .remove();

    function ready([coduf]) {
      const scaleRatio = Math.min(width / 700, height / 700);
      d3.select('#svg-country').append('g')
          .attr('id', 'country-g-map')
          .attr('transform', 'scale(' + scaleRatio + ')')
          .attr('class', 'counties')
          .selectAll('path')
          .data(coduf.features)
          .enter().append('path')
          .attr('fill', (d) => {
            const estColor = color(d.TotalReport = TotalReport.get(d.properties.UF_05));
            return estColor;
          })
          .attr('stroke', '#eeeeee')
          .attr('d', path)
          .on('mouseover', self.tipCountry.show)
          .on('mouseout', function() {
            d3.select(this).attr('stroke', '#eeeeee');
            self.tipCountry.hide();
          })
          .on('click', function(d) {
            self.selectedState = d.properties.UF_05;
            if (justOneRecordState === true) {
              self.loadStatesLineChart(self.iniSelectedDay, self.endSelectedDay, self.selectedState);
            }
            if (d3.select('#multipleCountiesCheckBox').property('checked')) {
              self.loadWidgetState(self.selectedState);
            } else {
              self.loadWidgetState(self.selectedState, true);
            }
          });

      const widthTrans = Math.abs((width - d3.select('#country-g-map').node().getBoundingClientRect().width)) * 4;
      const heightTrans = Math.abs((height - d3.select('#country-g-map').node().getBoundingClientRect().height)) * 2;
      d3.select('#country-g-map').attr('transform', 'translate( ' + widthTrans + ' , ' + heightTrans + ') scale(' + scaleRatio + ')');
    }

    self.tipCountry = d3Tip();
    self.tipCountry.attr('class', 'd3-tip')
        .html(function(d) {
      d3.select(this).attr('stroke', '#717171');
      return '<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
      '<text>Estado: </text><text style="font-weight: 800">' + d.properties.NOME_UF + '</text><br/>' +
      '<text>Total casos: </text><text style="font-weight: 800">' +
          ( typeof TotalReport.get(d.properties.UF_05) === 'undefined' ? 0 : TotalReport.get(d.properties.UF_05) ) +
          '</text><br/>' +
      '</div>'
    });
    g.call(self.tipCountry);

    // @ts-ignore
    d3.select('#total-country').html(self.formatThousandsSeperator(self.totalCountry));

    const statesRankingElmnt =  d3.select('#states-ranking');
    statesRankingElmnt.selectAll('*').remove();

    self.rankingStates.sort((a, b) => (a.value < b.value) ? 1 : -1);

    // tslint:disable-next-line:forin
    for (const item in self.rankingStates) {
      // if (justOneRecord) {
        statesRankingElmnt.append('p')
            .on('mouseover', function() {
              d3.select(this).style('cursor', 'pointer');
              d3.select(this).style('font-weight', '800');
            })
            .on('mouseout', function() {
              d3.select(this).style('font-weight', '300');
            })
            .on('click', function() {
              self.selectedState = self.rankingStates[item].region;
              if (d3.select('#multipleCountiesCheckBox').property('checked')) {
                self.loadWidgetState(self.rankingStates[item].region); // without event click on counties map
              } else {
                  self.loadWidgetState(self.rankingStates[item].region, true);
              }
              if (justOneRecordState) {
                self.loadStatesLineChart(self.iniSelectedDay, self.endSelectedDay, self.selectedState);
              } else {
                self.loadStatesLineChart(self.iniSelectedDay, self.endSelectedDay);
              }
            })
            .html('<text class="gt-number"  style="padding-left: 10px;">' + self.formatThousandsSeperator(self.rankingStates[item].value)
                + '</text> ' + self.rankingStates[item].name);
    }
    if ( justOneRecordState === true) {
      self.loadStatesLineChart(self.iniSelectedDay, self.endSelectedDay, self.rankingStates[0].region)
    } else {
      self.loadStatesLineChart(self.iniSelectedDay, self.endSelectedDay)
    }
  }

  loadWidgetState = (stateParam, justOneRecord = false) => {
    const self = this;
    let container = (d3.select('#svg-county').node() as any);
    //
    if (container === (undefined || null) || container.parentNode === (undefined || null)) {
      return;
    }
    container = container.getBoundingClientRect();
    const margin = { top: 5, right: 5, bottom: 35, left: 35 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    d3.select('#svg-county').selectAll('*').remove();

    self.svg = d3.select('#svg-county')
        .attr('viewBox', '0 0 ' + (container.width * 1.3) + ' ' + (container.height * 1.3));

    const TotalReport = d3.map();
    const path = d3.geoPath();
    let maxValue = 0;

    const promises = [
      d3.json('./assets/json/ufs/' + stateParam + '_trans.json'),
      new Promise((resolve) => {
        self.rankingCounties = [];
        self.totalState = 0;
        // const beginDay = self.listDatesCounties.indexOf(self.iniSelectedDay) === -1 ? self.listDatesCounties[0] : self.iniSelectedDay;
        const beginDay = self.iniSelectedDay;
        // const beginDay = self.listDatesStates[self.listDatesStates.indexOf(self.iniSelectedDay) - 1];
        const lastDay = self.listDatesStates.indexOf(self.endSelectedDay) === self.listDatesStates.length - 1 ? self.listDatesStates[self.listDatesStates.length - 2] : self.endSelectedDay;
        // const lastDay = self.listDatesCounties.indexOf(self.endSelectedDay) === -1 ? self.listDatesCounties[self.listDatesCounties.length - 1] : self.endSelectedDay;
        // tslint:disable-next-line:forin
        self.countiesByStates[stateParam].forEach(function(key, index) {
        // for (const key in self.data[self.listDatesCounties[self.listDatesCounties.length - 1]]['estados'][stateParam]['municipios']) {
          let valorEnd = 0, valorIni = 0;
          if (typeof self.data[beginDay] === 'undefined' ) {
            valorIni = 0;
          } else {
            if (typeof self.data[beginDay]['estados'][stateParam] === 'undefined' ) {
              valorIni = 0;
            } else {
              valorIni = typeof self.data[beginDay]['estados'][stateParam]['municipios'][key] === 'undefined' ? 0 : self.data[beginDay]['estados'][stateParam]['municipios'][key].total;
            }
          }
          if (typeof self.data[lastDay] === 'undefined' ) {
            valorEnd = 0;
          } else {
            if (typeof self.data[lastDay]['estados'][stateParam] === 'undefined' ) {
              valorEnd = 0;
            } else {
              valorEnd = typeof self.data[lastDay]['estados'][stateParam]['municipios'][key] === 'undefined' ? 0: self.data[lastDay]['estados'][stateParam]['municipios'][key].total;
            }
          }
          // if (typeof valorEnd === 'undefined') { valorEnd = 0; }
          // if (typeof valorIni === 'undefined') { valorIni = 0; }
          TotalReport.set(key, Math.abs(valorEnd - valorIni));
          self.totalState += (Math.abs(valorEnd - valorIni));
          maxValue = Math.max(maxValue, Math.abs(valorEnd - valorIni));
          self.rankingCounties.push({ibge: key, name: self.countiesNames[key], value: Math.abs(valorEnd - valorIni)});
        });
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);
    const newMaxVal = self.closestMaxLegend(maxValue / 1.5);
    const stepSize = newMaxVal / 10;

    const yLegend = d3.scaleLinear()
        .domain(d3.range(stepSize === 1 ? 1 : stepSize + 1, Math.max(stepSize * 10, 9), stepSize).reverse())
        .rangeRound([58, 88]);


    // @ts-ignore
    const colorRangePlasma = self.getPlasmaList(9);
    const color = d3.scaleThreshold().domain(d3.range(stepSize === 1 ? 1 : stepSize + 1, Math.max(stepSize * 10, 9), stepSize))
        .range(colorRangePlasma);

    const g = self.svg.append('g');

    self.svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('fill', '#aaaaaa')
        .attr('font-family', 'sans-serif')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(self.statesNames[stateParam].toUpperCase());

    g.selectAll('rect')
        .data(color.range().map((d) => {
          d = color.invertExtent(d);
          if (d[0] == null) { d[0] = yLegend.domain()[0]; }
          if (d[1] == null) { d[1] = yLegend.domain()[1]; }
          return d;
        }))
        .enter().append('rect')
        .attr('height', 26)
        .attr('x', -26 )
        .attr('y', (d) => yLegend(d[1]) - 13)
        .attr('width', 23)
        // .attr('fill', (d) => color(d[0]));
        .attr('fill', (d) => {
          return color(d[1] - 1);
        } );

    /*legend title*/
    g.append('text')
        .attr('font-family', 'sans-serif')
        .attr('x', -42)
        .attr('y', 20)
        .attr('fill', '#aaaaaa')
        .attr('text-anchor', 'start')
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .text('Casos');

    let lastTick = 0;
    g.attr('transform', 'translate(50, ' + (height / 1.7) + ') scale(' + (0.5 * height / 200) + ')')
        .attr('class', 'legend')
        .call(d3.axisRight(yLegend)
            .tickSize(0)
            // tslint:disable-next-line:only-arrow-functions
            .tickFormat(function(y, i) {
              if (i > 8) { return ''; }
              if (i === 0) { return '≤' + (y-1) + ''; }
              if (i === 8) { return '≥' + lastTick + ''; }
              lastTick = y;
              return (y - 1) + ''; })
            .tickValues(color.domain()))
        .select('.domain')
        .remove();

    function ready([counties]) {
      const scaleRatio = Math.min(width / 550, height / 550);
      d3.select('#svg-county').append('g')
          .attr('class', 'counties')
          .attr('id', 'county-g-map')
          .attr('transform', 'scale(' + scaleRatio + ')')
          .selectAll('path')
          .data(counties.features)
          .enter().append('path')
          .attr('fill', (d) => {
            const munColor = typeof TotalReport.get(d.properties.COD_IBGE) === 'undefined' ? 0 : TotalReport.get(d.properties.COD_IBGE);
            return color(munColor);
          })
          .attr('d', path)
          .attr('stroke', '#eeeeee')
          .on('click', function(d) {
            self.selectedCounty = d.properties.COD_IBGE;
            if (justOneRecord === true) {
              self.loadCountiesLineChart(self.selectedState, self.iniSelectedDay, self.endSelectedDay, d.properties.COD_IBGE);
            }
          })
          .on('mouseover', self.tipCounty.show)
          .on('mouseout', function() {
            d3.select(this).attr('stroke', '#eeeeee');
            self.tipCounty.hide();
          });

      const widthTrans = Math.min(Math.abs((width - d3.select('#county-g-map').node().getBoundingClientRect().width)) * 1.8, width * 0.35);
      const heightTrans = Math.min(Math.abs((height - d3.select('#county-g-map').node().getBoundingClientRect().height)) * 1.5, height * 0.35);
      d3.select('#county-g-map').attr('transform', 'translate( ' + widthTrans + ' , ' + heightTrans + ') scale(' + scaleRatio + ')');
    }

    self.tipCounty = d3Tip();
    self.tipCounty.attr('class', 'd3-tip')
        // .offset([100, 40])
        .html(function(d) {
          d3.select(this).attr('stroke', '#717171');
          return '<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
            '<text>Município: </text><text style="font-weight: 800">' + d.properties.NOME_MUNI + '</text><br/>' +
            '<text>Total casos: </text><text style="font-weight: 800">' +
              ( typeof TotalReport.get(d.properties.COD_IBGE) === 'undefined' ? 0 : TotalReport.get(d.properties.COD_IBGE) )+
              '</text><br/>' +
            '</div>'
        });
    g.call(self.tipCounty);

    d3.select('#total-state').html(self.formatThousandsSeperator(self.totalState));

    const countiesRankingElmnt = d3.select('#counties-ranking');
    countiesRankingElmnt.selectAll('*').remove();

    self.rankingCounties.sort((a, b) => (a.value < b.value) ? 1 : -1);

    // tslint:disable-next-line:forin
    for (const item in self.rankingCounties) {
      if (justOneRecord) {
        countiesRankingElmnt.append('p')
            .on('mouseover', function(){
              d3.select(this).style('cursor', 'pointer');
              d3.select(this).style('font-weight', '800');
            })
            .on('mouseout', function(){
              d3.select(this).style('font-weight', '300');
            })
            .on('click', function() {
              self.selectedCounty = self.rankingCounties[item].ibge;
              self.loadCountiesLineChart(self.selectedState, self.iniSelectedDay, self.endSelectedDay, self.selectedCounty);
            })
            .html('<text class="gt-number" style="padding-left: 6px;">' + self.formatThousandsSeperator(self.rankingCounties[item].value)
                + '</text> ' + self.rankingCounties[item].name);
      } else {
        countiesRankingElmnt.append('p')
            .html('<text class="gt-number" style="padding-left: 6px;">' + self.formatThousandsSeperator(self.rankingCounties[item].value)
                + '</text> ' + self.rankingCounties[item].name);
      }
    }

    if ( justOneRecord === true) {
      self.selectedCounty = self.countiesByStates[stateParam].indexOf(self.selectedCounty) !== -1 ? self.selectedCounty : self.rankingCounties[0].ibge;
      self.loadCountiesLineChart(stateParam, self.iniSelectedDay, self.endSelectedDay, self.selectedCounty);
    } else {
      self.loadCountiesLineChart(stateParam, self.iniSelectedDay, self.endSelectedDay);
    }
  }

  loadCountryLineChart = (iniDate, endDate) => {
    const self = this;
    let container = (d3.select('#svg-linechart-country').node() as any);
    if (container === (undefined || null) || container.parentNode === (undefined || null)) {
      return;
    }
    container = container.getBoundingClientRect();
    const margin = { top: 20, right: 40, bottom: 25, left: 15 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const parseDate = d3.timeParse('%Y-%m-%d');

    // Define scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal().range(d3.schemeCategory10);

    // Define axes
    const xAxis = d3.axisBottom().tickFormat(d3.timeFormat('%d/%m')).scale(xScale);
    const yAxis = d3.axisLeft().tickFormat(self.yFormat).scale(yScale);

    let minY = 100000000000;
    let maxY = 0;

    // Define lines
    const line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return xScale(d['date']) })
        .y(function(d) { return yScale(d['value']) });

    d3.select('#svg-linechart-country').selectAll('*').remove();
    // Define svg canvas
    const svg = d3.select('#svg-linechart-country')
        .attr('viewBox', '0 0 ' + (container.width) + ' ' + (container.height));
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.right + ', ' + margin.left + ')');

    const promises = [
      new Promise((resolve) => {
        self.lineChartCountry = [];
        let posIni = self.listDatesStates.indexOf(iniDate);

        const points = [];
        while (self.listDatesStates[posIni] <= endDate) {
          const value = typeof self.data[self.listDatesStates[posIni]] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]].total;
          minY = Math.min(minY, value);
          maxY = Math.max(maxY, value);
          if (value !== 0) {
            points.push({date: parseDate(self.listDatesStates[posIni]), value: value});
          }
          posIni = posIni + 1;
        }
        self.lineChartCountry.push({region: 'Brasil',
          datapoints: points
        });
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    function ready([dataPoints]) {
      const posIni = self.listDatesStates.indexOf(iniDate);
      const posEnd = self.listDatesStates.indexOf(endDate);
      xScale.domain(
          d3.extent(self.listDatesStates.slice(posIni, posEnd + 1), function(d) {
            return parseDate(d);
          })
      );
      yScale.domain([minY - 2, maxY + 30]);

      // Place the axes on the chart
      g.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

      g.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('y', 6)
          .style('text-anchor', 'beginning')
          .attr('transform', 'rotate(-90)')
          .text('Cases');

      g.append('text')
          .attr('x', width / 4)
          .attr('y', 5)
          .attr('fill', '#aaaaaa')
          .attr('font-family', 'sans-serif')
          .style('font-size', 'calc(2vh)')
          .style('font-weight', 'bold')
          .text('Total de casos no Brasil por dia');

      const cases = g
          .selectAll('.category')
          .data(self.lineChartCountry)
          .enter()
          .append('g')
          .attr('class', 'category');

      cases
          .append('path')
          .attr('class', 'line')
          .attr('d', function(d) { return line(d.datapoints) })
          .attr('fill', 'none')
          .style('stroke', function(d) { return self.coloresGoogle(0) });
      cases.selectAll('.series')
          .data(function(d) { return d.datapoints })
          .enter().append('circle') // Uses the enter().append() method
          .attr('class', 'dot') // Assign a class for styling
          .attr('cx', function(d) { return xScale(d.date) })
          .attr('cy', function(d) { return yScale(d.value) })
          .attr('stroke', self.coloresGoogle(0))
          .attr('fill', self.coloresGoogle(0))
          .attr('r', 2)
          .on('mouseover', self.tipLineCountry.show)
          .on('mouseout', self.tipLineCountry.hide)
    }

    self.tipLineCountry = d3Tip();
    self.tipLineCountry.attr('class', 'd3-tip')
        .offset([50, -50])
        .html(function(d) {
          return '<div style="opacity:0.8;background-color:' + d3.select(this).attr('fill') + ';padding:7px;color:white">' +
              '<text>' + d3.timeFormat('%d/%m')(d.date) +
              ':</text> <text style="font-weight: 800">' + self.formatThousandsSeperator(d.value) + '</text>' +
              '</div>'
        });
    g.call(self.tipLineCountry);
  }

  loadStatesLineChart = (iniDate, endDate, stateParam = '') => {
    const self = this;
    let container = (d3.select('#svg-linechart-state').node() as any);
    if (container === (undefined || null) || container.parentNode === (undefined || null)) {
      return;
    }
    container = container.getBoundingClientRect();
    const margin = { top: 20, right: 40, bottom: 25, left: 15 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const parseDate = d3.timeParse('%Y-%m-%d');

    // Define scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal().range(d3.schemeCategory10);

    // Define axes
    const xAxis = d3.axisBottom().tickFormat(d3.timeFormat('%d/%m')).scale(xScale);
    const yAxis = d3.axisLeft().tickFormat(self.yFormat).scale(yScale);

    let minY = 100000000000;
    let maxY = 0;

    // Define lines
    const line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return xScale(d['date']) })
        .y(function(d) { return yScale(d['value']) });

    d3.select('#svg-linechart-state').selectAll('*').remove();
    // Define svg canvas
    const svg = d3.select('#svg-linechart-state')
        .attr('viewBox', '0 0 ' + (container.width) + ' ' + (container.height));
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.right + ', ' + margin.left + ')');

    const statesList = [];
    const promises = [
      new Promise((resolve) => {
        self.lineChartStates = [];

        self.rankingStates.forEach(function(rankingElm, index) {
          if (index > 9 && stateParam === '') { return; }
          const state = rankingElm.region;
          if (stateParam !== '' && state !== stateParam) { return; }
          let posIni = self.listDatesStates.indexOf(iniDate);

          const points = [];
          while (self.listDatesStates[posIni] <= endDate) {
            let value = typeof self.data[self.listDatesStates[posIni]] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]].total;
            if (value !== 0) {
              value = typeof self.data[self.listDatesStates[posIni]]['estados'][state] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]]['estados'][state].total;
            }
            minY = Math.min(minY, value);
            maxY = Math.max(maxY, value);
            if (value !== 0) {
              points.push({date: parseDate(self.listDatesStates[posIni]), value: value, region: state});
            }
            posIni = posIni + 1;
          }
          statesList.push(state);
          self.lineChartStates.push({region: state,
            datapoints: points
          });
        });
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    function ready([dataPoints]) {
      const posIni = self.listDatesStates.indexOf(iniDate);
      const posEnd = self.listDatesStates.indexOf(endDate);
      xScale.domain(
          d3.extent(self.listDatesStates.slice(posIni, posEnd + 1), function(d) {
            return parseDate(d);
          })
      );
      yScale.domain([minY - 2, maxY + 30]);

      // Place the axes on the chart
      g.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

      g.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('y', 6)
          .style('text-anchor', 'beginning')
          .attr('transform', 'rotate(-90)')
          .text('Cases');

      const title = stateParam === '' ? 'Total de casos por estado' : self.statesNames[stateParam];

      g.append('text')
          .attr('x', width / 3.5)
          .attr('y', 5)
          .attr('fill', '#aaaaaa')
          .attr('font-family', 'sans-serif')
          .style('font-size', 'calc(2vh)')
          .style('font-weight', 'bold')
          .text(title);

      const cases = g
          .selectAll('.category')
          .data(self.lineChartStates)
          .enter()
          .append('g')
          .attr('class', 'category');

      cases
          .append('path')
          .attr('class', 'line')
          .attr('d', function(d) { return line(d.datapoints) })
          .attr('fill', 'none')
          .style('stroke', function(d) { return self.coloresGoogle(statesList.indexOf(d.region)) });
      cases.selectAll('.series')
          .data(function(d) { return d.datapoints })
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('cx', function(d) { return xScale(d.date) })
          .attr('cy', function(d) { return yScale(d.value) })
          .attr('stroke', function(d) { return self.coloresGoogle(statesList.indexOf(d.region)) })
          .attr('fill', function(d) { return self.coloresGoogle(statesList.indexOf(d.region)) })
          .attr('r', 2)
          .on('mouseover', self.tipLineState.show)
          .on('mouseout', self.tipLineState.hide)
    }

    self.tipLineState = d3Tip();
    self.tipLineState.attr('class', 'd3-tip')
        .offset([70, -50])
        .html(function(d) {
          return '<div style="opacity:0.8;background-color:' + d3.select(this).attr('fill') + ';padding:7px;color:white">' +
              '<text style="font-weight: 800">' + self.statesNames[d.region] +
              '</text></br><text>' + d3.timeFormat('%d/%m')(d.date) +
              ':</text> <text style="font-weight: 800">' + self.formatThousandsSeperator(d.value) + '</text>' +
              '</div>'
        });
    g.call(self.tipLineState);
  }


  loadCountiesLineChart = (stateParam, iniDate, endDate, countyParam = '') => {
    const self = this;
    // iniDate = self.listDatesCounties.indexOf(iniDate) === -1 ? self.listDatesCounties[0] : iniDate;
    // endDate = self.listDatesCounties.indexOf(endDate) === -1 ? self.listDatesCounties[self.listDatesCounties.length - 1] : endDate;
    let container = (d3.select('#svg-linechart-county').node() as any);
    if (container === (undefined || null) || container.parentNode === (undefined || null)) {
      return;
    }
    container = container.getBoundingClientRect();
    const margin = { top: 20, right: 40, bottom: 25, left: 15 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const parseDate = d3.timeParse('%Y-%m-%d');

    // Define scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal().range(d3.schemeCategory10);

    // Define axes
    const xAxis = d3.axisBottom().tickFormat(d3.timeFormat('%d/%m')).scale(xScale);
    const yAxis = d3.axisLeft().tickFormat(self.yFormat).scale(yScale);

    let minY = 100000000000;
    let maxY = 0;

    // Define lines
    const line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return xScale(d['date']) })
        .y(function(d) { return yScale(d['value']) });

    d3.select('#svg-linechart-county').selectAll('*').remove();
    // Define svg canvas
    const svg = d3.select('#svg-linechart-county')
        .attr('viewBox', '0 0 ' + (container.width) + ' ' + (container.height));
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.right + ', ' + margin.left + ')');

    const countiesList = [];
    const ibgeList = [];

    let posIniTemp = self.listDatesCounties.indexOf(iniDate);
    while (self.listDatesCounties[posIniTemp] <= endDate) {
      if (typeof self.data[self.listDatesCounties[posIniTemp]] !== 'undefined' &&
          typeof self.data[self.listDatesCounties[posIniTemp]]['estados'][stateParam] !== 'undefined'
      ) {
        // tslint:disable-next-line:forin
        for (const county in self.data[self.listDatesCounties[posIniTemp]]['estados'][stateParam]['municipios']) {
          if ( -1 === ibgeList.indexOf(county) ) {
            ibgeList.push(county);
          }
        }
      }
      posIniTemp = posIniTemp + 1;
    }

    const promises = [
      new Promise((resolve) => {
        self.lineChartCounties = [];

        // for (const county in ibgeList) {
        // ibgeList.forEach(function(county, index) {
        self.rankingCounties.forEach(function(rankingElm, index) {
          if (index > 9 && countyParam === '') { return; }
          const county = rankingElm.ibge;
          if (countyParam !== '' && county !== countyParam) { return; }

          let posIni = self.listDatesCounties.indexOf(iniDate);
          const points = [];
          while (self.listDatesCounties[posIni] <= endDate) {
            let value = typeof self.data[self.listDatesCounties[posIni]] === 'undefined' ? 0 : self.data[self.listDatesCounties[posIni]].total;
            if (value !== 0) {
              value = typeof self.data[self.listDatesCounties[posIni]]['estados'][stateParam] === 'undefined' ? 0 : self.data[self.listDatesCounties[posIni]]['estados'][stateParam].total;
            }
            if (value !== 0) {
              value = typeof self.data[self.listDatesCounties[posIni]]['estados'][stateParam]['municipios'][county] === 'undefined' ? 0 : self.data[self.listDatesCounties[posIni]]['estados'][stateParam]['municipios'][county].total;
            }
            minY = Math.min(minY, value);
            maxY = Math.max(maxY, value);
            if (value !== 0) {
              points.push({ date: parseDate(self.listDatesCounties[posIni]), value: value, region: county});
            }
            posIni = posIni + 1;
          }
          countiesList.push(county);
          self.lineChartCounties.push({region: county,
            datapoints: points
          });
        });
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    function ready([dataPoints]) {
      const posIni = self.listDatesCounties.indexOf(iniDate) === -1 ? 0 : self.listDatesCounties.indexOf(iniDate);
      const posEnd = self.listDatesCounties.indexOf(endDate) === -1 ? self.listDatesCounties.length - 1 : self.listDatesCounties.indexOf(endDate);
      xScale.domain(
          d3.extent(self.listDatesCounties.slice(posIni, posEnd + 1), function(d) {
            return parseDate(d);
          })
      );
      yScale.domain([minY - 2, maxY + 30]);

      // Place the axes on the chart
      g.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

      g.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('y', 6)
          .style('text-anchor', 'beginning')
          .attr('transform', 'rotate(-90)')
          .text('Cases');

      const title = countyParam === '' ? 'Total de casos por município (' + stateParam + ')' : ( typeof self.countiesNames[countyParam] === 'undefined' ? 'IBGE: ' + countyParam: self.countiesNames[countyParam]);

      g.append('text')
          .attr('x', width / 3.5)
          .attr('y', 5)
          .attr('fill', '#aaaaaa')
          .attr('font-family', 'sans-serif')
          .style('font-size', 'calc(2vh)')
          .style('font-weight', 'bold')
          .text(title);

      const cases = g
          .selectAll('.category')
          .data(self.lineChartCounties)
          .enter()
          .append('g')
          .attr('class', 'category');

      cases
          .append('path')
          .attr('class', 'line')
          .attr('d', function(d) { return line(d.datapoints) })
          .attr('fill', 'none')
          .style('stroke', function(d) { return self.coloresGoogle(countiesList.indexOf(d.region)) });
      cases.selectAll('.series')
          .data(function(d) { return d.datapoints })
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('cx', function(d) { return xScale(d.date) })
          .attr('cy', function(d) { return yScale(d.value) })
          .attr('stroke', function(d) { return self.coloresGoogle(countiesList.indexOf(d.region)) })
          .attr('fill', function(d) { return self.coloresGoogle(countiesList.indexOf(d.region)) })
          .attr('r', 2)
          .on('mouseover', self.tipLineCounty.show)
          .on('mouseout', self.tipLineCounty.hide)
    }

    self.tipLineCounty = d3Tip();
    self.tipLineCounty .attr('class', 'd3-tip')
        .offset([20, -80])
        .html(function(d) {
          return '<div style="opacity:0.8;background-color:' + d3.select(this).attr('fill') + ';padding:7px;color:white">' +
              '<text style="font-weight: 800">' + self.countiesNames[d.region] +
              '</text></br><text>' + d3.timeFormat('%d/%m')(d.date) +
              ':</text> <text style="font-weight: 800">' + self.formatThousandsSeperator(d.value) + '</text>' +
              '</div>'
        });
    g.call(self.tipLineCounty);
  }

  ngAfterViewInit() {
    // window.addEventListener('resize', this.loadWidgetCountry);
  }

  ngOnDestroy() {
    // window.removeEventListener('resize', this.loadWidgetCountry);
  }
}

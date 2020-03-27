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
  endSelectedDay = '2020-03-24';
  data = {
    };
  totalCountry = 0;
  totalState = 0;
  rankingStates = [];
  rankingCounties = [];
  listDates = [];
  lineChartCountry = [];
  lineChartStates = [];
  lineChartCounties = [];

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
    d3.csv('./assets/csv/cases-brazil-states.csv', function(d) {
      if (d.date in self.data === false) {
        self.data[d.date] = {
          total: parseInt('0'),
          estados: {}
        }
        self.listDates.push(d.date);
      }
      if (d.state !== 'TOTAL'){
        self.data[d.date]['total'] += parseInt(d.totalCases);
        self.data[d.date]['estados'][d.state] = {};
        self.data[d.date]['estados'][d.state]['total']= parseInt(d.totalCases);
        self.data[d.date]['estados'][d.state]['municipios']= {};
      }
    });

    d3.dsv(',', './assets/csv/cases-brazil-cities-ibge.csv', function(d) {
      let munId = d.ibgeID;
      if (d.ibgeID in self.data[d.date]['estados'][d.state]['municipios'] === false) {
        if (d.ibgeID.length < 4) {
          munId = d.city.split('/')[0];
        }
        self.data[d.date]['estados'][d.state]['municipios'][munId] = {};
      }
      self.data[d.date]['estados'][d.state]['municipios'][munId]['total'] = parseInt(d.totalCases);
      self.countiesNames[munId] = d.city.split('/')[0];
    }).then(function(data) {
      self.listDates.sort();
      self.loadWidgetCountry();
      self.loadWidgetCounty('RS');
      self.loadCountryLineChart(self.listDates[0], self.listDates[self.listDates.length - 1]);
      self.loadStatesLineChart(self.listDates[0], self.listDates[self.listDates.length - 1]);
    });
  }

  getPlasmaList = (cant) => {
    const rangeColor = [];
    for (let i = 0; i < cant; i++) {
      rangeColor.push(d3.interpolateInferno( i / (cant - 1) ));
    }
    return rangeColor;
  }


  formatThousandsSeperator = (n) => {
    return d3.format(',d')(n);
  }


  loadWidgetCountry = () => {
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

    const yLegend = d3.scaleLinear()
        .domain(d3.range(10, 500, 50))
        .rangeRound([58, 88]);

    // @ts-ignore
    const colorRangePlasma = self.getPlasmaList(9);
    const color = d3.scaleThreshold().domain(d3.range(10, 500, 50)).range(colorRangePlasma);

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

    /*Place the legend axis with the values in it*/
    g.attr('transform', 'translate(50, ' + (height / 1.7) + ') scale(' + (0.5 * height / 200) + ')')
        .call(d3.axisRight(yLegend)
            .tickSize(0)
            // tslint:disable-next-line:only-arrow-functions
            .tickFormat(function(y, i) {
              if (i > 8) { return ''; }
              if (i === 0) { return '≤' + y + ''; }
              if (i === 8) { return '≥' + y + ''; }
              return y + ''; })
            .tickValues(color.domain()))
        .select('.domain')
        .remove();

    const promises = [
      d3.json('./assets/json/coduf.json'),
      new Promise((resolve) => {
        self.totalCountry = 0;
        self.rankingStates = [];
        // tslint:disable-next-line:forin
        for (const key in self.data[self.endSelectedDay]['estados']) {
          let valorEnd = 0, valorIni = 0;
          if (typeof self.data[self.iniSelectedDay] === 'undefined' ) {
            valorIni = 0;
          } else {
            valorIni = typeof self.data[self.iniSelectedDay]['estados'][key] === 'undefined' ? 0 : self.data[self.iniSelectedDay]['estados'][key].total;
          }
          valorEnd = self.data[self.endSelectedDay]['estados'][key].total;
          if (typeof valorEnd === 'undefined') { valorEnd = 0; }
          if (typeof valorIni === 'undefined') { valorIni = 0; }
          TotalReport.set(key, valorEnd - valorIni);
          self.totalCountry += (valorEnd - valorIni);
          self.rankingStates.push({name: self.statesNames[key], value: valorEnd - valorIni});
        }
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

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
            if ( typeof estColor === 'undefined' ) {
              return '#eeeeee';
            }
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
            self.loadWidgetCounty(d.properties.UF_05);
            self.loadCountiesLineChart(d.properties.UF_05, self.listDates[0], self.listDates[self.listDates.length - 1]);
          });

      const widthTrans = Math.abs((width - d3.select('#country-g-map').node().getBoundingClientRect().width)) * 4;
      const heightTrans = Math.abs((height - d3.select('#country-g-map').node().getBoundingClientRect().height)) * 2;
      d3.select('#country-g-map').attr('transform', 'translate( ' + widthTrans + ' , ' + heightTrans + ') scale(' + scaleRatio + ')');
    }

    self.tipCountry = d3Tip();
    self.tipCountry.attr('class', 'd3-tip')
        .offset([140, 140])
        .html(function(d) {
      d3.select(this).attr('stroke', '#717171');
      return '<div style="opacity:0.8;background-color:#329c68;font-family:sans-serif;padding:8px;;color:white">' +
      'Estado: ' + d.properties.NOME_UF + '<br/>' +
      'População: ' + d.properties.population + '<br/>' +
      'Casos: ' + TotalReport.get(d.properties.UF_05) + '<br/>' +
      'Casos (MS): ' + TotalReportMS.get(d.properties.UF_05) +
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
      statesRankingElmnt.append('p')
          .html('<text class="gt-number">' + self.formatThousandsSeperator(self.rankingStates[item].value)
              + '</text> ' + self.rankingStates[item].name);
    }
  }

  loadWidgetCounty = (county) => {
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
    const TotalReportMS = d3.map();
    const path = d3.geoPath();

    const yLegend = d3.scaleLinear()
        .domain(d3.range(1, 500, 10))
        .rangeRound([58, 88]);

    // @ts-ignore
    const colorRangePlasma = self.getPlasmaList(9);
    const color = d3.scaleThreshold().domain(d3.range(1, 500, 10)).range(colorRangePlasma);

    const g = self.svg.append('g');

    self.svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('fill', '#aaaaaa')
        .attr('font-family', 'sans-serif')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(self.statesNames[county].toUpperCase());

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

    /*Place the legend axis with the values in it*/
    g.attr('transform', 'translate(50, ' + (height / 1.7) + ') scale(' + (0.5 * height / 200) + ')')
        .call(d3.axisRight(yLegend)
            .tickSize(0)
            // tslint:disable-next-line:only-arrow-functions
            .tickFormat(function(y, i) {
              if (i > 8) { return ''; }
              if (i === 0) { return '≤' + y + ''; }
              if (i === 8) { return '≥' + y + ''; }
              return y + ''; })
            .tickValues(color.domain()))
        .select('.domain')
        .remove();

    const promises = [
      d3.json('./assets/json/ufs/' + county + '_trans.json'),
      new Promise((resolve) => {
        self.rankingCounties = [];
        self.totalState = 0;
        // tslint:disable-next-line:forin
        for (const key in self.data[self.endSelectedDay]['estados'][county]['municipios']) {
          let valorEnd = 0, valorIni = 0;
          if (typeof self.data[self.iniSelectedDay] === 'undefined' ){
            valorIni = 0;
          } else {
            valorIni = typeof self.data[self.iniSelectedDay]['estados'][county]['municipios'][key] === 'undefined' ? 0 : self.data[self.iniSelectedDay]['estados'][county]['municipios'][key].total;
          }
          valorEnd = self.data[self.endSelectedDay]['estados'][county]['municipios'][key].total;
          if (typeof valorEnd === 'undefined') { valorEnd = 0; }
          if (typeof valorIni === 'undefined') { valorIni = 0; }
          TotalReport.set(key, valorEnd - valorIni);
          self.totalState += (valorEnd - valorIni);
          self.rankingCounties.push({ibge: key, name: self.countiesNames[key], value: valorEnd - valorIni});
        }
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    function ready([counties]) {
      const scaleRatio = Math.min(width / 550, height / 550);
      // self.svg.append('g')
      d3.select('#svg-county').append('g')
          .attr('class', 'counties')
          .attr('id', 'county-g-map')
          .attr('transform', 'scale(' + scaleRatio + ')')
          .selectAll('path')
          .data(counties.features)
          .enter().append('path')
          .attr('fill', (d) => {
            const munColor = color(d.TotalReport = TotalReport.get(d.properties.COD_IBGE));
            if ( typeof munColor === 'undefined' ) {
              return '#eeeeee';
            }
            return munColor;
          })
          .attr('d', path)
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
          return '<div style="opacity:0.8;background-color:#329c68;font-family:sans-serif;padding:8px;;color:white">' +
            'County: ' + d.properties.NOME_MUNI + '<br/>' +
            'Total Cases: ' + TotalReport.get(d.properties.COD_IBGE) + '<br/>' +
            '</div>'
        });
    g.call(self.tipCounty);

    d3.select('#total-state').html(self.formatThousandsSeperator(self.totalState));

    const countiesRankingElmnt = d3.select('#counties-ranking');
    countiesRankingElmnt.selectAll('*').remove();

    self.rankingCounties.sort((a, b) => (a.value < b.value) ? 1 : -1);

    // tslint:disable-next-line:forin
    for (const item in self.rankingCounties) {
      countiesRankingElmnt.append('p')
          .html('<text class="gt-number">' + self.formatThousandsSeperator(self.rankingCounties[item].value)
              + '</text> ' + self.rankingCounties[item].name);
    }
    self.loadCountiesLineChart(county, self.listDates[0], self.listDates[self.listDates.length - 1]);
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
    const svg = d3.select('#svg-linechart-country');
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.right + ', ' + margin.left + ')');

    const promises = [
      new Promise((resolve) => {
        self.lineChartCountry = [];
        let posIni = self.listDates.indexOf(iniDate);

        const points = [];
        while (self.listDates[posIni] <= endDate) {
          const value = typeof self.data[self.listDates[posIni]] === 'undefined' ? 0 : self.data[self.listDates[posIni]].total;
          minY = Math.min(minY, value);
          maxY = Math.max(maxY, value);
          if (value !== 0) {
            points.push({date: parseDate(self.listDates[posIni]), value: value});
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
      const posIni = self.listDates.indexOf(iniDate);
      const posEnd = self.listDates.indexOf(endDate);
      xScale.domain(
          d3.extent(self.listDates.slice(posIni, posEnd + 1), function(d) {
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

  loadStatesLineChart = (iniDate, endDate) => {
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
    const svg = d3.select('#svg-linechart-state');
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.right + ', ' + margin.left + ')');

    const statesList = [];
    const promises = [
      new Promise((resolve) => {
        self.lineChartStates = [];

        // tslint:disable-next-line:forin
        for (const state in self.data[endDate].estados) {
          let posIni = self.listDates.indexOf(iniDate);

          const points = [];
          while (self.listDates[posIni] <= endDate) {
            let value = typeof self.data[self.listDates[posIni]] === 'undefined' ? 0 : self.data[self.listDates[posIni]].total;
            if (value !== 0) {
              value = typeof self.data[self.listDates[posIni]]['estados'][state] === 'undefined' ? 0 : self.data[self.listDates[posIni]]['estados'][state].total;
            }
            minY = Math.min(minY, value);
            maxY = Math.max(maxY, value);
            if (value !== 0) {
              points.push({date: parseDate(self.listDates[posIni]), value: value, region: state});
            }
            posIni = posIni + 1;
          }
          statesList.push(state);
          self.lineChartStates.push({region: state,
            datapoints: points
          });
        }
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    function ready([dataPoints]) {
      const posIni = self.listDates.indexOf(iniDate);
      const posEnd = self.listDates.indexOf(endDate);
      xScale.domain(
          d3.extent(self.listDates.slice(posIni, posEnd + 1), function(d) {
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
          .attr('x', width / 3.5)
          .attr('y', 5)
          .attr('fill', '#aaaaaa')
          .attr('font-family', 'sans-serif')
          .style('font-size', 'calc(2vh)')
          .style('font-weight', 'bold')
          .text('Total de casos por estado');

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
          .enter().append('circle') // Uses the enter().append() method
          .attr('class', 'dot') // Assign a class for styling
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
        .offset([50, -50])
        .html(function(d) {
          return '<div style="opacity:0.8;background-color:' + d3.select(this).attr('fill') + ';padding:7px;color:white">' +
              '<text style="font-weight: 800">' + d.region +
              '</text></br><text>' + d3.timeFormat('%d/%m')(d.date) +
              ':</text> <text style="font-weight: 800">' + self.formatThousandsSeperator(d.value) + '</text>' +
              '</div>'
        });
    g.call(self.tipLineState);
  }


  loadCountiesLineChart = (stateParam, iniDate, endDate) => {
    const self = this;
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
    const svg = d3.select('#svg-linechart-county');
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.right + ', ' + margin.left + ')');

    console.log(self.data[endDate].estados[stateParam]);
    const countiesList = [];
    const ibgeList = [];

    let posIniTemp = self.listDates.indexOf(iniDate);
    while (self.listDates[posIniTemp] <= endDate) {
      if (typeof self.data[self.listDates[posIniTemp]] !== 'undefined' &&
          typeof self.data[self.listDates[posIniTemp]]['estados'][stateParam] !== 'undefined'
      ) {
        // tslint:disable-next-line:forin
        for (const county in self.data[self.listDates[posIniTemp]]['estados'][stateParam]['municipios']) {
          if ( -1 === ibgeList.indexOf(county) ){
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
          if (index > 10) { return; }
          const county = rankingElm.ibge;
          let posIni = self.listDates.indexOf(iniDate);
          console.log(iniDate, endDate);
          const points = [];
          while (self.listDates[posIni] <= endDate) {
            let value = typeof self.data[self.listDates[posIni]] === 'undefined' ? 0 : self.data[self.listDates[posIni]].total;
            if (value !== 0) {
              value = typeof self.data[self.listDates[posIni]]['estados'][stateParam] === 'undefined' ? 0 : self.data[self.listDates[posIni]]['estados'][stateParam].total;
            }
            if (value !== 0) {
              value = typeof self.data[self.listDates[posIni]]['estados'][stateParam]['municipios'][county] === 'undefined' ? 0 : self.data[self.listDates[posIni]]['estados'][stateParam]['municipios'][county].total;
            }
            minY = Math.min(minY, value);
            maxY = Math.max(maxY, value);
            if (value !== 0) {
              points.push({ date: parseDate(self.listDates[posIni]), value: value, region: county});
            }
            posIni = posIni + 1;
          }
          countiesList.push(county);
          self.lineChartCounties.push({region: county,
            datapoints: points
          });
        });
        console.log(self.lineChartCounties);
        resolve(true);
      })
    ];

    Promise.all(promises).then(ready);

    function ready([dataPoints]) {
      const posIni = self.listDates.indexOf(iniDate);
      const posEnd = self.listDates.indexOf(endDate);
      xScale.domain(
          d3.extent(self.listDates.slice(posIni, posEnd + 1), function(d) {
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
          .attr('x', width / 3.5)
          .attr('y', 5)
          .attr('fill', '#aaaaaa')
          .attr('font-family', 'sans-serif')
          .style('font-size', 'calc(2vh)')
          .style('font-weight', 'bold')
          .text('Total de casos por município (' + stateParam + ')');

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
          .enter().append('circle') // Uses the enter().append() method
          .attr('class', 'dot') // Assign a class for styling
          .attr('cx', function(d) { return xScale(d.date) })
          .attr('cy', function(d) { return yScale(d.value) })
          .attr('stroke', function(d) { return self.coloresGoogle(countiesList.indexOf(d.region)) })
          .attr('fill', function(d) { return self.coloresGoogle(countiesList.indexOf(d.region)) })
          .attr('r', 2)
          .on('mouseover', self.tipLineState.show)
          .on('mouseout', self.tipLineState.hide)
    }

    self.tipLineState = d3Tip();
    self.tipLineState.attr('class', 'd3-tip')
        .offset([50, -50])
        .html(function(d) {
          return '<div style="opacity:0.8;background-color:' + d3.select(this).attr('fill') + ';padding:7px;color:white">' +
              '<text style="font-weight: 800">' + self.countiesNames[d.region] +
              '</text></br><text>' + d3.timeFormat('%d/%m')(d.date) +
              ':</text> <text style="font-weight: 800">' + self.formatThousandsSeperator(d.value) + '</text>' +
              '</div>'
        });
    g.call(self.tipLineState);
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.loadWidgetCountry);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.loadWidgetCountry);
  }
}

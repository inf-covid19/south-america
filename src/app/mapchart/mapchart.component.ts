import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import * as fns from 'date-fns';
import {isLineBreak} from 'codelyzer/angular/sourceMappingVisitor';

@Component({
	selector: 'app-mapchart',
	templateUrl: './mapchart.component.html',
	styleUrls: ['./mapchart.component.css']
})
export class MapchartComponent implements OnInit, AfterViewInit, OnDestroy {
	// svg: any;
	tipWorld: any;
	tipState: any;
	tipLineStateName: any;
	tipLineCountry: any;
	tipLineState: any;
	iniSelectedDay = '31/12/2020';
	minSelectedDay = '24/02/2020';
	endSelectedDay = '24/03/2020';
	maxSelectedDay = '24/03/2020';
	newCountriesMaxVal = 0;
	data = {};
	totalWorld = 0;
	totalCountry = 0;
	totalDeathWorld = 0;
	totalDeathCountry = 0;
	rankingCountries = [];
	rankingStates = [];
	listDatesCountries = [];
	listDatesStates = [];
	lineChartWorld = [];
	lineChartCountries = [];
	lineChartStates = [];
	popScale = 100000;

	population = { total: 0 };

	counts = [ 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000,
		2000000, 5000000, 10000000, 20000000, 50000000, 100000000, 200000000, 500000000,
		1000000000, 2000000000, 5000000000, 10000000000, 20000000000, 50000000000, 100000000000, 200000000000,
		500000000000
	];

	statesByCountry = {
		argentina: [],
		bolivia: [],
		brazil: ['ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to'],
		chile: ['cl-ta', 'cl-an', 'cl-at', 'cl-co', 'cl-ar', 'cl-vs', 'cl-li', 'cl-ml', 'cl-bi', 'cl-ll', 'cl-ai', 'cl-ma', 'cl-rm', 'cl-lr', 'cl-ap', 'cl-nb'],
		colombia: [],
		ecuador: [],
		guyana: [],
		paraguay: [],
		peru: [],
		suriname: [],
		uruguay: [],
		venezuela: []
	};

	yFormat = d3.format(',d');

	countriesNames = {
		argentina: "Argentina", bolivia: "Bolivia", brazil: "Brasil", chile: "Chile", colombia: "Colombia", ecuador: "Ecuador", guyana: "Guyana", paraguay: "Paraguay", peru: "Perú", suriname: "Surinam", uruguay: "Uruguay", venezuela: "Venezuela"
	};

	countriesParam = {
		argentina: {haveStatesData: false},
		bolivia: {haveStatesData: false},
		brazil: {haveStatesData: true, date: 'date', dateFormat: '%Y-%m-%d', columnFilter: 'place_type', valueFilter: 'state', cases: 'confirmed', deaths: 'deaths', population: 'estimated_population_2019', hasKSeparator: false, kSeparator: ''},
		chile: {haveStatesData: true, date: 'date', dateFormat: '%Y-%m-%d', columnFilter: 'place_type', valueFilter: 'region', cases: 'cases', deaths: 'deaths', population: '', hasKSeparator: true, kSeparator: '.'},
		colombia: {haveStatesData: false},
		ecuador: {haveStatesData: false},
		guyana: {haveStatesData: false},
		paraguay: {haveStatesData: false},
		peru: {haveStatesData: false},
		suriname: {haveStatesData: false},
		uruguay: {haveStatesData: false},
		venezuela: {haveStatesData: false}
	}

	statesNames = {};
	selectedCountry = 'brazil';
	selectedState = 'RS';

	closestMaxLegend = goal => {
		return this.counts.reduce(function(prev, curr) {
			return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
		});
	};

	coloresGoogle = n => {
		const coloresG = [ '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e',
			'#316395', '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'
		];
		return coloresG[n % coloresG.length];
	};

	constructor() {
		d3.formatDefaultLocale({
			decimal: '.',
			thousands: ',',
			grouping: [3],
			currency: ['$', '']
		});
	}

	colorScale = (colorRange, legendRange, value) => {
		const color = colorRange[colorRange.length - 1];
		for (let index = 0; index < colorRange.length; index++) {
			if (value >= legendRange[index] && value < legendRange[index + 1]) { return colorRange[index]; }
		}
		return color;
	}

	ngOnInit() {
		const self = this;

		const serieInterval = {
			start: new Date(2019, 11, 31),
			end: new Date()
		};

		Object.keys(this.countriesNames).forEach(element => {
			self.population[element] = {
				population: 0,
				states: {}
			};
		});

		const dateSerie = fns.eachDayOfInterval(serieInterval);

		dateSerie.forEach(d => {
			const date = fns.format(d, 'dd/MM/yyyy');
			self.data[date] = {
				total: 0,
				total_death: 0,
				countries: {}
			};
			Object.keys(this.countriesNames).forEach(element => {
				self.data[date]['countries'][element] = {
					total: 0,
					total_death: 0,
					states: {}
				};
			});
		});

		let dataPromises = [];
		Object.keys(this.countriesNames).map(element => {
			if (self.countriesParam[element.toLowerCase()].haveStatesData) {
				for (let element2 of self.statesByCountry[element.toLowerCase()]) {
					dataPromises.push(d3.dsv(
						',',
						`https://raw.githubusercontent.com/inf-covid19/data/master/data/${element.toLowerCase()}/${element2.toLowerCase()}.csv`,
						function(d) {
							let parseDate = d3.timeParse(self.countriesParam[element.toLowerCase()].dateFormat)
							let dateDate = parseDate(d[self.countriesParam[element.toLowerCase()].date])
							let date = fns.format(dateDate, 'dd/MM/yyyy')
							let columnFilter = d[self.countriesParam[element.toLowerCase()].columnFilter]
							let valueFilter = self.countriesParam[element.toLowerCase()].valueFilter
							
							let cases = d[self.countriesParam[element.toLowerCase()].cases]
							let deaths = d[self.countriesParam[element.toLowerCase()].deaths]
							let population = d[self.countriesParam[element.toLowerCase()].population]
							
							if (self.countriesParam[element.toLowerCase()].hasKSeparator) {
								cases = cases.replace(self.countriesParam[element.toLowerCase()].kSeparator, '');
								deaths = deaths.replace(self.countriesParam[element.toLowerCase()].kSeparator, '');
								if (!isNaN(population)) {
									population = population.replace(self.countriesParam[element.toLowerCase()].kSeparator, '');
								}
							}
							
							cases = parseInt(cases)
							deaths = parseInt(deaths)
							population = parseInt(population)

							cases = isNaN(cases) ? 0 : cases
							deaths = isNaN(deaths) ? 0 : deaths

							if (columnFilter === valueFilter || valueFilter === '') {
								if (self.listDatesCountries.indexOf(date) === -1 && !(cases === 0 && deaths === 0)) {
									self.listDatesCountries.push(date);
								}

								if (-1 === self.listDatesStates.indexOf(date) && !(cases === 0 && deaths === 0)) {
									self.listDatesStates.push(date);
								}

								self.data[date]['total'] += cases;
								self.data[date]['total_death'] += deaths;
								self.data[date]['countries'][element.toLowerCase()]['total'] += cases;
								self.data[date]['countries'][element.toLowerCase()]['total_death'] += deaths;

								if (element2.toLowerCase() in self.data[date]['countries'][element.toLowerCase()]['states'] === false) {
									self.data[date]['countries'][element.toLowerCase()]['states'][element2.toLowerCase()] = {
										total: 0,
										total_death: 0
									}
								}

								self.data[date]['countries'][element.toLowerCase()]['states'][element2.toLowerCase()]['total'] += cases;
								self.data[date]['countries'][element.toLowerCase()]['states'][element2.toLowerCase()]['total_death'] += deaths;

								self.statesNames[element2.toLowerCase()] = element2.toUpperCase();

								if (element2.toLowerCase() in self.population[element.toLowerCase()]['states'] === false) {
									self.population[element.toLowerCase()]['states'][element2.toLowerCase()] = 0
								}

								if (self.population[element.toLowerCase()]['states'][element2.toLowerCase()] === 0) {
									self.population.total += population
									self.population[element.toLowerCase()].population += population
									self.population[element.toLowerCase()]['states'][element2.toLowerCase()] = population
								}
								else if (self.population[element.toLowerCase()]['states'][element2.toLowerCase()] <= population) {
									self.population.total += population - self.population[element.toLowerCase()]['states'][element2.toLowerCase()]
									self.population[element.toLowerCase()].population += population - self.population[element.toLowerCase()]['states'][element2.toLowerCase()]
									self.population[element.toLowerCase()]['states'][element2.toLowerCase()] = population
								}
							}
						}
					));
				}
			}
			else {
				dataPromises.push(d3.dsv(
					',',
					`https://raw.githubusercontent.com/inf-covid19/data/master/data/countries/${element.toLowerCase()}.csv`,
					function(d) {
						let date = d.dateRep
						let cases = isNaN(parseInt(d.cases)) ? 0 : parseInt(d.cases)
						let deaths = isNaN(parseInt(d.deaths)) ? 0 : parseInt(d.deaths)
						let population = parseInt(d.popData2018)
						
						if (self.listDatesCountries.indexOf(date) === -1 && !(cases === 0 && deaths === 0)) {
							self.listDatesCountries.push(date);
						}

						if (-1 === self.listDatesStates.indexOf(date) && !(cases === 0 && deaths === 0)) {
							self.listDatesStates.push(date);
						}
						
						self.data[date]['total'] += cases;
						self.data[date]['total_death'] += deaths;
						self.data[date]['countries'][element.toLowerCase()]['total'] += cases;
						self.data[date]['countries'][element.toLowerCase()]['total_death'] += deaths;

						if (self.population[element.toLowerCase()].population === 0) {
							self.population.total += population;
							self.population[element.toLowerCase()].population = population;
						}
						else if (self.population[element.toLowerCase()].population <= population) {
							self.population.total += population - self.population[element.toLowerCase()].population;
							self.population[element.toLowerCase()].population = population;
						}
					}
				));
			}
		});

		Promise.all(dataPromises).then(values => {
			dateSerie.slice(1).forEach((d, i) => {
				const date = fns.format(d, 'dd/MM/yyyy');
				const lastDate = fns.format(dateSerie[i], 'dd/MM/yyyy');

				self.data[date].total = 0;
				self.data[date].total_death = 0;

				Object.keys(self.data[date]['countries']).forEach(element => {
					if (self.countriesParam[element.toLowerCase()].haveStatesData) {
						if (self.data[date]['countries'][element].total === 0) {
							const lastValue1 = self.data[lastDate]['countries'][element].total;
							self.data[date]['countries'][element].total = lastValue1;
						}

						if (self.data[date]['countries'][element].total_death === 0) {
							const lastValue2 = self.data[lastDate]['countries'][element].total_death;
							self.data[date]['countries'][element].total_death = lastValue2;
						}
						Object.keys(self.data[lastDate]['countries'][element]['states']).forEach(
							state => {
								if ( state in self.data[date]['countries'][element]['states'] === false ||
									(state in self.data[date]['countries'][element]['states'] === true
										&& self.data[date]['countries'][element]['states'][state].total < self.data[lastDate]['countries'][element]['states'][state].total)) {
									const lastValue = self.data[lastDate]['countries'][element]['states'][state];
									self.data[date]['countries'][element]['states'][state] = {
										...lastValue
									};
								}
								if ( state in self.data[date]['countries'][element]['states'] === false ||
									(state in self.data[date]['countries'][element]['states'] === true
										&& self.data[date]['countries'][element]['states'][state].total_death < self.data[lastDate]['countries'][element]['states'][state].total_death)) {
									const lastValue = self.data[lastDate]['countries'][element]['states'][state];
									self.data[date]['countries'][element]['states'][state].total_death = lastValue.total_death;
								}
							}
						);
						let totalCountry = 0, totalCountryDeaths = 0;
						Object.keys(self.data[date]['countries'][element]['states']).forEach(state => {
							totalCountryDeaths += self.data[date]['countries'][element]['states'][state].total_death;
							totalCountry += self.data[date]['countries'][element]['states'][state].total;
						});
						self.data[date]['countries'][element].total = totalCountry;
						self.data[date]['countries'][element].total_death = totalCountryDeaths;
						self.data[date].total += totalCountry;
						self.data[date].total_death += totalCountryDeaths;

					}
					else {
						const lastValue1 = self.data[lastDate]['countries'][element].total;
						self.data[date]['countries'][element].total += lastValue1;
						self.data[date].total += self.data[date]['countries'][element].total;

						const lastValue2 = self.data[lastDate]['countries'][element].total_death;
						self.data[date]['countries'][element].total_death += lastValue2;
						self.data[date].total_death += self.data[date]['countries'][element].total_death;
					}
				});
			});

			self.listDatesCountries.sort((a: String, b: String) => {
				const a_date = d3.timeParse("%d/%m/%Y")(a)
				const b_date = d3.timeParse("%d/%m/%Y")(b)
				return a_date.getTime() - b_date.getTime();
			});
			self.listDatesStates.sort((a: String, b: String) => {
				const a_date = d3.timeParse("%d/%m/%Y")(a)
				const b_date = d3.timeParse("%d/%m/%Y")(b)
				return a_date.getTime() - b_date.getTime();
			});

			self.minSelectedDay = self.listDatesCountries[0];
			self.maxSelectedDay = self.listDatesCountries[self.listDatesCountries.length - 1];
			self.iniSelectedDay = self.minSelectedDay;
			self.endSelectedDay = self.maxSelectedDay;

			self.listDatesCountries = [];
			self.listDatesStates = [];
			let i = 0;
			while (true) {
				const temp = d3.timeFormat('%d/%m/%Y')(
					d3
					.timeParse('%d/%m/%Y')(self.minSelectedDay)
					.valueOf() +
					24 * 60 * 60 * 1000 * i
				);
				self.listDatesCountries.push(temp);
				if (temp === self.maxSelectedDay) {
					break;
				}
				i = i + 1;
			}
			i = 0;
			while (true) {
				const temp = d3.timeFormat('%d/%m/%Y')(
					d3
					.timeParse('%d/%m/%Y')(self.minSelectedDay)
					.valueOf() +
					24 * 60 * 60 * 1000 * i
				);
				self.listDatesStates.push(temp);
				if (temp === self.maxSelectedDay) {
					break;
				}
				i = i + 1;
			}

			// tslint:disable-next-line:no-shadowed-variable
			for (let i = 3; i < self.listDatesCountries.length; i++) {
				if (typeof self.data[self.listDatesCountries[i]] === 'undefined') {
					self.data[self.listDatesCountries[i]] =
						self.data[self.listDatesCountries[i - 1]];
				}
			}

			// self.loadRangeSliderTime();
			self.loadResizeWindow();

			d3.select('#byDeathsCheckBox').on( 'change', self.onByDeathsCheckBoxChange );
			d3.select('#byDensidadeCheckBox').on( 'change', self.onByDensidadeCheckBoxChange );
		});
	}

	loadRangeSliderTime = () => {
		const self = this;
		const parseDate = d3.timeParse('%d/%m/%Y');
		const formatTime = d3.timeFormat('%d/%m/%Y');
		const formatTimeFront = d3.timeFormat('%d/%m/%Y');
		const iniDate = new Date(parseDate(self.minSelectedDay)).valueOf();
		const endDate = new Date(parseDate(self.maxSelectedDay)).valueOf();

		d3.select('#date-slider').selectAll('*').remove();
		let container = d3.select('#date-slider').node() as any;
		container = container.parentNode.parentNode.getBoundingClientRect();
		const margin = { top: 0, right: 15, bottom: 35, left: 0 };
		const width = container.width - margin.left - margin.right;
		const height = container.height - margin.top - margin.bottom;

		const x = d3
			.scaleTime()
			.domain([iniDate, endDate])
			.rangeRound([margin.left, width - margin.right]);

		const xT = d3.scaleLinear().range([0, width]),
			yT = d3.randomNormal(height / 2, height / 8);

		const svg = d3
			.select('#date-slider')
			.attr('viewBox', '0 0 ' + width + ' ' + height);

		svg.attr('width', width)
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
			.classed('tick--minor', function(d) {
				return d.getHours();
			});

		svg
			.append('g')
			.attr('class', 'axis axis--x')
			.attr('transform', 'translate(0,' + height + ')')
			.attr('text-anchor', null)
			.selectAll('text')
			.attr('x', 6);

		const dataT = d3.range(800).map(Math.random);
		const circle = svg
			.append('g')
			.attr('class', 'circle')
			.selectAll('circle')
			.data(dataT)
			.enter()
			.append('circle')
			.attr('transform', function(d) {
				return 'translate(' + xT(d) + ',' + yT() + ')';
			})
			.attr('r', 0);

		const brush = d3.brushX()
			.extent([[0, 0], [width - margin.right, height]])
			.on('brush', onbrush)
			.on('end', brushended);

		const gBrush = svg
			.append('g')
			.attr('class', 'brush')
			.call(brush);

		const brushResizePath = function(d) {
			const e = +(d.type === 'e'), x = e ? 1 : -1, y = height;
			return ('M' + 0.5 * x + ',' + y + 'A6,6 0 0 ' + e + ' ' + 6.5 * x + ',' + (y + 6) + 'V' + (2 * y - 6) +
				'A6,6 0 0 ' + e + ' ' + 0.5 * x + ',' + 2 * y + 'Z' + 'M' + 2.5 * x + ',' + (y + 8) + 'V' + (2 * y - 8) + 'M' + 4.5 * x + ',' +
				(y + 8) + 'V' + (2 * y - 8)
			);
		};

		const handle = gBrush
			.selectAll('.handle--custom')
			.data([{ type: 'w' }, { type: 'e' }])
			.enter()
			.append('path')
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

			circle.classed('active', function(d) {
				return d0[0] <= d && d <= d0[1];
			});
			handle.attr('display', null).attr('transform', function(d, i) {
				return 'translate(' + [s[i], -height] + ')';
			});

			d3.select('#label-date-ini').html(
				'<text style="font-weight: 800; font-size: min(2.1vh, 2.1vw);">' + formatTimeFront(d1[0]) + '</text>'
			);
			d3.select('#label-date-end').html(
				'<text style="font-weight: 800; font-size: min(2.1vh, 2.1vw);">' + formatTimeFront(d1[1]) + '</text>'
			);
		}

		function brushended() {
			if (!d3.event.sourceEvent) {
				return;
			} // Only transition after input.
			if (!d3.event.selection) {
				return;
			} // Ignore empty selections.
			const d0 = d3.event.selection.map(x.invert),
				d1 = d0.map(d3.timeDay.round);

			// If empty when rounded, use floor & ceil instead.
			if (d1[0] >= d1[1]) {
				d1[0] = d3.timeDay.floor(d0[0]);
				d1[1] = d3.timeDay.offset(d1[0]);
			}

			d3.select('#label-date-ini').html(
				'<text style="font-weight: 800; font-size: min(2.1vh, 2.1vw);">' + formatTimeFront(d1[0]) + '</text>'
			);
			d3.select('#label-date-end').html(
				'<text style="font-weight: 800; font-size: min(2.1vh, 2.1vw);">' + formatTimeFront(d1[1]) + '</text>'
			);
			d3.select(this)
				.transition()
				.call(d3.event.target.move, d1.map(x));
			self.iniSelectedDay = formatTime(d1[0]);
			self.endSelectedDay = formatTime(d1[1]);
			let byDensidade = false;
			if (d3.select('#byDensidadeCheckBox').property('checked')) {
				byDensidade = true;
			}
			if (d3.select('#byDeathsCheckBox').property('checked')) {
				self.loadWidgetWorld(true, byDensidade);
				self.loadWidgetCountry(self.selectedCountry, true, byDensidade);
			} else {
				self.loadWidgetWorld(false, byDensidade);
				self.loadWidgetCountry(self.selectedCountry, false, byDensidade);
			}
		}
		const currIniDate = new Date(parseDate(self.iniSelectedDay)).valueOf();
		const currEndDate = new Date(parseDate(self.endSelectedDay)).valueOf();
		gBrush.call(brush.move, [currIniDate, currEndDate].map(x));
	};

	loadResizeWindow = () => {
		this.loadRangeSliderTime();
		if (d3.select('#byDeathsCheckBox').property('checked')) {
			this.loadWidgetWorld(true);
			this.loadWidgetCountry(this.selectedCountry, true);
		} else {
			this.loadWidgetWorld();
			this.loadWidgetCountry(this.selectedCountry);
		}
	}

	onByDeathsCheckBoxChange = () => {
		const self = this;
		let byDensidade = false;
		if (d3.select('#byDensidadeCheckBox').property('checked')) {
			byDensidade = true;
		}
		if (d3.select('#byDeathsCheckBox').property('checked')) {
			self.loadWidgetWorld(true, byDensidade);
			self.loadWidgetCountry(self.selectedCountry, true, byDensidade);
		} else {
			self.loadWidgetWorld(false, byDensidade);
			self.loadWidgetCountry(self.selectedCountry, false, byDensidade);
		}
	};

	onByDensidadeCheckBoxChange = () => {
		const self = this;
		let byDeath = false;
		if (d3.select('#byDeathsCheckBox').property('checked')) {
			byDeath = true;
		}
		if (d3.select('#byDensidadeCheckBox').property('checked')) {
			self.loadWidgetWorld(byDeath, true);
			self.loadWidgetCountry(self.selectedCountry, byDeath, true);
		} else {
			self.loadWidgetWorld(byDeath, false);
			self.loadWidgetCountry(self.selectedCountry, byDeath, false);
		}
	};

	getPlasmaList = cant => {
		const rangeColor = [];
		for (let i = 0; i < cant; i++) {
			rangeColor.push(d3.interpolateYlOrRd(i / (cant - 1)));
		}
		return rangeColor;
	};

	formatValueSeperator = n => {
		if (d3.select('#byDensidadeCheckBox').property('checked')) {
			return d3.format(',.2f')(n);
		} else {
			return d3.format(',d')(n);
		}
	};

	loadWidgetWorld = (byDeaths = false, byDensidade = false) => {
		const self = this;
		let container = d3.select('#svg-world').node() as any;
		//
		if (
			container === (undefined || null) ||
			container.parentNode === (undefined || null)
		) {
			return;
		}
		container = container.parentNode.parentNode.parentNode.getBoundingClientRect();
		const margin = { top: 5, right: 5, bottom: 35, left: 35 };
		const width = container.width - margin.left - margin.right;
		const height = container.height - margin.top - margin.bottom;

		d3.select('#svg-world').selectAll('*').remove();

		const svg = d3
			.select('#svg-world')
			.attr(
				'viewBox',
				'0 0 ' + container.width * 1.3 + ' ' + container.height * 1.3
			);

		const TotalReport = d3.map();
		const TotalDeathReport = d3.map();
		const path = d3.geoPath();

		let maxValue = 0;

		// const currDate = self.listDatesCountries[self.listDatesCountries.indexOf(self.iniSelectedDay) - 1];
		const currDate = self.iniSelectedDay;
		const promises = [
			d3.json('./assets/json/south-america3.geojson'),
			new Promise(resolve => {
				self.totalWorld = 0;
				self.totalDeathWorld = 0;
				self.rankingCountries = [];
				let population = self.popScale;
				// tslint:disable-next-line:forin
				for (const key in self.statesByCountry) {
					// for (const key in self.data[self.endSelectedDay]['countries']) {
					let valorEnd = 0, valorIni = 0, valorDeathIni = 0, valorDeathEnd = 0;
					if (typeof self.data[self.iniSelectedDay] === 'undefined') {
						valorIni = 0;
						valorDeathIni = 0;
					} else {
						valorIni = typeof self.data[currDate]['countries'][key] === 'undefined' ? 0 : self.data[currDate]['countries'][key].total;
						valorDeathIni = typeof self.data[currDate]['countries'][key] === 'undefined' ? 0 : self.data[currDate]['countries'][key].total_death;
					}
					if (typeof self.data[self.endSelectedDay] === 'undefined') {
						valorEnd = 0;
						valorDeathEnd = 0;
					} else {
						valorEnd = typeof self.data[self.endSelectedDay]['countries'][key] === 'undefined' ? 0 : self.data[self.endSelectedDay]['countries'][key].total;
						valorDeathEnd = typeof self.data[self.endSelectedDay]['countries'][key] === 'undefined' ? 0 : self.data[self.endSelectedDay]['countries'][key].total_death;
					}

					if (byDensidade === true) {
						population = self.population[key].population;
					}

					TotalReport.set(key, Math.abs(valorEnd - valorIni) * (self.popScale / population));
					TotalDeathReport.set(key, Math.abs(valorDeathEnd - valorDeathIni) * (self.popScale / population));
					self.totalWorld += Math.abs(valorEnd - valorIni);
					self.totalDeathWorld += Math.abs(valorDeathEnd - valorDeathIni);

					if (byDeaths === true) {
						maxValue = Math.max(maxValue, Math.abs(valorDeathEnd - valorDeathIni) * (self.popScale / population));
						self.rankingCountries.push({ region: key, name: self.countriesNames[key],
							value: Math.abs(valorDeathEnd - valorDeathIni) * (self.popScale / population)
						});
					} else {
						maxValue = Math.max(maxValue, Math.abs(valorEnd - valorIni) * (self.popScale / population));
						self.rankingCountries.push({ region: key, name: self.countriesNames[key],
							value: Math.abs(valorEnd - valorIni) * (self.popScale / population)
						});
					}
				}

				if ( byDensidade === true ) {
					self.totalWorld = self.totalWorld * (self.popScale / self.population.total);
					self.totalDeathWorld = self.totalDeathWorld * (self.popScale / self.population.total);
				}

				resolve(true);
			})
		];

		Promise.all(promises).then(ready);

		self.newCountriesMaxVal = self.closestMaxLegend(maxValue / 1.5);
		const stepSize = self.newCountriesMaxVal / 10;
		const yLegend = d3.scaleLinear().domain(
			d3.range(stepSize === 1 ? 1 : stepSize + 1, Math.max(stepSize * 10, 9), stepSize).reverse()
		).rangeRound([58, 88]);

		const colorRangePlasma = self.getPlasmaList(9);
		const color = d3.scaleThreshold().domain(
			d3.range(stepSize === 1 ? 1 : stepSize + 1, Math.max(stepSize * 10, 9), stepSize)
		).range(colorRangePlasma);

		const mapG = d3.select('#svg-world').append('g');
		function ready([world]) {
			const scaleRatio = Math.min(width / 700, height / 700);
			// d3.select('#svg-world').append('g')
			mapG
				.attr('id', 'world-g-map')
				.attr('transform', 'scale(' + scaleRatio + ')')
				.attr('class', 'states')
				.selectAll('path')
				.data(world.features)
				.enter()
				.append('path')
				.attr('fill', d => {
					let estColor = 0;
					if (byDeaths === true) {
						estColor = typeof TotalDeathReport.get(d.properties.code) === 'undefined' ? 0 : TotalDeathReport.get(d.properties.code);
					} else {
						estColor = typeof TotalReport.get(d.properties.code) === 'undefined' ? 0 : TotalReport.get(d.properties.code);
					}
					if (estColor === 0) {
						return '#000000';
					}
					return color(estColor);
				})
				.attr('stroke', '#eeeeee')
				.attr('d', path)
				.on('mouseover', self.tipWorld.show)
				.on('mouseout', function() {
					d3.selectAll('#world-g-map path').each(function(d) {
						if (d3.select(this).attr('selected') !== 'true') {
							d3.select(this).attr('stroke', '#eeeeee');
							d3.select(this).attr('stroke-width', 2);
						}
					});
					self.tipWorld.hide();
				})
				.on('click', function(d) {
					d3.selectAll('#world-g-map path').each(function() {
						d3.select(this).attr('stroke', '#eeeeee');
						d3.select(this).attr('stroke-width', 2);
						d3.select(this).attr('selected', 'false');
					});
					self.selectedCountry = d.properties.code;
					self.loadWidgetCountry(self.selectedCountry, byDeaths, byDensidade);
					d3.select(this)
						.attr('stroke', '#007acc')
						.attr('stroke-width', 6)
						.attr('selected', 'true');

				});

			const widthTrans = Math.abs(container.width - mapG.node().getBoundingClientRect().width) / 2;
			const heightTrans = Math.abs(container.height - mapG.node().getBoundingClientRect().height) / 2;
			mapG.attr('transform', 'translate( ' + widthTrans + ' , ' + heightTrans + ') scale(' + scaleRatio + ')');

			d3.selectAll('#world-g-map path').each(function(d) {
				if (d.properties.code === self.selectedCountry) {
					d3.select(this)
						.attr('stroke', '#007acc')
						.attr('stroke-width', 6)
						.attr('selected', 'true');
				}
			});
		}

		self.tipWorld = d3Tip();
		self.tipWorld.attr('class', 'd3-tip')
			.offset([100, 120])
			.html(function(d) {
				const selfTemp = this;
				d3.selectAll('#world-g-map path').each(function() {
					if (d3.select(this).attr('selected') !== 'true' && this === selfTemp) {
						d3.select(this).attr('stroke', '#717171');
						d3.select(this).attr('stroke-width', 3);
					}
				});
				const labelTot = byDensidade === true ? 'Densidad casos' : 'Total casos';
				const labelTotDeath = byDensidade === true ? 'Densidad muertes' : 'Total muertes';
				return (
					'<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
					'<text>País: </text><text style="font-weight: 800">' +
					d.properties.name +
					'</text><br/>' +
					'<text>' + labelTot + ': </text><text style="font-weight: 800">' +
					(typeof TotalReport.get(d.properties.code) === 'undefined'
						? 0
						: self.formatValueSeperator(TotalReport.get(d.properties.code))) +
					'</text><br/>' +
					'<text>' + labelTotDeath + ': </text><text style="font-weight: 800">' +
					(typeof TotalDeathReport.get(d.properties.code) === 'undefined'
						? 0
						: self.formatValueSeperator(TotalDeathReport.get(d.properties.code))) +
					'</text><br/>' +
					'<text>Población: </text><text style="font-weight: 800">' +
					d3.format(',d')(self.population[d.properties.code].population) +
					'</text><br/>' +
					'</div>'
				);
			});

		const zoom = d3
			.zoom()
			.scaleExtent([1, 8])
			.on('zoom', function() {
				mapG.selectAll('path').attr('transform', d3.event.transform);
			});

		svg.call(zoom);

		const g = svg.append('g');
		g.call(self.tipWorld);

		const scaleValue = Math.min((0.5 * height) / 150, (0.5 * width) / 150);
		svg.append('text')
			.attr('x', width / (2 * scaleValue))
			.attr('x', width / 1.7)
			.attr('y', 20)
			.attr('transform', 'scale(' + scaleValue + ')')
			.attr('fill', '#aaaaaa')
			.style('background-color', '#000000')
			.attr('font-family', 'sans-serif')
			.style('font-size', '23px')
			.style('font-weight', 'bold')
			.text('SUDAMÉRICA');

		g.selectAll('rect')
			.data(
				color.range().map(d => {
					d = color.invertExtent(d);
					if (d[0] == null) {
						d[0] = yLegend.domain()[0];
					}
					if (d[1] == null) {
						d[1] = yLegend.domain()[1];
					}
					return d;
				})
			)
			.enter()
			.append('rect')
			.attr('height', 26)
			.attr('x', -26)
			.attr('y', d => yLegend(d[1]) - 13)
			.attr('width', 23)
			.attr('fill', d => color(d[1] - 1));

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
		g.attr(
			'transform',
			'translate(50, ' + height / 1.7 + ') scale(' + (0.5 * height) / 200 + ')'
		)
			.attr('class', 'legend')
			.call(
				d3
				.axisRight(yLegend)
				.tickSize(0)
				// tslint:disable-next-line:only-arrow-functions
				.tickFormat(function(y, i) {
					if (i > 8) {
						return '';
					}
					if (i === 0) {
						return '≤' + d3.format(',d')(y - 1) + '';
					}
					if (i === 8) {
						return '≥' + d3.format(',d')(lastTick) + '';
					}
					lastTick = y;
					return d3.format(',d')(y - 1) + '';
				})
				.tickValues(color.domain())
			)
			.select('.domain')
			.remove();

		// @ts-ignore
		d3.select('#total-world').html( self.formatValueSeperator(self.totalWorld) );
		d3.select('#total-world-deaths').html( self.formatValueSeperator(self.totalDeathWorld) );

		if (byDensidade === true) {
			d3.select('#name-total-world').html('Densidad Sudamérica');
		} else {
			d3.select('#name-total-world').html('Confirmados Sudamérica');
		}

		const countriesRankingElmnt = d3.select('#countries-ranking');
		countriesRankingElmnt.selectAll('*').remove();

		self.rankingCountries.sort((a, b) => (a.value < b.value ? 1 : -1));

		const classColor = byDeaths === false ? 'gt-number' : 'gt-dark-number';
		// tslint:disable-next-line:forin
		for (const item in self.rankingCountries) {
			// if (justOneRecord) {
			countriesRankingElmnt
				.append('tr')
				.on('mouseover', function() {
					d3.select(this).style('cursor', 'pointer');
					d3.select(this).style('font-weight', '800');
				})
				.on('mouseout', function() {
					d3.select(this).style('font-weight', '300');
				})
				.on('click', function() {
					self.selectedCountry = self.rankingCountries[item].region;
					self.loadWidgetCountry(self.rankingCountries[item].region, byDeaths, byDensidade); // without event click on counties map
					self.loadStatesLineChart(self.selectedCountry, self.iniSelectedDay, self.endSelectedDay, byDeaths, byDensidade);
				})
				.html(
					'<td class="' + classColor + ' gt-ranking-number"  style="padding-left: 11px; text-align: right">' +
					self.formatValueSeperator(self.rankingCountries[item].value) +
					'</td><td>' + self.rankingCountries[item].name + '</td>'
				);
		}
		// if (justOneRecordState === true) {
		//   self.loadCountriesLineChart(self.iniSelectedDay, self.endSelectedDay, self.rankingCountries[0].region);
		// } else {
		self.loadCountriesLineChart(self.iniSelectedDay, self.endSelectedDay, byDeaths, byDensidade);
		// }
	};

	loadWidgetCountry = (param, byDeaths = false, byDensidade = false) => {
		const self = this;
		let container = d3.select('#svg-state').node() as any;
		//
		if (
			container === (undefined || null) ||
			container.parentNode === (undefined || null)
		) {
			return;
		}
		container = container.parentNode.parentNode.getBoundingClientRect();
		const margin = { top: 5, right: 5, bottom: 35, left: 35 };
		const width = container.width - margin.left - margin.right;
		const height = container.height - margin.top - margin.bottom;

		d3.select('#svg-state').selectAll('*').remove();

		const svg = d3.select('#svg-state').attr('viewBox', '0 0 ' + container.width * 1.3 + ' ' + container.height * 1.3);

		const TotalReport = d3.map();
		const TotalDeathReport = d3.map();
		const path = d3.geoPath();
		let maxValue = 0;

		const promises = [
			d3.json('./assets/json/countries/' + param + '3.geojson'),
			new Promise(resolve => {
				self.rankingStates = [];
				self.totalCountry = 0;
				self.totalDeathCountry = 0;
				const beginDay = self.iniSelectedDay;
				const lastDay = self.endSelectedDay;
				let population = self.popScale;
				self.statesByCountry[param].forEach(function(key, index) {
					let valorEnd = 0, valorIni = 0, valorDeathEnd = 0, valorDeathIni = 0;
					if (typeof self.data[beginDay] === 'undefined') {
						valorIni = 0;
						valorDeathIni = 0;
					} else {
						if ( typeof self.data[beginDay]['countries'][param] === 'undefined' ) {
							valorIni = 0;
							valorDeathIni = 0;
						} else {
							valorIni = typeof self.data[beginDay]['countries'][param]['states'][key] === 'undefined' ? 0 : self.data[beginDay]['countries'][param]['states'][key].total;
							valorDeathIni = typeof self.data[beginDay]['countries'][param]['states'][key] === 'undefined' ? 0 : self.data[beginDay]['countries'][param]['states'][key].total_death;
						}
					}
					if (typeof self.data[lastDay] === 'undefined') {
						valorEnd = 0;
						valorDeathEnd = 0;
					} else {
						if (typeof self.data[lastDay]['countries'][param] === 'undefined') {
							valorEnd = 0;
							valorDeathEnd = 0;
						} else {
							valorEnd = typeof self.data[lastDay]['countries'][param]['states'][key] === 'undefined' ? 0 : self.data[lastDay]['countries'][param]['states'][key].total;
							valorDeathEnd = typeof self.data[lastDay]['countries'][param]['states'][key] === 'undefined' ? 0 : self.data[lastDay]['countries'][param]['states'][key].total_death;
						}
					}
					if (byDensidade === true) {
						population = typeof self.population[param]['states'][key] === 'undefined' ? 1000000 :
							self.population[param]['states'][key];
					}

					TotalReport.set(key, Math.abs(valorEnd - valorIni) * (self.popScale / population));
					TotalDeathReport.set(key, Math.abs(valorDeathEnd - valorDeathIni) * (self.popScale / population));
					self.totalCountry += Math.abs(valorEnd - valorIni);
					self.totalDeathCountry += Math.abs(valorDeathEnd - valorDeathIni);
					if (byDeaths === true) {
						maxValue = Math.max(maxValue, Math.abs(valorDeathEnd - valorDeathIni) * (self.popScale / population));
						self.rankingStates.push({ state: key, name: self.statesNames[key],
							value: Math.abs(valorDeathEnd - valorDeathIni) * (self.popScale / population)
						});
					} else {
						maxValue = Math.max(maxValue, Math.abs(valorEnd - valorIni) * (self.popScale / population));
						self.rankingStates.push({ state: key, name: self.statesNames[key],
							value: Math.abs(valorEnd - valorIni) * (self.popScale / population)
						});
					}
				});
				if (byDensidade === true) {
					self.totalCountry = self.totalCountry * (self.popScale / self.population[param].population);
					self.totalDeathCountry = self.totalDeathCountry * (self.popScale / self.population[param].population);
				}
				resolve(true);
			})
		];

		Promise.all(promises).then(ready);
		const newMaxVal = self.closestMaxLegend(maxValue / 1.5);
		const stepSize = newMaxVal / 10;

		const yLegend = d3
			.scaleLinear()
			.domain(
				d3
				.range(
					stepSize === 1 ? 1 : stepSize + 1,
					Math.max(stepSize * 10, 9),
					stepSize
				)
				.reverse()
			)
			.rangeRound([58, 88]);

		// @ts-ignore
		const colorRangePlasma = self.getPlasmaList(9);
		const color = d3
			.scaleThreshold()
			.domain(
				d3.range(
					stepSize === 1 ? 1 : stepSize + 1,
					Math.max(stepSize * 10, 9),
					stepSize
				)
			)
			.range(colorRangePlasma);

		const mapG = d3.select('#svg-state').append('g');
		function ready([states]) {
			const scaleRatio = Math.min(width / 550, height / 550);
			mapG
				.attr('class', 'states')
				.attr('id', 'state-g-map')
				.attr('transform', 'scale(' + scaleRatio + ')')
				.selectAll('path')
				.data(states.features)
				.enter()
				.append('path')
				.attr('fill', d => {
					let stateColor = 0;
					if (byDeaths === true) {
						stateColor = typeof TotalDeathReport.get(d.properties.code.toLowerCase()) === 'undefined' ? 0 : TotalDeathReport.get(d.properties.code.toLowerCase());
					} else {
						stateColor = typeof TotalReport.get(d.properties.code.toLowerCase()) === 'undefined' ? 0 : TotalReport.get(d.properties.code.toLowerCase());
					}

					if (stateColor === 0) {
						return '#000000';
					}
					return color(stateColor);
				})
				.attr('d', path)
				.attr('stroke', '#eeeeee')
				.on('mouseover', self.tipState.show)
				.on('mouseout', function() {
					d3.select(this).attr('stroke', '#eeeeee');
					self.tipState.hide();
				});

			const widthTrans =
				Math.min(Math.abs(width - mapG.node().getBoundingClientRect().width) * 1.8, width * 0.35);
			// Math.min(Math.abs(width - d3.select('#state-g-map').node().getBoundingClientRect().width) * 1.8, width * 0.35);
			const heightTrans =
				Math.min(Math.abs(height - mapG.node().getBoundingClientRect().height) * 1.5, height * 0.35);
			mapG.attr('transform', 'translate( ' + widthTrans + ' , ' + heightTrans + ') scale(' + scaleRatio + ')');
		}

		self.tipState = d3Tip();
		self.tipState
			.attr('class', 'd3-tip')
			.html(function(d) {
				// console.log(d, self.population);
				d3.select(this).attr('stroke', '#717171');
				const labelTot = byDensidade === true ? 'Densidad casos' : 'Total casos';
				const labelTotDeath = byDensidade === true ? 'Densidad muertes' : 'Total muertes';
				return (
					'<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
					'<text>Estado: </text><text style="font-weight: 800">' +
					d.properties.name +
					'</text><br/>' +
					'<text>' + labelTot + ': </text><text style="font-weight: 800">' +
					(typeof TotalReport.get(d.properties.code.toLowerCase()) === 'undefined'
						? 0
						: self.formatValueSeperator(TotalReport.get(d.properties.code.toLowerCase()))) +
					'</text><br/>' +
					'<text>' + labelTotDeath + ': </text><text style="font-weight: 800">' +
					(typeof TotalDeathReport.get(d.properties.code.toLowerCase()) === 'undefined'
						? 0
						: self.formatValueSeperator(TotalDeathReport.get(d.properties.code.toLowerCase()))) +
					'</text><br/>' +
					'<text>Población: </text><text style="font-weight: 800">' +
					d3.format(',d')(self.population[param]['states'][d.properties.code.toLowerCase()]) +
					'</text><br/>' +
					'</div>'
				);
			});

		const zoom = d3
			.zoom()
			.scaleExtent([1, 8])
			.on('zoom', function() {
				mapG.selectAll('path').attr('transform', d3.event.transform);
			});

		svg.call(zoom);

		const g = svg.append('g');

		const scaleValue = Math.min((0.5 * height) / 150, (0.5 * width) / 150);
		svg.append('text')
			.attr('x', width / (2.2 * scaleValue))
			.attr('y', 20)
			.attr('transform', 'scale(' + scaleValue + ')')
			.attr('fill', '#aaaaaa')
			.attr('font-family', 'sans-serif')
			.style('font-size', '23px')
			.style('font-weight', 'bold')
			.text(self.countriesNames[param].toUpperCase());

		g.selectAll('rect')
			.data(
				color.range().map(d => {
					d = color.invertExtent(d);
					if (d[0] == null) {
						d[0] = yLegend.domain()[0];
					}
					if (d[1] == null) {
						d[1] = yLegend.domain()[1];
					}
					return d;
				})
			)
			.enter()
			.append('rect')
			.attr('height', 26)
			.attr('x', -26)
			.attr('y', d => yLegend(d[1]) - 13)
			.attr('width', 23)
		// .attr('fill', (d) => color(d[0]));
			.attr('fill', d => {
				return color(d[1] - 1);
			});

		/*legend title*/
		g.append('text')
			.attr('font-family', 'sans-serif')
			.attr('x', -42)
			.attr('y', 20)
			.attr('fill', '#aaaaaa')
			.attr('text-anchor', 'start')
			.attr('font-size', '22px')
			.attr('font-weight', 'bold')
			.text('Casos');

		let lastTick = 0;
		g.attr(
			'transform',
			'translate(50, ' + height / 1.7 + ') scale(' + (0.5 * height) / 200 + ')'
		)
			.attr('class', 'legend')
			.call(
				d3
				.axisRight(yLegend)
				.tickSize(0)
				// tslint:disable-next-line:only-arrow-functions
				.tickFormat(function(y, i) {
					if (i > 8) {
						return '';
					}
					if (i === 0) {
						return '≤' + d3.format(',d')(y - 1) + '';
					}
					if (i === 8) {
						return '≥' + d3.format(',d')(lastTick) + '';
					}
					lastTick = y;
					return d3.format(',d')(y - 1) + '';
				})
				.tickValues(color.domain())
			)
			.select('.domain')
			.remove();

		g.call(self.tipState);

		d3.select('#total-country').html(self.formatValueSeperator(self.totalCountry));
		d3.select('#total-country-deaths').html(self.formatValueSeperator(self.totalDeathCountry));
		if (byDensidade === true) {
			d3.select('#name-total-country').html('Densidad ' + self.countriesNames[self.selectedCountry]);
		} else {
			d3.select('#name-total-country').html('Confirmados ' + self.countriesNames[self.selectedCountry]);
		}


		const statesRankingElmnt = d3.select('#states-ranking');
		statesRankingElmnt.selectAll('*').remove();

		self.rankingStates.sort((a, b) => (a.value < b.value ? 1 : -1));

		const classColor = byDeaths === false ? 'gt-number' : 'gt-dark-number';
		// tslint:disable-next-line:forin
		for (const item in self.rankingStates) {
			statesRankingElmnt
				.append('tr')
				.on('mouseover', function() {
					d3.select(this).style('cursor', 'pointer');
					d3.select(this).style('font-weight', '800');
				})
				.on('mouseout', function() {
					d3.select(this).style('font-weight', '300');
				})
				.html(
					'<td class="' + classColor + ' gt-ranking-number"  style="padding-left: 6px; text-align: right">' +
					self.formatValueSeperator(self.rankingStates[item].value) +
					'</td><td>' + self.rankingStates[item].name + '</td>'
				);
		}
		self.loadStatesLineChart(param, self.iniSelectedDay, self.endSelectedDay, byDeaths, byDensidade );
	};


	loadCountriesLineChart = (iniDate, endDate, byDeaths = false, byDensidade = false) => {
		const self = this;
		let container = d3.select('#svg-linechart-country').node() as any;
		if ( container === (undefined || null) || container.parentNode === (undefined || null)) { return; }
		container = container.parentNode.parentNode.getBoundingClientRect();
		const margin = { top: 20, right: 40, bottom: 25, left: 15 };
		const width = container.width - margin.left - margin.right;
		const height = container.height - margin.top - margin.bottom;

		const parseDate = d3.timeParse('%d/%m/%Y');
		const countriesList = [];
		const promises = [
			new Promise(resolve => {
				self.lineChartCountries = [];
				let population = self.popScale;
				self.rankingCountries.forEach(function(rankingElm, index) {
					// if (index > 9 && param === '') { return; }
					const country = rankingElm.region;
					let posIni = self.listDatesCountries.indexOf(iniDate);

					let dateIni = (new Date(parseDate(self.listDatesCountries[posIni]))).getTime()
					const dateEnd = (new Date(parseDate(endDate))).getTime()

					if (byDensidade) {
						population = self.population[country].population;
					}

					while (dateIni !== null && dateIni !== 0 && dateIni <= dateEnd) {
						let value = 0;

						if (byDeaths === true) {
							value = typeof self.data[self.listDatesCountries[posIni]] === 'undefined' ? 0 : self.data[self.listDatesCountries[posIni]].total_death;
						} else {
							value = typeof self.data[self.listDatesCountries[posIni]] === 'undefined' ? 0 : self.data[self.listDatesCountries[posIni]].total;
						}

						if (value !== 0) {
							if (byDeaths === true) {
								value = typeof self.data[self.listDatesCountries[posIni]]['countries'][country] === 'undefined' ? 0 : self.data[self.listDatesCountries[posIni]]['countries'][country].total_death;
							} else {
								value = typeof self.data[self.listDatesCountries[posIni]]['countries'][country] === 'undefined' ? 0 : self.data[self.listDatesCountries[posIni]]['countries'][country].total;
							}
						}
						if (value !== 0) {
							value = value * (self.popScale / population);
							self.lineChartCountries.push({ region: country, date: parseDate(self.listDatesCountries[posIni]), value: value });
						}
						posIni = posIni + 1;
						dateIni = (new Date(parseDate(self.listDatesCountries[posIni]))).getTime()
					}
					countriesList.push(country);
				});
				resolve(true);
			})
		];

		Promise.all(promises).then(ready);

		d3.select('#svg-linechart-country').selectAll('*').remove();

		const svg = d3.select('#svg-linechart-country')
			.attr('x', 0)
			.attr('y', margin.top * 1.5)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.attr('viewBox', '0 0 ' + container.width + ' ' + container.height);

		const g = svg.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top * 3 + ')');

		function ready([dataPoints]) {
			let legendRange = [0, 10, 50, 100, 250, 500, 1000, 5000, 10000];
			if (byDeaths === true) {
				legendRange = [0, 1, 5, 10, 25, 50, 100, 500, 1000];
				if (byDensidade === true) {
					legendRange = [0, 0.25, 0.5, 0.75, 1, 5, 10, 25, 50];
				}
			} else {
				if (byDensidade === true) {
					legendRange = [0, 0.5, 1, 2, 5, 10, 20, 50, 100];
				}
			}
			const colorRange = self.getPlasmaList(9);
			const qtyDays = 1 + self.listDatesCountries.indexOf(self.endSelectedDay) - self.listDatesCountries.indexOf(self.iniSelectedDay);
			const gridSizeX = width / qtyDays;
			const gridSizeY = height / 12;
			const times = self.listDatesCountries.slice(
				self.listDatesCountries.indexOf(self.iniSelectedDay), self.listDatesCountries.indexOf(self.endSelectedDay) + 1);
			const legendElementWidth = width / 14;
			const x = d3.axisBottom().tickFormat(d3.timeFormat('%d/%m/%y')).scale(d3.scaleTime()
				.domain([d3.timeParse('%d/%m/%Y')(self.iniSelectedDay), d3.timeParse('%d/%m/%Y')(self.endSelectedDay)])
				.range([0, gridSizeX * (qtyDays - 0.9)]));
			let titleLabel = 'Casos confirmados ';
			if (byDensidade === true) {
				titleLabel = 'Densidade ';
			}
			svg.append('text')
				.attr('x', width / 3.5)
				.attr('y', margin.top)
				.attr('fill', '#aaaaaa')
				.attr('font-family', 'sans-serif')
				.style('font-size', 'calc(2vh)')
				.style('font-weight', 'bold')
				.text(titleLabel + ' por país');

			g.append('g')
				.attr('class', 'x-axis')
				.attr('transform', 'translate( 0,' + 0 + ')')
				.call(x)
				.selectAll('text')
				.attr('y', 0)
				.attr('x', 9)
				.attr('dy', '.35em')
				.attr('transform', 'rotate(-45)')
				.style('text-anchor', 'start');

			d3.selectAll('g.x-axis path.domain').remove();
			d3.selectAll('g.x-axis line').remove();

			const scrollG = svg
				.append('g')
				.attr('id', 'scroll-y-div')
				.attr('width', width)
				.attr('height', 9.9 * gridSizeY)
				.attr('transform', 'translate(0,' + margin.top * 3 + ')');
			scrollG.append('rect')
				.attr('width', width + margin.left + margin.right)
				.attr('height', 9 * gridSizeY)
				.attr('x', 0).attr('y', 0)
				.attr('fill-opacity', 0);

			const scrollGDiv = svg
				.append('svg')
				.attr('width', width + margin.left + margin.right)
				.attr('height', 10 * gridSizeY)
				.attr('x', 0)
				.attr('y', margin.top * 3)
				.attr('transform', 'translate(0, 0)');

			const dayLabels = scrollGDiv.selectAll('.dayLabel')
				.data(countriesList)
				.enter().append('text')
				.text(function (d) { return d; })
				.attr('x', 17)
				.attr('y', function (d, i) { return i * gridSizeY; })
				.style('text-anchor', 'end')
				.style('fill', '#aaaaaa')
				.attr('transform', 'translate(0,' + gridSizeY / 1.5 + ')');

			const heatMapG = scrollGDiv
				.append('g')
				.attr('transform', 'translate(20, 0)');
			const heatMap = heatMapG
				.selectAll('.hour')
				.data(self.lineChartCountries)
				.enter().append('rect')
				.attr('x', function (d) {
					if (d3.timeFormat('%d/%m/%Y')(d.date) !== -1) { return times.indexOf(d3.timeFormat('%d/%m/%Y')(d.date)) * gridSizeX; }
				})
				.attr('y', function (d) {
					if (d3.timeFormat('%d/%m/%Y')(d.date) !== -1) { return (countriesList.indexOf(d.region)) * gridSizeY; }
				})
				.attr('rx', 1)
				.attr('ry', 1)
				.attr('class', 'hour bordered')
				.attr('width', gridSizeX)
				.attr('height', gridSizeY)
				.style('fill', '#ffffff')
				.on('mouseover', self.tipLineCountry.show)
				.on('mouseout', self.tipLineCountry.hide);

			heatMap.transition().duration(1000).style('fill', function (d) {
				return self.colorScale(colorRange, legendRange, d.value);
			});

			/*BEGIN SCROLLBAR*/
			let scrollDistance = 0;
			const root = scrollGDiv.attr('clip-path', 'url(#scrollbox-clip-path)');
			const clipRect = scrollGDiv.append('clipPath').attr('id', 'scrollbox-clip-path').append('rect');
			clipRect.attr('x', 0)
				.attr('y', 0)
				.attr('width', width + margin.left + margin.right)
				.attr('height', 10 * gridSizeY);

			root.insert('rect', 'g')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', width + margin.left + margin.right)
				.attr('height', 10 * gridSizeY)
				.attr('opacity', 0);

			const scrollBar = scrollG.append('rect')
				.attr('width', 2)
				.attr('rx', 1)
				.attr('ry', 1)
				.attr('transform', 'translate(' + scrollG.node().getBoundingClientRect().width + ',0)');

			const absoluteContentHeight = heatMapG.node().getBoundingClientRect().height;
			const scrollbarHeight = absoluteContentHeight === 0 ? 0 :
				scrollG.node().getBoundingClientRect().height * scrollG.node().getBoundingClientRect().height / absoluteContentHeight;
			scrollBar.attr('height', scrollbarHeight);

			const maxScroll = Math.max(absoluteContentHeight - scrollG.node().getBoundingClientRect().height, 0);

			function updateScrollPosition(diff) {
				scrollDistance += diff;
				scrollDistance = Math.max(0, scrollDistance);
				scrollDistance = Math.min(maxScroll, scrollDistance);

				heatMapG.attr('transform', 'translate(20, ' + (-scrollDistance) + ')');
				dayLabels.attr('transform', 'translate(0, ' + ( gridSizeY / 1.5 - scrollDistance) + ')');
				const scrollBarPosition = scrollDistance / maxScroll * (scrollG.node().getBoundingClientRect().height - scrollbarHeight);
				scrollBar.attr('y', scrollBarPosition);
			}

			// Set up scroll events
			root.on('wheel', (e) => {
				updateScrollPosition(d3.event.deltaY)
			});

			// Set up scrollbar drag events
			const dragBehaviour = d3.drag()
				.on('drag', () => {
					updateScrollPosition(d3.event.dy * maxScroll / (svg.height - scrollbarHeight))
				});
			scrollBar.call(dragBehaviour);

			/*END*/
			const legend = g.append('g').attr('transform', 'translate(10, ' + ( 10 * gridSizeY + 2) + ')');

			legend.selectAll('rect')
				.data(legendRange)
				.enter()
				.append('rect')
				.attr('fill', function(d) { return self.colorScale(colorRange, legendRange, d); })
				.attr('x', function(d, i) { return legendElementWidth * i; })
				.attr('width', legendElementWidth)
				.attr('height', gridSizeY / 2);

			legend.selectAll('text')
				.data(legendRange)
				.join('text')
				.attr('fill', '#aaaaaa')
				.attr('x', function(d, i) { return legendElementWidth * i; })
				.attr('y', gridSizeY + 2)
				.text(function(d, i) {
					if (i === colorRange.length - 1) { return '≥' + self.yFormat(d); }
					return '' + self.yFormat(d);
				});
		}

		self.tipLineCountry = d3Tip();
		self.tipLineCountry
			.attr('class', 'd3-tip')
			.offset([20, -80])
			.html(function(d) {
				return (
					'<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
					'<text style="font-weight: 800">' +
					self.countriesNames[d.region] +
					'</text></br><text>' +
					d3.timeFormat('%d/%m/%Y')(d.date) +
					':</text> <text style="font-weight: 800">' +
					self.formatValueSeperator(d.value) +
					'</text>' +
					'</div>'
				);
			});
		svg.call(self.tipLineCountry);
	};

	loadStatesLineChart = (param, iniDate, endDate, byDeaths = false, byDensidade = false) => {
		const self = this;
		let container = d3.select('#svg-linechart-state').node() as any;
		if ( container === (undefined || null) || container.parentNode === (undefined || null) ) {
			return;
		}
		container = container.parentNode.parentNode.getBoundingClientRect();
		const margin = { top: 20, right: 40, bottom: 25, left: 45 };
		const width = container.width - margin.left - margin.right;
		const height = container.height - margin.top - margin.bottom;

		const parseDate = d3.timeParse('%d/%m/%Y');

		// Define scales
		const xScale = d3.scaleTime().range([0, width]);

		d3.select('#svg-linechart-state').selectAll('*').remove();

		const statesList = [];
		const ibgeList = [];

		let posIniTemp = self.listDatesStates.indexOf(iniDate);
		while (self.listDatesStates[posIniTemp] <= endDate) {
			if (typeof self.data[self.listDatesStates[posIniTemp]] !== 'undefined' &&
				typeof self.data[self.listDatesStates[posIniTemp]]['countries'][param] !== 'undefined') {
				// tslint:disable-next-line:forin
				for (const state in self.data[self.listDatesStates[posIniTemp]]['countries'][param]['states']) {
					if (-1 === ibgeList.indexOf(state)) { ibgeList.push(state); }
				}
			}
			posIniTemp = posIniTemp + 1;
		}

		const promises = [
			new Promise(resolve => {
				self.lineChartStates = [];

				let population = self.popScale;

				self.rankingStates.forEach(function(rankingElm, index) {
					const state = rankingElm.state;
					if (byDensidade === true) {
						population = typeof self.population[param]['states'][state] === 'undefined' ? 1000000 :
							self.population[param]['states'][state];
					}
					let posIni = self.listDatesStates.indexOf(iniDate);

					let dateIni = (new Date(parseDate(self.listDatesStates[posIni]))).getTime()
					const dateEnd = (new Date(parseDate(endDate))).getTime()
					while (dateIni !== null && dateIni !== 0 && dateIni <= dateEnd) {
						let value = 0;

						if (byDeaths === true) {
							value = typeof self.data[self.listDatesStates[posIni]] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]].total_death;
						} else {
							value = typeof self.data[self.listDatesStates[posIni]] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]].total;
						}
						if (value !== 0) {
							if (byDeaths === true) {
								value = typeof self.data[self.listDatesStates[posIni]]['countries'][param] === 'undefined'? 0 : self.data[self.listDatesStates[posIni]]['countries'][param].total_death;
							} else {
								value = typeof self.data[self.listDatesStates[posIni]]['countries'][param] === 'undefined'? 0 : self.data[self.listDatesStates[posIni]]['countries'][param].total;
							}
						}
						if (value !== 0) {
							if (byDeaths === true) {
								value = typeof self.data[self.listDatesStates[posIni]]['countries'][param]['states'][state] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]]['countries'][param]['states'][state].total_death;
							} else {
								value = typeof self.data[self.listDatesStates[posIni]]['countries'][param]['states'][state] === 'undefined' ? 0 : self.data[self.listDatesStates[posIni]]['countries'][param]['states'][state].total;
							}
						}
						if (value !== 0) {
							value = value * (self.popScale / population);
							self.lineChartStates.push({ date: parseDate(self.listDatesStates[posIni]),
								value: value,
								region: state
							});
						}
						posIni = posIni + 1;
						dateIni = (new Date(parseDate(self.listDatesStates[posIni]))).getTime()
					}
					statesList.push(state);
				});
				resolve(true);
			})
		];
		Promise.all(promises).then(ready);
		d3.select('#svg-linechart-state').selectAll('*').remove();

		const svg = d3.select('#svg-linechart-state')
			.attr('x', 0)
			.attr('y', margin.top * 1.5)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.attr('viewBox', '0 0 ' + container.width + ' ' + container.height);

		const g = svg.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top * 3 + ')');

		function ready([dataPoints]) {
			let legendRange = [0, 5, 10, 20, 50, 100, 200, 500, 1000];

			if (byDeaths === true) {
				legendRange = [0, 1, 2, 5, 10, 25, 50, 75, 100];
				if (byDensidade === true) {
					legendRange = [0, 0.25, 0.5, 0.75, 1, 5, 10, 25, 50];
				}
			} else {
				if (byDensidade === true) {
					legendRange = [0, 0.5, 1, 2, 5, 10, 20, 25, 50];
				}
			}

			const colorRange = self.getPlasmaList(9);
			const qtyDays = 1 + self.listDatesCountries.indexOf(self.endSelectedDay) - self.listDatesCountries.indexOf(self.iniSelectedDay);
			const gridSizeX = width / qtyDays;
			const gridSizeY = height / 12;
			const times = self.listDatesCountries.slice(
				self.listDatesCountries.indexOf(self.iniSelectedDay), self.listDatesCountries.indexOf(self.endSelectedDay) + 1);
			const legendElementWidth = width / 14;
			const x = d3.axisBottom().tickFormat(d3.timeFormat('%d/%m/%y')).scale(d3.scaleTime()
				.domain([d3.timeParse('%d/%m/%Y')(self.iniSelectedDay), d3.timeParse('%d/%m/%Y')(self.endSelectedDay)])
				.range([0, gridSizeX * (qtyDays - 0.9)]));
			let titleLabel = 'Casos confirmados ';
			if (byDensidade === true) {
				titleLabel = 'Densidad ';
			}
			svg.append('text')
				.attr('x', width / 3.5)
				.attr('y', margin.top)
				.attr('fill', '#aaaaaa')
				.attr('font-family', 'sans-serif')
				.style('font-size', 'calc(2vh)')
				.style('font-weight', 'bold')
				.text(titleLabel + 'por estados en ' + self.selectedCountry);

			g.append('g')
				.attr('class', 'x-axis')
				.attr('transform', 'translate(4,' + 0 + ')')
				.call(x)
				.selectAll('text')
				.attr('y', 0)
				.attr('x', 9)
				.attr('dy', '.35em')
				.attr('transform', 'rotate(-45)')
				.style('text-anchor', 'start');

			d3.selectAll('g.x-axis path.domain').remove();
			d3.selectAll('g.x-axis line').remove();


			const scrollG = svg
				.append('g')
				.attr('id', 'scroll-y-div')
				.attr('width', width)
				.attr('height', 9.9 * gridSizeY)
				.attr('transform', 'translate(0,' + margin.top * 3 + ')');
			scrollG.append('rect')
				.attr('width', width + margin.left + margin.right)
				.attr('height', 9 * gridSizeY)
				.attr('x', 0).attr('y', 0)
				.attr('fill-opacity', 0);

			const scrollGDiv = svg
				.append('svg')
				.attr('width', width + margin.left + margin.right)
				.attr('height', 10 * gridSizeY)
				.attr('x', 0)
				.attr('y', margin.top * 3)
				.attr('transform', 'translate(0, 0)');

			const dayLabels = scrollGDiv.selectAll('.dayLabel')
				.data(statesList)
				.enter().append('text')
				.text(function (d) { return self.statesNames[d].slice(0,8); })
				.on('mouseover', self.tipLineStateName.show)
				.on('mouseout', self.tipLineStateName.hide)
				.attr('x', 45)
				.attr('y', function (d, i) { return i * gridSizeY; })
				.style('text-anchor', 'end')
				.style('fill', '#aaaaaa')
				.attr('transform', 'translate(0,' + gridSizeY / 1.5 + ')');

			const heatMapG = scrollGDiv
				.append('g')
				.attr('transform', 'translate(50, 0)');
			const heatMap = heatMapG
				.selectAll('.hour')
				.data(self.lineChartStates)
				.enter().append('rect')
				.attr('x', function (d) {
					if (d3.timeFormat('%d/%m/%Y')(d.date) !== -1) { return times.indexOf(d3.timeFormat('%d/%m/%Y')(d.date)) * gridSizeX; }
				})
				.attr('y', function (d) {
					if (d3.timeFormat('%d/%m/%Y')(d.date) !== -1) { return (statesList.indexOf(d.region)) * gridSizeY; }
				})
				.attr('rx', 1)
				.attr('ry', 1)
				.attr('class', 'hour bordered')
				.attr('width', gridSizeX)
				.attr('height', gridSizeY)
				.style('fill', '#ffffff')
				.on('mouseover', self.tipLineState.show)
				.on('mouseout', self.tipLineState.hide);

			heatMap.transition().duration(1000).style('fill', function (d) {
				return self.colorScale(colorRange, legendRange, d.value);
			});

			/*BEGIN SCROLLBAR*/
			let scrollDistance = 0;
			const root = scrollGDiv.attr('clip-path', 'url(#scrollbox-clip-path)');
			const clipRect = scrollGDiv.append('clipPath').attr('id', 'scrollbox-clip-path').append('rect');
			clipRect.attr('x', 0)
				.attr('y', 0)
				.attr('width', width + margin.left + margin.right)
				.attr('height', 10 * gridSizeY);

			root.insert('rect', 'g')
				.attr('x', 50)
				.attr('y', 0)
				.attr('width', width + margin.left + margin.right)
				.attr('height', 10 * gridSizeY)
				.attr('opacity', 0);

			const scrollBar = scrollG.append('rect')
				.attr('width', 2)
				.attr('rx', 1)
				.attr('ry', 1)
				.attr('transform', 'translate(' + scrollG.node().getBoundingClientRect().width + ',0)');

			const absoluteContentHeight = heatMapG.node().getBoundingClientRect().height;
			const scrollbarHeight = absoluteContentHeight === 0 ? 0 :
				scrollG.node().getBoundingClientRect().height * scrollG.node().getBoundingClientRect().height / absoluteContentHeight;
			scrollBar.attr('height', scrollbarHeight);

			const maxScroll = Math.max(absoluteContentHeight - scrollG.node().getBoundingClientRect().height, 0);

			function updateScrollPosition(diff) {
				scrollDistance += diff;
				scrollDistance = Math.max(0, scrollDistance);
				scrollDistance = Math.min(maxScroll, scrollDistance);

				heatMapG.attr('transform', 'translate(50, ' + (-scrollDistance) + ')');
				dayLabels.attr('transform', 'translate(0, ' + ( gridSizeY / 1.5 - scrollDistance) + ')');
				const scrollBarPosition = scrollDistance / maxScroll * (scrollG.node().getBoundingClientRect().height - scrollbarHeight);
				scrollBar.attr('y', scrollBarPosition);
			}

			// Set up scroll events
			root.on('wheel', (e) => {
				updateScrollPosition(d3.event.deltaY)
			});

			// Set up scrollbar drag events
			const dragBehaviour = d3.drag()
				.on('drag', () => {
					updateScrollPosition(d3.event.dy * maxScroll / (svg.height - scrollbarHeight))
				});
			scrollBar.call(dragBehaviour);

			/*END*/

			const legend = g.append('g').attr('transform', 'translate(10, ' + ( 10 * gridSizeY + 2) + ')');

			legend.selectAll('rect')
				.data(legendRange)
				.enter()
				.append('rect')
				.attr('fill', function(d) { return self.colorScale(colorRange, legendRange, d); })
				.attr('x', function(d, i) { return legendElementWidth * i; })
				.attr('width', legendElementWidth)
				.attr('height', gridSizeY / 2);

			legend.selectAll('text')
				.data(legendRange)
				.join('text')
				.attr('fill', '#aaaaaa')
				.attr('x', function(d, i) { return legendElementWidth * i; })
				.attr('y', gridSizeY + 2)
				.text(function(d, i) {
					if (i === colorRange.length - 1) { return '≥' + self.yFormat(d); }
					return '' + self.yFormat(d);
				});
		}
		self.tipLineState = d3Tip();
		self.tipLineState
			.attr('class', 'd3-tip')
			.offset([20, -80])
			.html(function(d) {
				return (
					'<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
					'<text style="font-weight: 800">' +
					self.statesNames[d.region] +
					'</text></br><text>' +
					d3.timeFormat('%d/%m/%Y')(d.date) +
					':</text> <text style="font-weight: 800">' +
					self.formatValueSeperator(d.value) +
					'</text>' +
					'</div>'
				);
			});
		self.tipLineStateName = d3Tip();
		self.tipLineStateName
			.attr('class', 'd3-tip')
			.offset([20, -80])
			.html(function(d) {
				return (
					'<div style="opacity:0.8;background-color:#8b0707;padding:7px;color:white">' +
					'<text style="font-weight: 800">' +
					self.statesNames[d] +
					'</text>' +
					'</div>'
				);
			});
		svg.call(self.tipLineState);
		svg.call(self.tipLineStateName);
	};

	ngAfterViewInit() {
		window.addEventListener('resize', this.loadResizeWindow);
	}

	ngOnDestroy() {
	}
}

const Robinhood = require('./Robinhood');
const Fundamentals = require('./Fundamentals');
const Market = require('./Market');
const Quote = require('./Quote');
const request = require('request');

class Instrument extends Robinhood {

	/**
	 * Creates a new Instrument object.
	 * @param {Object} object
	 */
	constructor(object) {
		if (!object instanceof Object) throw new Error("Parameter 'object' must be an object.");
		else {
			super();
			this.name = String(object.name);
			this.simpleName = String(object.simple_name);
			this.symbol = String(object.symbol);
			this.listDate = new Date(object.list_date);
			this.country = String(object.country);
			this.tradeable = Boolean(object.tradeable);
			this.type = String(object.type);
			this.bloomberg = String(object.bloomberg_unique);
			this.state = String(object.state);
			this.id = String(object.id);
			this.urls = {
				market: String(object.market),
				fundamentals: String(object.fundamentals),
				quote: String(object.quote),
				instrument: String(object.url),
				splits: String(object.splits)
			};
			this.margin = {
				initialRatio: Number(object.margin_initial_ratio),
				dayTradeRatio: Number(object.day_trade_ratio),
				maintenanceRatio: Number(object.maintenance_ratio)
			}
		}
	}

	// Static initializer methods

	/**
	 * Returns an array of all available instruments.
	 * WARNING: this will take a while!
	 * @returns {Promise<Array>}
	 */
	static getAll() {
		return new Promise((resolve, reject) => {
			request({
				uri: "https://api.robinhood.com/instruments/"
			}, (error, response, body) => {
				return Robinhood.handleResponse(error, response, body, null, res => {
					let array = [];
					res.forEach(obj => {
						array.push(new Instrument(obj));
					});
					resolve(array);
				}, reject);
			})
		})
	}

	/**
	 * Returns an instrument object for the specified symbol.
	 * @param {String} symbol
	 * @returns {Promise<Instrument>}
	 */
	static getBySymbol(symbol) {
		return new Promise((resolve, reject) => {
			if (!symbol instanceof String) reject(new Error("Parameter 'symbol' must be a string."));
			else request({
				uri: "https://api.robinhood.com/instruments/",
				qs: {
					symbol: symbol
				}
			}, (error, response, body) => {
				return Robinhood.handleResponse(error, response, body, null, res => {
					resolve(new Instrument(res));
				}, reject);
			})
		})
	}

	/**
	 * Returns an instrument object for the specified instrument URL.
	 * @param {String} instrumentURL
	 * @returns {Promise<Instrument>}
	 */
	static getByURL(instrumentURL) {
		return new Promise((resolve, reject) => {
			if (!instrumentURL instanceof String) reject(new Error("Parameter 'instrumentURL' must be a string."));
			request({
				uri: instrumentURL
			}, (error, response, body) => {
				return Robinhood.handleResponse(error, response, body, null, res => {
					resolve(new Instrument(res));
				}, reject);
			})
		})
	}

	// GET from API

	/**
	 * Fills the instrument object with market, fundamental, quote, and split data. Returns an array of Market, Fundamentals, Quote, and Splits objects.
	 * @returns {Promise<Array>}
	 */
	populate() {
		const _this = this;
		return new Promise((resolve, reject) => {
			Promise.all([
				_this.getMarket(),
				_this.getFundamentals(),
				_this.getQuote(),
				_this.getSplits()
			]).then(q => {
				_this.MarketObject = q[0];
				_this.FundamentalsObject = q[1];
				_this.QuoteObject = q[2];
				_this.splits = q[3];
				resolve(q);
			}).catch(error => reject(error));
		});
	}

	/**
	 * Returns an object with information on the market that this instrument trades on.
	 * @returns {Promise<Market>}
	 */
	getMarket() {
		return Market.getByURL(this.urls.market);
	}

	/**
	 * Returns a new Fundamentals object with information such as open, high, low, close, volume, market cap, and more, on this instrument.
	 * @returns {Promise<Fundamentals>}
	 */
	getFundamentals() {
		return Fundamentals.getByURL(this.urls.fundamentals);
	}

	/**
	 * Returns an object with a real-time quote on this instrument.
	 * @returns {Promise<Quote>}
	 */
	getQuote() {
		return Quote.getByURL(this.urls.quote);
	}

	/**
	 * Returns an object containing details on past stock splits.
	 * @returns {Promise<Object>}
	 */
	getSplits() {
		const _this = this;
		return new Promise((resolve, reject) => {
			request({
				uri: _this.urls.splits
			}, (error, response, body) =>
				Robinhood.handleResponse(error, response, body, null, resolve, reject)
			);
		})
	}

	// GET from object

	/**
	 * @returns {String}
	 */
	getName() {
		return this.name;
	}

	/**
	 * @returns {String}
	 */
	getSimpleName() {
		return this.simpleName;
	}

	/**
	 * @returns {String}
	 */
	getSymbol() {
		return this.symbol;
	}

	/**
	 * @returns {Date}
	 */
	getListDate() {
		return this.listDate;
	}

	/**
	 * @returns {String}
	 */
	getCountry() {
		return this.country;
	}

	/**
	 * @returns {String}
	 */
	getType() {
		return this.type;
	}

	/**
	 * @returns {String}
	 */
	getBloombergID() {
		return this.bloomberg;
	}

	/**
	 *
	 * @returns {String}
	 */
	getState() {
		return this.state;
	}

	/**
	 * @returns {String}
	 */
	getID() {
		return this.id;
	}

	/**
	 * @returns {Number}
	 */
	getMarginInitialRatio() {
		return this.margin.initialRatio;
	}

	/**
	 * @returns {Number}
	 */
	getDayTradeRatio() {
		return this.margin.dayTradeRatio;
	}

	/**
	 * @returns {Number}
	 */
	getMaintenanceRatio() {
		return this.margin.maintenanceRatio;
	}

	// BOOLEANS

	/**
	 * Checks if the instrument is able to be traded.
	 * @returns {Boolean}
	 */
	isTradeable() {
		return this.tradeable;
	}

	isActive() {
		return this.state === "active";
	}

	/**
	 * Checks if the instrument is a stock.
	 * @returns {Boolean}
	 */
	isStock() {
		return this.type === "stock";
	}

	/**
	 * Checks if the instrument is an exchange traded product.
	 * @returns {Boolean}
	 */
	isETP() {
		return this.type === "etp";
	}

	/**
	 * Checks if the instrument is an American Depositary Receipt. Typically applies to foreign companies.
	 * https://www.investopedia.com/terms/a/adr.asp
	 * @returns {Boolean}
	 */
	isADR() {
		return this.type === "adr";
	}

}

module.exports = Instrument;
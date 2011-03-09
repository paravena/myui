var Utilities = {

    /**
     * Returns window height
     */
    getWindowHeight : function() {
        return([
            window.innerHeight ? window.innerHeight : null,
            document.documentElement ? document.documentElement.clientHeight : null,
            document.body ? document.body.clientHeight : null
        ].select(function(height) {
            return height > 0
        }).first() || 0);
    },

    /**
     * Returns window scroll top
     */
    getWindowScrollTop : function() {
        return ([
            window.pageYOffset ? window.pageYOffset : null,
            document.documentElement ? document.documentElement.scrollTop : null,
            document.body ? document.body.scrollTop : null
        ].select(function(scrollTop) {
            return scrollTop > 0
        }).first() || 0);
    },

    /**
     * Returns the closest number as the result of using i as a multiplication factor
     *
     * @param n limit number
     * @param i factor number
     */
    floorToInterval : function(n, i) {
        return Math.floor(n / i) * i;
    }
};

Element.buildAndAppend = function(type, options, style) {
    var newElement = $(document.createElement(type));
    $H(options).each(function(pair) {
        newElement[pair.key] = pair.value
    });
    if (style) newElement.setStyle(style);
    return newElement;
};

Element.addMethods({
    purgeChildren: function(element) {
        $A(element.childNodes).each(function(e) {
            $(e).remove();
        });
    },
    build: function(element, type, options, style) {
        var newElement = Element.buildAndAppend(type, options, style);
        element.appendChild(newElement);
        return newElement;
    }
});

var SelectBox = Class.create();

SelectBox.prototype = {
    initialize: function(parent_element, values, html_options, style_options) {
        this.element = $(parent_element).build("select", html_options, style_options);
        this.populate(values);
    },

    populate: function(values) {
        this.element.purgeChildren();
        var that = this;
        $A(values).each(function(pair) {
            if (typeof(pair) != "object") {
                pair = [pair, pair]
            }
            that.element.build("option", { value: pair[1], innerHTML: pair[0]})
        });
    },

    setValue: function(value) {
        var e = this.element;
        var matched = false;
        $R(0, e.options.length - 1).each(function(i) {
            if (e.options[i].value == value.toString()) {
                e.selectedIndex = i;
                matched = true;
            }

        });
        return matched;
    },

    getValue: function() {
        return $F(this.element)
    }
};

var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

var dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

var TEXT2 = 0, TEXT3 = 1, NUMBER = 2, YEAR = 3, MONTH = 4, TIMEZONE = 5;
var types = {
    G : TEXT2,
    y : YEAR,
    M : MONTH,
    w : NUMBER,
    W : NUMBER,
    D : NUMBER,
    d : NUMBER,
    F : NUMBER,
    E : TEXT3,
    a : TEXT2,
    H : NUMBER,
    k : NUMBER,
    K : NUMBER,
    h : NUMBER,
    m : NUMBER,
    s : NUMBER,
    S : NUMBER,
    Z : TIMEZONE
};
var ONE_DAY = 24 * 60 * 60 * 1000;
var ONE_WEEK = 7 * ONE_DAY;
var DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;

Date.ONE_DAY = 24 * 60 * 60 * 1000;
Date.WEEK_DAYS = $w("S M T W T F S");
Date.FIRST_DAY_OF_WEEK = 0;
Date.MONTHS = $w("January February March April May June July August September October November December");
Date.DAY_NAMES = $w("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");

function newDateAtMidnight (year, month, day) {
    var d = new Date(year, month, day, 0, 0, 0);
    d.setMilliseconds(0);
    return d;
}

Date.prototype.getAMPMHour = function() {
    var hour = this.getHours();
    return (hour == 0) ? 12 : (hour > 12 ? hour - 12 : hour )
};

Date.prototype.getAMPM = function() {
    return (this.getHours() < 12) ? "AM" : "PM";
};

Date.prototype.stripTime = function() {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
};

Date.prototype.daysDistance = function(compare_date) {
    return Math.round((compare_date - this) / Date.ONE_DAY);
};

Date.prototype.toFormattedString = function(includeTimeFlg) {
    var str = Date.MONTHS[this.getMonth()] + " " + this.getDate() + ", " + this.getFullYear();
    if (includeTimeFlg) {
        str += this.getHours() +" " + this.getAMPMHour() + ":" + this.getMinutes().toPaddedString(2) + " " + this.getAMPM()
    }
    return str;
};

Date.parseFormattedString = function(string) {
    return new Date(string);
};

Date.prototype.getDifference = function(date) {
    return this.getTime() - date.getTime();
};

Date.prototype.isBefore = function(d) {
    return this.getTime() < d.getTime();
};

Date.prototype.getUTCTime = function() {
    return Date.UTC(this.getFullYear(),
            this.getMonth(),
            this.getDate(),
            this.getHours(),
            this.getMinutes(),
            this.getSeconds(),
            this.getMilliseconds());
};

Date.prototype.getTimeSince = function(d) {
    return this.getUTCTime() - d.getUTCTime();
};

Date.prototype.getPreviousSunday = function() {
    // Using midday avoids any possibility of DST messing things up
    var midday = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 12, 0, 0);
    var previousSunday = new Date(midday.getTime() - this.getDay() * ONE_DAY);
    return newDateAtMidnight(previousSunday.getFullYear(), previousSunday.getMonth(), previousSunday.getDate());
};

Date.prototype.getWeekInYear = function(minimalDaysInFirstWeek) {
    var previousSunday = this.getPreviousSunday();
    var startOfYear = newDateAtMidnight(this.getFullYear(), 0, 1);
    var numberOfSundays = previousSunday.isBefore(startOfYear) ?
        0 : 1 + Math.floor(previousSunday.getTimeSince(startOfYear) / ONE_WEEK);
    var numberOfDaysInFirstWeek =  7 - startOfYear.getDay();
    var weekInYear = numberOfSundays;
    if (numberOfDaysInFirstWeek < minimalDaysInFirstWeek) {
        weekInYear--;
    }
    return weekInYear;
};

Date.prototype.getWeekInMonth = function(minimalDaysInFirstWeek) {
    var previousSunday = this.getPreviousSunday();
    var startOfMonth = newDateAtMidnight(this.getFullYear(), this.getMonth(), 1);
    var numberOfSundays = previousSunday.isBefore(startOfMonth) ? 0 : 1 + Math.floor((previousSunday.getTimeSince(startOfMonth)) / ONE_WEEK);
    var numberOfDaysInFirstWeek =  7 - startOfMonth.getDay();
    var weekInMonth = numberOfSundays;
    if (numberOfDaysInFirstWeek >= minimalDaysInFirstWeek) {
        weekInMonth++;
    }
    return weekInMonth;
};

Date.prototype.getDayInYear = function() {
    var startOfYear = newDateAtMidnight(this.getFullYear(), 0, 1);
    return 1 + Math.floor(this.getTimeSince(startOfYear) / ONE_DAY);
};

var SimpleDateFormat = Class.create();

SimpleDateFormat.prototype = {
    initialize : function (formatString) {
        this.formatString = formatString;
        this.minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
    },

	/**
	 * Sets the minimum number of days in a week in order for that week to
	 * be considered as belonging to a particular month or year
	 */
	setMinimalDaysInFirstWeek : function(days) {
		this.minimalDaysInFirstWeek = days;
	},

	getMinimalDaysInFirstWeek : function() {
		return this.minimalDaysInFirstWeek;
	},

	format : function(date) {
		var formattedString = "";
		var result;

		var padWithZeroes = function(str, len) {
			while (str.length < len) {
				str = '0' + str;
			}
			return str;
		};

		var formatText = function(data, numberOfLetters, minLength) {
			return (numberOfLetters >= 4) ? data : data.substr(0, Math.max(minLength, numberOfLetters));
		};

		var formatNumber = function(data, numberOfLetters) {
			var dataString = "" + data;
			// Pad with 0s as necessary
			return padWithZeroes(dataString, numberOfLetters);
		};

        var regex = /('[^']*')|(G+|y+|M+|w+|W+|D+|d+|F+|E+|a+|H+|k+|K+|h+|m+|s+|S+|Z+)|([a-zA-Z]+)|([^a-zA-Z']+)/;

        var searchString = this.formatString;
		while ((result = regex.exec(searchString))) {
			var matchedString = result[0];
			var quotedString = result[1];
			var patternLetters = result[2];
			var otherLetters = result[3];
			var otherCharacters = result[4];

			// If the pattern matched is quoted string, output the text between the quotes
			if (quotedString) {
				if (quotedString == "''") {
					formattedString += "'";
				} else {
					formattedString += quotedString.substring(1, quotedString.length - 1);
				}
			} else if (otherLetters) {
				// Swallow non-pattern letters by doing nothing here
			} else if (otherCharacters) {
				// Simply output other characters
				formattedString += otherCharacters;
			} else if (patternLetters) {
				// Replace pattern letters
				var patternLetter = patternLetters.charAt(0);
				var numberOfLetters = patternLetters.length;
				var rawData = "";
				switch (patternLetter) {
					case "G":
						rawData = "AD";
						break;
					case "y":
						rawData = date.getFullYear();
						break;
					case "M":
						rawData = date.getMonth();
						break;
					case "w":
						rawData = date.getWeekInYear(this.getMinimalDaysInFirstWeek());
						break;
					case "W":
						rawData = date.getWeekInMonth(this.getMinimalDaysInFirstWeek());
						break;
					case "D":
						rawData = date.getDayInYear();
						break;
					case "d":
						rawData = date.getDate();
						break;
					case "F":
						rawData = 1 + Math.floor((date.getDate() - 1) / 7);
						break;
					case "E":
						rawData = dayNames[date.getDay()];
						break;
					case "a":
						rawData = (date.getHours() >= 12) ? "PM" : "AM";
						break;
					case "H":
						rawData = date.getHours();
						break;
					case "k":
						rawData = date.getHours() || 24;
						break;
					case "K":
						rawData = date.getHours() % 12;
						break;
					case "h":
						rawData = (date.getHours() % 12) || 12;
						break;
					case "m":
						rawData = date.getMinutes();
						break;
					case "s":
						rawData = date.getSeconds();
						break;
					case "S":
						rawData = date.getMilliseconds();
						break;
					case "Z":
						rawData = date.getTimezoneOffset(); // This is returns the number of minutes since GMT was this time.
						break;
				}
				// Format the raw data depending on the type
				switch (types[patternLetter]) {
					case TEXT2:
						formattedString += formatText(rawData, numberOfLetters, 2);
						break;
					case TEXT3:
						formattedString += formatText(rawData, numberOfLetters, 3);
						break;
					case NUMBER:
						formattedString += formatNumber(rawData, numberOfLetters);
						break;
					case YEAR:
						if (numberOfLetters <= 3) {
							// Output a 2-digit year
							var dataString = "" + rawData;
							formattedString += dataString.substr(2, 2);
						} else {
							formattedString += formatNumber(rawData, numberOfLetters);
						}
						break;
					case MONTH:
						if (numberOfLetters >= 3) {
							formattedString += formatText(monthNames[rawData], numberOfLetters, numberOfLetters);
						} else {
							// NB. Months returned by getMonth are zero-based
							formattedString += formatNumber(rawData + 1, numberOfLetters);
						}
						break;
					case TIMEZONE:
						var isPositive = (rawData > 0);
						// The following line looks like a mistake but isn't
						// because of the way getTimezoneOffset measures.
						var prefix = isPositive ? "-" : "+";
						var absData = Math.abs(rawData);

						// Hours
						var hours = "" + Math.floor(absData / 60);
						hours = padWithZeroes(hours, 2);
						// Minutes
						var minutes = "" + (absData % 60);
						minutes = padWithZeroes(minutes, 2);

						formattedString += prefix + hours + minutes;
						break;
				}
			}
			searchString = searchString.substr(result.index + result[0].length);
		}
		return formattedString;
	}
};

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};

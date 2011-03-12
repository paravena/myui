var _translations = {
    "OK" : "OK",
    "Now" :  "Now",
    "Today" : "Today",
    "Clear" : "Clear"
};

var CalendarDateSelect = Class.create();

CalendarDateSelect.prototype = {
    initialize: function(targetElement, options) {
        this.targetElement = $(targetElement); // make sure it's an element, not a string
        if (!this.targetElement) {
            alert("Target element " + targetElement + " not found!");
            return false;
        }
        if (this.targetElement.tagName != "INPUT") this.targetElement = this.targetElement.down("INPUT");

        this.targetElement.calendar_date_select = this;
        this.last_click_at = 0;
        // initialize the date control
        this.options = $H({
            embedded: false,
            format: 'MM/dd/yyyy',
            popup: null,
            time: false,
            buttons: true,
            clearButton: true,
            yearRange: 10,
            close_on_click: null,
            minuteInterval: 5,
            popupBy: this.targetElement,
            monthYear: 'dropdowns',
            onchange: this.targetElement.onchange,
            valid_date_check: null
        }).merge(options || {});

        this.use_time = this.options.get('time');
        this.format = this.options.get('format');

        this._parseDate();
        this._callback('before_show');
        this._initCalendarDiv();
        if (!this.options.get("embedded")) {
            this._positionCalendarDiv();
            // set the click handler to check if a user has clicked away from the document
            Event.observe(document, "mousedown", this._closeIfClickedOut_handler = this._closeIfClickedOut.bindAsEventListener(this));
            Event.observe(document, "keypress", this._keyPress_handler = this._keyPress.bindAsEventListener(this));
        }
        this._callback("after_show")
    },

    _positionCalendarDiv : function() {
        var above = false;
        var c_dim = this._calendarDiv.getDimensions();
        var c_height = c_dim.height;
        var c_width = c_dim.width;
        var w_top = Utilities.getWindowScrollTop();
        var w_height = Utilities.getWindowHeight();
        var e_dim = $(this.options.get('popupBy')).cumulativeOffset();
        var e_top = e_dim[1];
        var e_left = e_dim[0];
        var e_height = $(this.options.get('popupBy')).getDimensions().height;
        var e_bottom = e_top + e_height;

        if ((( e_bottom + c_height ) > (w_top + w_height)) && ( e_bottom - c_height > w_top )) above = true;
        var left_px = e_left.toString() + "px";
        var top_px = (above ? (e_top - c_height ) : ( e_top + e_height )).toString() + "px";

        this._calendarDiv.style.left = left_px;
        this._calendarDiv.style.top = top_px;
        this._calendarDiv.setStyle({visibility: ''});

        // draw an iframe behind the calendar -- ugly hack to make IE 6 happy
        if (navigator.appName == 'Microsoft Internet Explorer') {
            this.iframe = $(document.body).build('iframe',
                {
                    src: 'javascript:false',
                    className: 'ie6_blocker'
                },
                {
                    left: left_px,
                    top: top_px,
                    height: c_height.toString() + 'px',
                    width: c_width.toString() + 'px',
                    border: '0px'
                }
            );
        }
    },

    _initCalendarDiv : function() {
        var parent = null;
        var style = null;
        if (this.options.get("embedded")) {
            parent = this.targetElement.parentNode;
            style = {};
        } else {
            parent = document.body;
            style = { position:"absolute", visibility: "hidden", left:0, top:0 };
        }
        this._calendarDiv = new Element('div', {className: 'calendar_date_select'}).setStyle(style);
        // create the divs
        this._topDiv = new Element('div', {className: 'mdp_top'}).setStyle({clear:'left'});
        this._headerDiv = new Element('div', {className: 'mdp_header'}).setStyle({clear:'left'});
        this._bodyDiv = new Element('div', {className: 'mdp_body'}).setStyle({clear:'left'});
        this._buttonsDiv = new Element('div', {className: 'mdp_buttons'}).setStyle({clear:'left'});
        this._footerDiv = new Element('div', {className: 'mdp_footer'}).setStyle({clear:'left'});
        this._bottomDiv = new Element('div', {className: 'mdp_bottom'}).setStyle({clear:'left'});

        this._calendarDiv.insert(this._topDiv);
        this._calendarDiv.insert(this._headerDiv);
        this._calendarDiv.insert(this._bodyDiv);
        this._calendarDiv.insert(this._buttonsDiv);
        this._calendarDiv.insert(this._footerDiv);
        this._calendarDiv.insert(this._bottomDiv);

        $(parent).insert(this._calendarDiv);

        this._initHeaderDiv();
        this._initButtonsDiv();
        this._initCalendarGrid();
        this._updateFooter("&#160;");

        this._refresh();
        this.setUseTime(this.use_time);
    },

    _initHeaderDiv : function() {
        var header_div = this._headerDiv;
        this.close_button = header_div.build('a', { innerHTML: 'x', href: '#', onclick: function () {
            this._close();
            return false;
        }.bindAsEventListener(this), className: 'close'});

        this.next_month_button = header_div.build('a', { innerHTML: '<div class="next">&nbsp;</div>', href:'#', onclick: function () {
            this.navMonth(this.date.getMonth() + 1);
            return false;
        }.bindAsEventListener(this), className: 'next' });

        this.prev_month_button = header_div.build('a', { innerHTML: '<div class="prev">&nbsp;</div>', href: '#', onclick: function () {
            this.navMonth(this.date.getMonth() - 1);
            return false;
        }.bindAsEventListener(this), className: 'prev' });

        if (this.options.get('monthYear') == 'dropdowns') {
            this.month_select = new SelectBox(header_div, $R(0, 11).map(function(m) {
                return [Date.MONTH_NAMES[m], m]
            }), {className: 'month', onchange: function () {
                this.navMonth(this.month_select.getValue())
            }.bindAsEventListener(this)});

            this.year_select = new SelectBox(header_div, [], {className: 'year', onchange: function () {
                this.navYear(this.year_select.getValue())
            }.bindAsEventListener(this)});

            this._populateYearRange();
        } else {
            this.month_year_label = header_div.build('span');
        }
    },

    _initCalendarGrid : function() {
        var body_div = this._bodyDiv;
        this.calendar_day_grid = [];
        var days_table = body_div.build('table', { cellPadding: '0px', cellSpacing: '0px', width: '100%'});
        // make the weekdays!
        var weekdays_row = days_table.build('thead').build('tr');
        Date.WEEK_DAYS.each(function(weekday) {
            weekdays_row.build("th", {innerHTML: weekday});
        });

        var days_tbody = days_table.build("tbody");
        // Make the days!
        var row_number = 0, weekday;
        for (var cell_index = 0; cell_index < 42; cell_index++) {
            weekday = (cell_index + Date.FIRST_DAY_OF_WEEK) % 7;
            //var days_row = null;
            if (cell_index % 7 == 0) days_row = days_tbody.build("tr", {className: 'row_' + row_number++});
            (this.calendar_day_grid[cell_index] = days_row.build("td", {
                calendar_date_select: this,
                onmouseover: function () {
                    this.calendar_date_select._dayHover(this);
                },
                onmouseout: function () {
                    this.calendar_date_select._dayHoverOut(this)
                },
                onclick: function() {
                    this.calendar_date_select._updateSelectedDate(this, true);
                },
                className: (weekday == 0) || (weekday == 6) ? ' weekend' : '' //clear the class
            },
            {
                cursor: 'pointer' }
            )).build("div");
        }
    },

    _initButtonsDiv : function() {
        var buttons_div = this._buttonsDiv;
        if (this.options.get('time')) {
            var blank_time = $A(this.options.get('time') == 'mixed' ? [[' - ', '']] : []);
            buttons_div.build("span", {innerHTML:"@", className: "at_sign"});

            var t = new Date();
            this.hour_select = new SelectBox(buttons_div,
                    blank_time.concat($R(0, 23).map(function(x) {
                        t.setHours(x);
                        return $A([t.getAMPMHour() + " " + t.getAMPM(),x])
                    })),
                    {
                        calendar_date_select: this,
                        onchange: function() {
                            this.calendar_date_select._updateSelectedDate({ hour: this.value });
                        },
                        className: "hour"
                    }
                );
            buttons_div.build("span", {innerHTML:":", className: "seperator"});
            var that = this;
            this.minute_select = new SelectBox(buttons_div,
                    blank_time.concat($R(0, 59).select(function(x) {
                        return (x % that.options.get('minuteInterval') == 0)
                    }).map(function(x) {
                        //return $A([ Date.padded2(x), x]);
                        return $A([x.toPaddedString(2), x]);
                    })),
                    {
                        calendar_date_select: this,
                        onchange: function() {
                            this.calendar_date_select._updateSelectedDate({minute: this.value })
                        },
                        className: "minute"
                    }
                );
        } else if (! this.options.get("buttons")) buttons_div.remove();

        if (this.options.get("buttons")) {
            buttons_div.build("span", {innerHTML: "&#160;"});
            if (this.options.get("time") == "mixed" || !this.options.get("time")) buttons_div.build("a", {
                innerHTML: _translations["Today"],
                href: "#",
                onclick: function() {
                    this.today(false);
                    return false;
                }.bindAsEventListener(this)
            });

            if (this.options.get("time") == "mixed") buttons_div.build("span", {innerHTML: "&#160;|&#160;", className:"button_separator"});

            if (this.options.get("time")) buttons_div.build("a", {
                innerHTML: _translations["Now"],
                href: "#",
                onclick: function() {
                    this.today(true);
                    return false
                }.bindAsEventListener(this)
            });

            if (!this.options.get('embedded') && !this._closeOnClick()) {
                buttons_div.build("span", {innerHTML: "&#160;|&#160;", className:"button_separator"});
                buttons_div.build("a", { innerHTML: _translations["OK"], href: "#", onclick: function() {
                    this._close();
                    return false;
                }.bindAsEventListener(this) });
            }
            if (this.options.get('clearButton')) {
                buttons_div.build("span", {innerHTML: "&#160;|&#160;", className:"button_separator"});
                buttons_div.build("a", { innerHTML: _translations["Clear"], href: "#", onclick: function() {
                    this.clearDate();
                    if (!this.options.get("embedded")) this._close();
                    return false;
                }.bindAsEventListener(this) });
            }
        }
    },

    _refresh : function () {
        this._refreshMonthYear();
        this._refreshCalendarGrid();

        this._setSelectedClass();
        this._updateFooter();
    },

    _refreshCalendarGrid : function () {
        this.beginning_date = new Date(this.date).stripTime();
        this.beginning_date.setDate(1);
        this.beginning_date.setHours(12); // Prevent daylight savings time boundaries from showing a duplicate day
        var pre_days = this.beginning_date.getDay(); // draw some days before the fact
        if (pre_days < 3) pre_days += 7;
        this.beginning_date.setDate(1 - pre_days + Date.FIRST_DAY_OF_WEEK);

        var iterator = new Date(this.beginning_date);
        var today = new Date().stripTime();
        var this_month = this.date.getMonth();
        var vdc = this.options.get("valid_date_check");

        for (var cell_index = 0; cell_index < 42; cell_index++) {
            var day = iterator.getDate();
            var month = iterator.getMonth();
            var cell = this.calendar_day_grid[cell_index];
            Element.remove(cell.childNodes[0]);
            var div = cell.build("div", {innerHTML:day});
            if (month != this_month) div.className = "other";
            cell.day = day;
            cell.month = month;
            cell.year = iterator.getFullYear();
            if (vdc) {
                if (vdc(iterator.stripTime()))
                    cell.removeClassName("disabled");
                else
                    cell.addClassName("disabled")
            }
            iterator.setDate(day + 1);
        }

        if (this.today_cell) this.today_cell.removeClassName("today");
        var days_until = this.beginning_date.stripTime().daysDistance(today);
        if ($R(0, 41).include(days_until)) {
            this.today_cell = this.calendar_day_grid[days_until];
            this.today_cell.addClassName("today");
        }
    },

    _refreshMonthYear : function() {
        var m = this.date.getMonth();
        var y = this.date.getFullYear();
        // set the month
        if (this.options.get("monthYear") == "dropdowns") {
            this.month_select.setValue(m, false);

            var e = this.year_select.element;
            if (this.flexibleYearRange() && (!(this.year_select.setValue(y, false)) || e.selectedIndex <= 1 || e.selectedIndex >= e.options.length - 2 )) this._populateYearRange();

            this.year_select.setValue(y);
        } else {
            this.month_year_label.update(Date.MONTH_NAMES[m] + " " + y.toString());
        }
    },

    _populateYearRange : function() {
        this.year_select.populate(this.yearRange().toArray());
    },

    yearRange : function() {
        if (!this.flexibleYearRange())
            return $R(this.options.get("yearRange")[0], this.options.get("yearRange")[1]);

        var y = this.date.getFullYear();
        return $R(y - this.options.get("yearRange"), y + this.options.get("yearRange"));
    },

    flexibleYearRange : function() {
        return (typeof(this.options.get("yearRange")) == "number");
    },

    validYear : function(year) {
        if (this.flexibleYearRange()) {
            return true;
        } else {
            return this.yearRange().include(year);
        }
    },

    _dayHover : function(element) {
        var hoverDate = new Date(this.selected_date);
        hoverDate.setYear(element.year);
        hoverDate.setMonth(element.month);
        hoverDate.setDate(element.day);
        this._updateFooter(hoverDate.format(this.format));
    },

    _dayHoverOut : function(element) {
        this._updateFooter();
    },

    _clearSelectedClass : function() {
        if (this.selected_cell) this.selected_cell.removeClassName("selected");
    },

    _setSelectedClass : function() {
        if (!this.selection_made) return;
        this._clearSelectedClass();
        var days_until = this.beginning_date.stripTime().daysDistance(this.selected_date.stripTime());
        if ($R(0, 42).include(days_until)) {
            this.selected_cell = this.calendar_day_grid[days_until];
            this.selected_cell.addClassName("selected");
        }
    },

    reparse : function() {
        this._parseDate();
        this._refresh();
    },

    dateString : function() {
        return (this.selection_made) ? this.selected_date.format(this.format) : "&#160;";
    },

    _parseDate : function() {
        var value = $F(this.targetElement).strip();
        this.selection_made = (value != '');
        this.date = value == '' ? NaN : Date.parseDate(this.options.get('date') || value, this.format);
        if (isNaN(this.date)) this.date = new Date();
        if (!this.validYear(this.date.getFullYear())) this.date.setYear((this.date.getFullYear() < this.yearRange().start) ? this.yearRange().start : this.yearRange().end);
        this.selected_date = new Date(this.date);
        this.use_time = /[0-9]:[0-9]{2}/.exec(value) ? true : false;
        this.date.setDate(1);
    },

    _updateFooter : function(text) {
        if (!text) text = this.dateString();
        this._footerDiv.purgeChildren();
        this._footerDiv.build("span", {innerHTML: text});
    },

    clearDate : function() {
        if ((this.targetElement.disabled || this.targetElement.readOnly) && this.options.get("popup") != "force") return false;
        var last_value = this.targetElement.value;
        this.targetElement.value = "";
        this._clearSelectedClass();
        this._updateFooter('&#160;');
        if (last_value != this.targetElement.value) this._callback("onchange");
    },

    _updateSelectedDate : function(partsOrElement, via_click) {
        var parts = $H(partsOrElement);
        if ((this.targetElement.disabled || this.targetElement.readOnly) && this.options.get("popup") != "force") return false;
        if (parts.get("day")) {
            var t_selected_date = this.selected_date, vdc = this.options.get("valid_date_check");
            for (var x = 0; x <= 3; x++) t_selected_date.setDate(parts.get("day"));
            t_selected_date.setYear(parts.get("year"));
            t_selected_date.setMonth(parts.get("month"));

            if (vdc && ! vdc(t_selected_date.stripTime())) {
                return false;
            }
            this.selected_date = t_selected_date;
            this.selection_made = true;
        }

        if (!isNaN(parts.get("hour"))) this.selected_date.setHours(parts.get("hour"));
        if (!isNaN(parts.get("minute"))) this.selected_date.setMinutes(Utilities.floorToInterval(parts.get("minute"), this.options.get("minuteInterval")));
        if (parts.get("hour") === "" || parts.get("minute") === "")
            this.setUseTime(false);
        else if (!isNaN(parts.get("hour")) || !isNaN(parts.get("minute")))
            this.setUseTime(true);

        this._updateFooter();
        this._setSelectedClass();

        if (this.selection_made) this.updateValue();
        if (this._closeOnClick()) {
            this._close();
        }
        if (via_click && !this.options.get("embedded")) {
            if ((new Date() - this.last_click_at) < 333) this._close();
            this.last_click_at = new Date();
        }
    },

    _closeOnClick : function() {
        if (this.options.get("embedded")) return false;
        if (this.options.get("close_on_click") === null)
            return (this.options.get("time")) ? false : true;
        else
            return (this.options.get("close_on_click"))
    },

    navMonth : function(month) {
        var targetDate = new Date(this.date);
        targetDate.setMonth(month);
        return (this.navTo(targetDate));
    },

    navYear : function(year) {
        var targetDate = new Date(this.date);
        targetDate.setYear(year);
        return (this.navTo(targetDate));
    },

    navTo : function(date) {
        if (!this.validYear(date.getFullYear())) return false;
        this.date = date;
        this.date.setDate(1);
        this._refresh();
        this._callback("after_navigate", this.date);
        return true;
    },

    setUseTime : function(turn_on) {
        this.use_time = this.options.get("time") && (this.options.get("time") == "mixed" ? turn_on : true); // force use_time to true if time==true && time!="mixed"
        if (this.use_time && this.selected_date) { // only set hour/minute if a date is already selected
            var minute = Utilities.floorToInterval(this.selected_date.getMinutes(), this.options.get('minuteInterval'));
            var hour = this.selected_date.getHours();

            this.hour_select.setValue(hour);
            this.minute_select.setValue(minute);
        } else if (this.options.get("time") == "mixed") {
            this.hour_select.setValue("");
            this.minute_select.setValue("");
        }
    },

    updateValue : function() {
        var last_value = this.targetElement.value;
        this.targetElement.value = this.dateString();
        if (last_value != this.targetElement.value) this._callback("onchange");
    },

    today : function(now) {
        var d = new Date();
        this.date = new Date();
        var o = $H({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), hour: d.getHours(), minute: d.getMinutes()});
        if (!now) o = o.merge({hour: '', minute: ''});
        this._updateSelectedDate(o, true);
        this._refresh();
    },

    _close : function() {
        if (this.closed) return false;
        this._callback('before_close');
        this.targetElement.calendar_date_select = null;
        Event.stopObserving(document, 'mousedown', this._closeIfClickedOut_handler);
        Event.stopObserving(document, 'keypress', this._keyPress_handler);
        this._calendarDiv.remove();
        this.closed = true;
        if (this.iframe) this.iframe.remove();
        if (this.targetElement.type != 'hidden' && ! this.targetElement.disabled) this.targetElement.focus();
        this._callback('after_close');
    },

    _closeIfClickedOut : function(e) {
        if (!$(Event.element(e)).descendantOf(this._calendarDiv)) this._close();
    },

    _keyPress : function(e) {
        if (e.keyCode == Event.KEY_ESC) this._close();
    },

    _callback : function(name, param) {
        if (this.options.get(name)) {
            this.options.get(name).bind(this.targetElement)(param);
        }
    }
};
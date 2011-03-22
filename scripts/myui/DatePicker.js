var _translations = {
    'OK' : 'OK',
    'Now' :  'Now',
    'Today' : 'Today',
    'Clear' : 'Clear'
};

MY.DatePicker = Class.create({
    initialize: function(targetElement, options) {
        this._mdpId = $$('.myDatePicker').length + 1;
        this.targetElement = $(targetElement); // make sure it's an element, not a string
        if (!this.targetElement) {
            alert('Target element ' + targetElement + ' not found!');
            return false;
        }
        if (this.targetElement.tagName != 'INPUT') this.targetElement = this.targetElement.down('INPUT');

        this.targetElement.datePicker = this;
        this.lastClickAt = 0;
        this.visibleFlg = false;
        // initialize the date control
        this.options = $H({
            embedded: false,
            format: 'MM/dd/yyyy',
            popup: null,
            time: false,
            buttons: true,
            clearButton: true,
            yearRange: 10,
            closeOnClick: null,
            minuteInterval: 5,
            popupBy: this.targetElement,
            monthYear: 'dropdowns',
            onchange: this.targetElement.onchange,
            validate: null
        }).merge(options || {});

        this.use_time = this.options.get('time');
        this.format = this.options.get('format');
        if (!this.options.get('embedded')) {
            if (Prototype.Browser.Gecko || Prototype.Browser.Opera )
                this.targetElement.on('keypress', this._keyPress.bindAsEventListener(this));
            else
                this.targetElement.on('keydown', this._keyPress.bindAsEventListener(this));
        }
    },

    show : function() {
        this._parseDate();
        this._callback('beforeShow');
        this._initCalendarDiv();
        if (!this.options.get('embedded')) {
            this._positionCalendarDiv();
            // set the click handler to check if a user has clicked away from the document
            this._closeIfClickedOutHandler = $(document).on('click', this._closeIfClickedOut.bindAsEventListener(this));
        }
        this._callback('afterShow');
        this.visibleFlg = true;
    },

    getId : function() {
        return this._mdpId;
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
        var left_px = e_left.toString() + 'px';
        var top_px = (above ? (e_top - c_height ) : ( e_top + e_height )).toString() + 'px';

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
        if (this.options.get('embedded')) {
            parent = this.targetElement.parentNode;
            style = {};
        } else {
            parent = document.body;
            style = { position:'absolute', visibility: 'hidden', left:0, top:0 };
        }
        this._calendarDiv = new Element('div', {className: 'myDatePicker'}).setStyle(style);
        // create the divs
        this._topDiv = new Element('div', {className: 'mdpTop'}).setStyle({clear:'left'});
        this._headerDiv = new Element('div', {className: 'mdpHeader'}).setStyle({clear:'left'});
        this._bodyDiv = new Element('div', {className: 'mdpBody'}).setStyle({clear:'left'});
        this._buttonsDiv = new Element('div', {className: 'mdpButtons'}).setStyle({clear:'left'});
        this._footerDiv = new Element('div', {className: 'mdpFooter'}).setStyle({clear:'left'});
        this._bottomDiv = new Element('div', {className: 'mdpBottom'}).setStyle({clear:'left'});

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
        this._updateFooter('&#160;');

        this._refresh();
        this.setUseTime(this.use_time);
        this._applyKeyboardBehavior();
    },

    _initHeaderDiv : function() {
        var headerDiv = this._headerDiv;
        this.next_month_button = headerDiv.build('a', {innerHTML: '<div class="next">&nbsp;</div>', href:'#', onclick: function () {
            this.navMonth(this.date.getMonth() + 1);
            return false;
        }.bindAsEventListener(this), className: 'next'});

        this.prev_month_button = headerDiv.build('a', {innerHTML: '<div class="prev">&nbsp;</div>', href: '#', onclick: function () {
            this.navMonth(this.date.getMonth() - 1);
            return false;
        }.bindAsEventListener(this), className: 'prev'});

        if (this.options.get('monthYear') == 'dropdowns') {
            this.monthSelect = new SelectBox(headerDiv, $R(0, 11).map(function(m) {
                return [Date.MONTH_NAMES[m], m]
            }),
            {
                className: 'month',
                onchange: function () {
                    this.navMonth(this.monthSelect.getValue())
                }.bindAsEventListener(this)
            });

            this.yearSelect = new SelectBox(headerDiv, [], {
                className: 'year',
                onchange: function () {
                    this.navYear(this.yearSelect.getValue())
                }.bindAsEventListener(this)
            });
            this._populateYearRange();
        } else {
            this.monthYearLabel = headerDiv.build('span');
        }
    },

    _initCalendarGrid : function() {
        var bodyDiv = this._bodyDiv;
        this._calendarDayGrid = [];
        this.daysTable = bodyDiv.build('table', {cellPadding: '0px', cellSpacing: '0px', width: '100%'});
        // make the weekdays!
        var weekdays_row = this.daysTable.build('thead').build('tr');
        Date.WEEK_DAYS.each(function(weekday) {
            weekdays_row.build('th', {innerHTML: weekday});
        });

        var daysTbody = this.daysTable.build('tbody');
        // Make the days!
        var rowNumber = 0, weekday;
        for (var cellIndex = 0; cellIndex < 42; cellIndex++) {
            weekday = (cellIndex + Date.FIRST_DAY_OF_WEEK) % 7;
            //var days_row = null;
            if (cellIndex % 7 == 0) days_row = daysTbody.build('tr', {className: 'row_' + rowNumber++});
            (this._calendarDayGrid[cellIndex] = days_row.build('td', {
                id: 'mdpC'+this._mdpId+'_'+weekday+','+(rowNumber-1),
                datePicker: this,
                className: (weekday == 0) || (weekday == 6) ? 'day weekend' : 'day' //clear the class
            },
            {
                cursor: 'pointer' }
            )).build('div');
        }
    },

    _initButtonsDiv : function() {
        var buttons_div = this._buttonsDiv;
        if (this.options.get('time')) {
            var blank_time = $A(this.options.get('time') == 'mixed' ? [[' - ', '']] : []);
            buttons_div.build('span', {innerHTML:'@', className: 'at_sign'});

            var t = new Date();
            this.hour_select = new SelectBox(buttons_div,
                    blank_time.concat($R(0, 23).map(function(x) {
                        t.setHours(x);
                        return $A([t.getAMPMHour() + ' ' + t.getAMPM(),x])
                    })),
                    {
                        datePicker: this,
                        onchange: function() {
                            this.datePicker._updateSelectedDate({ hour: this.value });
                        },
                        className: 'hour'
                    }
                );
            buttons_div.build('span', {innerHTML:':', className: 'seperator'});
            var that = this;
            this.minute_select = new SelectBox(buttons_div,
                    blank_time.concat($R(0, 59).select(function(x) {
                        return (x % that.options.get('minuteInterval') == 0)
                    }).map(function(x) {
                        //return $A([ Date.padded2(x), x]);
                        return $A([x.toPaddedString(2), x]);
                    })),
                    {
                        datePicker: this,
                        onchange: function() {
                            this.datePicker._updateSelectedDate({minute: this.value })
                        },
                        className: 'minute'
                    }
                );
        } else if (! this.options.get('buttons')) buttons_div.remove();

        if (this.options.get('buttons')) {
            buttons_div.build('span', {innerHTML: '&#160;'});
            if (this.options.get('time') == 'mixed' || !this.options.get('time')) buttons_div.build('a', {
                innerHTML: _translations['Today'],
                href: '#',
                onclick: function() {
                    this.today(false);
                    return false;
                }.bindAsEventListener(this)
            });

            if (this.options.get('time') == 'mixed') buttons_div.build('span', {innerHTML: '&#160;|&#160;', className: 'button_separator'});

            if (this.options.get('time')) buttons_div.build('a', {
                innerHTML: _translations['Now'],
                href: '#',
                onclick: function() {
                    this.today(true);
                    return false
                }.bindAsEventListener(this)
            });

            if (!this.options.get('embedded') && !this._closeOnClick()) {
                buttons_div.build('span', {innerHTML: '&#160;|&#160;', className: 'button_separator'});
                buttons_div.build('a', {innerHTML: _translations['OK'], href: '#', onclick: function() {
                    this._close();
                    return false;
                }.bindAsEventListener(this) });
            }
            if (this.options.get('clearButton')) {
                buttons_div.build('span', {innerHTML: '&#160;|&#160;', className: 'button_separator'});
                buttons_div.build('a', {innerHTML: _translations['Clear'], href: '#', onclick: function() {
                    this.clearDate();
                    if (!this.options.get('embedded')) this._close();
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
        this.beginningDate = new Date(this.date).stripTime();
        this.beginningDate.setDate(1);
        this.beginningDate.setHours(12); // Prevent daylight savings time boundaries from showing a duplicate day
        var pre_days = this.beginningDate.getDay(); // draw some days before the fact
        if (pre_days < 3) pre_days += 7;
        this.beginningDate.setDate(1 - pre_days + Date.FIRST_DAY_OF_WEEK);

        var iterator = new Date(this.beginningDate);
        var today = new Date().stripTime();
        var this_month = this.date.getMonth();
        var vdc = this.options.get('validate');

        for (var cellIndex = 0; cellIndex < 42; cellIndex++) {
            var day = iterator.getDate();
            var month = iterator.getMonth();
            var cell = this._calendarDayGrid[cellIndex];
            Element.remove(cell.childNodes[0]);
            var div = cell.build('div', {innerHTML:day});
            if (month != this_month) div.className = 'other';
            cell.day = day;
            cell.month = month;
            cell.year = iterator.getFullYear();
            if (vdc) {
                if (vdc(iterator.stripTime()))
                    cell.removeClassName('disabled');
                else
                    cell.addClassName('disabled')
            }
            iterator.setDate(day + 1);
        }

        if (this.today_cell) this.today_cell.removeClassName('today');
        var daysUntil = this.beginningDate.stripTime().daysDistance(today);
        if ($R(0, 41).include(daysUntil)) {
            this.today_cell = this._calendarDayGrid[daysUntil];
            this.today_cell.addClassName('today');
        }
    },

    _refreshMonthYear : function() {
        var m = this.date.getMonth();
        var y = this.date.getFullYear();
        // set the month
        if (this.options.get('monthYear') == 'dropdowns') {
            this.monthSelect.setValue(m, false);

            var e = this.yearSelect.element;
            if (this.flexibleYearRange() && (!(this.yearSelect.setValue(y, false)) || e.selectedIndex <= 1 || e.selectedIndex >= e.options.length - 2 )) this._populateYearRange();

            this.yearSelect.setValue(y);
        } else {
            this.monthYearLabel.update(Date.MONTH_NAMES[m] + ' ' + y.toString());
        }
    },

    _populateYearRange : function() {
        this.yearSelect.populate(this.yearRange().toArray());
    },

    yearRange : function() {
        if (!this.flexibleYearRange())
            return $R(this.options.get('yearRange')[0], this.options.get('yearRange')[1]);

        var y = this.date.getFullYear();
        return $R(y - this.options.get('yearRange'), y + this.options.get('yearRange'));
    },

    flexibleYearRange : function() {
        return (typeof(this.options.get('yearRange')) == 'number');
    },

    validYear : function(year) {
        if (this.flexibleYearRange()) {
            return true;
        } else {
            return this.yearRange().include(year);
        }
    },

    _dayHover : function(element) {
        element.addClassName('focus');
        var hoverDate = new Date(this.selectedDate);
        hoverDate.setYear(element.year);
        hoverDate.setMonth(element.month);
        hoverDate.setDate(element.day);
        this._updateFooter(hoverDate.format(this.format));
        this.keys.setFocus(element, false);
    },

    _dayHoverOut : function(element) {
        element.removeClassName('focus');
        this._updateFooter();
    },

    _clearSelectedClass : function() {
        if (this.selectedCell) this.selectedCell.removeClassName('selected');
    },

    _setSelectedClass : function() {
        if (!this.selectionMade) return;
        this._clearSelectedClass();
        var daysUntil = this.beginningDate.stripTime().daysDistance(this.selectedDate.stripTime());
        if ($R(0, 42).include(daysUntil)) {
            this.selectedCell = this._calendarDayGrid[daysUntil];
            this.selectedCell.addClassName('selected');
        }
    },

    reparse : function() {
        this._parseDate();
        this._refresh();
    },

    dateString : function() {
        return (this.selectionMade) ? this.selectedDate.format(this.format) : '&#160;';
    },

    _parseDate : function() {
        var value = $F(this.targetElement).strip();
        this.selectionMade = (value != '');
        this.date = value == '' ? NaN : Date.parseString(this.options.get('date') || value, this.format);
        if (isNaN(this.date)) this.date = new Date();
        if (!this.validYear(this.date.getFullYear())) this.date.setYear((this.date.getFullYear() < this.yearRange().start) ? this.yearRange().start : this.yearRange().end);
        this.selectedDate = this.date;
        this.use_time = /[0-9]:[0-9]{2}/.exec(value) ? true : false;
        //this.date.setDate(1);
    },

    _updateFooter : function(text) {
        if (!text) text = this.dateString();
        this._footerDiv.purgeChildren();
        this._footerDiv.build('span', {innerHTML: text});
    },

    clearDate : function() {
        if ((this.targetElement.disabled || this.targetElement.readOnly) && this.options.get('popup') != 'force') return false;
        var lastValue = this.targetElement.value;
        this.targetElement.value = '';
        this._clearSelectedClass();
        this._updateFooter('&#160;');
        if (lastValue != this.targetElement.value) this._callback('onchange');
    },

    _updateSelectedDate : function(partsOrElement, via_click) {
        var parts = $H(partsOrElement);
        if ((this.targetElement.disabled || this.targetElement.readOnly) && this.options.get('popup') != 'force') return false;
        if (parts.get('day')) {
            var selectedDate = this.selectedDate, vdc = this.options.get('validate');
            for (var x = 0; x <= 3; x++) selectedDate.setDate(parts.get('day'));
            selectedDate.setYear(parts.get('year'));
            selectedDate.setMonth(parts.get('month'));

            if (vdc && ! vdc(selectedDate.stripTime())) {
                return false;
            }
            this.selectedDate = selectedDate;
            this.selectionMade = true;
        }

        if (!isNaN(parts.get('hour'))) this.selectedDate.setHours(parts.get('hour'));
        if (!isNaN(parts.get('minute'))) this.selectedDate.setMinutes(Utilities.floorToInterval(parts.get('minute'), this.options.get('minuteInterval')));
        if (parts.get('hour') === '' || parts.get('minute') === '')
            this.setUseTime(false);
        else if (!isNaN(parts.get('hour')) || !isNaN(parts.get('minute')))
            this.setUseTime(true);

        this._updateFooter();
        this._setSelectedClass();

        if (this.selectionMade) this.updateValue();
        if (this._closeOnClick()) {
            this._close();
        }
        if (via_click && !this.options.get('embedded')) {
            if ((new Date() - this.lastClickAt) < 333) this._close();
            this.lastClickAt = new Date();
        }
    },

    _closeOnClick : function() {
        if (this.options.get('embedded')) return false;
        if (this.options.get('closeOnClick') === null)
            return (this.options.get('time')) ? false : true;
        else
            return (this.options.get('closeOnClick'))
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
        this._callback('after_navigate', this.date);
        return true;
    },

    setUseTime : function(turnOnFlg) {
        this.use_time = this.options.get('time') && (this.options.get('time') == 'mixed' ? turnOnFlg : true); // force use_time to true if time==true && time!='mixed'
        if (this.use_time && this.selectedDate) { // only set hour/minute if a date is already selected
            var minute = Utilities.floorToInterval(this.selectedDate.getMinutes(), this.options.get('minuteInterval'));
            var hour = this.selectedDate.getHours();

            this.hour_select.setValue(hour);
            this.minute_select.setValue(minute);
        } else if (this.options.get('time') == 'mixed') {
            this.hour_select.setValue('');
            this.minute_select.setValue('');
        }
    },

    updateValue : function() {
        var last_value = this.targetElement.value;
        this.targetElement.value = this.dateString();
        if (last_value != this.targetElement.value) this._callback('onchange');
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
        if (!this.visibleFlg) return false;
        this._callback('beforeClose');
        this._closeIfClickedOutHandler.stop();
        this._calendarDiv.remove();
        this.keys.stop();
        this.keys = null;
        this.visibleFlg = false;
        if (this.iframe) this.iframe.remove();
        if (this.targetElement.type != 'hidden' && ! this.targetElement.disabled) this.targetElement.focus();
        this._callback('afterClose');
    },

    _closeIfClickedOut : function(e) {
        if (!$(Event.element(e)).descendantOf(this._calendarDiv)) this._close();
    },

    _keyPress : function(event) {
        if (event.keyCode == Event.KEY_DOWN && !this.visibleFlg) {
            this.show();
            event.stop();
        } else if (event.keyCode == Event.KEY_ESC && this.visibleFlg) {
            this._close();
            event.stop();
        }
    },

    _callback : function(name, param) {
        if (this.options.get(name)) {
            this.options.get(name).bind(this.targetElement)(param);
        }
    },

    _applyKeyboardBehavior : function() {
        var self = this;
        this.keys = new KeyTable(this.daysTable, {idPrefix : 'mdpC'+this._mdpId+'_'});
        for (var i = 0; i < this._calendarDayGrid.length; i++) {
            var element = this._calendarDayGrid[i];
            (function(element) {
                element.on('mouseover', function () {
                    self._dayHover(this);
                });

                element.on('mouseout', function () {
                    self._dayHoverOut(this)
                });

                element.on('click', function() {
                    self.keys.setFocus(element, false);
                    self.keys.captureKeys();
                    self.keys.eventFire('focus', element);
                    self._updateSelectedDate(this, true);
                });

                self.keys.event.remove.focus(element);
                var f_focus = (function(element) {
                    return function() {
                        self._calendarDayGrid.each(function(td) {
                            td.removeClassName('focus');
                        });
                        self._dayHover(element);
                    };
                })(element);
                self.keys.event.focus(element, f_focus);

                self.keys.event.remove.action(element);
                var f_action = (function(element) {
                    return function() {
                        self._updateSelectedDate(element, true);
                    };
                })(element);
                self.keys.event.action(element, f_action);
            })(element);
        }

        var selectedCell = this.selectedCell || $('mdpC'+this._mdpId+'_0,0');
        this.keys.setFocus(selectedCell, false);
        this.keys.captureKeys();
        this.keys.eventFire('focus', selectedCell);
    }
});
/**
 * MYUI, version 1.0
 *
 * Dual licensed under the MIT and GPL licenses.
 *
 * Copyright 2009 Pablo Aravena, all rights reserved.
 * http://pabloaravena.info
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
MY.DatePicker = Class.create(MY.TextField, {
    initialize: function(options) {
        this.baseInitialize(options);
        this._mdpId = $$('.my-datepicker').length + 1;
        this.targetElement = $(options.input); // make sure it's an element, not a string
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
            changeMonth: false,
            changeYear: false,
            showWeek: false,
            numberOfMonths : 1,
            selectOtherMonth : false,
            validate: null
        }).merge(options || {}).toObject();
        this.useTimeFlg = this.options.time == 'mixed';
        this.format = this.options.format;
        if (this.useTimeFlg)
            this.format += ' hh:mm';
        if (this.targetElement) this.render(this.targetElement);
    },

    render : function($super, input) {
        $super(input);
        this.targetElement = $(input);
        if (this.targetElement.tagName != 'INPUT') this.targetElement = this.targetElement.down('INPUT');
        this.options.popupBy = this.targetElement;
        this.options.onchange = this.targetElement.onchange;
        if (!this.options.embedded) {
            this.targetElement.observe('keydown', this._keyPress.bindAsEventListener(this));
        }
        this.decorate(this.targetElement);
    },

    decorate : function(element) {
        var self = this;
        var width = element.getDimensions().width;
        var height = element.getDimensions().height;
        Element.wrap(element, 'div'); // date picker container
        element.setStyle({width : (width - 29)+'px'});
        this.container = element.up();
        this.container.addClassName('my-datepicker-container');
        this.container.id = this.id + '_container';
        this.container.setStyle({width : width + 'px', height: height + 'px'});
        var datePickerSelectBtn = new Element('div');
        datePickerSelectBtn.addClassName('my-datepicker-select-button');
        this.container.insert(datePickerSelectBtn);
        datePickerSelectBtn.observe('click', function(event) {
            self.show();
            event.stop();
        });
    },

    show : function() {
        if (this.visibleFlg) return;
        this._parseDate();
        this._callback('beforeShow');
        this._initCalendarDiv();
        if (!this.options.embedded) {
            this._positionCalendarDiv();
            // set the click handler to check if a user has clicked away from the document
            this._closeIfClickedOutHandler = this._closeIfClickedOut.bindAsEventListener(this);
            $(document).observe('click', this._closeIfClickedOutHandler);
        }
        this._callback('afterShow');
        this.visibleFlg = true;
    },

    getId : function() {
        return this._mdpId;
    },

    _initCalendarDiv : function() {
        var idx = 0;
        var html = [];
        var parent = null;
        var style = '';
        if (this.options.embedded) {
            parent = this.targetElement.parentNode;
        } else {
            parent = document.body;
            style = 'position: absolute; visibility: hidden; left:0; top:0';
        }

        html[idx++] = '<div id="my-datepicker-div'+this._mdpId+'" class="my-datepicker shadow all-round-corners" style="'+style+'">';
        html[idx++] = '    <div class="my-datepicker-top" style="clear:left"></div>';
        html[idx++] = '    <div class="my-datepicker-header all-round-corners" style="clear:left"></div>';
        html[idx++] = '    <div class="my-datepicker-body" style="clear:left"></div>';
        html[idx++] = '    <div class="my-datepicker-footer all-round-corners" style="clear:left"></div>';
        html[idx++] = '</div>';

        $(parent).insert(html.join(''));
        this._calendarDiv = $('my-datepicker-div'+this._mdpId);
        this._headerDiv = this._calendarDiv.down('.my-datepicker-header');
        this._bodyDiv = this._calendarDiv.down('.my-datepicker-body');
        this._footerDiv = this._calendarDiv.down('.my-datepicker-footer');

        this._initHeaderDiv();
        this._initHeaderDivBehavior();
        this._initButtonsDiv();
        this._initButtonDivBehavior();
        this._initCalendarGrid();
        this._updateHeader('&#160;');
        this._refresh();
        this.setUseTime(this.useTimeFlg);
        this._applyKeyboardBehavior();
    },

    _positionCalendarDiv : function() {
        var above = false;
        var c_dim = this._calendarDiv.getDimensions();
        var c_height = c_dim.height;
        //var c_width = c_dim.width;
        var w_top = document.viewport.getScrollOffsets().top;
        var w_height = document.viewport.getHeight();
        var e_dim = $(this.options.popupBy).cumulativeOffset();
        var e_top = e_dim.top;
        if (this.tableGrid)
            e_top = e_top - this.tableGrid.bodyDiv.scrollTop;
        var e_left = e_dim.left;
        if (this.tableGrid)
            e_left = e_left - this.tableGrid.bodyDiv.scrollLeft;
        var e_height = $(this.options.popupBy).getDimensions().height;
        var e_bottom = e_top + e_height;

        if ((( e_bottom + c_height ) > (w_top + w_height)) && ( e_bottom - c_height > w_top )) above = true;
        var left_px = e_left.toString() + 'px';
        var top_px = (above ? (e_top - c_height - 2) : ( e_top + e_height + 2)).toString() + 'px';

        this._calendarDiv.style.left = left_px;
        this._calendarDiv.style.top = top_px;
        this._calendarDiv.setStyle({visibility: ''});
    },

    _initHeaderDiv : function() {
        var headerDiv = this._headerDiv;
        var id = this._mdpId;
        var numberOfMonths = this.options.numberOfMonths;
        if (numberOfMonths > 1) {
            this.options.changeMonth = false;
            this.options.changeYear = false;
        }
        var idx = 0, html = [];
        html[idx++] = '<a href="#" class="toolbar-button prev"><span class="icon" style="margin: 1px 0">&nbsp;</span></a>';
        html[idx++] = '<a href="#" class="toolbar-button next"><span class="icon" style="margin: 1px 0">&nbsp;</span></a>';
        html[idx++] = '<span id="mdpSelectedDate_'+id+'" class="selected-date"></span>';
        headerDiv.insert(html.join(''));
    },

    _initHeaderDivBehavior : function() {
        var headerDiv = this._headerDiv;
        var nextMonthButton = headerDiv.down('.next');
        var prevMonthButton = headerDiv.down('.prev');

        nextMonthButton.observe('click', function() {
            this._navMonth(this.date.getMonth() + 1);
        }.bindAsEventListener(this));

        prevMonthButton.observe('click', function() {
            this._navMonth(this.date.getMonth() - 1);
        }.bindAsEventListener(this));

        this.monthSelect = headerDiv.down('.month');
        if (this.monthSelect) {
            this.monthSelect.observe('change', function() {
                this._navMonth($F(this.monthSelect));
            }.bindAsEventListener(this));
        }

        this.yearSelect = headerDiv.down('.year');
        if (this.yearSelect) {
            this.monthSelect.observe('change', function() {
                this._navYear($F(this.yearSelect));
            }.bindAsEventListener(this));
        }
    },

    _initCalendarGrid : function() {
        var bodyDiv = this._bodyDiv;
        var numberOfMonths = this.options.numberOfMonths;
        var showWeek = this.options.showWeek;
        this._calendarDayGrid = [];
        var idx = 0, html = [], i = 0;
        html[idx++] = '<table border="0" cellpadding="0" cellspacing="0" width="100%">';
        html[idx++] = '<thead>';
        html[idx++] = '<tr>';
        for (i = 1; i <= numberOfMonths; i++) {
            html[idx++] = '<th colspan="'+(showWeek ? '8' : '7')+'">';
            if (this.options.changeMonth) {
                html[idx++] = '<select class="month">';
                $R(0, 11).each(function(month) {
                    html[idx++] =  '<option value="'+month+'">'+Date.MONTH_NAMES[month]+'</option>';
                }),
                html[idx++] = '</select>';
            } else {
                html[idx++] = '<span id="mdpMonthLabel_'+i+'" class="my-datepicker-month-label">';
                html[idx++] = '</span>';
            }

            if (this.options.changeYear) {
                html[idx++] = '<select class="year">';
                this.yearRange().each(function(year){
                    html[idx++] = '<option value="'+year+'">'+year+'</option>';
                });
                html[idx++] = '</select>';
            } else {
                html[idx++] = '&nbsp;';
                html[idx++] = '<span id="mdpYearLabel_'+i+'" class="my-datepicker-year-label">';
                html[idx++] = '</span>';
            }
            html[idx++] = '</th>';
        }
        html[idx++] = '</tr>';
        html[idx++] = '<tr>';
        for (i = 0; i < numberOfMonths; i++) {
            if (showWeek) {
                if (i > 0) {
                    html[idx++] = '<th class="new-month-separator">Week</th>'; // TODO hard coded
                } else {
                    html[idx++] = '<th>Week</th>'; // TODO hard coded
                }
            }
            Date.WEEK_DAYS.each(function(weekday, index) {
                if (i > 0 && index % 7 == 0 && !showWeek) {
                    html[idx++] = '<th class="new-month-separator">'+weekday+'</th>';
                } else {
                    html[idx++] = '<th>'+weekday+'</th>';
                }
            });
        }
        html[idx++] = '</tr>';
        html[idx++] = '</thead>';
        html[idx++] = '<tbody>';
        for (i = 0; i < 6; i++) {
            html[idx++] = '<tr class="row_' + i + '">';
            for (var j = 0; j < 7 * numberOfMonths; j++) {
                if (showWeek && j % 7 == 0) {
                    if (j > 0) {
                        html[idx++] = '<td class="week-number new-month-separator"><div></div></td>';
                    } else {
                        html[idx++] = '<td class="week-number"><div></div></td>';
                    }
                }
                var className = 'day';
                if ((j % 7 == 0) || ((j + 1) % 7 == 0)) className += ' weekend';
                if (j > 0 && j % 7 == 0 && !showWeek) className += ' new-month-separator';
                html[idx++] = '<td id="mdpC'+this._mdpId+'_'+j+','+i+'" class="'+className+'"><div></div></td>';
            }
            html[idx++] = '</tr>';
        }
        html[idx++] = '</tbody>';
        html[idx++] = '</table>';
        bodyDiv.insert(html.join(''));
        this.daysTable = bodyDiv.down('table');
        this._calendarDayGrid = this.daysTable.select('.day');
    },

    _initButtonsDiv : function() {
        var footerDiv = this._footerDiv;
        var idx = 0, html = [];
        if (this.options.time) {
            var timeItems = $A(this.options.time == 'mixed' ? [[' - ', '']] : []);
            var currentTime = new Date();
            var self = this;
            html[idx++] = '<select class="hour">';
            timeItems.concat($R(0, 23).map(function(hour) {
                    currentTime.setHours(hour);
                    return $A([currentTime.getAMPMHour() + ' ' + currentTime.getAMPM(), hour])
                })).each(function(hour) {
                    html[idx++] = '<option value="'+hour[1]+'">'+hour[0]+'</option>';
                });
            html[idx++] = '</select>';
            html[idx++] = '<span class="separator">&nbsp;:&nbsp;</span>';
            html[idx++] = '<select class="minute">';
            timeItems.concat($R(0, 59).select(function(min) {
                    return (min % self.options.minuteInterval == 0)
                }).map(function(x) {
                    return $A([x.toPaddedString(2), x]);
                })).each(function(min) {
                    html[idx++] = '<option value="'+min[1]+'">'+min[0]+'</option>';
                });
            html[idx++] = '</select>';
        } else if (!this.options.buttons) {
            footerDiv.remove(); //TODO review this condition
        }

        if (this.options.buttons) {
            html[idx++] = '<span class="buttons-container">';
            if (this.options.time == 'mixed' || !this.options.time) {
                html[idx++] = '<a href="#" class="toolbar-button today-button"><span class="text">'+i18n.getMessage('label.today')+'</span></a>';
            }

            if (this.options.time) {
                html[idx++] = '<a href="#" class="toolbar-button now-button"><span class="text">'+i18n.getMessage('label.now')+'</span></a>';
            }

            if (!this.options.embedded && !this._closeOnClick()) {
                html[idx++] = '<a href="#" class="toolbar-button close-button"><span class="text">'+i18n.getMessage('label.ok')+'</span></a>';
            }

            if (this.options.clearButton) {
                html[idx++] = '<a href="#" class="toolbar-button clear-button"><span class="text">'+i18n.getMessage('label.clear')+'</span></a>';
            }
            html[idx++] = '</span>';
        }
        footerDiv.insert(html.join(''));
    },

    _initButtonDivBehavior : function() {
        var footerDiv = this._footerDiv;
        this.hourSelect = footerDiv.down('.hour');
        this.minuteSelect = footerDiv.down('.minute');

        if (this.hourSelect) {
            this.hourSelect.observe('change', function() {
                this._updateSelectedDate({hour: $F(this.hourSelect)});
            }.bindAsEventListener(this));
        }

        if (this.minuteSelect) {
            this.minuteSelect.observe('change', function() {
               this._updateSelectedDate({minute: $F(this.minuteSelect)});
            }.bindAsEventListener(this));
        }

        var todayButton = footerDiv.down('.today-button');
        if (todayButton) {
            todayButton.observe('click', function() {
                this.today(false);
            }.bindAsEventListener(this));
        }

        var nowButton = footerDiv.down('.now-button');
        if (nowButton) {
            nowButton.observe('click', function() {
                this.today(true);
            }.bindAsEventListener(this));
        }

        var closeButton = footerDiv.down('.close-button');
        if (closeButton) {
            closeButton.observe('click', function() {
                this._close();
            }.bindAsEventListener(this));
        }

        var clearButton = footerDiv.down('.clear-button');
        if (clearButton) {
            clearButton.observe('click', function() {
                this.clearDate();
                if (!this.options.embedded) this._close();
            }.bindAsEventListener(this));
        }
    },

    _refresh : function () {
        this._refreshMonthYear();
        this._refreshCalendarGrid();
        this._setSelectedClass();
        this._updateHeader();
    },

    _refreshCalendarGrid : function () {
        var numberOfMonths = this.options.numberOfMonths;
        var showWeek = this.options.showWeek;
        var selectOtherMonth = this.options.selectOtherMonth;
        var beginningDate = this.date.stripTime();
        var beginningMonth = this.date.getMonth();
        var beginningYear = this.date.getFullYear();
        var today = new Date().stripTime();
        var self = this;
        if (this.todayCell) this.todayCell.removeClassName('today');
        $R(1, numberOfMonths).each(function(m) {
            beginningDate = new Date(beginningYear, beginningMonth, 1);
            beginningDate.setHours(12); // Prevent daylight savings time boundaries from showing a duplicate day
            var preDays = beginningDate.getDay(); // draw some days before the fact
            beginningDate.setDate(1 - preDays + Date.FIRST_DAY_OF_WEEK);
            var setTodayFlg = false;
            var daysUntil = beginningDate.daysDistance(today);
            if ($R(0, 41).include(daysUntil) && !setTodayFlg && today.getMonth() == beginningMonth) {
                self.todayCell = self._getCellByIndex(daysUntil, m).addClassName('today');
                setTodayFlg = true;
            }
            for (var i = 0; i < 42; i++) {
                var day = beginningDate.getDate();
                var month = beginningDate.getMonth();
                var cell = self._getCellByIndex(i, m);
                var updateFlg = true;
                var weekCell = null;
                if (i % 7 == 0 && showWeek && (month == beginningMonth || i == 0)) {
                    weekCell = cell.previousSiblings()[0];
                    weekCell.down().update(beginningDate.getWeek());
                } else {
                    weekCell = cell.previousSiblings()[0];
                    if (weekCell) weekCell.removeClassName('week-number');
                }
                var div = cell.down(); // div element
                if (month != beginningMonth) {
                    div.addClassName('other');
                    if (!selectOtherMonth) updateFlg = false;
                } else {
                    div.removeClassName('other');
                }
                if (updateFlg) {
                    div.update(day);
                    cell.day = day;
                    cell.month = month;
                    cell.year = beginningDate.getFullYear();
                } else {
                    cell.removeClassName('day');
                    cell.removeClassName('weekend');
                    cell.removeAttribute('id');
                }
                beginningDate.setDate(day + 1);
            }
            if ((beginningMonth + 1) > 11) {
                beginningMonth = 0;
                beginningYear++;
            } else {
                beginningMonth++;
            }
        });
    },

    _getCellByIndex : function(index, monthIdx) {
        var numberOfMonths = this.options.numberOfMonths;
        var row = Math.floor(index / 7);
        var offset = index;
        if (monthIdx > 1) {
            offset += (monthIdx - 1) * (row + 1) * 7;
        }
        if (numberOfMonths > 1 && row > 0) {
            offset += (numberOfMonths - monthIdx) * row * 7;
        }
        return this._calendarDayGrid[offset];
    },

    /**
     * Refresh months and years at header bar area
     */
    _refreshMonthYear : function() {
        var month = this.date.getMonth();
        var year = this.date.getFullYear();
        var numberOfMonths = this.options.numberOfMonths;

        if (this.options.changeMonth) {
            this._setSelectBoxValue(this.monthSelect, month);
        } else {
            $R(1, numberOfMonths).each(function(i) {
                $('mdpMonthLabel_'+i).update(Date.MONTH_NAMES[month]);
                if ((month + 1) > 11) {
                    month = 0;
                } else {
                    month++;
                }
            });
        }

        if (this.options.changeYear) {
            if (this.flexibleYearRange() && (!this._setSelectBoxValue(this.yearSelect, year) ||
                    this.yearSelect.selectedIndex <= 1 ||
                    this.yearSelect.selectedIndex >= this.yearSelect.options.length - 2 )) {
                var idx = 0, html = [];
                this.yearRange().each(function(year){
                    html[idx++] = '<option value="'+year+'">'+year+'</option>';
                });
                this.yearSelect.replace(html.join(''));
            }
            this._setSelectBoxValue(this.yearSelect, year)
        } else {
            month = this.date.getMonth();
            $R(1, numberOfMonths).each(function(i) {
                $('mdpYearLabel_'+i).update(year);
                if ((month + 1) > 11) {
                    month = 0;
                    year++;
                } else {
                    month++;
                }
            });
        }
    },

    yearRange : function() {
        if (!this.flexibleYearRange())
            return $R(this.options.yearRange[0], this.options.yearRange[1]);
        var currentYear = this.date.getFullYear();
        return $R(currentYear - this.options.yearRange, currentYear + this.options.yearRange);
    },

    _setSelectBoxValue: function(selectElement, value) {
        var matched = false;
        $R(0, selectElement.options.length - 1).each(function(i) {
            if (selectElement.options[i].value == value.toString()) {
                selectElement.selectedIndex = i;
                matched = true;
            }
        });
        return matched;
    },

    flexibleYearRange : function() {
        return (typeof(this.options.yearRange) == 'number');
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
        this._updateHeader(hoverDate.format(this.format));
        this.keys.setFocus(element, false);
    },

    _dayHoverOut : function(element) {
        element.removeClassName('focus');
        this._updateHeader();
    },

    _clearSelectedClass : function() {
        if (this.selectedCell) this.selectedCell.removeClassName('selected');
    },

    _setSelectedClass : function() {
        if (!this.selectionMade) return;
        this._clearSelectedClass();
        var selectedDate = this.selectedDate.stripTime();
        var numberOfMonths = this.options.numberOfMonths;
        var beginningDate = this.date.stripTime();
        var beginningMonth = this.date.getMonth();
        var beginningYear = this.date.getFullYear();
        var self = this;
        $R(1, numberOfMonths).each(function(m) {
            beginningDate = new Date(beginningYear, beginningMonth, 1);
            beginningDate.setHours(12); // Prevent daylight savings time boundaries from showing a duplicate day
            var preDays = beginningDate.getDay(); // draw some days before the fact
            beginningDate.setDate(1 - preDays + Date.FIRST_DAY_OF_WEEK);
            var setTodayFlg = false;
            var daysUntil = beginningDate.daysDistance(selectedDate);
            if ($R(0, 41).include(daysUntil) && !setTodayFlg) {
                self.selectedCell = self._getCellByIndex(daysUntil, m).addClassName('selected');
                setTodayFlg = true;
            }
            if ((beginningMonth + 1) > 11) {
                beginningMonth = 0;
                beginningYear++;
            } else {
                beginningMonth++;
            }
        });
    },

    dateString : function() {
        return (this.selectionMade) ? this.selectedDate.format(this.format) : '&#160;';
    },

    getValue : function() {
        if (this.input.value != null && this.input.value.strip().length > 0) {
            return Date.parseString(this.input.value, this.format);
        }
        return null;
    },

    _parseDate : function() {
        var value = $F(this.targetElement).strip();
        this.selectionMade = (value != '');
        this.date = value == '' ? NaN : Date.parseString(this.options.date || value, this.format);
        if (isNaN(this.date) || this.date == null) this.date = new Date();
        if (!this.validYear(this.date.getFullYear()))
            this.date.setYear((this.date.getFullYear() < this.yearRange().start) ? this.yearRange().start : this.yearRange().end);
        this.selectedDate = this.date;
    },

    _updateHeader : function(text) {
        if (!text) text = this.dateString();
        $('mdpSelectedDate_'+this._mdpId).update(text);
    },

    clearDate : function() {
        if ((this.targetElement.disabled || this.targetElement.readOnly) && this.options.popup != 'force') return false;
        var lastValue = this.targetElement.value;
        this.targetElement.value = '';
        this._clearSelectedClass();
        this._updateHeader('&#160;');
        if (lastValue != this.targetElement.value) this._callback('onchange');
    },

    _updateSelectedDate : function(partsOrElement, viaClickFlg) {
        var parts = $H(partsOrElement);

        if ((this.targetElement.disabled || this.targetElement.readOnly)
                && this.options.popup != 'force') return false;

        if (parts.get('day')) {
            var selectedDate = this.selectedDate;
            for (var x = 0; x <= 3; x++) selectedDate.setDate(parts.get('day'));
            selectedDate.setYear(parts.get('year'));
            selectedDate.setMonth(parts.get('month'));
            this.selectedDate = selectedDate;
            this.selectionMade = true;
        }

        if (!isNaN(parts.get('hour'))) {
            this.selectedDate.setHours(parts.get('hour'));
        }

        if (!isNaN(parts.get('minute'))) {
            this.selectedDate.setMinutes(Utilities.floorToInterval(parts.get('minute'), this.options.minuteInterval));
        }

        if (parts.get('hour') === '' || parts.get('minute') === '') {
            this.setUseTime(false);
        } else if (!isNaN(parts.get('hour')) || !isNaN(parts.get('minute'))) {
            this.setUseTime(true);
        }

        this._updateHeader();
        this._setSelectedClass();

        if (this.selectionMade) {
            this._updateValue();
            this.validate();
        }

        if (this._closeOnClick()) {
            this._close();
        }

        if (this.options.afterUpdate)
            this.options.afterUpdate(this.targetElement, selectedDate);

        if (viaClickFlg && !this.options.embedded) {
            this._close();
        }
    },

    _closeOnClick : function() {
        if (this.options.embedded) return false;
        if (this.options.closeOnClick === null)
            return (!this.options.time);
        else
            return (this.options.closeOnClick)
    },

    _navMonth : function(month) {
        var targetDate = new Date(this.date);
        targetDate.setMonth(month);
        return (this._navTo(targetDate));
    },

    _navYear : function(year) {
        var targetDate = new Date(this.date);
        targetDate.setYear(year);
        return (this._navTo(targetDate));
    },

    _navTo : function(date) {
        if (!this.validYear(date.getFullYear())) return false;
        this.date = date;
        this.date.setDate(1);
        this._refresh();
        this._callback('after_navigate', this.date);
        return true;
    },

    setUseTime : function(turnOnFlg) {
        this.useTimeFlg = this.options.time && (this.options.time == 'mixed' ? turnOnFlg : true); // force use_time to true if time==true && time!='mixed'
        if (this.useTimeFlg && this.selectedDate) { // only set hour/minute if a date is already selected
            var minute = Utilities.floorToInterval(this.selectedDate.getMinutes(), this.options.minuteInterval);
            var hour = this.selectedDate.getHours();
            this.hourSelect.setValue(hour);
            this.minuteSelect.setValue(minute);
        } else if (this.options.time == 'mixed') {
            this.hourSelect.setValue('');
            this.minuteSelect.setValue('');
        }
    },

    _updateValue : function() {
        var lastValue = this.targetElement.value;
        this.targetElement.value = this.dateString();
        if (lastValue != this.targetElement.value) this._callback('onchange');
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
        var self = this;
        if (!this.visibleFlg) return false;
        this._callback('beforeClose');
        Event.stopObserving($(document),'click', this._closeIfClickedOutHandler);
        this._calendarDiv.remove();
        this.keys.stop();
        this.keys = null;
        self.visibleFlg = false;
        if (this.targetElement.type != 'hidden' && ! this.targetElement.disabled) this.targetElement.focus();
        this._callback('afterClose');
    },

    _closeIfClickedOut : function(e) {
        var target = $(Event.element(e));
        if (!target.descendantOf(this._calendarDiv) && !target.descendantOf(this.container)) this._close();
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
        if (this.options[name]) {
            this.options[name].bind(this.targetElement)(param);
        }
    },

    _applyKeyboardBehavior : function() {
        var i = 0, self = this;
        var numberOfMonths = this.options.numberOfMonths;
        var showWeek = this.options.showWeek;
        this.keys = new KeyTable(this.daysTable, {
            idPrefix : 'mdpC'+this._mdpId+'_',
            numberOfColumns : numberOfMonths * (showWeek ? 8 : 7)
        });
        for (i = 0; i < this._calendarDayGrid.length; i++) {
            var element = this._calendarDayGrid[i];
            (function(element) {
                if (element.hasClassName('day')) {
                    element.observe('mouseover', function () {
                            self._dayHover(this);
                    });

                    element.observe('mouseout', function () {
                        self._dayHoverOut(this)
                    });

                    element.observe('click', function() {
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
                }
            })(element);
        }

        var selectedCell = this.selectedCell || $('mdpC'+this._mdpId+'_0,0');
        i = 0;
        while (!selectedCell) {
            selectedCell = $('mdpC'+this._mdpId+'_' +(++i)+',0');
        }
        this.keys.setFocus(selectedCell, false);
        this.keys.captureKeys();
        this.keys.eventFire('focus', selectedCell);
    }
});
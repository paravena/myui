var KeyTable = Class.create();

KeyTable.prototype = {
	initialize : function(targetTable, options) {
		options = options || {};
        if (targetTable instanceof MyTableGrid) {
            this._numberOfRows = targetTable.rows.length;
            this._numberOfColumns = targetTable.columnModel.length;
            this._tableGrid = targetTable;
            this._bodyDiv = targetTable.bodyDiv;
            this._targetTable = targetTable.bodyTable;
        } else {
            this._targetTable = targetTable; // a normal table
            this._numberOfRows = this._targetTable.rows.length;
            this._numberOfColumns = this._targetTable.rows[0].cells.length;
        }

        this.idPrefix = options.idPrefix || '';
        if (this._tableGrid) this.idPrefix = 'mtgC'+ this._tableGrid._mtgId + '_';

        this.nBody = this._targetTable.down('tbody'); // Cache the tbody node of interest
		this._xCurrentPos = null;
		this._yCurrentPos = null;
		this._nCurrentFocus = null;
		this._nOldFocus = null;
        this._topLimit = 0;
		// Table grid key navigation handling flags
		this.blockFlg = false;
		this.blockKeyCaptureFlg = false;

		this._nInput = null;
		this._bForm = options.form || false;
		this._bInputFocused = false;
		this._sFocusClass = 'focus';
		this._xCurrentPos = 0;
		this._yCurrentPos = 0;

		/**
		 * Variable: event
		 * Purpose:  Container for all event application methods
		 * Scope:    KeyTable - public
		 * Notes:    This object contains all the public methods for adding and removing events - these
		 *           are dynamically added later on
		 */
		this.event = {remove : {}};

		/**
		 * Variable: _oaoEvents
		 * Purpose:  Event cache object, one array for each supported event for speed of searching
		 * Scope:    KeyTable - private
		 */
		this._oaoEvents = {"action": [], "esc": [], "focus": [], "blur": []};

		var self = this;

		// Use the template functions to add the event API functions
		for (var sKey in this._oaoEvents) {
			if (sKey) {
				self.event[sKey] = self.insertAddEventTemplate(sKey);
				self.event.remove[sKey] = self.insertRemoveEventTemplate(sKey);
			}
		}

		// Loose table focus when click outside the table
		Event.observe(document, 'click', function(event) {
			if (!self._nCurrentFocus) return;
			var nTarget = Event.element(event);
			var ancestor = self._targetTable;
			var blurFlg = true;
			var element = nTarget;
			if (element.descendantOf(ancestor)) blurFlg = false;
			if (blurFlg) {
				while (element = element.parentNode) {
					if (element.className == 'autocomplete' || element.className == 'myDatePicker') {
						blurFlg = false;
						break;
					}
				}
			}
			if (blurFlg) {
				self.removeFocus(self._nCurrentFocus, true);
				self.releaseKeys();
				self._nOldFocus = null;
			}
		});

        if (targetTable instanceof MyTableGrid) this.addMouseBehavior();

		if (Prototype.Browser.Gecko || Prototype.Browser.Opera ) {
			Event.observe(document, 'keypress', function(event) {
				var result = self.onKeyPress(event);
				if (!result) event.preventDefault();
			});
		} else {
			Event.observe(document, 'keydown', function(event) {
				var result = self.onKeyPress(event);
				if (!result) event.preventDefault();
			});
		}
	},

	addMouseBehavior : function() {
		var tableGrid = this._tableGrid;
		var renderedRows = tableGrid.renderedRows;
		var renderedRowsAllowed = tableGrid.renderedRowsAllowed;
		var beginAtRow = renderedRows - renderedRowsAllowed;
		if (beginAtRow < 0) beginAtRow = 0;
		for (var j = beginAtRow; j < renderedRows; j++) {
            this.addMouseBehaviorToRow(j);
		}
	},

    addMouseBehaviorToRow : function(y) {
        var self = this;
        for (var i = 0; i < this._numberOfColumns; i++) {
            var element = this.getCellFromCoords(i, y);
            var f_click = (function(element){
                return function(event) {
                    self.onClick(event);
                    self.eventFire('focus', element);
                };
            })(element);

            Event.observe(element, 'click', f_click.bindAsEventListener(this));

            var f_dblclick = (function(element){
                return function() {
                    self.eventFire('action', element);
                };
            })(element);
            Event.observe(element, 'dblclick', f_dblclick);
        }
    },
	/**
	 * Purpose:  Create a function (with closure for sKey) event addition API
	 * Returns:  function: - template function
	 * Inputs:   string:sKey - type of event to detect
	 */
	insertAddEventTemplate : function(sKey) {
		/*
		 * API function for adding event to cache
		 * Notes: This function is (interally) overloaded (in as much as javascript allows for that)
		 *        the target cell can be given by either node or coords.
		 *
		 * Parameters:  1. x - target node to add event for
		 *              2. y - callback function to apply
		 * or
		 *              1. x - x coord. of target cell
		 *              2. y - y coord. of target cell
		 *              3. z - callback function to apply
		 */
		var self = this;
		return function(x, y, z) {
			if (typeof x == "number" && typeof y == "number" && typeof z == "function") {
				self.addEvent(sKey, self.getCellFromCoords(x,y), z);
			} else if (typeof x == "object" && typeof y == "function") {
				self.addEvent(sKey, x, y);
			}
		};
	},

	/**
	 * Purpose:  Create a function (with closure for sKey) event removal API
	 * Returns:  function: - template function
	 * Inputs:   string:sKey - type of event to detect
	 */
	insertRemoveEventTemplate : function(sKey) {
		/*
		 * API function for removing event from cache
		 * Returns: number of events removed
		 * Notes: This function is (internally) overloaded (in as much as javascript allows for that)
		 *        the target cell can be given by either node or coordinates and the function
		 *        to remove is optional
		 *
		 * Parameters: 1. x - target node to remove event from
		 *             2. y - callback function to apply
		 * or
		 *             1. x - x coordinate. of target cell
		 *             2. y - y coordinate. of target cell
		 *             3. z - callback function to remove - optional
		 */
		var self = this;
		return function (x, y, z) {
			if (typeof arguments[0] == 'number' && typeof arguments[1] == 'number') {
				if ( typeof arguments[2] == 'function' ) {
					self.removeEvent(sKey, self.getCellFromCoords(x,y), z);
				} else {
					self.removeEvent(sKey, self.getCellFromCoords(x,y));
				}
			} else if (typeof arguments[0] == 'object' ) {
				if ( typeof arguments[1] == 'function' ) {
					self.removeEvent(sKey, x, y);
				} else {
					self.removeEvent(sKey, x);
				}
			}
		};
	},

	/**
	 * Add an event to the internal cache
	 *
	 * @param sType type of event to add, given by the available elements in _oaoEvents
	 * @param nTarget cell to add event too
	 * @param fn callback function for when triggered
	 */
	addEvent : function(sType, nTarget, fn) {
		this._oaoEvents[sType].push( {
			"nCell": nTarget,
			"fn": fn
		} );
	},

	/**
	 * Removes an event from the event cache
	 *
	 * @param sType type of event to look for
	 * @param nTarget target table cell
	 * @param fn remove function. If not given all handlers of this type will be removed
	 * @return number of matching events removed
	 */
	removeEvent : function(sType, nTarget, fn) {
		var iCorrector = 0;
		for (var i = 0, iLen = this._oaoEvents[sType].length ; i < iLen - iCorrector; i++) {
			if (typeof fn != 'undefined') {
				if (this._oaoEvents[sType][i - iCorrector].nCell == nTarget && this._oaoEvents[sType][i - iCorrector].fn == fn) {
					this._oaoEvents[sType].splice(i - iCorrector, 1);
					iCorrector++;
				}
			} else {
				if (this._oaoEvents[sType][i].nCell == nTarget) {
					this._oaoEvents[sType].splice(i, 1);
					return 1;
				}
			}
		}
		return iCorrector;
	},

	/**
	 * Handles key events moving the focus from one cell to another
	 *
	 * @param event key event
	 */
	 onKeyPress : function(event) {
        if (this.blockFlg || !this.blockKeyCaptureFlg) return true;
		// If a modifier key is pressed (except shift), ignore the event
		if (event.metaKey || event.altKey || event.ctrlKey) return true;
		var x = this._xCurrentPos;
		var y = this._yCurrentPos;
        var topLimit = this._topLimit;
		// Capture shift+tab to match the left arrow key
		var keyCode = (event.keyCode == 9 && event.shiftKey) ? -1 : event.keyCode;
		var cell = null;
		while(true) {
			switch(keyCode) {
				case Event.KEY_RETURN: // return
					this.eventFire('action', this._nCurrentFocus);
					return false;
				case Event.KEY_ESC: // esc
					if (!this.eventFire('esc', this._nCurrentFocus)) {
						// Only lose focus if there isn't an escape handler on the cell
						this.blur();
					}
					break;
				case -1:
				case Event.KEY_LEFT: // left arrow
					if (this._bInputFocused) return true;
					if (this._xCurrentPos > 0) {
                        x = this._xCurrentPos - 1;
						y = this._yCurrentPos;
					} else if (this._yCurrentPos > topLimit) {
                        x = this._numberOfColumns - 1;
						y = this._yCurrentPos - 1;
					} else {
						// at start of table
						if (keyCode == -1 && this._bForm) {
							// If we are in a form, return focus to the 'input' element such that tabbing will
							// follow correctly in the browser
							this._bInputFocused = true;
							this._nInput.focus();
							// This timeout is a little nasty - but IE appears to have some asynchronous behaviour for
							// focus
							setTimeout(function(){this._bInputFocused = false;}, 0);
							this.blockKeyCaptureFlg = false;
							this.blur();
							return true;
						} else {
							return false;
						}
					}
					break;
				case Event.KEY_UP: /* up arrow */
                    if (this._bInputFocused) return true;
					if (this._yCurrentPos > topLimit) {
						x = this._xCurrentPos;
						y = this._yCurrentPos - 1;
					} else {
						return false;
					}
					break;
				case Event.KEY_TAB: // tab
				case Event.KEY_RIGHT: // right arrow
					if (this._bInputFocused) return true;
					if (this._xCurrentPos < this._numberOfColumns - 1) {
						x = this._xCurrentPos + 1;
						y = this._yCurrentPos;
					} else if (this._yCurrentPos < this._numberOfRows - 1) {
						x = 0;
						y = this._yCurrentPos + 1;
					} else {
						// at end of table
						if (keyCode == 9 && this._bForm ) {
							// If we are in a form, return focus to the 'input' element such that tabbing will
							// follow correctly in the browser
							this._bInputFocused = true;
							this._nInput.focus();
							// This timeout is a little nasty - but IE appears to have some asynchronous behaviour for
							// focus
							setTimeout(function(){this._bInputFocused = false;}, 0);
							this.blockKeyCaptureFlg = false;
							this.blur();
							return true;
						} else {
							return false;
						}
					}
					break;
				case Event.KEY_DOWN: // down arrow
					if (this._bInputFocused) return true;
					if (this._yCurrentPos < this._numberOfRows - 1) {
						x = this._xCurrentPos;
						y = this._yCurrentPos + 1;
					} else {
						return false;
					}
					break;
				default: /* Nothing we are interested in */
					return true;
			}
			cell = this.getCellFromCoords(x, y);
			if (cell != null && (cell.getStyle('display') != 'none' && cell.up('tr').getStyle('display') != 'none')) {
				break;
			} else {
				this._xCurrentPos = x;
				this._yCurrentPos = y;
			}
		}
		this.setFocus(cell);
        this.eventFire("focus", cell);
		return false;
	},

	/**
	 * Set focus on a node, and remove from an old node if needed
	 *
	 * @param nTarget node we want to focus on
	 * @param bAutoScroll should we scroll the view port to the display
	 */
	setFocus : function(nTarget, bAutoScroll) {
		// If node already has focus, just ignore this call
		// if (this._nCurrentFocus == nTarget) return;
		if (typeof bAutoScroll == 'undefined') 	bAutoScroll = true;
		// Remove old focus (with blur event if needed)
		if (this._nCurrentFocus != null) this.removeFocus(this._nCurrentFocus); 

		// Add the new class to highlight the focused cell
		$(nTarget).addClassName(this._sFocusClass);
    	$(nTarget).up('tr').addClassName(this._sFocusClass);
		/* Cache the information that we are interested in */
		var aNewPos = this.getCoordsFromCell(nTarget);

		this._nOldFocus = this._nCurrentFocus;
		this._nCurrentFocus = nTarget;
		this._xCurrentPos = aNewPos[0];
		this._yCurrentPos = aNewPos[1];

        if (bAutoScroll && this._bodyDiv) {
			// Scroll the viewport such that the new cell is fully visible in the
			// rendered window
			var iViewportHeight = this._bodyDiv.clientHeight;
			var iViewportWidth = this._bodyDiv.clientWidth;

			var iScrollTop = this._bodyDiv.scrollTop;
			var iScrollLeft = this._bodyDiv.scrollLeft;

			var iHeight = nTarget.offsetHeight;
			var iWidth = nTarget.offsetWidth;
			var aiPos = this.getPosition(nTarget);

			// Correct viewport positioning for vertical scrolling
			if (aiPos[1]+iHeight > iScrollTop+iViewportHeight) {
				// Displayed element if off the bottom of the viewport
				this.setScrollTop( aiPos[1]+iHeight - iViewportHeight );
			} else if ( aiPos[1] < iScrollTop ) {
				// Displayed element if off the top of the viewport
				this.setScrollTop( aiPos[1] );
			}

			// Correct viewport positioning for horizontal scrolling
			if ( aiPos[0] + iWidth > iScrollLeft + iViewportWidth )	{
				// Displayed element is off the bottom of the viewport
				this.setScrollLeft(aiPos[0] + iWidth - iViewportWidth);
			} else if (aiPos[0] < iScrollLeft) {
				// Displayed element if off the Left of the viewport
				this.setScrollLeft(aiPos[0]);
			}
		}
	},

	/**
	 * Set the vertical scrolling position
	 *
	 * @param iPos scroll top position
	 */
	setScrollTop : function(iPos)	{
		this._bodyDiv.scrollTop = iPos;
	},

	/**
	 * Set the horizontal scrolling position
	 *
	 * @param iPos scroll left position
	 */
	setScrollLeft : function(iPos) {
		this._bodyDiv.scrollLeft = iPos;
	},

	/**
	 * Look thought the events cache and fire off the event of interest
	 * Notes: It might be more efficient to return after the first event has been triggered,
	 *        but that would mean that only one function of a particular type can be
	 *        subscribed to a particular node
	 *
	 * @param sType type of event to look for
	 * @param nTarget target table cell
	 * @return  number of events fired
	 */
	eventFire: function(sType, nTarget) {
		var iFired = 0;
		var aEvents = this._oaoEvents[sType];
		for (var i = 0; i < aEvents.length; i++) {
			if (aEvents[i].nCell == nTarget) {
				aEvents[i].fn(nTarget);
				iFired++;
			}
		}
		return iFired;
	},

	/**
	 * Blur focus from the whole table
	 */
	blur : function() {
//		if (!this._nCurrentFocus) return;
//		this.removeFocus(this._nCurrentFocus, onlyCellFlg);
//		this.xCurrentPos = null;
//		this.yCurrentPos = null;
//		this._nCurrentFocus = null;
//		this.releaseKeys();
	},

	/**
	 * Removes focus from a cell and fire any blur events which are attached
	 *
	 * @param nTarget cell of interest
	 */
	removeFocus : function(nTarget, onlyCellFlg) {
		if (!nTarget) return;
		nTarget.removeClassName(this._sFocusClass);
		if (!onlyCellFlg) nTarget.up().removeClassName(this._sFocusClass);
		this.eventFire("blur", nTarget);
	},

	/**
	 * Get the position of an object on the rendered page
	 *
	 * @param obj element of interest
	 * @return the element position [left, right]
	 */
	getPosition : function(obj)	{
		var iLeft = 0;
		var iTop = 0;
		if (obj.offsetParent) {
			iLeft = obj.offsetLeft;
			iTop = obj.offsetTop;
		}
		return [iLeft, iTop];
	},

	/*
	 * Calculates the x and y position in a table from a TD cell
	 *
	 * @param n TD cell of interest
	 * @return [x, y] position of the element
	 */
	getCoordsFromCell : function(n) {
		var id = n.id;
		var coords = id.substring(id.indexOf('_') + 1, id.length).split(',');
		return [
			parseInt(coords[0]),
			parseInt(coords[1])
		];
	},

	/**
	 * Calculates the target TD cell from x and y coordinates
	 *
	 * @param x coordinate
	 * @param y coordinate
	 * @return TD target
	 */
	getCellFromCoords : function(x, y) {
		return $(this.idPrefix + x + ',' + y);
        //return this._targetTable.rows[y].cells[x]; <-- this sadly doesn't work
	},

	/**
	 * Focus on the element that has been clicked on by the user
	 *
	 * @param event click event
	 */
	onClick : function(event) {
		/*
		var nTarget = event.target;
		while (nTarget.nodeName != "TD") {
			nTarget = nTarget.parentNode;
		}*/
		var nTarget = Event.findElement(event, 'TD');
		if (nTarget) {
			this.setFocus(nTarget);
			this.captureKeys();
		}
	},

	/**
	 * Start capturing key events for this table
	 */
	captureKeys : function() {
		if (!this.blockKeyCaptureFlg) {
			this.blockKeyCaptureFlg = true;
		}
	},

	/**
	 * Stop capturing key events for this table
	 */
	releaseKeys : function() {
		this.blockKeyCaptureFlg = false;
	},

    /**
     * Sets the top limit of the grid
     *
     * @param topLimit the the table grid top limit
     */
    setTopLimit : function(topLimit) {
        this._topLimit = topLimit;
    },

    /**
     * Sets the number of rows
     *
     * @param numberOfRows the table grid number of rows
     */
    setNumberOfRows : function(numberOfRows) {
        this._numberOfRows = numberOfRows;
    }
};
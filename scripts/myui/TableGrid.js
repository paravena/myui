/**
 * MyTableGrid, version 1.1.1
 *
 * Dual licensed under the MIT and GPL licenses.
 *
 * Copyright 2009 Pablo Aravena, all rights reserved.
 * http://pabloaravena.info/mytablegrid
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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
MY.TableGrid = Class.create({
    version: '1.1.0',
    _messages : {
        totalDisplayMsg: '<strong><span id="mtgTotal">{total}</span></strong> records found',
        rowsDisplayMsg: ', displaying <strong><span id="mtgFrom">{from}</span></strong>&nbsp;to&nbsp;<strong><span id="mtgTo">{to}</span></strong>',
        pagePromptMsg: '<td><strong>Page:</strong></td><td>{input}</td><td>of <strong>{pages}</strong></td>',
        pagerNoDataFound: '<strong>No records found</strong>',
        add: 'Add',
        remove: 'Delete',
        save: 'Save',
        sortAsc: 'Sort ascending',
        sortDesc: 'Sort descending',
        selectAll: 'Select all',
        loading: 'Loading ...'
    },
    /**
     * MyTableGrid constructor
     */
    initialize : function(tableModel) {
        this._mtgId = $$('.myTableGrid').length + 1;
        this.tableModel = tableModel;
        this.columnModel = tableModel.columnModel || [];
        this.rows = tableModel.rows || [];
        this.options = tableModel.options || {};
        this.name = tableModel.name || '';
        this.fontSize = 11;
        this.cellHeight = parseInt(this.options.cellHeight) || 24;
        this.pagerHeight = 24;
        this.titleHeight = 24;
        this.toolbarHeight = 24;
        this.scrollBarWidth = 18;
        this.topPos = 0;
        this.leftPos = 0;
        this.selectedHCIndex = 0;
        this.pager = this.options.pager || null;
        if (this.options.pager) this.pager.pageParameter = this.options.pager.pageParameter || 'page';
        this.url = tableModel.url || null;
        this.request = tableModel.request || {};
        this.sortColumnParameter = this.options.sortColumnParameter || 'sortColumn';
        this.ascDescFlagParameter = this.options.ascDescFlagParameter || 'ascDescFlg';
        this.sortedColumnIndex = 0;
        this.sortedAscDescFlg = 'ASC'; // || 'DESC'
        this.onCellFocus = this.options.onCellFocus || null;
        this.onCellBlur = this.options.onCellBlur || null;
        this.modifiedRows = []; //will contain the modified row numbers
        this.afterRender = this.options.afterRender || null; //after rendering handler
        this.onFailure = this.options.onFailure || null; //on failure handler
        this.rowStyle = this.options.rowStyle || null; //row style handler
        this.rowClass = this.options.rowClass || null; //row class handler
        this.addSettingBehaviorFlg = (this.options.addSettingBehavior == undefined || this.options.addSettingBehavior)? true : false;
        this.addDraggingBehaviorFlg = (this.options.addDraggingBehavior == undefined || this.options.addDraggingBehavior)? true : false;

        this.renderedRows = 0; //Use for lazy rendering
        this.renderedRowsAllowed = 0; //Use for lazy rendering depends on bodyDiv height
        this.newRowsAdded = [];
        this.deletedRows = [];

        // Header builder
        this.hb = new HeaderBuilder(this._mtgId, this.columnModel);
        if (this.hb.getHeaderRowNestedLevel() > 1) {
            this.addSettingBehaviorFlg = false;
            this.addDraggingBehaviorFlg = false;
        }
        this.headerWidth = this.hb.getTableHeaderWidth();
        this.headerHeight = this.hb.getTableHeaderHeight();
        this.columnModel = this.hb.getLeafElements();
        for (var i = 0; i < this.columnModel.length; i++) {
            if (!this.columnModel[i].hasOwnProperty('editor')) this.columnModel[i].editor = new MY.TableGrid.CellInput();
            if (!this.columnModel[i].hasOwnProperty('editable')) {
                this.columnModel[i].editable = false;
                if (this.columnModel[i].editor == 'checkbox' || this.columnModel[i].editor instanceof MY.TableGrid.CellCheckbox ||
                    this.columnModel[i].editor == 'radio' || this.columnModel[i].editor instanceof MY.TableGrid.CellRadioButton) {
                    this.columnModel[i].editable = true;
                }
            }
            if (!this.columnModel[i].hasOwnProperty('visible')) this.columnModel[i].visible = true;
            if (!this.columnModel[i].hasOwnProperty('sortable')) this.columnModel[i].sortable= true;
            if (!this.columnModel[i].hasOwnProperty('type')) this.columnModel[i].type = 'string';
            if (!this.columnModel[i].hasOwnProperty('selectAllFlg')) this.columnModel[i].selectAllFlg = false;
            if (!this.columnModel[i].hasOwnProperty('sortedAscDescFlg')) this.columnModel[i].sortedAscDescFlg = 'DESC';
            this.columnModel[i].positionIndex = i;
        }

        this.targetColumnId = null;
        this.editedCellId = null;

        this.gap = 2; //diff between width and offsetWidth
        if (Prototype.Browser.WebKit) this.gap = 0;
    },

    show : function(target) {
        this.render(target);
    },

    /**
     * Renders the table grid control into a given target
     */
    render : function(target) {
        this.target = target;
        $(target).innerHTML = this._createTableLayout();
        var id = this._mtgId;
        this.tableDiv = $('myTableGrid' + id);
        this.headerTitle = $('mtgHeaderTitle'+id);
        this.headerToolbar = $('mtgHeaderToolbar'+id);
        this.headerRowDiv = $('headerRowDiv' + id);
        this.bodyDiv = $('bodyDiv' + id);
        this.overlayDiv = $('overlayDiv' + id);
        this.innerBodyDiv = $('innerBodyDiv' + id);
        this.pagerDiv = $('pagerDiv' + id);
        this.resizeMarkerLeft = $('resizeMarkerLeft' + id);
        this.resizeMarkerRight = $('resizeMarkerRight' + id);
        this.dragColumn = $('dragColumn' + id);
        this.colMoveTopDiv = $('mtgColMoveTop' + id);
        this.colMoveBottomDiv = $('mtgColMoveBottom' + id);
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.targetColumnId = null;

        $(target).insert({after:'<div class="my-autocompleter-list shadow" id="list" style="display:none;z-index:1000"></div>'});

        var self = this;

        this.bodyDiv.on('dom:dataLoaded', function() {
            self._showLoaderSpinner();
            self.bodyTable = $('mtgBT' + id);
            self._applyCellCallbacks();
            self._applyHeaderButtons();
            self._makeAllColumnsResizable();
            if (self.addDraggingBehaviorFlg) self._makeAllColumnDraggable();
            if (self.addSettingBehaviorFlg) self._applySettingMenuBehavior();
            self.keys = new KeyTable(self);
            self._addKeyBehavior();
            if (self.pager) {
                self._addPagerBehavior();
            }
            if (self.afterRender) {
                self.afterRender();
            }
            self._hideLoaderSpinner();
        });

        setTimeout(function() {
            self.renderedRowsAllowed = Math.floor((self.bodyHeight - self.scrollBarWidth - 3)  / self.cellHeight) + 1;
            if (self.tableModel.hasOwnProperty('rows')) {
                self.innerBodyDiv.innerHTML = self._createTableBody(self.rows);
                if (self.pager) {
                    self.pagerDiv.innerHTML = self._updatePagerInfo();
                }
                self.bodyDiv.fire('dom:dataLoaded');
            } else {
                self._retrieveDataFromUrl(1, true);
            }
        }, 0);

        if (this.options.toolbar) {
            var elements = this.options.toolbar.elements || [];
            if (elements.indexOf(MY.TableGrid.ADD_BTN) >= 0) {
                Event.observe($('mtgAddBtn'+id), 'click', function() {
                    var addFlg = true;
                    if (self.options.toolbar.onAdd) {
                        addFlg = self.options.toolbar.onAdd.call();
                        if (addFlg == undefined) addFlg = true;
                    }
                    if (addFlg) self.addNewRow();
                });
            }

            if (elements.indexOf(MY.TableGrid.DEL_BTN) >= 0) {
                Event.observe($('mtgDelBtn'+id), 'click', function() {
                    var deleteFlg = true;
                    if (self.options.toolbar.onDelete) {
                        deleteFlg = self.options.toolbar.onDelete.call();
                        if (deleteFlg == undefined) deleteFlg = true;
                    }
                    if (deleteFlg) self.deleteRows();
                });
            }

            if (elements.indexOf(MY.TableGrid.SAVE_BTN) >= 0) {
                Event.observe($('mtgSaveBtn'+id), 'click', function() {
                   self._blurCellElement(self.keys._nCurrentFocus);
                   if (self.options.toolbar.onSave) {
                       self.options.toolbar.onSave.call();
                   }
                });
            }
        }
        // Adding scrolling handler
        Event.observe($('bodyDiv' + id), 'scroll', function() {
            self._syncScroll();
        });
        // Adding resize handler
        Event.observe(window, 'resize', function() {
            self.resize();
        });

    },

    /**
     * Creates the table layout
     */
    _createTableLayout : function() {
        var target = $(this.target);
        var width = this.options.width || (target.getWidth() - this._fullPadding(target,'left') - this._fullPadding(target,'right')) + 'px';
        var height = this.options.height || (target.getHeight() - this._fullPadding(target,'top') - this._fullPadding(target,'bottom') + 2) + 'px';
        var id = this._mtgId;
        var cm = this.columnModel;
        var gap = this.gap;
        var imageRefs = this._imageRefs;
        var imagePath = this._imagePath;
        var overlayTopPos = 0;
        var overlayHeight = 0;
        this.tableWidth = parseInt(width) - 2;
        overlayHeight = this.tableHeight = parseInt(height) - 2;

        var idx = 0;
        var html = [];
        html[idx++] = '<div id="myTableGrid'+id+'" class="myTableGrid" style="position:relative;width:'+this.tableWidth+'"px;height:'+this.tableHeight+'px;z-index:0">';

        if (this.options.title) { // Adding header title
            html[idx++] = '<div id="mtgHeaderTitle'+id+'" class=" mtgHeaderTitle" style="position:absolute;top:'+this.topPos+'px;left:'+this.leftPos+'px;width:'+(this.tableWidth - 6)+'px;height:'+(this.titleHeight - 6)+'px;padding:3px;z-index:10">';
            html[idx++] = this.options.title;
            html[idx++] = '</div>';
            this.topPos += this.titleHeight + 1;
        }

        if (this.options.toolbar) {
            var elements = this.options.toolbar.elements || [];
            html[idx++] = '<div id="mtgHeaderToolbar'+id+'" class="mtgToolbar" style="position:absolute;top:'+this.topPos+'px;left:'+this.leftPos+'px;width:'+(this.tableWidth - 4)+'px;height:'+(this.toolbarHeight - 4)+'px;padding:2px;z-index:10">';
            var beforeFlg = false;
            if(elements.indexOf(MY.TableGrid.SAVE_BTN) >= 0) {
                html[idx++] = '<a href="#" class="toolbarbtn"><span class="savebutton" id="mtgSaveBtn'+id+'">'+this._messages.save+'</span></a>';
                beforeFlg = true;
            }
            if(elements.indexOf(MY.TableGrid.ADD_BTN) >= 0) {
                if (beforeFlg) html[idx++] = '<div class="toolbarsep">&#160;</div>';
                html[idx++] = '<a href="#" class="toolbarbtn"><span class="addbutton" id="mtgAddBtn'+id+'">'+this._messages.add+'</span></a>';
                beforeFlg = true;
            }
            if(elements.indexOf(MY.TableGrid.DEL_BTN) >= 0) {
                if (beforeFlg) html[idx++] = '<div class="toolbarsep">&#160;</div>';
                html[idx++] = '<a href="#" class="toolbarbtn"><span class="delbutton" id="mtgDelBtn'+id+'">'+this._messages.remove+'</span></a>';
            }
            html[idx++] = '</div>';
            this.topPos += this.toolbarHeight + 1;
        }
        overlayTopPos = this.topPos;
        // Adding Header Row
        html[idx++] = '<div id="headerRowDiv'+id+'" class="mtgHeaderRow" style="position:absolute;top:'+this.topPos+'px;left:'+this.leftPos+'px;width:'+this.tableWidth+'px;height:'+this.headerHeight+'px;padding:0;overflow:hidden;z-index:0">';
        //header row box useful for drag and drop
        html[idx++] = '<div id="mtgHRB'+id+'" style="position:relative;padding:0;margin:0;width:'+(this.headerWidth+21)+'px;height:'+this.headerHeight+'px;">';
        // Adding Header Row Cells
        html[idx++] = this.hb._createHeaderRow();
        html[idx++] = '</div>'; // closes mtgHRB
        html[idx++] = '</div>'; // closes headerRowDiv
        this.topPos += this.headerHeight + 1;

        // Adding Body Area
        this.bodyHeight = this.tableHeight - this.headerHeight - 3;
        if (this.options.title) this.bodyHeight = this.bodyHeight - this.titleHeight - 1;
        if (this.options.pager) this.bodyHeight = this.bodyHeight - this.pagerHeight - 1;
        if (this.options.toolbar) this.bodyHeight = this.bodyHeight - this.toolbarHeight - 1;
        overlayHeight = this.bodyHeight + this.headerHeight;

        html[idx++] = '<div id="overlayDiv'+id+'" class="overlay" style="position:absolute;top:'+overlayTopPos+'px;width:'+(this.tableWidth+2)+'px;height:'+(overlayHeight+2)+'px;overflow:none;">';
        html[idx++] = '<div class="loadingBox" style="margin-top:'+((overlayHeight+2)/2 - 14)+'px">'+this._messages.loading+'</div>';
        html[idx++] = '</div>'; // closes overlay
        html[idx++] = '<div id="bodyDiv'+id+'" class="mtgBody" style="position:absolute;top:'+this.topPos+'px;left:'+this.leftPos+'px;width:'+this.tableWidth+'px;height:'+this.bodyHeight+'px;overflow:auto;">';
        html[idx++] = '<div id="innerBodyDiv'+id+'" class="mtgInnerBody" style="position:relative;top:0px;width:'+(this.tableWidth - this.scrollBarWidth)+'px;overflow:none;">';
        html[idx++] = '</div>'; // closes innerBodyDiv
        html[idx++] = '</div>'; // closes bodyDiv

        // Adding Pager Panel
        if (this.pager) {
            this.topPos += this.bodyHeight + 2;
            html[idx++] = '<div id="pagerDiv'+id+'" class="mtgPager" style="position:absolute;top:'+this.topPos+'px;left:0;bottom:0;width:'+(this.tableWidth - 4)+'px;height:'+(this.pagerHeight - 4)+'px">';
            html[idx++] = this._updatePagerInfo(true);
            html[idx++] = '</div>'; // closes Pager Div
        }

        // Adding Table Setting Button Control
        if (this.addSettingBehaviorFlg) {
            html[idx++] = '<div id="mtgSB'+id+'" class="mtgSettingButton" style="left:'+(this.tableWidth - 20)+'px">';
            html[idx++] = '</div>';
            // Adding Table Setting Menu
            html[idx++] = this._createSettingMenu();
        }

        // Adding Header Button Control
        html[idx++] = '<div id="mtgHB'+id+'" class="mtgHeaderButton" style="width:14px;height:'+this.headerHeight+'px">';
        html[idx++] = '</div>';
        // Adding Header Button Menu
        html[idx++] = '<div id="mtgHBM'+id+'" class="mtgMenu shadow">';
        html[idx++] = '<ul>';
        html[idx++] = '<li>';
        html[idx++] = '<a id="mtgSortAsc'+id+'" class="mtgMenuItem" href="javascript:void(0)">';
        html[idx++] = '<table cellspacing="0" cellpadding="0" width="100%" border="0">';
        html[idx++] = '<tr><td width="25"><span class="mtgMenuItemIcon mtgSortAscendingIcon">&nbsp;</span></td>';
        html[idx++] = '<td>'+this._messages.sortAsc+'</td></tr></table>';
        html[idx++] = '</a>';
        html[idx++] = '</li>';
        html[idx++] = '<li>';
        html[idx++] = '<a id="mtgSortDesc'+id+'" class="mtgMenuItem" href="javascript:void(0)">';
        html[idx++] = '<table cellspacing="0" cellpadding="0" width="100%" border="0">';
        html[idx++] = '<tr><td width="25"><span class="mtgMenuItemIcon mtgSortDescendingIcon">&nbsp;</span></td>';
        html[idx++] = '<td>'+this._messages.sortDesc+'</td></tr></table>';
        html[idx++] = '</a>';
        html[idx++] = '</li>';
        html[idx++] = '<li class="mtgSelectAll">';
        html[idx++] = '<a class="mtgMenuItem" href="javascript:void(0)">';
        html[idx++] = '<table cellspacing="0" cellpadding="0" width="100%" border="0">';
        html[idx++] = '<tr><td width="25"><span class="mtgMenuItemChk"><input type="checkbox" id="mtgSelectAll'+id+'"></span></td>';
        html[idx++] = '<td>'+this._messages.selectAll+'</td></tr></table>';
        html[idx++] = '</a>';
        html[idx++] = '</li>';
        html[idx++] = '</ul>';
        html[idx++] = '</div>';

        // Adding resize markers
        html[idx++] = '<div id="resizeMarkerLeft'+id+'" class="mtgResizeMarker">';
        html[idx++] = '</div>';
        html[idx++] = '<div id="resizeMarkerRight'+id+'" class="mtgResizeMarker">';
        html[idx++] = '</div>';

        // Adding Dragging controls
        html[idx++] = '<div id="mtgColMoveTop'+id+'" class="mtgColMoveTop">&nbsp;</div>';
        html[idx++] = '<div id="mtgColMoveBottom'+id+'" class="mtgColMoveBottom">&nbsp;</div>';

        html[idx++] = '<div id="dragColumn'+id+'" class="dragColumn" style="width:100px;height:18px;">';
        html[idx++] = '<span class="columnTitle">&nbsp;</span>';
        html[idx++] = '<div class="drop-no">&nbsp;</div>';
        html[idx++] = '</div>';

        html[idx++] = '</div>'; // closes Table Div;
        return html.join('');
    },

    /**
     * Creates the Table Body
     */
    _createTableBody : function(rows) {
        var id = this._mtgId;
        var renderedRowsAllowed = this.renderedRowsAllowed;
        var renderedRows = this.renderedRows;
        var cellHeight = this.cellHeight;
        var headerWidth = this.headerWidth;
        var self = this;
        var html = [];
        var idx = 0;
        var firstRenderingFlg = false;
        if (renderedRows == 0) firstRenderingFlg = true;

        if (firstRenderingFlg) {
            this.innerBodyDiv.setStyle({height: (rows.length * cellHeight) + 'px'});
            html[idx++] = '<table id="mtgBT'+id+'" border="0" cellspacing="0" cellpadding="0" width="'+headerWidth+'" class="mtgBodyTable">';
            html[idx++] = '<tbody>';
        }
        var lastRowToRender = renderedRows + renderedRowsAllowed;
        if (lastRowToRender > rows.length) lastRowToRender = rows.length;
        this._showLoaderSpinner();
        for (var i = renderedRows; i < lastRowToRender; i++) {
            rows[i] = this._fromArrayToObject(rows[i]);
            html[idx++] = self._createRow(rows[i], i);
            renderedRows++;
        }

        if (firstRenderingFlg) {
            html[idx++] = '</tbody>';
            html[idx++] = '</table>';
        }
        this.renderedRows = renderedRows;
        setTimeout(function(){self._hideLoaderSpinner();},1.5); //just to see the spinner
        return html.join('');
    },

    /**
     * Creates a row
     */
    _createRow : function(row, rowIdx) {
        var id = this._mtgId;
        var tdTmpl = '<td id="mtgC{id}_{x},{y}" height="{height}" width="{width}" style="width:{width}px;height:{height}px;padding:0;margin:0;display:{display}" class="mtgCell mtgC{id} mtgC{id}_{x} mtgR{id}_{y}">';
        var icTmpl = '<div id="mtgIC{id}_{x},{y}" style="width:{width}px;height:{height}px;padding:3px;text-align:{align}" class="mtgInnerCell mtgIC{id} mtgIC{id}_{x} mtgIR{id}_{y}">';
        var checkboxTmpl = '<input id="mtgInput{id}_{x},{y}" name="mtgInput{id}_{x},{y}" type="checkbox" value="{value}" class="mtgInput{id}_{x} mtgInputCheckbox" checked="{checked}">';
        var radioTmpl = '<input id="mtgInput{id}_{x},{y}" name="mtgInput{id}_{x}" type="radio" value="{value}" class="mtgInput{id}_{x} mtgInputRadio">';
        if (Prototype.Browser.Opera || Prototype.Browser.WebKit) {
            checkboxTmpl = '<input id="mtgInput{id}_{x},{y}" name="mtgInput{id}_{x},{y}" type="checkbox" value="{value}" class="mtgInput{id}_{x}" checked="{checked}">';
            radioTmpl = '<input id="mtgInput{id}_{x},{y}" name="mtgInput{id}_{x}" type="radio" value="{value}" class="mtgInput{id}_{x}">';
        }
        var rs = this.rowStyle || function(){return '';}; // row style handler
        var rc = this.rowClass || function(){return '';}; // row class handler
        var cellHeight = this.cellHeight;
        var iCellHeight = cellHeight - 6;
        var cm = this.columnModel;
        var gap = this.gap == 0? 2 : 0;
        var html = [];
        var idx = 0;
        html[idx++] = '<tr id="mtgRow'+id+'_'+rowIdx+'" class="mtgRow'+id+' '+rc(rowIdx)+'" style="'+rs(rowIdx)+'">';
        for (var j = 0; j < cm.length; j++) {
            var columnId = cm[j].id;
            var type = cm[j].type || 'string';
            var cellWidth = parseInt(cm[j].width); // consider border at both sides
            var iCellWidth = cellWidth - 6 - gap; // consider padding at both sides
            var editor = cm[j].editor || null;
            var normalEditorFlg = !(editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox || editor == 'radio' || editor instanceof MY.TableGrid.CellRadioButton || editor instanceof MY.ComboBox);
            var alignment = 'left';
            var display = '\'\'';
            if (!cm[j].hasOwnProperty('renderer')) {
                if (type == 'number')
                    alignment = 'right';
                else if (type == 'boolean')
                    alignment = 'center';
            }

            if (cm[j].hasOwnProperty('align')) {
                alignment = cm[j].align;
            }
            if (!cm[j].visible) {
                display = 'none';
            }
            var temp = tdTmpl.replace(/\{id\}/g, id);
            temp = temp.replace(/\{x\}/g, j);
            temp = temp.replace(/\{y\}/g, rowIdx);
            temp = temp.replace(/\{width\}/g, cellWidth);
            temp = temp.replace(/\{height\}/g, cellHeight);
            temp = temp.replace(/\{display\}/g, display);
            html[idx++] = temp;
            temp = icTmpl.replace(/\{id\}/g, id);
            temp = temp.replace(/\{x\}/g, j);
            temp = temp.replace(/\{y\}/g, rowIdx);
            temp = temp.replace(/\{width\}/, iCellWidth);
            temp = temp.replace(/\{height\}/, iCellHeight);
            temp = temp.replace(/\{align\}/, alignment);
            html[idx++] = temp;
            if (normalEditorFlg) { // checkbox is an special case
                if (!cm[j].hasOwnProperty('renderer')) {
                    html[idx++] = row[columnId];
                } else {
                    html[idx++] = cm[j].renderer(row[columnId], this.getRow(rowIdx));
                }
            } else if (editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox) {
                temp = checkboxTmpl.replace(/\{id\}/g, id);
                temp = temp.replace(/\{x\}/g, j);
                temp = temp.replace(/\{y\}/g, rowIdx);
                temp = temp.replace(/\{value\}/, row[columnId]);
                if (editor.selectable == 'undefined' || !editor.selectable) {
                    var selectAllFlg = cm[j].selectAllFlg;
                    if (editor.hasOwnProperty('getValueOf')) {
                        var trueVal = editor.getValueOf(true);
                        if (row[columnId] == trueVal || selectAllFlg) {
                            temp = temp.replace(/\{checked\}/, 'checked');
                        } else {
                            temp = temp.replace(/checked=.*?>/, '');
                        }
                    } else {
                        if (eval(row[columnId]) || selectAllFlg) {  //must be true or false
                            temp = temp.replace(/\{checked\}/, 'checked');
                        } else {
                            temp = temp.replace(/checked=.*?>/, '');
                        }
                    }
                } else { // When is selectable
                    if (cm[j].selectAllFlg)
                        temp = temp.replace(/\{checked\}/, 'checked');
                    else
                        temp = temp.replace(/checked=.*?>/, '');
                }
                html[idx++] = temp;
            } else if (editor == 'radio' || editor instanceof MY.TableGrid.CellRadioButton) {
                temp = radioTmpl.replace(/\{id\}/g, id);
                temp = temp.replace(/\{x\}/g, j);
                temp = temp.replace(/\{y\}/g, rowIdx);
                temp = temp.replace(/\{value\}/, row[columnId]);
                html[idx++] = temp;
            } else if (editor instanceof MY.ComboBox) {
                if (!cm[j].hasOwnProperty('renderer')) {
                    cm[j].renderer = function(value, list) {
                        var result = value;
                        for (var i = 0; i < list.length; i++) {
                            if (list[i].value == value) result = list[i].text;
                        }
                        return result;
                    };
                }
                html[idx++] = cm[j].renderer(row[columnId], editor.getItems(), this.getRow(rowIdx));
            }
            html[idx++] = '</div>';
            html[idx++] = '</td>';
        }
        html[idx++] = '</tr>';
        return html.join('');
    },

    _toggleLoadingOverlay : function() {
        var id = this._mtgId;
        var overlayDiv = $('overlayDiv'+id);
        if (overlayDiv.getStyle('visibility') == 'hidden') {
            this._hideMenus();
            overlayDiv.setStyle({visibility : 'visible'});
        } else {
            overlayDiv.setStyle({visibility : 'hidden'});
        }
    },
    /**
     * Applies cell callbacks
     */
    _applyCellCallbacks : function() {
        var renderedRows = this.renderedRows;
        var renderedRowsAllowed = this.renderedRowsAllowed;
        var beginAtRow = renderedRows - renderedRowsAllowed;
        if (beginAtRow < 0) beginAtRow = 0;
        for (var j = beginAtRow; j < renderedRows; j++) {
            this._applyCellCallbackToRow(j);
        }
    },

    _applyCellCallbackToRow : function(y) {
        var id = this._mtgId;
        var cm = this.columnModel;
        var self = this;
        for (var i = 0; i < cm.length; i++) {
            var editor = cm[i].editor;
            if ((editor == 'radio' || editor instanceof MY.TableGrid.CellRadioButton) ||
                (editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox)) {
                var element = $('mtgInput'+id + '_' + i + ',' + y);
                var innerElement = $('mtgIC'+id + '_' + i + ',' + y);
                element.onclick = (function(editor, element, innerElement) {
                    return function() {
                        if (editor.selectable == undefined || !editor.selectable) {
                            var coords = element.id.substring(element.id.indexOf('_') + 1, element.id.length).split(',');
                            var x = coords[0];
                            var y = coords[1];
                            var value = element.checked;
                            if (editor.hasOwnProperty('getValueOf')) value = editor.getValueOf(element.checked);
                            self.setValueAt(value, x, y, false);
                            if (y >= 0 && self.modifiedRows.indexOf(y) == -1) self.modifiedRows.push(y); //if doesn't exist in the array the row is registered
                        }
                        if (editor.onClickCallback) editor.onClickCallback(element.value, element.checked);
                        if (editor.selectable == undefined || !editor.selectable)
                            innerElement.addClassName('modifiedCell');
                    };
                })(editor, element, innerElement);
            }
        }
    },

    getId : function() {
        return this._mtgId;
    },

    _showLoaderSpinner : function() {
        var id = this._mtgId;
        var loaderSpinner = $('mtgLoader'+id);
        if(loaderSpinner) loaderSpinner.show();
    },

    _hideLoaderSpinner : function() {
        var id = this._mtgId;
        var loaderSpinner = $('mtgLoader'+id);
        if(loaderSpinner) loaderSpinner.hide();
    },

    _hideMenus : function() {
        var id = this._mtgId;
        var hb = $('mtgHB'+id);
        var hbm = $('mtgHBM'+id);
        var sm = $('mtgSM'+id);
        if (hb) hb.setStyle({visibility: 'hidden'});
        if (hbm) hbm.setStyle({visibility: 'hidden'});
        if (sm) sm.setStyle({visibility: 'hidden'});
    },

    /**
     * Creates the Setting Menu
     */
    _createSettingMenu : function() {
        var id = this._mtgId;
        var cm = this.columnModel;
        var bh = this.bodyHeight + 30;
        var cellHeight = (Prototype.Browser.IE)? 25 : 22;
        var height = (cm.length * 25 > bh)? bh : 0;
        var html = [];
        var idx = 0;
        if (height > 0)
            html[idx++] = '<div id="mtgSM'+id+'" class="mtgMenu shadow" style="height:'+height+'px">';
        else
            html[idx++] = '<div id="mtgSM'+id+'" class="mtgMenu shadow">';
        html[idx++] = '<ul>';
        for (var i = 0; i < cm.length; i++) {
            var column = cm[i];
            html[idx++] = '<li>';
            html[idx++] = '<a href="#" class="mtgMenuItem">';
            html[idx++] = '<table border="0" cellpadding="0" cellspacing="0" width="100%">';
            html[idx++] = '<tr><td width="25"><span><input id="'+column.id+'" type="checkbox" checked="'+column.visible+'"></span></td>';
            html[idx++] = '<td><label for="'+column.id+'">&nbsp;'+ column.title+'</label></td></tr>';
            html[idx++] = '</table>';
            html[idx++] = '</a>';
            html[idx++] = '</li>';
        }
        html[idx++] = '</ul>';
        html[idx++] = '</div>';
        return html.join('');
    },

    /**
     * Applies Setting Menu behavior
     */
    _applySettingMenuBehavior : function() {
        var self = this;
        var settingMenu = $('mtgSM' + this._mtgId);
        var settingButton = $('mtgSB' + this._mtgId);

        var width = settingMenu.getWidth();

        settingButton.on('click', function() {
            if (settingMenu.getStyle('visibility') == 'hidden') {
                var topPos = settingButton.offsetTop;
                var leftPos = settingButton.offsetLeft;
                settingMenu.setStyle({
                    top: (topPos + 16) + 'px',
                    left: (leftPos - width + 16) + 'px',
                    visibility: 'visible'
                });
            } else {
                settingMenu.setStyle({visibility: 'hidden'});
            }
        });

        var miFlg = false;
        settingMenu.on('mousemove', function(event) {
            miFlg = true;
        });

        settingMenu.on('mouseout', function(event) {
            miFlg = false;
            var element = event.element();
            setTimeout(function() {
                if (!element.descendantOf(settingMenu) && !miFlg)
                    settingMenu.setStyle({visibility: 'hidden'});
            },500);
        });

        $('mtgSM'+this._mtgId).select('input').each(function(checkbox, index) {
            checkbox.onclick = function() {
                self._toggleColumnVisibility(index, checkbox.checked);
            };
        });
    },

    /**
     * Synchronizes horizontal scrolling
     */
    _syncScroll : function() {
        var id = this._mtgId;
        var keys = this.keys;
        var bodyDiv = this.bodyDiv;
        var headerRowDiv = this.headerRowDiv;
        var bodyTable = this.bodyTable;
        var renderedRows = this.renderedRows;

        this.scrollLeft = headerRowDiv.scrollLeft = bodyDiv.scrollLeft;
        this.scrollTop = bodyDiv.scrollTop;

        $('mtgHB' + id).setStyle({visibility: 'hidden'});

        if (renderedRows < this.rows.length
            && (bodyTable.getHeight() - bodyDiv.scrollTop - 10) < bodyDiv.clientHeight) {
            var html = this._createTableBody(this.rows);
            bodyTable.down('tbody').insert(html);
            this._addKeyBehavior();
            this._applyCellCallbacks();
            keys.addMouseBehavior();
        }
    },

    /**
     * Makes all columns resizable
     */
    _makeAllColumnsResizable : function() {
        var id = this._mtgId;
        var headerHeight = this.headerHeight;
        var scrollBarWidth = this.scrollBarWidth;
        var topPos = 0;
        if (this.options.title) topPos += this.titleHeight;
        if (this.options.toolbar) topPos += this.toolbarHeight;
        var columnIndex;
        var self = this;
        var leftPos = 0;
        $$('.mtgHS' + this._mtgId).each(function(separator, index) {
            Event.observe(separator, 'mousemove', function() {
                columnIndex = parseInt(separator.id.substring(separator.id.indexOf('_') + 1, separator.id.length));
                if (columnIndex >= 0) {
                    leftPos = $('mtgHC' + id + '_' + columnIndex).offsetLeft - self.scrollLeft;
                    leftPos += $('mtgHC' + id + '_' + columnIndex).offsetWidth - 1;
                    self.resizeMarkerRight.setStyle({
                        height: (self.bodyHeight + headerHeight) + 'px',
                        top: (topPos + 2) + 'px',
                        left: leftPos + 'px'
                    });
                }
            });
        });

        new Draggable(self.resizeMarkerRight, {
            constraint: 'horizontal',
            onStart : function() {
                var markerHeight = self.bodyHeight + headerHeight + 2;
                if (self._hasHScrollBar()) markerHeight = markerHeight - scrollBarWidth + 1;

                self.resizeMarkerRight.setStyle({
                    height: markerHeight + 'px',
                    backgroundColor: 'dimgray'
                });

                var leftPos = $('mtgHC' + id + '_' + columnIndex).offsetLeft - self.scrollLeft;

                self.resizeMarkerLeft.setStyle({
                    height: markerHeight + 'px',
                    top: (topPos + 2) + 'px',
                    left: leftPos + 'px',
                    backgroundColor: 'dimgray'
                });
            },

            onEnd : function() {
                var newWidth = parseInt(self.resizeMarkerRight.getStyle('left')) - parseInt(self.resizeMarkerLeft.getStyle('left'));
                if (newWidth > 0 && columnIndex != null) {
                    setTimeout(function() {
                        self._resizeColumn(columnIndex, newWidth);
                    }, 0);
                }

                self.resizeMarkerLeft.setStyle({
                    backgroundColor: 'transparent',
                    left: 0
                });

                self.resizeMarkerRight.setStyle({
                    backgroundColor: 'transparent'
                });
            },
            endeffect : false
        });
    },

    /**
     * Resizes a column to a new size
     *
     * @param index the index column position
     * @param newWidth resizing width
     */
    _resizeColumn: function(index, newWidth) {
        var id = this._mtgId;
        var cm = this.columnModel;
        var gap = this.gap;
        var self = this;

        var oldWidth = parseInt($('mtgHC' + id + '_' + index).width);
        var editor = cm[index].editor;
        var checkboxOrRadioFlg = (editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox || editor == 'radio' || editor instanceof MY.TableGrid.CellRadioButton);

        $('mtgHC' + id + '_' + index).width = newWidth;
        $('mtgHC' + id + '_' + index).setStyle({width: newWidth + 'px'});
        $('mtgIHC' + id + '_' + index).setStyle({width: (newWidth - 8 - ((gap == 0) ? 2 : 0)) + 'px'});

        $$('.mtgC' + id + '_' + index).each(function(cell) {
            cell.width = newWidth;
            cell.setStyle({width: newWidth + 'px'});
        });

        $$('.mtgIC' + id + '_' + index).each(function(cell) {
            var cellId = cell.id;
            var coords = cellId.substring(cellId.indexOf('_') + 1, cellId.length).split(',');
            var y = coords[1];
            var value = self.getValueAt(index, y);
            cell.setStyle({width: (newWidth - 6 - ((gap == 0) ? 2 : 0)) + 'px'});
            if (!checkboxOrRadioFlg) {
                if (cm[index].renderer) {
                    if (editor instanceof MY.ComboBox)
                        value = cm[index].renderer(value, editor.getItems(), self.getRow(y));
                    else
                        value = cm[index].renderer(value, self.getRow(y));
                }
                cell.innerHTML = value;
            }
        });

        this.headerWidth = this.headerWidth - (oldWidth - newWidth);

        $('mtgHRT' + id).width = this.headerWidth + 21;
        $('mtgBT' + id).width = this.headerWidth;

        this.columnModel[index].width = newWidth;
        this._syncScroll();
    },

    _hasHScrollBar : function() {
        return (this.headerWidth + 20) > this.tableWidth;
    },

    /**
     * Makes all columns draggable
     */
    _makeAllColumnDraggable : function() {
        this.separators = [];
        var i = 0;
        var id = this._mtgId;
        var self = this;
        $$('.mtgHS' + this._mtgId).each(function(separator) {
            self.separators[i++] = separator;
        });

        var topPos = 0;
        if (this.options.title) topPos += this.titleHeight;
        if (this.options.toolbar) topPos += this.toolbarHeight;

        var dragColumn = $('dragColumn' + id);

        $$('.mtgIHC' + id).each(function(column, index) {
            var columnIndex = -1;
            Event.observe(column, 'mousemove', function() {
                var leftPos = column.up().offsetLeft;
                dragColumn.setStyle({
                    top: (topPos + 15) + 'px',
                    left: (leftPos - self.scrollLeft + 15) + 'px'
                });
            });
            new Draggable(dragColumn, {
                handle : column,
                onStart : function() {
                    for (var i = 0; i < self.columnModel.length; i++) {
                        if (index == self.columnModel[i].positionIndex) {
                            columnIndex = i;
                            break;
                        }
                    }
                    if (Prototype.Browser.IE) {
                        // The drag might register an ondrag or onselectstart event when using IE
                        Event.observe(document.body, "drag", function() {return false;}, false);
                        Event.observe(document.body, "selectstart",	function() {return false;}, false);
                    }
                    dragColumn.down('span').innerHTML = self.columnModel[columnIndex].title;
                    dragColumn.setStyle({visibility: 'visible'});
                },
                onDrag : function() {
                    var leftPos = parseInt(dragColumn.getStyle('left'));
                    var width = parseInt(dragColumn.getStyle('width'));
                    setTimeout(function(){
                        self._detectDroppablePosition(leftPos + width / 2, width, dragColumn, columnIndex);
                    }, 0);
                },
                onEnd : function() {
                    dragColumn.setStyle({visibility: 'hidden'});
                    self.colMoveTopDiv.setStyle({visibility: 'hidden'});
                    self.colMoveBottomDiv.setStyle({visibility: 'hidden'});
                    if (columnIndex >=0 && self.targetColumnId >= 0) {
                        setTimeout(function(){
                            self._moveColumn(columnIndex, self.targetColumnId);
                            columnIndex = -1;
                        }, 0);
                    }
                },
                endeffect : false
            });
        });
    },

    /**
     * Detects dropable position when the mouse pointer is over a header cell
     * separator
     */
    _detectDroppablePosition : function(columnPos, width, dragColumn, index) {
        var topPos = -10;
        if (this.options.title) topPos += this.headerHeight;
        if (this.options.toolbar) topPos += this.headerHeight;
        var sepLeftPos = 0;
        var cm = this.columnModel;
        var gap = this.gap;
        var scrollLeft = this.scrollLeft;
        var colMoveTopDiv = this.colMoveTopDiv;
        var colMoveBottomDiv = this.colMoveBottomDiv;

        for (var i = 0; i < cm.length; i++) {
            if (cm[i].visible) sepLeftPos += parseInt(cm[i].width) + gap;
            if (columnPos > (sepLeftPos - scrollLeft)
                    && (columnPos - (sepLeftPos - this.scrollLeft)) < (width / 2)) {
                colMoveTopDiv.setStyle({
                    top: topPos + 'px',
                    left: (sepLeftPos - scrollLeft - 4) + 'px',
                    visibility : 'visible'
                });
                colMoveBottomDiv.setStyle({
                    top: (topPos + 34) + 'px',
                    left: (sepLeftPos - scrollLeft - 4) + 'px',
                    visibility : 'visible'
                });
                this.targetColumnId = i;
                dragColumn.down('div').className = (i != index)? 'drop-yes' : 'drop-no';
                break;
            } else {
                colMoveTopDiv.setStyle({visibility : 'hidden'});
                colMoveBottomDiv.setStyle({visibility : 'hidden'});
                this.targetColumnId = null;
                dragColumn.down('div').className = 'drop-no';
            }
        }
    },

    /**
     * Moves a column from one position to a new one
     *
     * @param fromColumnId initial position
     * @param toColumnId target position
     */
    _moveColumn : function(fromColumnId, toColumnId) {
        // Some validations
        if (fromColumnId == null
            || toColumnId == null
            || fromColumnId == toColumnId
            || (toColumnId + 1 == fromColumnId && fromColumnId == this.columnModel.length -1)) return;

        var id = this._mtgId;
        var cm = this.columnModel;
        var keys = this.keys;
        var renderedRows = this.renderedRows;
        var numberOfRowsAdded = this.newRowsAdded.length;

        $('mtgHB' + id).setStyle({visibility: 'hidden'}); // in case the cell menu button is visible
        this._blurCellElement(keys._nCurrentFocus); //in case there is a cell in editing mode
        keys.blur(); //remove the focus of the selected cell

        var removedHeaderCell = null;
        var targetHeaderCell = null;
        var removedCells = null;
        var tr = null;
        var targetId = null;
        var targetCell = null;
        var idx = 0;
        var i = 0;
        var last = null;

        if (toColumnId == 0) { // moving to the left to first column
            removedHeaderCell = $('mtgHC'+id+'_'+fromColumnId).remove();
            targetHeaderCell = $('mtgHC'+id+'_'+ toColumnId);
            targetHeaderCell.up().insertBefore(removedHeaderCell, targetHeaderCell);

            // Moving cell elements
            removedCells = [];
            idx = 0;
            $$('.mtgC'+id+'_'+fromColumnId).each(function(element){
                removedCells[idx++] = element.remove();
            });

            if (numberOfRowsAdded > 0) {
                for (i = -numberOfRowsAdded; i < 0; i++) {
                    targetCell = $('mtgC'+id+'_'+toColumnId+','+i);
                    targetCell.up().insertBefore(removedCells[i+numberOfRowsAdded], targetCell);
                }
            }

            for (i = numberOfRowsAdded; i < (renderedRows+numberOfRowsAdded); i++) {
                targetCell = $('mtgC'+id+'_'+toColumnId+','+(i-numberOfRowsAdded));
                targetCell.up().insertBefore(removedCells[i], targetCell);
            }
        } else if (toColumnId > 0 && toColumnId < cm.length - 1) { // moving in between
            removedHeaderCell = $('mtgHC'+id+'_'+fromColumnId).remove();
            targetId = toColumnId + 1;
            if (targetId == fromColumnId) targetId--;
            targetHeaderCell = $('mtgHC'+id+'_'+ targetId);
            targetHeaderCell.up().insertBefore(removedHeaderCell, targetHeaderCell);

            // Moving cell elements
            removedCells = [];
            idx = 0;
            $$('.mtgC'+id+'_'+fromColumnId).each(function(element){
                removedCells[idx++] = element.remove();
            });

            if (numberOfRowsAdded > 0) {
                for (i = -numberOfRowsAdded; i < 0; i++) {
                    targetCell = $('mtgC'+id+'_'+targetId+','+i);
                    targetCell.up().insertBefore(removedCells[i+numberOfRowsAdded], targetCell);
                }
            }

            for (i = numberOfRowsAdded; i < (renderedRows+numberOfRowsAdded); i++) {
                targetCell = $('mtgC'+id+'_'+targetId+','+(i-numberOfRowsAdded));
                targetCell.up().insertBefore(removedCells[i], targetCell);
            }
        } else if (toColumnId == cm.length - 1) { // moving to the last column
            tr = $('mtgHC'+id+'_'+fromColumnId).up();
            removedHeaderCell = $('mtgHC'+id+'_'+fromColumnId).remove();
            last = $('mtgHC'+id+'_'+ cm.length);
            tr.insertBefore(removedHeaderCell, last);

            // Moving cell elements
            removedCells = [];
            idx = 0;
            $$('.mtgC'+id+'_'+fromColumnId).each(function(element){
                removedCells[idx++] = element.remove();
            });

            if (numberOfRowsAdded > 0) {
                for (i = -numberOfRowsAdded; i < 0; i++) {
                    tr = $('mtgRow'+id+'_'+i);
                    tr.insert(removedCells[i+numberOfRowsAdded]);
                }
            }

            for (i = numberOfRowsAdded; i < (renderedRows+numberOfRowsAdded); i++) {
                tr = $('mtgRow'+id+'_'+(i-numberOfRowsAdded));
                tr.insert(removedCells[i]);
            }
        }

        // Update column model
        var columnModelLength = cm.length;
        var columnModelEntry = cm[fromColumnId];
        cm[fromColumnId] = null;
        cm = cm.compact();
        var aTemp = [];
        var k = 0;
        var targetColumnId = toColumnId;
        if (toColumnId > 0 && toColumnId < fromColumnId) targetColumnId++;
        if (targetColumnId == fromColumnId) targetColumnId--;
        for (var c = 0; c < columnModelLength; c++) {
            if (c == targetColumnId) aTemp[k++] = columnModelEntry;
            if (c < (columnModelLength - 1))
                aTemp[k++] = cm[c];
        }
        cm = this.columnModel = aTemp;
        $('mtgHRT'+id).select('th').each(function(th, index){
            if (index < cm.length) {
                th.id = 'mtgHC'+id+'_'+index;
                try {
                    var ihc = th.down('div.mtgInnerHeaderCell');
                    ihc.id = 'mtgIHC'+id+'_'+index;
                    ihc.down('span').id = 'mtgSortIcon'+id+'_'+index;
                    var hs = th.down('div.mtgHS');
                    hs.id = 'mtgHS'+id+'_'+index;
                } catch (ihc_ex) {
                    // exception of ihc.down('div') being non existant
                }
            }
        });

        // Recreates cell indexes
        for (i = -numberOfRowsAdded; i < renderedRows; i++) {
            $$('.mtgR'+id+'_'+i).each(function(td, index) {
                td.id = 'mtgC'+id+'_'+index+','+i;
                td.className = 'mtgCell mtgC'+id+' mtgC'+id+'_'+index+' mtgR'+id+'_'+i;
            });

            $$('.mtgIR'+id+'_'+i).each(function(div, index) {
                div.id = 'mtgIC'+id+'_'+index+','+i;
                var modifiedCellClass = (div.className.match(/modifiedCell/)) ? ' modifiedCell' : '';
                div.className = 'mtgInnerCell mtgIC'+id+' mtgIC'+id+'_'+index+' mtgIR'+id+'_'+i+modifiedCellClass;
                if (div.firstChild && div.firstChild.tagName == 'INPUT') { // when it contains a checkbox or radio button
                    var input = div.firstChild;
                    input.id = 'mtgInput'+id+'_'+index+','+i;
                    input.name = 'mtgInput'+id+'_'+index+','+i;
                    //input.className =  input.className.replace(/mtgInput.*?_.*?\s/, 'mtgInput'+id+'_'+index+' ');
                    input.className =  'mtgInput'+id+'_'+index;
                }
            });
        }
        if (fromColumnId == this.sortedColumnIndex) this.sortedColumnIndex = toColumnId;
    },

    /**
     * Add Key behavior functionality to the table grid
     */
    _addKeyBehavior : function() {
        var rows = this.rows;
        var renderedRows = this.renderedRows;
        var renderedRowsAllowed = this.renderedRowsAllowed;
        var beginAtRow = renderedRows - renderedRowsAllowed;
        if (beginAtRow < 0) beginAtRow = 0;
        for (var j = beginAtRow; j < renderedRows; j++) {
            this._addKeyBehaviorToRow(rows[j], j);
        }
    },

    _addKeyBehaviorToRow : function(row, j) {
        var self = this;
        var id = this._mtgId;
        var cm = this.columnModel;
        var keys = this.keys;

        for (var i = 0; i < cm.length; i++) {
            var element = $('mtgC'+id+'_'+i+','+j);
            if (cm[i].editable) {
                keys.event.remove.action(element);
                keys.event.remove.esc(element);
                keys.event.remove.blur(element);

                var f_action = (function(element) {
                    return function() {
                        if (self.editedCellId == null || self.editedCellId != element.id) {
                            self.editedCellId = element.id;
                            self._editCellElement(element);
                        } else {
                            if (self._blurCellElement(element))
                                self.editedCellId = null;
                        }
                    };
                })(element);
                keys.event.action(element, f_action);

                var f_esc = (function(element) {
                    return function() {
                        if (self._blurCellElement(element))
                            self.editedCellId = null;
                    };
                })(element);
                keys.event.esc(element, f_esc);

                var f_blur = (function(x, y, element) {
                    return function() {
                        if (self._blurCellElement(element))
                            self.editedCellId = null;
                        if (self.onCellBlur) self.onCellBlur(element, row[x], x, y, cm[x].id);
                    };
                })(i, j, element);
                keys.event.blur(element, f_blur);
            }

            keys.event.remove.focus(element);
            var f_focus = (function(x, y, element) {
                return function() {
                    if (self.onCellFocus) {
                        self.onCellFocus(element, row[x], x, y, cm[x].id);
                    }
                };
            })(i, j, element);
            keys.event.focus(element, f_focus);
        }
    },

    /**
     *  When a cell is edited
     */
    _editCellElement : function(element) {
        this.keys._bInputFocused = true;
        var cm = this.columnModel;
        var coords = this.getCurrentPosition();
        var x = coords[0];
        var y = coords[1];
        var width = parseInt(element.getStyle('width'));
        var height = parseInt(element.getStyle('height'));
        var innerElement = element.down();
        var value = this.getValueAt(x, y);
        var editor = this.columnModel[x].editor || 'input';
        var type = this.columnModel[x].type || 'string';
        var input = null;
        var isInputFlg = !(editor == 'radio' || editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox || editor instanceof MY.TableGrid.CellRadioButton);

        if (isInputFlg) {
            element.setStyle({
                height: this.cellHeight + 'px'
            });
            innerElement.setStyle({
                position: 'relative',
                width: width + 'px',
                height: height + 'px',
                padding: '0',
                border: '0',
                margin: '0'
            });
            innerElement.innerHTML = '';
            if (editor instanceof MY.ComboBox) { // when is a list
                value = cm[x].renderer(value, editor.getItems(), this.getRow(y));
            }
            // Creating a normal input
            var inputId = 'mtgInput' + this._mtgId + '_' + x + ',' + y;
            input = new Element('input', {id: inputId, type: 'text', value: value});
            input.addClassName('mtgInputText');
            input.setStyle({
                padding : '3px',
                width: (width - 8) + 'px'
            });
            innerElement.insert(input);
            editor.render(input);
            input.focus();
            input.select();
        } else if (editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox) {
            input = $('mtgInput' + this._mtgId + '_' + x + ',' + y);
            input.checked = (!input.checked);
            if (editor.selectable == undefined || !editor.selectable) {
                value = input.checked;
                if (editor.hasOwnProperty('getValueOf')) value = editor.getValueOf(input.checked);
                this.setValueAt(value, x, y, false);
                if (y >= 0 && this.modifiedRows.indexOf(y) == -1) this.modifiedRows.push(y); //if doesn't exist in the array the row is registered
            }
            if (editor instanceof MY.TableGrid.CellCheckbox && editor.onClickCallback) {
                editor.onClickCallback(value, input.checked);
            }
            this.keys._bInputFocused = false;
            this.editedCellId = null;
            if (editor.selectable == undefined || !editor.selectable)
                if(y >= 0) innerElement.addClassName('modifiedCell');
        } else if (editor == 'radio' || editor instanceof MY.TableGrid.CellRadioButton) {
            input = $('mtgInput' + this._mtgId + '_' + x + ',' + y);
            input.checked = (!input.checked);
            value = input.checked;
            if (editor.hasOwnProperty('getValueOf')) value = editor.getValueOf(input.checked);
            this.setValueAt(value, x, y, false);
            if (y >= 0 && this.modifiedRows.indexOf(y) == -1) this.modifiedRows.push(y); //if doesn't exist in the array the row is registered
            if (editor instanceof MY.TableGrid.CellRadioButton && editor.onClickCallback) {
                editor.onClickCallback(value, input.checked);
            }
            this.keys._bInputFocused = false;
            this.editedCellId = null;
            if (editor.selectable == undefined || !editor.selectable)
                if(y >= 0) innerElement.addClassName('modifiedCell');
        }
    },

    /**
     * When the cell is blured
     */
    _blurCellElement : function(element) {
        if (!this.keys._bInputFocused) return;
        var id = this._mtgId;
        var keys = this.keys;
        var cm = this.columnModel;
        var width = parseInt(element.getStyle('width'));
        var height = parseInt(element.getStyle('height'));
        var coords = this.getCurrentPosition();
        var x = coords[0];
        var y = coords[1];
        var cellHeight = this.cellHeight;
        var innerId = 'mtgIC' + id + '_' + x + ',' + y;
        var input = $('mtgInput' + id + '_' + x + ',' + y);
        var innerElement = $(innerId);
        var value = input.value;
        var editor = cm[x].editor || 'input';
        var type = cm[x].type || 'string';
        var columnId = cm[x].id;
        var alignment = (type == 'number')? 'right' : 'left';

        var isInputFlg = !(editor == 'radio' || editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox || editor instanceof MY.TableGrid.CellRadioButton);
        if (isInputFlg) {
            if (editor.hide) editor.hide(); // this only happen when editor is a Combobox
            if (editor instanceof MY.DatePicker && editor.visibleFlg) return false;
            if (editor.validate) { // this only happen when there is a validate method
                var isValidFlg = editor.validate(value, input);
                if (editor instanceof MY.ComboBox && !isValidFlg) {
                    value = editor.getItems()[0][editor.listTextPropertyName];
                } else {
                    if (!isValidFlg) {
                        if (y >= 0)
                            value = this.rows[y][columnId];
                        else
                            value = this.newRowsAdded[Math.abs(y)-1][columnId];
                    }
                }
            }

            element.setStyle({
                height: cellHeight + 'px'
            });

            innerElement.setStyle({
                width : (width - 6) + 'px',
                height : (height - 6) + 'px',
                padding: '3px',
                textAlign: alignment
            }).update(value);
        }

        /*
        if (editor instanceof MY.ComboBox) { // I hope I can find a better solution
            value = editor.getSelectedValue(value);
        }
        */

        if (y >= 0 && this.rows[y][columnId] != value) {
            this.rows[y][columnId] = value;
            innerElement.addClassName('modifiedCell');
            if (this.modifiedRows.indexOf(y) == -1) this.modifiedRows.push(y); //if doesn't exist in the array the row is registered
        } else if (y < 0) {
            this.newRowsAdded[Math.abs(y)-1][columnId] = value;
        }

        if ((editor instanceof MY.TableGrid.BrowseInput || editor instanceof MY.TableGrid.CellInput || editor instanceof MY.DatePicker) && editor.afterUpdateCallback) {
            editor.afterUpdateCallback(element, value);
        }
        keys._bInputFocused = false;
        return true;
    },

    /**
     * Applies header buttons
     */
    _applyHeaderButtons : function() {
        var self = this;
        var id = this._mtgId;
        var headerHeight = this.headerHeight;
        var headerButton = $('mtgHB' + this._mtgId);
        var headerButtonMenu = $('mtgHBM' + this._mtgId);
        var sortAscMenuItem = $('mtgSortAsc'+this._mtgId);
        var sortDescMenuItem = $('mtgSortDesc'+this._mtgId);
        var topPos = 0;
        if (this.options.title) topPos += this.titleHeight;
        if (this.options.toolbar) topPos += this.toolbarHeight;
        var selectedHCIndex = -1;
        $$('.mtgIHC' + id).each(function(element, index) {
            var editor = null;
            var sortable = true;
            var hbHeight = null;
            Event.observe(element, 'mousemove', function() {
                var cm = self.columnModel;
                if (!element.id) return;
                selectedHCIndex = parseInt(element.id.substring(element.id.indexOf('_') + 1, element.id.length));
                editor = cm[selectedHCIndex].editor;
                sortable = cm[selectedHCIndex].sortable;
                hbHeight = cm[selectedHCIndex].height;
                if (sortable || editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox) {
                    var hc = element.up();
                    var leftPos = hc.offsetLeft + hc.offsetWidth;
                    leftPos = leftPos - 16 - self.scrollLeft;
                    if (leftPos < self.bodyDiv.clientWidth) {
                        headerButton.setStyle({
                            top: (topPos + 3 + headerHeight - hbHeight) + 'px',
                            left: leftPos + 'px',
                            height: hbHeight + 'px',
                            visibility: 'visible'
                        });
                    }


                    sortAscMenuItem.onclick = function() {
                        self._sortData(selectedHCIndex, 'ASC');
                    };

                    sortDescMenuItem.onclick = function() {
                        self._sortData(selectedHCIndex, 'DESC');
                    };
                }
            });
            // Sorting when click on header column
            Event.observe(element, 'click', function() {
                if (!element.id) return;
                selectedHCIndex = parseInt(element.id.substring(element.id.indexOf('_') + 1, element.id.length));
                self._toggleSortData(selectedHCIndex);
            });
        });

        Event.observe(headerButton, 'click', function() {
            var cm = self.columnModel;
            if (headerButtonMenu.getStyle('visibility') == 'hidden') {
                if (cm[selectedHCIndex].sortable) {
                    $('mtgSortDesc'+self._mtgId).show();
                    $('mtgSortAsc'+self._mtgId).show();
                } else {
                    $('mtgSortDesc'+self._mtgId).hide();
                    $('mtgSortAsc'+self._mtgId).hide();
                }

                var selectAllItem = $$('#mtgHBM' + id + ' .mtgSelectAll')[0];
                if (self.renderedRows > 0
                        && (cm[selectedHCIndex].editor == 'checkbox'
                            || cm[selectedHCIndex].editor instanceof MY.TableGrid.CellCheckbox)) {
                    selectAllItem.down('input').checked = cm[selectedHCIndex].selectAllFlg;
                    selectAllItem.show();
                    selectAllItem.onclick = function() { // onclick handler
                        var flag = cm[selectedHCIndex].selectAllFlg = $('mtgSelectAll' + id).checked;
                        var selectableFlg = false;
                        if (cm[selectedHCIndex].editor instanceof MY.TableGrid.CellCheckbox
                                && cm[selectedHCIndex].editor.selectable) selectableFlg = true;
                        var renderedRows = self.renderedRows;
                        var beginAtRow = 0;
                        if (self.newRowsAdded.length > 0) beginAtRow = -self.newRowsAdded.length;
                        var x = selectedHCIndex;
                        for (var y = beginAtRow; y < renderedRows; y++) {
                            var element = $('mtgInput' + id + '_' + x +','+y);
                            var value = element.checked = flag;
                            if (!selectableFlg) {
                                if (cm[x].editor.hasOwnProperty('getValueOf')) value = cm[x].editor.getValueOf(element.checked);
                                self.setValueAt(value, x, y, false);
                                // if doesn't exist in the array the row is registered
                                if (y >= 0 && self.modifiedRows.indexOf(y) == -1) self.modifiedRows.push(y);
                            }
                        }
                        //if (cm[selectedHCIndex].editor instanceof MY.TableGrid.CellCheckbox // Maybe this is a mistake
                        //        && cm[selectedHCIndex].editor.onClickCallback) cm[selectedHCIndex].editor.onClickCallback();
                    };
                } else {
                    selectAllItem.hide();
                }

                var leftPos = parseInt(headerButton.getStyle('left'));
                var topPos = self.headerHeight + 2;
                if (self.options.title) topPos += self.titleHeight;
                if (self.options.toolbar) topPos += self.toolbarHeight;
                headerButtonMenu.setStyle({
                    top: topPos + 'px',
                    left: leftPos + 'px',
                    visibility: 'visible'
                });
            } else {
                headerButtonMenu.setStyle({visibility: 'hidden'});
            }
        });

        var miFlg = false;
        Event.observe(headerButtonMenu,'mousemove', function() {
            miFlg = true;
        });

        Event.observe(headerButtonMenu,'mouseout', function(event) {
            miFlg = false;
            var element = event.element();
            setTimeout(function() {
                if (!element.descendantOf(headerButtonMenu) && !miFlg)
                    headerButtonMenu.setStyle({visibility: 'hidden'});
            }, 500);
        });
    },

    _sortData : function(idx, ascDescFlg) {
        var cm = this.columnModel;
        var id = this._mtgId;
        if (cm[idx].sortable) {
            $('mtgSortIcon'+id+'_'+idx).className = (ascDescFlg == 'ASC')? 'mtgSortAscIcon' : 'mtgSortDescIcon';
            this.request[this.sortColumnParameter] = cm[idx].id;
            this.request[this.ascDescFlagParameter] = ascDescFlg;
            this._retrieveDataFromUrl(1);
            $('mtgSortIcon'+id+'_'+this.sortedColumnIndex).setStyle({visibility : 'hidden'});
            $('mtgIHC'+id+'_'+this.sortedColumnIndex).setStyle({color : 'dimgray'});
            $('mtgSortIcon'+id+'_'+idx).setStyle({visibility : 'visible'});
            $('mtgIHC'+id+'_'+idx).setStyle({color : 'black'});
            this.sortedColumnIndex = idx;
            cm[idx].sortedAscDescFlg = ascDescFlg;
        }
    },

    _toggleSortData : function(idx) {
        var cm = this.columnModel;
        if (cm[idx].sortedAscDescFlg == 'DESC')
            this._sortData(idx, 'ASC');
        else
            this._sortData(idx, 'DESC');
    },

    _toggleColumnVisibility : function(index, visibleFlg) {
        this._blurCellElement(this.keys._nCurrentFocus); //in case there is a cell in editing mode
        this.keys.blur(); //remove the focus of the selected cell
        var headerRowTable = $('mtgHRT' + this._mtgId);
        var bodyTable = $('mtgBT' + this._mtgId);

        for (var i = 0; i < this.columnModel.length; i++) {
            if (this.columnModel[i].positionIndex == index) {
                index = i;
                break;
            }
        }

        var targetColumn = $('mtgHC' + this._mtgId + '_' + index);
        $('mtgHB' + this._mtgId).setStyle({visibility: 'hidden'});

        var width = 0;

        if (!visibleFlg) { // hide
            width = parseInt(targetColumn.offsetWidth);
            targetColumn.hide();
            $$('.mtgC'+this._mtgId+ '_'+index).each(function(element){
                element.hide();
            });
            this.columnModel[index].visible = false;
            this.headerWidth = this.headerWidth - width;
        } else { // show
            targetColumn.show();
            width = parseInt(targetColumn.offsetWidth) + 2;
            $$('.mtgC'+this._mtgId+ '_'+index).each(function(element){
                element.show();
            });
            this.columnModel[index].visible = true;
            this.headerWidth = this.headerWidth + width;
        }

        headerRowTable.width = this.headerWidth + 21;
        bodyTable.width = this.headerWidth;
        bodyTable.setStyle({width: this.headerWidth + 'px'});
    },

    _fullPadding : function(element, s) {
        var padding = parseInt(element.getStyle('padding-'+s));
        padding = (isNaN(padding)) ? 0 : padding;
        var border = parseInt(element.getStyle('border-'+s+'-width'));
        border = (isNaN(border)) ? 0 : border;
        return padding + border;
    },

    _retrieveDataFromUrl : function(pageNumber, firstTimeFlg) {
        if (!firstTimeFlg && this.onPageChange) {
            if (!this.onPageChange()) return;
        }
        var pageParameter = 'page';
        if(this.pager != null && this.pager.pageParameter) pageParameter = this.pager.pageParameter;
        this.request[pageParameter] = pageNumber;
        this._toggleLoadingOverlay();
        for (var i = 0; i < this.columnModel.length; i++) {
            this.columnModel[i].selectAllFlg = false;
        }
        var self = this;
        new Ajax.Request(this.url, {
            parameters: self.request,
            onSuccess: function(response) {
                var tableModel = response.responseText.evalJSON();
                try {
                    self.rows = tableModel.rows || [];
                    self.pager = null;
                    if (tableModel.options != null && tableModel.options.pager) self.pager = tableModel.options.pager;
                    if (self.pager == null) self.pager = {};
                    self.pager.pageParameter = pageParameter;
                    self.renderedRows = 0;
                    self.innerBodyDiv.innerHTML = self._createTableBody(tableModel.rows);
                    self.bodyTable = $('mtgBT' + self._mtgId);
                    if (tableModel.rows.length > 0 && !firstTimeFlg) {
                        self._applyCellCallbacks();
                        self.keys = new KeyTable(self);
                        self._addKeyBehavior();
                    }
                    if (self.pager) {
                        self.pagerDiv.innerHTML = self._updatePagerInfo(); // update pager info panel
                        self._addPagerBehavior();
                    }
                    if (self.afterRender) {
                        self.afterRender();
                    }
                } catch (ex) {
                    if (self.onFailure) self.onFailure(response);
                } finally {
                    self._toggleLoadingOverlay();
                    self.scrollTop = self.bodyDiv.scrollTop = 0;
                    if (firstTimeFlg) self.bodyDiv.fire('dom:dataLoaded');
                }
            },
            onFailure : function(transport) {
                if (self.onFailure) self.onFailure(transport);
                self._toggleLoadingOverlay();
                self.scrollTop = self.bodyDiv.scrollTop = 0;
                if (firstTimeFlg) self.bodyDiv.fire('dom:dataLoaded');
            }
        });
    },

    _updatePagerInfo : function(emptyFlg) {
        var id = this._mtgId;
        var imageRefs = this._imageRefs;
        var imagePath = this._imagePath;

        if (emptyFlg)
            return '<span id="mtgLoader'+id+'" class="mtgLoader">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';

        var html = [];
        var idx = 0;
        var pager = this.pager;
        if (this.pager.total > 0) {
            var temp = this._messages.totalDisplayMsg;
            temp = temp.replace(/\{total\}/g, pager.total);
            if (pager.from && pager.to) {
                temp += this._messages.rowsDisplayMsg;
                temp = temp.replace(/\{from\}/g, pager.from);
                temp = temp.replace(/\{to\}/g, pager.to);
            }
            html[idx++] = '<span class="mtgPagerMsg">'+temp+'</span>';
            if (pager.pages) {
                temp = this._messages.pagePromptMsg;
                temp = temp.replace(/\{pages\}/g, pager.pages);
                var input = '<input type="text" name="mtgPageInput'+id+'" id="mtgPageInput'+id+'" value="'+pager.currentPage+'" class="mtgPageInput" size="3" maxlength="3">';
                temp = temp.replace(/\{input\}/g, input);
                html[idx++] = '<table class="mtgPagerTable" border="0" cellpadding="0" cellspacing="0">';
                html[idx++] = '<tbody>';
                html[idx++] = '<tr>';

                html[idx++] = '<td><div id="mtgLoader'+id+'" class="mtgLoader">&nbsp;</div></td>';
                html[idx++] = '<td><div class="mtgSep">&nbsp;</div></td>';
                html[idx++] = '<td><a id="mtgFirst'+id+'" class="mtgPagerCtrl"><div class="mtgFirstPage">&nbsp;</div></a></td>';
                html[idx++] = '<td><a id="mtgPrev'+id+'" class="mtgPagerCtrl"><div class="mtgPrevPage">&nbsp;</div></a></td>';
                html[idx++] = '<td><div class="mtgSep">&nbsp;</div></td>';
                html[idx++] = temp;

                html[idx++] = '<td><div class="mtgSep">&nbsp;</div></td>';
                html[idx++] = '<td><a id="mtgNext'+id+'" class="mtgPagerCtrl"><div class="mtgNextPage">&nbsp;</div></a></td>';
                html[idx++] = '<td><a id="mtgLast'+id+'" class="mtgPagerCtrl"><div class="mtgLastPage">&nbsp;</div></a></td>';
                html[idx++] = '</tr>';
                html[idx++] = '</tbody>';
                html[idx++] = '</table>';
            } else {
                html[idx++] = '<table class="mtgPagerTable" border="0" cellpadding="0" cellspacing="0">';
                html[idx++] = '<tbody>';
                html[idx++] = '<tr>';
                html[idx++] = '<td><div id="mtgLoader'+id+'" class="mtgLoader">&nbsp;</div></td>';
                html[idx++] = '</tr>';
                html[idx++] = '</tbody>';
                html[idx++] = '</table>';
            }
        } else {
            html[idx++] = '<span class="mtgPagerMsg">'+this._messages.pagerNoDataFound+'</span>';
        }
        return html.join('');
    },

    _addPagerBehavior : function() {
        var self = this;
        if (!self.pager.pages) return;
        var currentPage = self.pager.currentPage;
        var pages = self.pager.pages;
        var total = self.pager.total;
        if (total > 0) {
            if (currentPage > 1) {
                $('mtgFirst'+this._mtgId).down('div').className = 'mtgFirstPage';
                $('mtgFirst'+this._mtgId).onclick = function() {
                    self._retrieveDataFromUrl.call(self, 1);
                };
            } else {
                $('mtgFirst'+this._mtgId).down('div').className = 'mtgFirstPageDisabled';
            }


            if (currentPage > 0 && currentPage < pages) {
                $('mtgNext'+this._mtgId).down('div').className = 'mtgNextPage';
                $('mtgNext'+this._mtgId).onclick = function() {
                    self._retrieveDataFromUrl.call(self, currentPage + 1);
                };
            } else {
                $('mtgNext'+this._mtgId).down('div').className = 'mtgNextPageDisabled';
            }


            if (currentPage > 1 && currentPage <= pages) {
                $('mtgPrev'+this._mtgId).down('div').className = 'mtgPrevPage';
                $('mtgPrev'+this._mtgId).onclick = function() {
                    self._retrieveDataFromUrl.call(self, currentPage - 1);
                };
            } else {
                $('mtgPrev'+this._mtgId).down('div').className = 'mtgPrevPageDisabled';
            }


            if (currentPage < pages) {
                $('mtgLast'+this._mtgId).down('div').className = 'mtgLastPage';
                $('mtgLast'+this._mtgId).onclick = function() {
                    self._retrieveDataFromUrl.call(self, self.pager.pages);
                };
            } else {
                $('mtgLast'+this._mtgId).down('div').className = 'mtgLastPageDisabled';
            }

            var keyHandler = function(event) {
                if (event.keyCode == Event.KEY_RETURN) {
                    var pageNumber = $('mtgPageInput'+self._mtgId).value;
                    if (pageNumber > pages) pageNumber = pages;
                    if (pageNumber < 1) pageNumber = '1';
                    $('mtgPageInput'+self._mtgId).value = pageNumber;
                    self._retrieveDataFromUrl.call(self, pageNumber);
                }
            };
            if (Prototype.Browser.Gecko || Prototype.Browser.Opera ) {
                Event.observe($('mtgPageInput'+this._mtgId), 'keypress', function(event) {
                    keyHandler(event);
                });
            } else {
                Event.observe($('mtgPageInput'+this._mtgId), 'keydown', function(event) {
                    keyHandler(event);
                });
            }
        }
    },

    resize : function() {
        var target = $(this.target);
        var width = this.options.width || (target.getWidth() - this._fullPadding(target,'left') - this._fullPadding(target,'right')) + 'px';
        var height = this.options.height || (target.getHeight() - this._fullPadding(target,'top') - this._fullPadding(target,'bottom')) + 'px';
        this.tableWidth = parseInt(width) - 2;
        var tallerFlg = false;
        if ((parseInt(height) - 2) > this.tableHeight) tallerFlg = true;
        this.tableHeight = parseInt(height) - 2;

        var headerButton = $('mtgHB' + this._mtgId);
        if (headerButton) headerButton.setStyle({visibility: 'hidden'});

        this.tableDiv.setStyle({
            width: this.tableWidth + 'px',
            height: this.tableHeight + 'px'
        });

        if (this.headerTitle) {
            this.headerTitle.setStyle({
                width: (this.tableWidth - 6) + 'px'
            });
        }

        if (this.headerToolbar) {
            this.headerToolbar.setStyle({
                width: (this.tableWidth - 4) + 'px'
            });
        }

        this.headerRowDiv.setStyle({
            width: (this.tableWidth) + 'px'
        });

        this.overlayDiv.setStyle({
            width: (this.tableWidth + 2) + 'px'
        });

        var settingButton = $('mtgSB' + this._mtgId);
        if (settingButton) {
            settingButton.setStyle({
                left: (this.tableWidth - 20) + 'px'
            });
        }

        this.bodyHeight = this.tableHeight - this.headerHeight - 3;
        if (this.options.title) this.bodyHeight = this.bodyHeight - this.headerHeight - 1;
        this.overlayDiv.setStyle({
            height: (this.bodyHeight + 4) + 'px'
        });
        if (this.options.pager) this.bodyHeight = this.bodyHeight - this.pagerHeight;
        if (this.options.toolbar) this.bodyHeight = this.bodyHeight - this.pagerHeight;

        this.bodyDiv.setStyle({
            width: (this.tableWidth) + 'px',
            height: this.bodyHeight + 'px'
        });

        if (this.options.pager) {
            var topPos = this.bodyHeight + this.headerHeight + 2;
            if (this.options.title) topPos += this.headerHeight;
            if (this.options.toolbar) topPos += this.headerHeight;
            this.pagerDiv.setStyle({
                top: topPos + 'px',
                width: (this.tableWidth - 4) + 'px'
            });
        }

        this.renderedRowsAllowed = Math.floor(this.bodyDiv.clientHeight / this.cellHeight);

        if (tallerFlg) {
            var html = this._createTableBody(this.rows);
            this.bodyTable.down('tbody').insert(html);
            this._addKeyBehavior();
            this._applyCellCallbacks();
            this.keys.addMouseBehavior();
        }
    },

    getValueAt : function(x, y) {
        var value = null;
        var columnId = this.columnModel[x].id;
        if (y >= 0)
            value = this.rows[y][columnId];
        else
            value = this.newRowsAdded[Math.abs(y)-1][columnId];
        return value;
    },

    setValueAt : function(value, x, y, refreshValueFlg) {
        var cm = this.columnModel;
        var id = this._mtgId;
        var editor = cm[x].editor;
        var columnId = cm[x].id;
        if (refreshValueFlg == undefined || refreshValueFlg) {
            if (editor != null && (editor == 'checkbox' || editor instanceof MY.TableGrid.CellCheckbox || editor == 'radio' || editor instanceof MY.TableGrid.CellRadioButton)) {
                var input = $('mtgInput'+id+'_'+x+','+y);
                if (editor.hasOwnProperty('getValueOf')) {
                    var trueVal = editor.getValueOf(true);
                    if (value == trueVal) {
                        input.checked = true;
                    } else {
                        input.checked = false;
                        value = editor.getValueOf(false);
                    }
                } else {
                    if (eval(value)) {
                        input.checked = true;
                    } else {
                        input.checked = false;
                        value = false;
                    }
                }
            } else {
                $('mtgIC'+id+'_'+x+','+y).innerHTML = value;
            }
        }
        if (y >= 0)
            this.rows[y][columnId] = value;
        else
            this.newRowsAdded[Math.abs(y)-1][columnId] = value;
    },

    getColumnIndex : function(id) {
        var index = -1;
        for (var i = 0; i < this.columnModel.length; i++) {
            if (this.columnModel[i].id == id) {
                index = this.columnModel[i].positionIndex;
                break;
            }
        }
        return index;
    },

    getIndexOf : function(id) {
        var cm = this.columnModel;
        var idx = -1;
        for (var i = 0; i < cm.length; i++) {
            if (cm[i].id == id) {
                idx = i;
                break;
            }
        }
        return idx;
    },

    getCurrentPosition : function() {
        return [this.keys._xCurrentPos, this.keys._yCurrentPos];
    },

    getCellElementAt : function(x, y) {
        return $('mtgC'+this._mtgId + '_' + x + ',' + y);
    },

    getModifiedRows : function() {
        var result = [];
        var modifiedRows = this.modifiedRows;
        var rows = this.rows;
        for (var i = 0; i < modifiedRows.length; i++) {
            var idx = modifiedRows[i];
            result.push(rows[idx]);
        }
        return result;
    },

    getNewRowsAdded : function() {
        return this.newRowsAdded;
    },

    getDeletedRows : function() {
        return this.deletedRows;
    },

    /**
     * Returns the selected rows by column
     *
     * @param id of the selectable column
     */
    getSelectedRowsByColumn : function(id) {
        var idx = this.getIndexOf(id);
        var result = [];
        var cm = this.columnModel;
        var rows = this.rows;
        var newRowsAdded = this.newRowsAdded;
        if (idx < 0) return null;
        var selectedRowsIdx = this._getSelectedRowsIdx(idx);
        for (var i = 0; i < selectedRowsIdx.length; i++) {
            var rowIdx = selectedRowsIdx[i];
            if (rowIdx >= 0)
                result.push(rows[rowIdx]);
            else
                result.push(newRowsAdded[Math.abs(rowIdx)-1])
        }
        return result;
    },

    _getSelectedRowsIdx: function(idx) {
        var result = [];
        var id = this._mtgId;
        var cm = this.columnModel;
        var newRowsAdded = this.newRowsAdded;
        var renderedRows = this.renderedRows;
        idx = idx || -1; // Selectable column index
        var selectAllFlg = false;
        if (idx == -1) {
            for (var i = 0; i < cm.length; i++) {
                if (cm[i].editor == 'checkbox' || cm[i].editor instanceof MY.TableGrid.CellCheckbox
                        && cm[i].editor.selectable) {
                    idx = cm[i].positionIndex;
                    selectAllFlg = cm[i].selectAllFlg;
                    break;
                }
            }
        } else {
            selectAllFlg = cm[idx].selectAllFlg;
        }

        if (idx >= 0) {
            var j = 0;
            var y = 0;
            if (newRowsAdded.length > 0) { // there are new rows added
                for (j = 0; j < newRowsAdded.length; j++) {
                    y = -(j + 1);
                    if ($('mtgInput'+id+'_'+idx+','+y).checked) result.push(y);
                }
            }

            for (j = 0; j < renderedRows; j++) {
                y = j;
                if (this.deletedRows.indexOf(this.getRow(y)) == -1 && $('mtgInput'+id+'_'+idx+','+y) != null && $('mtgInput'+id+'_'+idx+','+y).checked) result.push(y);
            }

            if (selectAllFlg && renderedRows < this.rows.length) {
                for (j = renderedRows; j < this.rows.length; j++) {
                    result.push(j);
                }
            }
        }
        return result;
    },

    highlightRow : function(id, value) {
        $$('.mtgRow'+this._mtgId).each(function(row){
            row.removeClassName('focus');
        });

        var index = this.getColumnIndex(id);
        var rowIndex = -1;
        for (var i = 0; i < this.rows.length; i++) {
            if (this.rows[i][index] == value) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex >= 0) {
            $('mtgRow'+this._mtgId+'_'+rowIndex).addClassName('focus');
        }
    },

    getRow : function(y) {
        var result = null;
        if (y >= 0)
            result = this.rows[y];
        else
            result = this.newRowsAdded[-(y+1)];
        return result;
    },

    getColumnValues : function(id) {
        var result = [];
        var j = 0;
        var i = 0;
        for (i = 0; i < this.newRowsAdded.length; i++) {
            result[j++] = this.newRowsAdded[i][id];
        }

        for (i = 0; i < this.rows.length; i++) {
            result[j++] = this.rows[i][id];
        }
        return result;
    },

    clear : function() {
        this.modifiedRows = [];
        this.deletedRows = [];
        this.newRowsAdded = [];
    },

    addNewRow : function(newRow) {
        var keys = this.keys;
        var bodyTable = this.bodyTable;
        var cm = this.columnModel;
        var i = this.newRowsAdded.length + 1;
        if (newRow == undefined) {
            newRow = {};
            for (var j = 0; j < cm.length; j++) {
                newRow[cm[j].id] = '';
            }
        }
        bodyTable.down('tbody').insert({top: this._createRow(newRow, -i)});
        this.newRowsAdded[i-1] = newRow;
        keys.setTopLimit(-i);
        this._addKeyBehaviorToRow(newRow, -i);
        keys.addMouseBehaviorToRow(-i);
        this._applyCellCallbackToRow(-i);
        this.scrollTop = this.bodyDiv.scrollTop = 0;
    },

    deleteRows : function() {
        var id = this._mtgId;
        var selectedRows = this._getSelectedRowsIdx();
        var i = 0;
        var y = 0;
        for (i = 0; i < selectedRows.length; i++) {
            y = selectedRows[i];
            if (y >=0) {
                this.deletedRows.push(this.getRow(y));
            } else {
                this.newRowsAdded[Math.abs(y)-1] = null;
            }
            $('mtgRow'+id+'_'+y).hide();
        }
        var totalDiv = $('mtgTotal');
        if (totalDiv) {
            var total = parseInt(totalDiv.innerHTML);
            total -= selectedRows.length;
            totalDiv.innerHTML = total;
        }
        var toDiv = $('mtgTo');
        if (toDiv) {
            var to = parseInt(toDiv.innerHTML);
            to -= selectedRows.length;
            toDiv.innerHTML = to;
        }
        this._syncScroll();
    },

    refresh : function() {
        this.modifiedRows = [];
        this.deletedRows = [];
        this.newRowsAdded = [];
        this._retrieveDataFromUrl(1,false);
    },

    empty : function() {
        var bodyTable = this.bodyTable;
        bodyTable.down('tbody').innerHTML = '';
        this.rows = [];
        this.pager.total = 0;
        this.pagerDiv.innerHTML = this._updatePagerInfo();
    },

    /**
     * Turns an array row into an object row
     */
    _fromArrayToObject : function(row) {
        var result = null;
        var cm = this.columnModel;

        if (row instanceof Array) {
            result = {};
            for (var i = 0; i < cm.length; i++) {
                result[cm[i].id] = row[cm[i].positionIndex];
            }
        } else if (row instanceof Object) {
            result = row;
        }
        return result;
    }
});

MY.TableGrid.ADD_BTN = 1;
MY.TableGrid.DEL_BTN = 4;
MY.TableGrid.SAVE_BTN = 8;

var HeaderBuilder = Class.create({
    initialize : function(id, cm) {
        this.columnModel = cm;
        this._mtgId = id;
        this.gap = 2; //diff between width and offsetWidth
        if (Prototype.Browser.WebKit) this.gap = 0;
        this.filledPositions = [];
        this._leafElements = [];
        this.defaultHeaderColumnWidth = 100;
        this.cellHeight = 24;
        this.rnl = this.getHeaderRowNestedLevel();
        this._validateHeaderColumns();
        this.headerWidth = this.getTableHeaderWidth();
        this.headerHeight = this.getTableHeaderHeight();
    },

    /**
     * Creates header row
     */
    _createHeaderRow : function() {
        var thTmpl = '<th id="mtgHC{id}_{x}" colspan="{colspan}" rowspan="{rowspan}" width="{width}" height="{height}" style="position:relative;width:{width}px;height:{height}px;padding:0;margin:0;border-bottom-color:{color}" class="mtgHeaderCell mtgHC{id}">';
        var thTmplLast = '<th id="mtgHC{id}_{x}" colspan="{colspan}" rowspan="{rowspan}" width="{width}" height="{height}" style="width:{width}px;height:{height}px;padding:0;margin:0;border-right:none;border-bottom:1px solid #ccc;" class="mtgHeaderCell mtgHC{id}">';
        var ihcTmpl = '<div id="mtgIHC{id}_{x}" class="mtgInnerHeaderCell mtgIHC{id}" style="float:left;width:{width}px;height:{height}px;padding:4px 3px;z-index:20">';
        var ihcTmplLast = '<div class="mtgInnerHeaderCell" style="position:relative;width:{width}px;height:{height}px;padding:3px;z-index:20">';
        var hsTmpl = '<div id="mtgHS{id}_{x}" class="mtgHS mtgHS{id}" style="float:right;width:1px;height:{height}px;z-index:30">';
        var siTmpl = '<span id="mtgSortIcon{id}_{x}" style="width:8px;height:4px;visibility:hidden">&nbsp;&nbsp;&nbsp;</span>';

        var cm = this.columnModel;
        var id = this._mtgId;
        var gap = (this.gap == 0)? 2 : 0;
        var rnl = this.rnl; //row nested level

        var html = [];
        var idx = 0;
        this.filledPositions = [];

        html[idx++] = '<table id="mtgHRT'+id+'" width="'+(this.headerWidth+21)+'" cellpadding="0" cellspacing="0" border="0" class="mtgHeaderRowTable">';
        html[idx++] = '<thead>';

        var temp = null;
        for (var i = 0; i < rnl; i++) { // for each nested level
            var row = this._getHeaderRow(i);
            html[idx++] = '<tr>';
            var x = this._getStartingPosition();
            for (var j = 0; j < row.length; j++) {
                var cell = row[j];
                var colspan = 1;
                var rowspan = 1;
                var cnl = this._getHeaderColumnNestedLevel(cell);
                if (cnl == 0) { // is a leaf element
                    rowspan = rnl - i;
                    cell.height = rowspan*(this.cellHeight+2);
                    x = this._getNextIndexPosition(x);
                    temp = thTmpl.replace(/\{id\}/g, id);
                    temp = temp.replace(/\{x\}/g, x);
                    temp = temp.replace(/\{colspan\}/g, colspan);
                    temp = temp.replace(/\{rowspan\}/g, rowspan);
                    temp = temp.replace(/\{color\}/g, '#ccc');
                    var cellWidth = cell.width || '80';
                    cellWidth = parseInt(cellWidth);
                    temp = temp.replace(/\{width\}/g, cellWidth);
                    temp = temp.replace(/\{height\}/g, cell.height);
                    html[idx++] = temp;

                    temp = ihcTmpl.replace(/\{id\}/g, id);
                    temp = temp.replace(/\{x\}/g, x);
                    temp = temp.replace(/\{width\}/g,  cellWidth - 8 - gap);
                    temp = temp.replace(/\{height\}/g, cell.height - 6 - gap);
                    html[idx++] = temp;
                    html[idx++] = row[j].title;
                    html[idx++] = '&nbsp;';
                    temp = siTmpl.replace(/\{id\}/g, id);
                    temp = temp.replace(/\{x\}/g, x);
                    html[idx++] = temp;
                    html[idx++] = '</div>';

                    temp = hsTmpl.replace(/\{id\}/g, id);
                    temp = temp.replace(/\{x\}/g, x);
                    temp = temp.replace(/\{height\}/g, cell.height);
                    html[idx++] = temp;
                    html[idx++] = '&nbsp;';
                    html[idx++] = '</div>';
                    html[idx++] = '</th>';
                    this.filledPositions.push(x);
                    this._leafElements[x] = cell;
                } else {
                    colspan = this._getNumberOfNestedCells(cell);
                    x += colspan - 1;
                    temp = thTmpl.replace(/\{id\}/g, id);
                    temp = temp.replace(/\{colspan\}/g, colspan);
                    temp = temp.replace(/\{rowspan\}/g, rowspan);
                    temp = temp.replace(/id="mtgHC.*?_\{x\}"/g,'');
                    temp = temp.replace(/width="\{width\}"/g,'');
                    temp = temp.replace(/width:\{width\}px;/g,'');
                    temp = temp.replace(/height="\{height\}"/g,'');
                    temp = temp.replace(/height:\{height\}px;/g,'');
                    temp = temp.replace(/\{color\}/g, '#ddd');
                    html[idx++] = temp;
                    temp = ihcTmpl.replace(/\{id\}/g, id);
                    temp = temp.replace(/id="mtgIHC.*?_\{x\}"/g,'');
                    temp = temp.replace(/width:\{width\}px;/g,'');
                    temp = temp.replace(/height:\{height\}px;/g,'');
                    html[idx++] = temp;
                    html[idx++] = row[j].title;
                    html[idx++] = '</div>';
                    html[idx++] = '</th>';
                }
                x++;
            }

            if (i == 0) { // Last Header Element added in nested level 0
                temp = thTmplLast.replace(/\{id\}/g, id);
                temp = temp.replace(/\{x\}/g, this.filledPositions.length);
                temp = temp.replace(/\{colspan\}/g, '1');
                temp = temp.replace(/\{rowspan\}/g, rnl);
                temp = temp.replace(/\{width\}/g, 20);
                temp = temp.replace(/\{height\}/g, rnl*this.cellHeight);
                html[idx++] = temp;
                temp = ihcTmplLast.replace(/\{id\}/g, id);
                temp = temp.replace(/\{height\}/g, rnl*this.cellHeight-6);
                temp = temp.replace(/\{width\}/g, 14);
                html[idx++] = temp;
                html[idx++] = '&nbsp;';
                html[idx++] = '</div>';
                html[idx++] = '</th>';
            }
            html[idx++] = '</tr>';
        }
        html[idx++] = '</thead>';
        html[idx++] = '</table>';
        return html.join('');
    },

    /**
     * Retrieves the header row by nested level
     *
     * @param nl nested level
     * @param elements header elements
     */
    _getHeaderRow : function(nl, elements, column) {
        var cm = this.columnModel;
        elements = elements || cm;

        var result = [];
        var idx = 0;

        if (nl > 0) {
            var j = 0;
            var children = null;
            if (!column) {
                for (var i = 0; i < elements.length; i++) {
                    if (elements[i].hasOwnProperty('children') && elements[i].children.length > 0) {
                        children = elements[i].children;
                        for (j = 0; j < children.length; j++) {
                            result[idx++] = children[j];
                        }
                    }
                }
            } else {
                if (column.hasOwnProperty('children') && column.children.length > 0) {
                    children = column.children;
                    for (j = 0; j < children.length; j++) {
                        result[idx++] = children[j];
                    }
                }
            }
        } else {
            if (!column)
                result = elements;
            else
                result = column;
        }
        if (nl > 0) result = this._getHeaderRow(--nl, result);
        return result;
    },

    /**
     * Get header row nested level
     */
    getHeaderRowNestedLevel : function() {
        var cm = this.columnModel;
        var self = this;
        var result = 0;
        cm.each(function(column) {
            var nl = self._getHeaderColumnNestedLevel(column);
            if (nl > result) result = nl;
        });
        return result + 1;
    },

    /**
     * Get column nested level
     * @param column the column object
     */
    _getHeaderColumnNestedLevel : function(column) {
        var result = 0;
        var self = this;
        if (column.hasOwnProperty('children') && column.children.length > 0) {
            result++;
            var max = 0;
            column.children.each(function(element) {
                var nl = self._getHeaderColumnNestedLevel(element);
                if (nl > max) max = nl;
            });
            result = result + max;
        }
        return result;
    },

    /**
     * Get number of nested cells (used to determine colspan attribute)
     * @param column the column object
     */
    _getNumberOfNestedCells : function(column) {
        var result = 1;
        if (column.hasOwnProperty('children') && column.children.length > 0) {
            var children = column.children;
            result = children.length;
            for (var i = 0; i < children.length; i++) {
                result = result + this._getNumberOfNestedCells(children[i]) - 1;
            }
        }
        return result;
    },

    /**
     * Useful for determine index positions
     */
    _getStartingPosition : function() {
        var result = 0;
        while(true) {
            if (this.filledPositions.indexOf(result) == -1) break;
            result++;
        }
        return result;
    },

    /**
     * Useful for determine index positions
     */
    _getNextIndexPosition : function(idx) {
        var result = idx;
        while(true) {
            if (this.filledPositions.indexOf(result) == -1) break;
            result++;
        }
        return result;
    },

    /**
     * Validates header columns width
     */
    _validateHeaderColumns : function() {
        var cm = this.columnModel;
        for (var i = 0; i < cm.length; i++) { // foreach column
            cm[i] = this._validateHeaderColumnWidth(cm[i]);
        }
        this.columnModel = cm;
    },

    _validateHeaderColumnWidth : function(column) {
        var defaultWidth = this.defaultHeaderColumnWidth;
        var cnl = this._getHeaderColumnNestedLevel(column);
        if (cnl > 0) {
            var cl = cnl - 1; // current level
            do {
                var elements = this._getHeaderRow(cl, null, column);
                for (var i = 0; i < elements.length; i++) {
                    var childrenWidth = 0;
                    if (elements[i].hasOwnProperty('children') && elements[i].children.length > 0) {
                        var children = elements[i].children;
                        for (var j = 0; j < children.length; j++) {
                            children[j].width = (children[j].width)? parseInt(children[j].width) : defaultWidth;
                            childrenWidth += children[j].width;
                        }
                        elements[i].children = children;
                    } else {
                        childrenWidth = (elements[i].width)? parseInt(elements[i].width) : defaultWidth;
                    }
                    elements[i].width = childrenWidth;
                }
                cl--;
            } while(cl > 0)
        } else { // is a leaf
            column.width = (column.width)? parseInt(column.width) : defaultWidth;
        }
        return column;
    },

    getTableHeaderWidth : function() {
        var gap = this.gap;
        var rnl = this.rnl; //row nested level
        var result = 0;
        for (var i = 0; i < rnl; i++) { // for each nested level
            var row = this._getHeaderRow(i);
            for (var j = 0; j < row.length; j++) {
                var cnl = this._getHeaderColumnNestedLevel(row[j]);
                if (cnl == 0) { // is a leaf element
                    result += row[j].width + gap;
                }
            }
        }
        return result;
    },

    getTableHeaderHeight : function() {
        return this.rnl*(this.cellHeight + 2);
    },


    getLeafElements : function() {
        var cm = this.columnModel;
        var rnl = this.rnl; //row nested level
        var colspan = 1;
        this.filledPositions = [];
        for (var i = 0; i < rnl; i++) { // for each nested level
            var row = this._getHeaderRow(i);
            var x = this._getStartingPosition();
            for (var j = 0; j < row.length; j++) {
                var cell = row[j];
                var cnl = this._getHeaderColumnNestedLevel(cell);
                if (cnl == 0) { // is a leaf element
                    x = this._getNextIndexPosition(x);
                    this.filledPositions.push(x);
                    this._leafElements[x] = cell;
                } else {
                    colspan = this._getNumberOfNestedCells(cell);
                    x += colspan - 1;
                }
                x++;
            }
        }
        return this._leafElements;
    }
});
var Menu = Class.create();

Menu.prototype = {
    initialize : function(menu) {
        this._menuId = $$('.menuBar').length + 1;
        this.menu = menu;
        var items = menu.items;
        for (var i = 0; i < items.length; i++) {
            items[i].menuShownFlg = false;
            items[i].hideMenuFlg = false;
            items[i].menuHasItemsFlg = false;
        }
    },

    show : function(target) {
        $(target).innerHTML = this._createMenuBar();
        // Add behavior to menu elements
        this._addMenuBehavior();
    },

    _createMenuBar : function() {
        var menu = this.menu;
        var id = this._menuId;
        var html = [];
        var idx = 0;
        var items = menu.items;
        html[idx++] = '<div id="menuBar'+ id + '" class="mb menuBar">';
        html[idx++] = '<ul class="menuContainer">';
        for (var i = 0; i < items.length; i++) {
            var classNames = (i < items.length - 1) ? 'menu' : 'menuLast';
            if (items[i].items && items[i].items.length > 0) {
                classNames += ' menuHasItems';
                items[i].menuHasItemsFlg = true;
            }
            html[idx++] = '<li id="menu'+id+'_'+i+'" class="'+classNames+'">';
            html[idx++] = '<a class="menuInnerText" href="#">'+items[i].title+'</a>';
            html[idx++] = '</li>';
        }
        html[idx++] = '</ul>';
        html[idx++] = '</div>';
        return html.join('');
    },

    _addMenuBehavior : function() {
        var self = this;
        var items = this.menu.items;
        var elements = $$('li.menu, li.menuLast');
        
        for (var i = 0; i < elements.length; i++) {
            (function(element, index) {
                element.observe('mouseover', function(event) {
                    element.addClassName('menuSelected');
                    // Removes other menus displayed
                    for (var j = 0; j < items.length; j++) {
                        if (j == index) continue;
                        if(items[j].menuShownFlg) {
                            items[j].hideMenuFlg = true;
                            setTimeout(function(){self.hideMenuItems(j)}, 0);
                        }
                    }

                    if (!items[index].menuShownFlg && items[index].menuHasItemsFlg) {
                        element.insert(self._createMenuItems(index));
                        self._addMenuItemsBehavior(index);
                        items[index].menuShownFlg = true;
                        items[index].hideMenuFlg = false;
                    }
                });

                element.observe('mouseout', function(event) {
                    element.removeClassName('menuSelected');
                    if (items[index].menuHasItemsFlg) {
                        items[index].hideMenuFlg = true;
                        setTimeout(function(){self.hideMenuItems(index)}, 0);
                    }
                });
            })(elements[i], i);
        }
    },

    hideMenuItems : function(index) {
        var items = this.menu.items;
        var id = this._menuId;
        if (items[index].menuShownFlg && items[index].hideMenuFlg) {
            var menuElement = $('menu'+id+'_'+index);
            menuElement.removeClassName('menuSelected');
            if (menuElement.down('ul')) menuElement.down('ul').remove();
            items[index].menuShownFlg = false;
        }
    },

    _createMenuItems : function(index) {
        var id = this._menuId;
        var menu = this.menu;
        var items = menu.items[index].items;
        if (!items || items.length == 0) return; 
        var html = [];
        var idx = 0;
        html[idx++] = '<ul id="menuItems'+id+'_'+index+'" class="menuItems">';
        if (items) {
            for (var i = 0; i < items.length; i++) {
                html[idx++] = '<li class="menuItem">';
                html[idx++] = '<a class="menuItemInnerText">'+items[i].title+'</a>';
                html[idx++] = '</li>';
            }
        }
        html[idx++] = '</ul>';
        return html.join('');
    },

    _addMenuItemsBehavior : function(index) {
        var id = this._menuId;
        var items = this.menu.items;
        $('menuItems'+id+'_'+index).observe('mouseover', function(event) {
            items[index].hideMenuFlg = false;
        });
    }
};
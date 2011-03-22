<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>TableGrid Last Version</title>
    <link type="text/css" href="../../css/main.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/TableGrid.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/DatePicker.css" rel="stylesheet">
    <script type="text/javascript" src="../../scripts/prototype/prototype.js"></script>
    <script type="text/javascript" src="../../scripts/scriptaculous/scriptaculous.js"></script>
    <script type="text/javascript" src="../../scripts/myui/myui.js"></script>
</head>
<script type="text/javascript">
    var countryList = [
        {value: 'UK', text: 'United Kingdon'},
        {value: 'US', text: 'United States'},
        {value: 'UC', text: 'Ucranie'},
        {value: 'CL', text: 'Chile'},
        {value: 'CH', text: 'China'},
        {value: 'AR', text: 'Argentina'},
        {value: 'AG', text: 'Argelia'},
        {value: 'IT', text: 'Italy'},
        {value: 'BR', text: 'Brazil'},
        {value: 'ES', text: 'Spain'}
    ];

    var tableModel = {
        options : {
            width: '640px',
            title: 'JAW Motors Inventory',
            addSettingBehavior : false,
            pager: {
                pageParameter : 'page'
            },
            onCellBlur : function(element, value, x, y, id) {
                //alert(value);            
            },
            toolbar : {
                elements: [MyTableGrid.ADD_BTN, MyTableGrid.DEL_BTN, MyTableGrid.SAVE_BTN],
                onSave: function() {
                    var modifiedRows = tableGrid1.getModifiedRows();
                    var temp = '';
                    for (var i = 0; i < modifiedRows.length; i++) {
                        for (var p in modifiedRows[i]) {
                            temp += p + '=' + modifiedRows[i][p] + '&';
                        }
                    }
                    alert(temp);
                    new Ajax.Request('./save.php?'+temp, {
                        onComplete: function(transport){
                            tableGrid1.clear();
                            tableGrid1.refresh();
                        }
                    });
                },
                onAdd: function() {
                    alert('on add handler');
                },
                onDelete: function() {
                    alert('on delete handler');
                }
            },
            rowClass : function(rowIdx) {
                var className = '';
                if (rowIdx % 2 == 0) {
                    className = 'hightlight';
                }
                return className;
            }
        },
        columnModel : [
            {
                id : 'carId',
                title : 'Id',
                width : 30,
                editable: true,
                sortable: false,
                editor: new MyTableGrid.CellCheckbox({
                    selectable : true
                })
            },
            {
                id: 'generalInfo',
                title: 'General Info',
                children : [
                    {
                        id : 'manufacturer',
                        title : 'Manufacturer',
                        width : 140,
                        sortable: true,
                        editable: true
                    },
                    {
                        id : 'model',
                        title : 'Model',
                        width : 90,
                        editable: true
                    },
                    {
                        id : 'year',
                        title : 'Year',
                        width : 60,
                        editable: true,
                        editor: new MyTableGrid.CellInput({
                            validate : function(value, input){
                                return parseInt(value) > 1900;
                            }
                        })
                    }
                ]
            },
            {
                id : 'price',
                title : 'Price',
                width : 70,
                type: 'number',
                editable: true
            },
            {
                id : 'origCountry',
                title : 'Origin Country',
                width : 100,
                editable: true,
                editor: new MyTableGrid.ComboBox({
                    list: countryList
                }),
                renderer: function(value, list) {
                    var result = value;
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].value == value) result = list[i].text;
                    }
                    return result;
                }
            },
            {
                id : 'used',
                title : 'Used',
                width : 50,
                editable: true,
                align: 'center',
                editor: new MyTableGrid.CellCheckbox({
                    getValueOf: function(value) {
                        var result = 'No';
                        if (value) result = 'Yes';
                        return result;
                    },
                    onClick: function(value, checked, element) {
                        alert('hola ' + value + ' ' + checked  + ' ' + element);
                    }
                })
            },
            {
                id : 'expirationDt',
                title : 'Expiration Date',
                width : 100,
                editable: true,
                editor: new MyTableGrid.CellCalendar({
                    validate : function (value, input) {
                        return true;      
                    }
                })
            },
            {
                id : 'browseId',
                title : 'Select client',
                width : 100,
                editable: true,
                editor: new MyTableGrid.BrowseInput({
                    onClick : function() {
                        alert('on click event');
                    },
                    afterUpdate : function() {
                        alert('after update event');
                    }
                })                
            }
        ],
        url: 'get_all_cars.php'
    };

    var tableGrid1 = null;
    window.onload = function() {
        tableGrid1 = new MyTableGrid(tableModel);
        tableGrid1.show('mytable1');
    };
</script>
<body>
    <div class="container">
        <div class="samples">
            <h1>TableGrid Last Version</h1>
            <div id="mytable1" style="position:relative; width: 640px; height: 350px"></div>
        </div>
    </div>
</body>
</html>
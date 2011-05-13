<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>TableGrid Last Version</title>
    <link type="text/css" href="../../css/main.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/myui.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/TableGrid.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/DatePicker.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/Autocompleter.css" rel="stylesheet">
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
                elements: [MY.TableGrid.ADD_BTN, MY.TableGrid.DEL_BTN, MY.TableGrid.SAVE_BTN],
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
                editor: new MY.TableGrid.CellCheckbox({
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
                        editor: new MY.TableGrid.CellInput({
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
                editor: new MY.ComboBox({
                    items: countryList
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
                editor: new MY.TableGrid.CellCheckbox({
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
                editor: new MY.DatePicker({
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
                editor: new MY.TableGrid.BrowseInput({
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
/*
    rows : [
        ["9","PEUGEOT","106","2002","2100000","ES",false,"12\/12\/2007","106","1"],
        ["27","PEUGEOT","106","2002","2100000","ES",false,"09\/11\/2009","106","1"],
        ["7","PEUGEOT","206","2001","3800000","ES",false,"12\/12\/2007","206","1"],
        ["25","PEUGEOT","206","2001","3800000","ES",false,"09\/11\/2009","206","1"],
        ["8","PEUGEOT","404","1985","1900000","ES",false,"12\/12\/2007","404","1"],
        ["26","PEUGEOT","404","1985","1900000","ES",false,"09\/11\/2009","404","1"],
        ["2","TOYOTA","COROLLA","1987","1100000","ES",false,"12\/12\/2007","COROLLA","1"],
        ["10","TOYOTA","COROLLA","1987","2000000","ES",false,"05\/13\/2011","COROLLA","1"],
        ["11","TOYOTA","COROLLA","1987","2000000","ES",false,"05\/13\/2011","COROLLA","1"],
        ["12","TOYOTA","COROLLA","1987","2000000","ES",false,"05\/13\/2011","COROLLA","1"],
        ["13","TOYOTA","COROLLA","1987","2000000","ES",false,"05\/13\/2011","COROLLA","1"],
        ["6","FORD","FOCUS","2005","5400000","ES",false,"12\/12\/2007","FOCUS","1"],
        ["24","FORD","FOCUS","2005","5400000","ES",false,"09\/11\/2009","FOCUS","1"],
        ["4","FORD","KA","2003","3200000","ES",false,"12\/12\/2007","KA","1"],
        ["16","FORD","KA","2003","2000000","ES",false,"05\/13\/2011","KA","1"],
        ["19","FIAT","Panda","2008","2100000","ES",false,"09\/11\/2009","Panda","1"],
        ["20","FIAT","Panda","2008","2100000","ES",false,"09\/11\/2009","Panda","1"],
        ["30","FIAT","Panda","2008","2100000","ES",false,"09\/11\/2009","Panda","1"],
        ["31","FIAT","Panda","2008","2100000","ES",false,"09\/11\/2009","Panda","1"],
        ["23","FIAT","Panda","2008","2100000","ES",false,"09\/11\/2009","Panda","1"],
        ["36","FIAT","Panda","2008","2100000","ES",false,"09\/11\/2009","Panda","1"],
        ["76","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["77","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["80","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["81","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["82","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["83","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["84","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["85","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["86","FIAT","Panda","2008","2100000","ES",false,"09\/15\/2009","Panda","1"],
        ["88","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["93","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["94","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["95","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["98","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["99","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["100","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["101","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["102","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["103","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["104","FIAT","Panda","2008","2100000","ES",false,"09\/15\/2009","Panda","1"],
        ["106","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["111","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["112","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["113","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["116","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["117","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["118","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["119","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["120","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["121","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["122","FIAT","Panda","2008","2100000","ES",false,"09\/15\/2009","Panda","1"],
        ["124","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["129","FIAT","Panda","2008","24000","ES",false,"09\/15\/2009","Panda","1"],
        ["17","FIAT","Punto Classic","2008","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["28","FIAT","Punto Classic","2008","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["32","FIAT","Punto Classic","2008","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["18","FIAT","Punto Classic","2009","210000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["29","FIAT","Punto Classic","2009","210000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["33","FIAT","Punto Classic","2009","210000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["79","FIAT","Punto Classic","2009","2100000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["87","FIAT","Punto Classic","2009","2100000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["90","FIAT","Punto Classic","2009","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["97","FIAT","Punto Classic","2009","2100000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["105","FIAT","Punto Classic","2009","2100000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["108","FIAT","Punto Classic","2009","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["115","FIAT","Punto Classic","2009","2100000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["123","FIAT","Punto Classic","2009","2100000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["126","FIAT","Punto Classic","2009","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["78","FIAT","Punto Classic","2003","21100","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["91","FIAT","Punto Classic","2003","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["92","FIAT","Punto Classic","2003","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["96","FIAT","Punto Classic","2003","21100","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["109","FIAT","Punto Classic","2003","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["110","FIAT","Punto Classic","2003","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["114","FIAT","Punto Classic","2003","21100","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["127","FIAT","Punto Classic","2003","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["128","FIAT","Punto Classic","2003","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["21","FIAT","Punto Classic","2004","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["22","FIAT","Punto Classic","2004","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["34","FIAT","Punto Classic","2004","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["35","FIAT","Punto Classic","2004","2100000","ES",false,"09\/11\/2009","Punto Classic","1"],
        ["89","FIAT","Punto Classic","2004","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["107","FIAT","Punto Classic","2004","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["125","FIAT","Punto Classic","2004","24000","ES",false,"09\/15\/2009","Punto Classic","1"],
        ["3","TOYOTA","RAV4","2007","9500000","ES",false,"12\/12\/2007","RAV4","1"],
        ["14","TOYOTA","RAV4","2007","2000000","ES",false,"05\/13\/2011","RAV4","1"],
        ["15","TOYOTA","RAV4","2007","2000000","ES",false,"05\/13\/2011","RAV4","1"],
        ["5","FORD","SCORT","1985","900000","ES",false,"12\/12\/2007","SCORT","1"],
        ["37","CHEVROLET","Spark","2008","2100000","ES",false,"09\/11\/2009","Spark","1"],
        ["38","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"],
        ["39","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"],
        ["40","CHEVROLET","Spark","2008","2100000","ES",false,"09\/11\/2009","Spark","1"],
        ["41","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"],
        ["42","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"],
        ["43","CHEVROLET","Spark","2008","2100000","ES",false,"09\/11\/2009","Spark","1"],
        ["44","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"],
        ["45","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"],
        ["46","CHEVROLET","Spark","2008","2100000","ES",false,"09\/11\/2009","Spark","1"],
        ["47","CHEVROLET","Spark","2008","21000","ES",false,"09\/11\/2009","Spark","1"]
    ]*/
    };

    var tableGrid1 = null;
    window.onload = function() {
        tableGrid1 = new MY.TableGrid(tableModel);
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
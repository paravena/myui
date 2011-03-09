<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>TableGrid Last Version</title>
    <link type="text/css" href="../../css/main.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/tablegrid.css" rel="stylesheet">
    <link type="text/css" href="../../css/myui/calendar.css" rel="stylesheet">
    <script type="text/javascript" src="../../scripts/prototype/prototype.js"></script>
    <script type="text/javascript" src="../../scripts/scriptaculous/scriptaculous.js"></script>
    <script type="text/javascript" src="../../scripts/myui/myui.js"></script>
</head>
<script type="text/javascript">
    var tableGrid1 = null;

    var tableModel = {
        options : {
            width: '640px',
            title: 'Manufacturers',
            toolbar : {
                elements: [MyTableGrid.ADD_BTN, MyTableGrid.DEL_BTN, MyTableGrid.SAVE_BTN],
                onSave: function() {
                    var newRowsAdded = tableGrid1.getNewRowsAdded();
                    var temp = '';
                    for (var i = 0; i < newRowsAdded.length; i++) {
                        temp += '{';
                        for (var p in newRowsAdded[i]) {
                            temp += p + ' : ' + newRowsAdded[i][p] + ', ';
                        }
                        temp += '}\n';
                    }
                    alert('added rows: ' + temp);
                    var modifiedRows = tableGrid1.getModifiedRows();
                    temp = '';
                    for (var i = 0; i < modifiedRows.length; i++) {
                        temp += '{';
                        for (var p in modifiedRows[i]) {
                            temp += p + ' : ' + modifiedRows[i][p] + ', ';
                        }
                        temp += '}\n';
                    }
                    alert('modified rows: ' + temp);
                    var deletedRows = tableGrid1.getDeletedRows();
                    temp = '';
                    for (var i = 0; i < deletedRows.length; i++) {
                        temp += '{';
                        for (var p in deletedRows[i]) {
                            temp += p + ' : ' + deletedRows[i][p] + ', ';
                        }
                        temp += '}\n';
                    }
                    alert('deleted rows: ' + temp);
                },

                onAdd: function() {
                    //alert('on add handler');
                },
                onDelete: function() {
                    //alert('on delete handler');
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
                id : 'manufId',
                title : 'Id',
                width : 30,
                editable: true,
                editor: new MyTableGrid.CellCheckbox({
                    selectable : true,
                    onClick : function(value, checked) {
//                        alert(value + ' ' + checked);
                    }
                })
            },
            {
                id : 'manufName',
                title : 'Manufacturer',
                width : 140,
                editable: true,
                sortable: true
            },
            {
                id : 'manufDesc',
                title : 'Description',
                width : 90,
                editable: true,
                sortable: true
            }
        ],
        rows : []
    };


    window.onload = function() {
        tableGrid1 = new MyTableGrid(tableModel);
        tableGrid1.render('mytable1');
    };
</script>
<body>
    <div class="container">
        <div class="samples">
            <h1>New TableGrid Sample</h1>
            <div id="mytable1" style="position:relative; width: 640px; height: 350px"></div>
            <div class="autocomplete" id="list" style="display:none;z-index:1000"></div>
        </div>
    </div>
</body>
</html>
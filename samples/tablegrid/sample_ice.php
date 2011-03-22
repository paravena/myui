
<?php
    $SERIALNO = $_GET["SERIALNO"];
    $url = "donations.php?SERIALNO=" . $SERIALNO;
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
    <head>
        <title>MyTableGrid Last Sample</title>
        <link type="text/css" href="../../css/myui/TableGrid.css" rel="stylesheet">
        <link type="text/css" href="../../css/myui/DatePicker.css" rel="stylesheet">
        <script type="text/javascript" src="../../scripts/prototype/prototype.js"></script>
        <script type="text/javascript" src="../../scripts/scriptaculous/scriptaculous.js"></script>
        <script type="text/javascript" src="../../scripts/myui/myui.js"></script>
    </head>
    <script type="text/javascript">

        var SOURCE_LIST = [
            {value: 'AG 2006 Election', text: 'AG 2006 Election'},
            {value: 'AG 2002 Election', text: 'AG 2002 Election'},
            {value: 'State Senate', text: 'State Senate'},
            {value: 'U.S. Senate Primary 2008', text: 'U.S. Senate Primary 2008'},
            {value: 'U.S. Senate General 2008', text: 'U.S. Senate General 2008'},
            {value: 'AG Primary 2010', text: 'AG Primary 2010'},
            {value: 'CBN', text: 'CBN'}
        ];


        var ELECTION_LIST = [
            {value: 'AG 2006 Election', text: 'AG 2006 Election'},
            {value: 'AG 2002 Election', text: 'AG 2002 Election'},
            {value: 'State Senate', text: 'State Senate'},
            {value: 'U.S. Senate Primary 2008', text: 'U.S. Senate Primary 2008'},
            {value: 'U.S. Senate General 2008', text: 'U.S. Senate General 2008'},
            {value: 'AG Primary 2010', text: 'AG Primary 2010'},
            {value: 'CBN', text: 'CBN'}
        ];

        var tableGrid1 = null;

        var tableModel = {
            options : {
                width: '700',
                height: '400',
                title: 'Donations',
                pager : {
                    
                },
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
                    id : 'DONATION_SERIAL',
                    title : 'Serial',
                    width : 30,
                    editable: true,
                    editor: new MyTableGrid.CellCheckbox({
                        selectable : true
                    })
                },
                {
                    id : 'AMOUNT',
                    title : 'Amount',
                    width : 50,
                    editable: true
                },
                {
                    id : 'DATE',
                    title : 'Date',
                    width : 120,
                    editable: true,
                    editor: new MyTableGrid.CellCalendar()
                },
                {
                    id : 'SOURCE',
                    title : 'SOURCE',
                    width : 200,
                    editable: true,
                    editor: new MyTableGrid.ComboBox({
                        list: SOURCE_LIST
                    })
                },
                {
                    id : 'ELECTION',
                    title : 'ELECTION',
                    width : 200,
                    editable: true,
                    editor: new MyTableGrid.ComboBox({
                        list: ELECTION_LIST
                    })
                }
            ],
            url: 'donations.php'
        };


        window.onload = function() {
            tableGrid1 = new MyTableGrid(tableModel);
            tableGrid1.render('mytable1');
        };
    </script>
    <body>
        <div id="mytable1" style="position:relative; width: 480px; height: 215px"></div>
        <div class="autocomplete" id="list" style="display:none;z-index:1000"></div>
    </body>
</html>
<?php
    header('Content-type: application/json');
    /*
    $SERIALNO = $_GET["SERIALNO"];
    $con = mysql_connect("localhost", "admin", "password");

    if (!$con)  {
        die('Could not connect: ' . mysql_error());
    }

    mysql_select_db("jawdb", $con);
    $query = "SELECT DONATION_SERIAL, AMOUNT, DATE, SOURCE, ELECTION FROM gorilla.contfile WHERE SERIALNO = " . $SERIALNO . "  ORDER BY DATE DESC";

    $result = mysql_query($query)  or die(mysql_error());
    $rows = array();
    $idx = 0;

    while($row = mysql_fetch_array($result)) {
        $rows[$idx++] = array($row['DONATION_SERIAL'], $row['AMOUNT'] , $row['DATE'] , $row['SOURCE'], $row['ELECTION']);
    }
    mysql_close($con);
    */
?>
{
    options: {
        pager: {
            currentPage: 1,
            from: 1,
            to: 11,
            total: 11,
            pages: 1
        }
    },
    rows : [
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB'],
        {DONATION_SERIAL: '12345678', AMOUNT: '12.9', DATE: '02/15/2010', SOURCE: 'FFFFF', ELECTION: 'DDDDD'},
        ['12345678', '12.9', '02/15/2010', 'AAAAA', 'BBBBB']
    ]
}
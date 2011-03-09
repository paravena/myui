<?php
    header('Content-type: application/json');

    $con = mysql_connect("localhost", "root", "admin");
    
    if (!$con)  {
        die('Could not connect: ' . mysql_error());
    }
    
    mysql_select_db("jawdb", $con);


    $query = 'select * from manufacturers';
    
    $result = mysql_query($query);
    $rows = array();
    $idx = 0;
        
    while($row = mysql_fetch_array($result)) {
            $rows[$idx++] = array($row['manuf_id'], $row['manuf_name'], $row['manuf_desc']);
    }
    mysql_close($con);
?>
{
    rows : <?php print json_encode($rows); ?>
}
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
    $json_result = '[';
    while($row = mysql_fetch_array($result)) {
        $json_result .= '[\''.$row['manuf_id'].'\',\''. $row['manuf_name'].'\',\''. $row['manuf_desc'].'\'],';
    }
    $json_result = preg_replace("/\,$/", '', $json_result);
    $json_result .= ']';
    mysql_close($con);
?>
{
    rows : <?php echo $json_result; ?>
}
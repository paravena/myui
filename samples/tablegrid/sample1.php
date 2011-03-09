<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd"> 
<html> 
<head> 
    <title>TableGrid Samples</title> 
    <META http-equiv="Expires" content="0"> 
    <META HTTP-EQUIV="PRAGMA" CONTENT="NO-CACHE"> 
    <link type="text/css" href="../../css/main.css" rel="stylesheet"> 
    <link type="text/css" href="../../css/myui/tablegrid.css" rel="stylesheet">
    <link type="text/css" href="../../css/highlighter/shCore.css" rel="stylesheet"> 
    <link type="text/css" href="../../css/highlighter/shThemeDjango.css" rel="stylesheet" id="shTheme"> 
    <script type="text/javascript" src="../../scripts/lib/prototype/back/prototype.js"></script>
    <script type="text/javascript" src="../../scripts/lib/scriptaculous/scriptaculous.js"></script>
    <script type="text/javascript" src="../../scripts/lib/myui/myui.js"></script>
    <script type="text/javascript" src="../../scripts/highlighter/shCore.js"></script> 
    <script type="text/javascript" src="../../scripts/highlighter/shBrushJScript.js"></script> 
    <script type="text/javascript" src="../../scripts/highlighter/shBrushJava.js"></script> 
    <script type="text/javascript" src="../../scripts/highlighter/shBrushXml.js"></script> 
    <script type="text/javascript" src="../../scripts/highlighter/shBrushPlain.js"></script> 
</head> 
<script type="text/javascript"> 
    SyntaxHighlighter.config.clipboardSwf = '../../scripts/highlighter/clipboard.swf';
    SyntaxHighlighter.all();
</script> 
<body> 
	<div style="width: 500px">
	2-1
	<pre class="brush: java;gutter: false;"> 
		&lt;modifiers&gt; class &lt;class_name> {
			[&lt;attribute_declarations&gt;]
			[&lt;constructor_declarations&gt;]
			[&lt;method_declarations&gt;]
		}
	</pre>
	2-2
	<pre class="brush: java;"> 
		public class Vehicle {
			private double maxLoad;
			public void setMaxLoad(double value) {
				maxLoad = value;
			}
		}
	</pre> 
	2-3
	<pre class="brush: java; gutter: false;"> 
		[&lt;modifiers&gt;] &lt;type&gt; &lt;name&gt; [ = &lt;initial_value&gt;];
	</pre>
	2-4
	<pre class="brush: java;"> 
		public class Foo {
			private int x;
			private float y = 10000.0F;
			private String name = "Bates Motel";
		}
	</pre>
	2-5
	<pre class="brush: java; gutter: false;"> 
		[&lt;modifiers&gt;] &lt;return_type&gt; &lt;name&gt;([&lt;argument_list&gt;]) {
			[&lt;statements&gt;]
		}
	</pre>
	2-6
	<pre class="brush: java;"> 
		public class Dog {
			private int weight;
			public int getWeight() {
				return weight;
			}
			public void setWeight(int newWeight) {
				weight = newWeight;
			}
		}
	</pre>
	2-7
	<pre class="brush: java;"> 
		d.setWeight(42);
		d.weight = 42; // only permissible if weight is public
	</pre>
	2-8
	<pre class="brush: java;"> 
		d.day = 32;
		// invalid day
		d.month = 2; d.day = 30;
		// plausible but wrong
		d.day = d.day + 1;
		// no check for wrap around
	</pre>
	2-9
	<pre class="brush: java;"> 
		MyDate d = new MyDate();
		d.setDay(32);
		// invalid day, returns false
		d.setMonth(2);
		d.setDay(30);
		// plausible but wrong, setDay returns false
		d.setDay(d.getDay() + 1);
		// this will return false if wrap around
		// needs to occur
	</pre>
	2-10
	<pre class="brush: java;"> 
		public class Dog {
			private int weight;

			public Dog() {
				weight = 42;
			}

			public int getWeight() {
				return weight;
			}
		
			public void setWeight(int newWeight) {
				weight = newWeight;
			}
		}
	</pre>
	2-11
	<pre class="brush: java;gutter:false;"> 
		[&lt;package_declaration&gt;]
		[&lt;import_declarations&gt;]
		&lt;class_declaration&gt;+
	</pre>
	2-12
	<pre class="brush: java;"> 
		package shipping.reports;

		import shipping.domain.*;
		import java.util.List;
		import java.io.*;
		
		public class VehicleCapacityReport {
			private List vehicles;
			public void generateReport(Writer output) {...}
		}
	</pre>
	2-13
	<pre class="brush: java;gutter:false;"> 
		package &lt;top_pkg_name&gt;[.&lt;sub_pkg_name&gt;]*;
	</pre>
	2-14
	<pre class="brush: java;gutter:false;"> 
		package shipping.reports;
	</pre>
	2-15
	<pre class="brush: java;gutter:false;"> 
		import &lt;pkg_name&gt;[.&lt;sub_pkg_name&gt;].&lt;class_name&gt;;
		OR
		import &lt;pkg_name&gt;[.&lt;sub_pkg_name&gt;].*;
	</pre>
	2-16
	<pre class="brush: java;"> 
		import shipping.domain.*;
		import java.util.List;
		import java.io.*;
	</pre>
	3-1
	<pre class="brush: java;gutter:false;"> 
		totals = a + b + c + d + e + f;
	</pre>
	3-2
	<pre class="brush: java;gutter:false;"> 
		{
			x = y + 1;
			y = x + 1;
		}
	</pre>
	3-3
	<pre class="brush: java;"> 
		public class MyDate {
			private int day;
			private int month;
			private int year;
		}
	</pre>
	3-4
	<pre class="brush: java;gutter:false;"> 
		boolean truth = true;
	</pre>
	3-5
	<pre class="brush: java;gutter:false;">
		String greeting = "Good Morning !! \n";
		String errorMessage = "Record Not Found !";
	</pre>
	3-6
	<pre class="brush: java;">
		public class MyDate {
			private int day = 1;
			private int month = 1;
			private int year = 2000;
			public MyDate(int day, int month, int year) { ... }
			public void print() { ... }
		}
			
		public class TestMyDate {
			public static void main(String[] args) {
				MyDate today = new MyDate(22, 7, 1964);
			}
		}
	</pre>
	4-1
	<pre class="brush: java;">
		public class ScopeExample {
			private int i = 1;

			public void firstMethod() {
				int i = 4, j = 5;
				this.i = i + j;
				secondMethod(7);
			}
	
			public void secondMethod(int i) {
				int j = 8;
				this.i = i + j;
			}
		}
		
		public class TestScoping {
			public static void main(String[] args) {
				ScopeExample scope = new ScopeExample();
				scope.firstMethod();
			}
		}
	</pre>
	</div>
</body> 
</html>
$( document ).ready( function() {

	var currentYear = "i_di10";

	drawMap(currentYear);
	fillNational("i_di10")
	setupSlider();
	setSliderTicks();

});

var drawMap = function(currentYear) {

	var urls = {
        us: "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/us.json",
        states: "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/states.json",
        counties: "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/counties.json"
    };

    //hide all tooltips
    $(".dlegend-tooltip").attr("style", "visibility: hidden;")
    $(".dmap-tooltip").attr("style", "visibility: hidden;")

	var width = $("#dmapContainer").width(),
		height = $("#dmapContainer").width()*0.618,
		active = d3.select(null),
		projection = d3.geo.albersUsa()
	    	.scale(1100)
		path = d3.geo.path()
			.projection(projection),
		usMap = d3.select("#dmapContainer")
			.append("svg")
				.attr("width", width)
	    		.attr("height", height)
	    		.on("click", stopProp, true)
	    		.on("mouseleave", function(e){
					if( $(".active-state").length === 0  ) {
						var thisYear = $(".active").attr("id");
						fillNational(thisYear);
					}
				})
		zoom = d3.behavior.zoom()
		    .scale(.69)
		    .scaleExtent([.69, 7])
		    .on("zoom", function(){
		    	features.style("stroke-width", 1.5 / d3.event.scale + "px");
	  			features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			  });
		
	usMap.append("rect")
	    .attr("class", "mapBack")
	    .attr("width", width)
	    .attr("height", height)
	    .on("click", resetMap)

	var features = usMap.append("g");


	usMap 
		.call(zoom)
		.call(zoom.event)

    //load files
    queue()
        .defer(d3.json, "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/us.json")
        .defer(d3.json, "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/counties.json")
        .defer(d3.json, "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/states.json")
        .await(renderMap);

    function renderMap(error, us, counties, states){
    	var landMass = topojson.feature(us, us.objects.land);
    	var counties = topojson.feature(counties, counties.objects.counties).features;
    	var stateLines = topojson.mesh(states, states.objects.states, function(a, b) { return a !== b; });

    	//create land backgrouns
    	features.append("path")
		   .datum(landMass)
		   .attr("class", "dmap-land")
		   .attr("id", "land")
		   .attr("d", path)

		// Create counties and hover effect
	    features.selectAll("path")
	      .data(counties)
	    	.enter().append("path")
	      	.attr("d", path)
	      	.attr("class",function(e){
	      		var currentYearProp = e.properties[currentYear];	
	      		return ("dmap-county " + currentYearProp)
	      	})
	      	.attr("data-fips",function(e){
	      		var fipsCode= e.properties["FIPS"];
	      		return (fipsCode)
	      	})
	      	.attr("data-value",function(e){
	      		var currentYearProp = e.properties[currentYear];
	      		return (currentYearProp)
	      	})
	      	.style("fill", function(d) { 
	      		return establishColor(d.properties[currentYear]);
	      	})
			.on("mouseover", function(e){
				if( $(".active-state").length === 0 ){
					var activeYear = $(".active").attr("id");
					fillInfo(e, activeYear);
					fillExtraInfo(e, activeYear);
				d3.select(this)
					.style("fill", "rgb(255,255,255")
				}
				fillTooltip(e)
			})
			.on("mouseout", function(e){
				var establishYear=d3.select(this).attr("data-value");
				d3.select(this)
					.style("fill", establishColor(establishYear))
				$(".dmap-tooltip").attr("style", "visibility: hidden;")
				$(".dlegend-tooltip").attr("style", "visibility: hidden;")


			})
			.on("click", function(e){
				// switch between it being active and not
				if (active.node() === this) return resetMap();
				active.classed("active-state", false);
				active = d3.select(this).classed("active-state", true)
				var activeYear = $(".active").attr("id");
				d3.select(this)
					.style("fill", "rgb(255,255,255")

				fillInfo(e, activeYear);
				fillExtraInfo(e, activeYear);
				
				//zoom in or out of active path
				zoomPath(e)

			})

		// Create the mesh outline States
	     features.append("path")
		   .datum(stateLines)
		   .attr("class", "dmap-state-lines")
		   .attr("d", path)
    }

	// Legend click events
    $('.dmap-zoom-btn').on('click', function(e){
    	zoomControl($(this).attr('rel'));
    	e.preventDefault();
    })

    $('.dmap-reset-map').on('click', function(e){
    	resetMap();
    })

    var fillTooltip = function(e) {
		var mouse = d3.mouse(usMap.node()).map( function(d) { return parseInt(d); } );$(".dmap-tooltip").attr("style", "visibility: visible;")
		if(mouse[0] < 300) {
			$(".dmap-tooltip").attr("style", "left:"+(mouse[0]+70)+"px; top:"+(mouse[1]+140)+"px")
			$(".dmap-tooltip").removeClass("left-arrow");
			$(".dmap-tooltip").addClass("right-arrow");
		}else{
			$(".dmap-tooltip").attr("style", "left:"+(mouse[0]-160)+"px; top:"+(mouse[1]+140)+"px")
			$(".dmap-tooltip").addClass("left-arrow");
			$(".dmap-tooltip").removeClass("right-arrow");
		}
		$(".dmap-tooltip-state").html(e.properties.STATE_NAME)
		$(".dmap-tooltip-county").html(e.properties.i_cty)
	}

	var resetMap = function() {
		  active.classed("active-state", false);
		  active = d3.select(null);

		  usMap.transition()
		      .duration(750)
		      .call(zoom.translate([0, 0]).scale(.69).event);
	}

	var stopProp= function() {
	  if (d3.event.defaultPrevented) d3.event.stopPropagation();
	}

	var zoomPath = function(e){
		var bounds = path.bounds(e),
		    dx = bounds[1][0] - bounds[0][0],
		    dy = bounds[1][1] - bounds[0][1],
		    x = (bounds[0][0] + bounds[1][0]) / 2,
		    y = (bounds[0][1] + bounds[1][1]) / 2,
		    scale = .1 / Math.max(dx / width, dy / height),
		    translate = [width / 2 - scale * x, height / 2 - scale * y];
		
		usMap.transition()
			.duration(750)
			.call(zoom.translate(translate).scale(scale).event);
    }

    var zoomControl = function(zoomDirection){
  		var currentScale = zoom.scale();
  		
  		// detect which button is pressed and zoom in/out if 
  		// current zoom is within specified limits
  		if (zoomDirection == "in" && currentScale <= 7 ) {
  				var newZoom = zoom.scale() * 1.95;
				var newX = ((zoom.translate()[0] - (width / 2)) * 1.95) + width / 2;
				var newY = ((zoom.translate()[1] - (height / 2)) * 1.95) + height / 2;
				zoom.scale(newZoom);
		  		zoom.translate([newX,newY]);
		  		features.transition()
			      .duration(750)
			      .style("stroke-width", 1.5 / newZoom + "px")
			      .attr("transform", "translate(" + [newX,newY] + ")scale(" + newZoom + ")");
		} else if (zoomDirection == "out" && currentScale > 2 ){
				var newZoom = zoom.scale() * .45;
				var newX = ((zoom.translate()[0] - (width / 2)) * .45) + width / 2;
				var newY = ((zoom.translate()[1] - (height / 2)) * .45) + height / 2;  
				zoom.scale(newZoom);
		  		zoom.translate([newX,newY]);
		  		features.transition()
			      .duration(750)
			      .style("stroke-width", 1.5 / newZoom + "px")
			      .attr("transform", "translate(" + [newX,newY] + ")scale(" + newZoom + ")");
		} 
	}
}

var establishColor = function(colorEdit){
	if(colorEdit == "null" || colorEdit =="" || colorEdit == " ") {
		return "rgb(190,190,190)";
	} else if (colorEdit <= 15){
		return "rgb(205,234,249)";
	} else if( colorEdit > 15 && colorEdit <= 30){
		return "rgb(169,223,250)";
	} else if( colorEdit > 30 && colorEdit <= 45){
		return "rgb(111,194,235)";
	} else if( colorEdit > 45 && colorEdit <= 55){
		return "rgb(41,161,220)";
	} else if( colorEdit > 55 && colorEdit <= 100){
		return "rgb(26,137,192)";
	} else if (colorEdit == "null"){
		return "rgb(190,190,190)";
	}
}

var fillInfo = function(e, thisYear) {
	$(".national-name").html("")

	var stateName = stateToAP(e.properties.STATE_NAME),
		countyName = e.properties.i_cty,
		dIndex = e.properties[thisYear],
		fipsCode = e.properties.FIPS;
	$(".state-name").html(stateName)
	$(".county-name").html(countyName+ ", ")
	if(dIndex == "") {
		$(".d-index").html("no data");
	}else {
		$(".d-index").html(dIndex)
	}

	//fill population
	$.getJSON('http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/extra.json', function(data) {     
	   var fipsData = getDataByFIPS(fipsCode, data);
	   fillPop(e, fipsData, thisYear);
	});
}

var fillExtraInfo = function(e, thisYear){
	var fipsCode = e.properties.FIPS;
	//use the fipsCode to get the extra JSON data for the bar graph
	$.getJSON('http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/extra.json', function(data) {         
	   var fipsData = getDataByFIPS(fipsCode, data);
	   hispanicBarGraph(fipsData, thisYear);
	   mainBarGraph(fipsData, thisYear);
	});
}

var fillPop = function(e, data, thisYear){
	var fipsCode = e.properties.FIPS;

	$.getJSON('http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/extra.json', function(data) {         
	   	var fipsData = getDataByFIPS(fipsCode, data);
	   	var activeYear = $(".active").attr("id");
		var yearNumber = getCurrentYearNumber(activeYear)
		var numberWithCommas = addCommas(fipsData[0].p[yearNumber]);
		$(".total-pop").html(numberWithCommas)
	});
}

var getDataByFIPS = function(fipsCode, data) {
	return data.filter(
      function(data){return data.id == fipsCode}
  	); 
}

var getMainDataByFIPS = function(fipsCode, data) {
	
	return data.filter(
      function(data){
      	return data.properties["FIPS"] == fipsCode
      }
  	); 
}

var getCurrentYearNumber = function(thisYear){
	swap = {
        i_di60             : "0",
        i_di70             : "1",
        i_di80             : "2",
        i_di90             : "3",
        i_di00             : "4",
        i_di10             : "5",
        i_di20p            : "6",
        i_di30p            : "7",
        i_di40p            : "8",
        i_di50p            : "9",
        i_di60p            : "10", 
    }
	return swap[thisYear]
}

var hispanicBarGraph = function(data, thisYear){
	//remove pre existing chart
	$("#dmap-hispanic-chart").html(" ");

	var thisData = { "hispanic": data[0].h , "years": ["'60","'70","'80","'90","'00","'10","'20p","'30p","'40p","'50p","'60p"] }

	//create new chart
	var margin = {top: 10, right: 10, bottom: 30, left: 30},
		width = 268,
		height = 100

	var ticks = [0,20,40,60,80,100];

	var x = d3.scale.ordinal()
        .domain(thisData.years.map(function(d) {
        	return d;
        }))
        .rangeRoundBands([0, width], 0);

	var y = d3.scale.linear()
	    .domain([0, 100])
        .range([height, 0])

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .tickValues(ticks)
	    .tickFormat(function(d) { 
	    	return d + "%" 
	    })

	var svg = d3.select(".dmap-hispanic-chart-container").append("svg")
	    .attr("class", "chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom).append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

  	svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", ".9em")
            .attr("dy", "1em")

	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	  .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")

	svg.selectAll(".bar")
	    	.data(thisData.hispanic)
	  	.enter()
		  	.append("rect")
			    .attr("class", function(d) {
		            return "bar " + d;
		        })
		        .attr("x", function(d, i) {
		            return i * x.rangeBand() + 6;
		        })
		        .attr("y", function(d) {
		            return y(d);
		        })
		        .attr("width", function(){
		            return 18;
		        })
		        .attr("height", function(d) {
		            return height -y(d);
		        })
		        .on("mouseover", function(e){
					var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
					$(".dlegend-tooltip").attr("style", "visibility: visible;")
					$(".dlegend-tooltip-amount").html(e + "%")
					$(".dlegend-race-label").html("hispanic: ")
					console.log(mouse[0])
					if( mouse[0] < 130){
						$(".dlegend-tooltip").attr("style", "left:"+(mouse[0]+740)+"px; top:"+(mouse[1]+480)+"px")
						$(".dlegend-tooltip").removeClass("left-arrow");
						$(".dlegend-tooltip").addClass("right-arrow");
					}else {
						$(".dlegend-tooltip").attr("style", "left:"+(mouse[0] + 590)+"px; top:"+(mouse[1]+480)+"px")
						$(".dlegend-tooltip").addClass("left-arrow");
						$(".dlegend-tooltip").removeClass("right-arrow");
					}
				})
				.on("mouseout", function(e){
					$(".dlegend-tooltip").attr("style", "visibility: hidden;")


				})


	        
}
var mainBarGraph = function(data, thisYear){
	//remove pre existing chart
	$("#dmap-main-chart").html(" ");

	//create new chart
	var newData = redesignData(data),
		margin = {top: 10, right: 10, bottom: 30, left: 30},
		width = 270,
		height = 100
	

	var color = d3.scale.ordinal()
    	.range(["rgb(205,234,249)", "rgb(26,137,192)", "rgb(111,194,235)"]);
	
	var ticks = [0,20,40,60,80,100];

	var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0);

	var y = d3.scale.linear()
        .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .tickValues(ticks)
	    .tickFormat(function(d) { 
	    	return d + "%" 
	    })

	var svg = d3.select(".dmap-main-chart-container").append("svg")
	    .attr("class", "chart")
	     .attr("width", width + margin.left + margin.right)
	     .attr("height", height + margin.top + margin.bottom).append("g")   
	     .append("g")
	     	.attr("transform", "translate(" + margin.left + "," + margin.right + ")");


	color.domain(d3.keys(newData[0]).filter(function(key) { return key !== "year"; }));

	newData.forEach(function(d) {
	  var y0 = 0;
	  d.races = color.domain().map(function(race) { 
	  	return {race: race, y0: y0, y1: y0 += +d[race]}; });
	  d.total = d.races[d.races.length - 1].y1;
	});

	y.domain([0, 100]);
	x.domain(newData.map(function(d) {return d.year; }))


	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis)
	    .selectAll("text")  
            .style("text-anchor", "end")
             .attr("dx", ".5em")
             .attr("dy", "1em")

	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	  .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")

	var county = svg.selectAll(".county")
	    .data(newData)
	  .enter().append("g")
	    .attr("class", function(d) {
	         return "bar " + d.year;
	     })
	    .attr("data-year", function(d) {
	         return  d.year;
	     })
	    .attr("transform", function(d) { return "translate(" + x(d.year) + ",0)"; });

	county.selectAll("rect")
	    .data(function(d) { 
	    	return d.races; })
	  .enter().append("rect")
	    .attr("width", function(){
	       return 18;
	    })
	    .attr("y", function(d) { 
	    	return y(d.y1); })
	    .attr("height", function(d) { 
	    	return y(d.y0) - y(d.y1); 
	    })
	    .style("fill", function(d) { return color(d.race); })
	    .on("mouseover", function(e){
			var amount = e.y1 - e.y0;
			var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
			$(".dlegend-tooltip").attr("style", "visibility: visible;")
			$(".dlegend-race-label").html(e.race)
			$(".dlegend-tooltip-amount").html(amount + "%")
			if( mouse[0] < 130){
				$(".dlegend-tooltip").attr("style", "left:"+(mouse[0]+750)+"px; top:"+(mouse[1]+250)+"px")
				$(".dlegend-tooltip").removeClass("left-arrow");
				$(".dlegend-tooltip").addClass("right-arrow");
			}else {
				$(".dlegend-tooltip").attr("style", "left:"+(mouse[0]+600)+"px; top:"+(mouse[1]+250)+"px")
				$(".dlegend-tooltip").addClass("left-arrow");
				$(".dlegend-tooltip").removeClass("right-arrow");
			}
		})
		.on("mouseout", function(e){
			$(".dlegend-tooltip").attr("style", "visibility: hidden;")

		})


}

var redesignData = function(data) {

    var white = data[0].w;
    var black = data[0].b;
    var other = data[0].o;
    var years = ["'60","'70","'80","'90","'00","'10","'20p","'30p","'40p","'50p","'60p"];

    // Add all data to an associative array that we can loop over
    var data = {
        white: white,
        black: black,
        other: other
    };

    //empty output container
    var output = [];

    // for each year create an object
    $.each(years, function (i, val) {
        var row =  new countyYear();
        function countyYear() {
        	this.year = val;
        	this.white = white[i]
			this.black = black[i]
			this.other = other[i]
        }
        output.push(row); 
    });
    return output;
}


var setupSlider = function(){
	$( "#slider" ).slider({
      value:2010,
      animate: true,
      dragAnimate: "fast",
      min: 1960,
      max: 2060,
      step: 10,
      slide: function( event, ui ) {
      	$(".slider-step").removeClass("active");
      	//on slider slide, change the year for data
      	yearValue = ui.value;
      	yearChange(yearValue)
      	$("." + yearValue + "-step").addClass("active");
      }
    })
 
	//how far apart each option label should appear
	var sliderWidth =$("#slider").width() / 10.05;
 	$(".slider-step").css("width", sliderWidth);
}

var setSliderTicks = function(){
    var $slider =  $('#slider');
    var max =  11;    
    var spacing =  100 / (max -1);

    $slider.find('.ui-slider-tick-mark').remove();
    for (var i = 0; i < max ; i++) {
        $('<span class="ui-slider-click-area"><span class="ui-slider-tick-mark"></span></span>').css('left', (spacing * i) +  '%').appendTo($slider); 
     }
}

var yearChange = function(yearValue) {
	currentClass= "." + yearValue +"-step";
	newYear = $(currentClass).attr("id");
	var usMap = d3.select("#dmapContainer");
	d3.json("http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/counties.json", function(error, us) {	
		//Create counties and hover effect
	    usMap
	   	  .selectAll("path")
	   	    .data(topojson.feature(us, us.objects.counties).features)
	   	    	.style("fill", function(d) { 
	   	    		return establishColor(d.properties[newYear]);
	   	    	})
	   	    	.attr("data-value", function(d) { 
	   	    		return d.properties[newYear] ;
	   	    	});
	   //Filling in information is handled differently for year change on zoom in.
	   if( $(".active-state").length != 0) {
			var thisData = (topojson.feature(us, us.objects.counties).features),
				fipsCode = $(".active-state").attr("data-fips"),
				fipsData = getMainDataByFIPS(fipsCode, thisData);

			//refilling info, replace this please
			var dIndex = fipsData[0].properties[newYear],
				fipsCode = fipsData[0].properties.FIPS;
			if(fipsData[0].properties[newYear] == "") {
				$(".d-index").html("no data");
			}else {
				$(".d-index").html(dIndex);
			}
			
			
			$.getJSON('http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/extra.json', function(data) {         
			   	var newFipsData = getDataByFIPS(fipsCode, data);
				var yearNumber = getCurrentYearNumber(newYear)
				var numberWithCommas = addCommas(newFipsData[0].p[yearNumber]);
				$(".total-pop").html(numberWithCommas)
			});
	   }	
	});
	//filling in national data
	if( $(".active-state").length === 0){
		fillNational(newYear)
	}

}

var fillNational = function(currentYear){
	$(".county-name").html("");
	$(".state-name").html("");
	$.getJSON('http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/extra.json', function(data) {  
		// fill in national information
		
		
	//fill population
		var yearNumber = getCurrentYearNumber(currentYear);
		var	nationalData = data.filter(function(data){
	      		return data.id == "n"
	      	});

		hispanicBarGraph(nationalData, currentYear);
	   	mainBarGraph(nationalData, currentYear);

	   	var numberWithCommas = addCommas(nationalData[0].p[yearNumber]);
		$(".total-pop").html(numberWithCommas)  
		$(".d-index").html(nationalData[0].d[yearNumber])  
		$(".national-name").html("National Data")   

	});
}

var stateToAP = function(state) {
    swap = {
        Alabama             : "Ala.",
        Alaska              : "Alaska",
        Arizona             : "Ariz.",
        Arkansas            : "Ark.",
        California          : "Calif.",
        Colorado            : "Colo.",
        Connecticut         : "Conn.",
        Delaware            : "Del.",
        Florida             : "Fla.",
        Georgia             : "Ga.",
        Hawaii              : "Hawaii",
        Idaho               : "Idaho",
        Illinois            : "Ill.",
        Indiana             : "Ind.",
        Iowa                : "Iowa",
        Kansas              : "Kan.",
        Kentucky            : "Ky.",
        Louisiana           : "La.",
        Maine               : "Maine",
        Maryland            : "Md.",
        Massachusetts       : "Mass.",
        Michigan            : "Mich.",
        Minnesota           : "Minn.",
        Mississippi         : "Miss.",
        Missouri            : "Mo.",
        Montana             : "Mont.",
        Nebraska            : "Neb.",
        Nevada              : "Nev.",
        "New Hampshire"     : "N.H.",
        "New Jersey"        : "N.J.",
        "New Mexico"        : "N.M.",
        "New York"          : "N.Y.",
        "North Carolina"    : "N.C.",
        "North Dakota"      : "N.D.",
        Ohio                : "Ohio",
        Oklahoma            : "Okla.",
        Oregon              : "Ore",
        Pennsylvania        : "Pa",
        "Rhode Island"      : "R.I.",
        "South Carolina"    : "S.C.",
        "South Dakota"      : "S.D.",
        Tennessee           : "Tenn.",
        Texas               : "Texas",
        Utah                : "Utah",
        Vermont             : "Vt.",
        Virginia            : "Va.",
        Washington          : "Wash.",
        "West Virginia"     : "W.Va.",
        Wisconsin           : "Wis.",
        Wyoming             : "Wyo.",

        "District Of Columbia"      : "D.C.",
        "Puerto Rico"               : "P.R.",
        "Northern Mariana Islands"  : "M.P.",
        "Virgin Islands"            : "VI",
        "American Samoa"            : "A.S.",
        Guam                        : "Guam",
    }
    return swap[state]
}

var addCommas = function(num ) {
    var str = num.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
}


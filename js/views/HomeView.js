define([
  'jquery', 
  'jqueryUI',
  'underscore', 
  'backbone',
  'queue',
  'topojson',
  'd3',
  'animate',
], function($, jqueryUI, _, Backbone, Queue, topojson, d3, Animate){

  var HomeView = Backbone.View.extend({
    el: $(".dmap-app-container"),

    render: function(){
     
      //hide all tooltips
      $(".dlegend-tooltip").attr("style", "visibility: hidden;")
      $(".dmap-tooltip").attr("style", "visibility: hidden;")
     
      var currentYear = "i_di10";
      this.drawMap(currentYear);

    },
   drawMap: function(currentYear){
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
                .on("click", this.stopProp, true)
                .on("mouseleave", function(e){
                if( $(".active-state").length === 0  ) {
                  var thisYear = $(".active").attr("id");
                  this.fillNational(thisYear);
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
            .on("click", this.resetMap)

        var features = usMap.append("g");

        usMap 
          .call(zoom)
          .call(zoom.event)

          //load files
          queue()
              .defer(d3.json, "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/us.json")
              .defer(d3.json, "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/counties.json")
              .defer(d3.json, "http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/states.json")
              .await(this.renderMap);

         },
      renderMap: function(error, us, counties, states) {
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
      },
      stopProp: function() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
      },
      resetMap : function() {
          active.classed("active-state", false);
          active = d3.select(null);

          usMap.transition()
              .duration(750)
              .call(zoom.translate([0, 0]).scale(.69).event);
      },
      fillNational : function(currentYear){
        $(".county-name").html("");
        $(".state-name").html("");
        $.getJSON('http://www.gannett-cdn.com/GDContent/2014/diversity-map/data/extra.json', function(data) {  
          // fill in national information
          
          
        //fill population
          var yearNumber = getCurrentYearNumber(currentYear);
          var nationalData = data.filter(function(data){
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


  });

  return HomeView;
  
});

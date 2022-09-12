
function Close() {
  var T = document.getElementById("tutorial");
  T.style.display = "none";  
}

function Open() {
  var T = document.getElementById("tutorial");
  T.style.display = "block";  
}

//TOP GENES
d3.json("http://127.0.0.1:5000/genes",function(error,f){
  if (error) throw error;

d3.json("http://127.0.0.1:5000/pca",function(error,pcad){
    if (error) throw error;
    
var pcaData = pcad.data;
var pca_x_axis_lable = pcad.x;
var pca_y_axis_lable = pcad.y;
var hdata = [];
var network ='';
var filter = f.data;
var keep_me_alive;
var resizing = false;
var reset = false;

d3.csv("../static/data/GeniPAAD.csv", function(Odata){


redraw(100)

function redraw(f){
  var ultfilt = filter.slice(0,f)
  resizing = false;
  data = Odata.filter(function(d,i){ return ultfilt.indexOf(d.GeneEnsembl) >= 0 })
  var globaldata = [];
  var globaldata_control;
  var saved = f;
  const h = document.getElementById('pca').clientHeight
  const hS = document.getElementById('genescatter').clientHeight
  const hP = document.getElementById('parallel').clientHeight
  const hD = document.getElementById('dce').clientHeight
  render();

  function render_resize(){
    resizing = true;
    render();
  }
  function render(saved){
      d3.selectAll('#genescatter svg').remove();
      d3.selectAll('#parallel svg').remove();
      d3.selectAll('#pca svg').remove();
      d3.selectAll('#dce svg').remove();
      var margin = {top: 40, right: 30, bottom: 40, left: 60}
      myResponsiveComponent(saved,d3.select("#pca"),d3.select("#genescatter"),d3.select("#parallel"),d3.select("#dce"),{
          margin:margin,
          widthScatter : document.getElementById('genescatter').clientWidth- margin.left - margin.right ,
          widthParallel : document.getElementById('parallel').clientWidth- margin.left - margin.right ,
          widthDce : document.getElementById('dce').clientWidth- margin.left - margin.right ,
          heightScatter : hS - margin.top - margin.bottom ,
          heightParallel : hP - margin.top - margin.bottom,
          heightDce : hD - margin.top - margin.bottom - 50,
          width : document.getElementById('pca').clientWidth- margin.left - margin.right ,
          height : h - margin.top - margin.bottom
      });
  }

  window.addEventListener('resize',render_resize);

function myResponsiveComponent(saved,container,cont1,cont2,cont3,props){
// Gene Scatterplot
var genescatter = cont1
    .append("svg")
    .attr("width", props.widthScatter + props.margin.left + props.margin.right)
    .attr("height", props.heightScatter + props.margin.top + props.margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + props.margin.left + "," + props.margin.top + ")");

// Parallel Coordinates
var prl = cont2
.append("svg")
.attr("width", props.widthParallel + props.margin.left + props.margin.right)
.attr("height", props.heightParallel + props.margin.top + props.margin.bottom)
.append("g")
.attr("transform",
"translate(" + props.margin.left + "," + props.margin.top + ")");

var pc = container
      .append("svg")
      .attr("width", props.width+ props.margin.left + props.margin.right)
      .attr("height", props.height+ props.margin.top + props.margin.bottom)
      .append("g")
      .attr("transform",
      "translate(" +props.margin.left + "," + props.margin.top + ")");

d3.selection.prototype.moveToFront = function() {
  console.log(this.parentNode)
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

    /////////////////////////////////////////////////////
    //////////////  PCA SECTION  //////////////////
    /////////////////////////////////////////////////////
        //Background
        pc
        .append("rect")
            .attr("x",0)
            .attr("y",0)
            .attr("height", props.height)
            .attr("width", props.width)
            .style("fill", "#ffffff")

        var xPCA = d3.scaleLinear()
            .domain([d3.min(pcaData,function(d){return d.x;}) -5,
                    d3.max(pcaData, function(d){return d.x;}) +5])
            .range([0,props.width]);
        var xAxis = pc.append("g")
            .attr("class", "axisColor")
            .attr("transform", "translate(0," + props.height + ")")
            .call(d3.axisBottom(xPCA));
            
            pc.append("text")
            .attr("class", "axisColor")
            .attr("transform","translate("+ (props.width/2 - 15) +","+ (props.height + 30)+ ")")
            .style("text-transform","initial")
            .text(pca_x_axis_lable);

        var yPCA = d3.scaleLinear()
            .domain([d3.min(pcaData,function(d){return d.y;}) -5,
                    d3.max(pcaData, function(d){return d.y;}) +5])
            .range([props.height,0]);

        var yAxis = pc.append("g")
            .attr("class", "axisColor")
            .call(d3.axisLeft(yPCA))

            pc.append("text")
            .attr("class", "axisColor")
            .attr("transform","translate("+ (-props.margin.right) + ","+ (props.height/2) +")rotate(-90)")
            .style("text-transform","initial")
            .text(pca_y_axis_lable)


        var colorPCA = d3.scaleOrdinal()
            .domain(["HC", "PAAD"])
            .range([ "#619CFF","#F8766D"])

        //ToolTip

        var tooltip = d3.select("#pca")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        var mouseover = function(d) {
            tooltip.style("opacity", 1)
            d3.select(this).transition()
                .duration(1)
                .attr("r",6);
            d3.select(this).raise()
            }

        var mousemove = function(d) {
            var html  = "<span style='color:" + colorPCA(d.class) + ";'>" + "Id : " + d.id + "</span><br/>";
            tooltip.html(html)
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
            .transition()
                .duration(50) 
                .style("opacity", .9) 
            }

        var mouseleave = function(d) {
            tooltip
                .transition()
                .duration(50)
                .style("opacity", 0)
            d3.select(this).transition()
                .duration(1)
                .attr("r",4);
            }

        // Add dots & zoom
        // ZOOM section

        var zoom = d3.zoom()
        .scaleExtent([.5, 20])  
        .extent([[0, 0], [props.width, props.height]])
        .on("zoom", updateChartPCA);

        pc.append("rect")
          .attr("width", props.width)
          .attr("height", props.height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
          .call(zoom);
        
        var clip = pc.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", props.width )
        .attr("height", props.height )
        .attr("x", 0)
        .attr("y", 0);
        
        var scatter = pc.append('g')
            .attr("clip-path", "url(#clip)")
      
        scatter
          .selectAll("dot")
          .data(pcaData)
          .enter()
          .append("circle")
              .attr("cx", function (d) { return xPCA(d.x); } )
              .attr("cy", function (d) { return yPCA(d.y); } )
              .attr("r", 4)
              .style("opacity", 0.8)
              .style("fill", function (d) { return colorPCA(d.class) } )
          .on("mouseover", mouseover )
          .on("mousemove", mousemove )
          .on("mouseleave", mouseleave );
      

        function updateChartPCA() {

            var newX = d3.event.transform.rescaleX(xPCA);
            var newY = d3.event.transform.rescaleY(yPCA);
        
            // update gli axis
            xAxis.call(d3.axisBottom(newX))

            yAxis.call(d3.axisLeft(newY))
        
            // update i punti
            scatter
            .selectAll("circle")
              .attr('cx', function(d) {return newX(d.x)})
              .attr('cy', function(d) {return newY(d.y)});
        }

    /////////////////////////////////////////////////////
    //////////////  GENE VIEW SECTION  //////////////////
    /////////////////////////////////////////////////////

    

    var xscatter = d3.scaleLinear()
        .domain([d3.min(data,function(d){return parseFloat(d.logCPM);})-1,
                 d3.max(data, function(d){return parseFloat(d.logCPM);})+1])
        .range([0,props.widthScatter]);
        

    var xSAxis = genescatter.append("g")
        .attr("class", "axisColor")
        .attr("transform","translate(0," + props.heightScatter + ")")
        .call(d3.axisBottom(xscatter))
        .append("text")
        .attr("fill", "black")
        .attr("transform","translate("+ props.widthScatter/2 +","+ props.margin.right + ")")
        .style("text-transform","initial")
        .text("Average LogCPM (Log Counts Per Million)");

    var yscatter = d3.scaleLinear()
        .domain([d3.min(data,function(d){return parseFloat(d.logFC);})-1 ,
                 d3.max(data, function(d){return parseFloat(d.logFC);})+1 ])
        .range([props.heightScatter,0]);
  

    var ySAxis = genescatter.append("g")
        .attr("class", "axisColor")
        .call(d3.axisLeft(yscatter))
        .append("text")
        .attr("fill", "black")
        .attr("transform","translate("+ (-props.margin.right) + ","+ (props.heightScatter/2 - props.margin.top) +")rotate(-90)")
        .style("text-transform","initial")
        .text("LogFC");

    const xScatterGrid = d3.axisBottom(xscatter).tickSize(props.heightScatter).tickFormat('').ticks();
    const yScatterGrid = d3.axisLeft(yscatter).tickSize(-props.widthScatter).tickFormat('').ticks();

    genescatter.append('g')
      .attr('class', 'x axis-grid')
      .call(xScatterGrid)
      .attr('opacity','0.1');

    genescatter.append('g')
      .attr('class', 'y axis-grid')
      .call(yScatterGrid)
      .attr('opacity','0.1');

    var color = d3.scaleOrdinal()
            .domain(["up","ns","down"])
            .range(["#F8766D","#808080","#59b5c9"])

    var myCircle = genescatter.append('g')
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class" , function(d){return "circle"+d.GeneEnsembl})
                .attr("cx",function(d){return xscatter(d.logCPM);})
                .attr("cy",function(d){return yscatter(d.logFC);})
                .attr("r",4)
                .style("fill",function(d) {return color(d.regulation)})
                .style("opacity",0.6)
          
      genescatter.call(d3.brush()
            .extent( [[0,0], [props.widthScatter,props.heightScatter]])
            .on("start brush",updateChart) //was not active
            .on("end brush",updateChart)
      )

      table(data)
      globaldata = data;
    
    var x0 = 0,x1 = 0,y0 = 0,y1 = 0, foreground,ScatterplotBrushList = [], parallelBrushList=[], parallelData=[], scatterData=[],  extent, extentP=0;

    function updateChart() {
        extent = d3.event.selection;
        myCircle.classed('selected' , false) 
        myCircle.classed('intersected' , false) 
        foreground.style("stroke","#3DBD35") 
        ScatterplotBrushList = []
        databrush = data.filter(function(d){return x0 <= xscatter(d.logCPM) && xscatter(d.logCPM) <= x1 && y0 <= yscatter(d.logFC) && yscatter(d.logFC) <= y1 ;});
        databrush.forEach(d=>{
          ScatterplotBrushList.push(d.GeneEnsembl) 
        })
        scatterData = databrush; 
        intersectionOfBrush(extent,extentP, ScatterplotBrushList, parallelBrushList)/
        myCircle.classed("selected",function(d){
          let result = isBrushed(extent,xscatter(d.logCPM),yscatter(d.logFC))
          return result});
         }
         
      
      //hightlight on intersection function
      function intersectionOfBrush(extentScatter,extentParallel,SPList , PCList){
        foreground.style("stroke","#3DBD35").style("opacity",0.9) 
        myCircle.classed('intersected' , false) 
      
        const filteredArray = SPList.filter(value => PCList.includes(value)); 
      

        if((extentScatter === null))
        {

          //SPERIMENTAL
          if (reset){
            PCList.forEach(d=>{
              d3.select('.circle'+d).classed('intersected' , false).raise() 
            })
            reset = false
          }
          //SPERIMENTALEND

          else{
            PCList.forEach(d=>{
              d3.select('.circle'+d).classed('intersected' , true).raise() 
            })
          }

          if(parallelData.length == 0){
            table(data)
            globaldata = data
          }
          
          else{
            table(parallelData)
            globaldata = parallelData
          }

        }

        else if(extentScatter == undefined || (extentScatter[0][0] === extentScatter[1][0] && extentScatter[0][1] === extentScatter[1][1])){
          //SPERIMENTAL
          if (reset){
            PCList.forEach(d=>{
              d3.select('.circle'+d).classed('intersected' , false).raise() 
            })
            reset = false;
          }
          //SPERIMENTALEND
          else{
            PCList.forEach(d=>{
              d3.select('.circle'+d).classed('intersected' , true).raise() 
            })
          }
          
        table(parallelData)
        globaldata = parallelData

        }
        else if(extentParallel == 0){
          SPList.forEach(d=>{
            d3.select('.foreground'+d).style("stroke",'red').style("opacity",1).raise()  
          })
          parallelBrushList = [];
          parallelData = [];
          
        table(scatterData)
        globaldata = scatterData
        

  
        }
        else{
        filteredArray.forEach(d=>{
          d3.select('.foreground'+d).style("stroke",'red').style("opacity",1).raise() 
          d3.select('.circle'+d).classed('intersected' , true).raise() 
        })
        const filteredDataArray = parallelData.filter(value => scatterData.includes(value)); 
        table(filteredDataArray) //create table
        globaldata = filteredDataArray;
      }
    }


    ////////////////////////////////////////////////////////////////
    //////////////         TABLE  SECTION         //////////////////
    ////////////////////////////////////////////////////////////////

      function table(data){
        d3.selectAll("thead").remove();
        d3.selectAll("tbody").remove();
        d3.selectAll("#tabella-arity text").remove();

        var columns = ["GeneEnsembl","geneId","regulation"] //select columns to display
        var table = d3.select("#tabella")
        var tableT = d3.select("#tabella-titles")
        var tableA = d3.select("#tabella-arity")
        var thead = tableT.append('thead')
        var tbody = table.append('tbody')

        tableA.append('text')
        .style("text-transform","initial")
        .text("Number of Selected Genes : " + data.length);


        thead.append('tr')
        .selectAll('th')
          .data(columns)
          .enter()
        .append('th')
          .text(function (d) { return d })
          .style('padding-top','10px')
          .style('width','100px')

        var rows = tbody.selectAll('tr')
          .data(data)
          .enter()
        .append('tr')

        rows.selectAll('td')
          .data(function(row) {
            return columns.map(function (column) {
              return { column: column, value: row[column] }
            })
          })
          .enter()
        .append('td')
          .text(function (d) { return d.value })
          .style('padding-top','20px')
          .style('width','100px')
          .style('font-size','10px')
        }
      

    
    function isBrushed(brush_coords,cx,cy){
        x0 = brush_coords[0][0]
        x1 = brush_coords[1][0]
        y0 = brush_coords[0][1]
        y1 = brush_coords[1][1] 

        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    }

    ////////////////////////////////////////////////////////////////
    //////////////  PARALLEL COORDINATE  SECTION  //////////////////
    ////////////////////////////////////////////////////////////////

      var myV3Reset= document.getElementById('parallelReset');

      myV3Reset.onclick = function(){  
        d3.selectAll(".brush").remove();
        g.append("g")
        .attr("class","brush")
        .each(function(d){
          d3.select(this).call(py[d].brush = d3.brushY()
            .extent([[-10,0], [10,props.heightParallel]])
            .on("brush",brush)
            .on("end",brush)
            )
        })
        .selectAll("rect")
          .attr("x",-8)
          .attr("width",16)
        reset = true;
        brush ()
        
      }

      var dimensions = d3.keys(data[0]).filter(function(d){return d == "absLogFc" || d == "logCPM" || d == "LR"  || d == "FDR"})

      var px = d3.scalePoint()
        .range([0, props.widthParallel])
        .padding(0.2)
        .domain(dimensions);

      var py = {}
      for (i in dimensions) {
        dname = dimensions[i]
        if (dname == "FDR"){
          py[dname] = d3.scaleLog()
          .domain( d3.extent(data, function(d) { return +d[dname]; }) )
          .range([props.heightParallel, 0])
        }
        else {
          py[dname] = d3.scaleLinear()
            .domain( d3.extent(data, function(d) { return +d[dname]; }) )
            .range([props.heightParallel, 0])
        }
      }
      var prlcolor = d3.scaleOrdinal()
          .domain(["up","ns","down"])
          .range(["#F8766D","#808080","#59b5c9"]);
    
      var axis = d3.axisLeft(),
          background,
          parallelChart = false;
          
      
      // inactive genes.
      background = prl.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", path);

      // active genes.
      foreground = prl.append("g")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("class" , function(d){return "foreground"+d.GeneEnsembl})
          .attr("d", path)
      
      foreground.style("stroke","#3DBD35") //function(d) {return prlcolor(d.regulation)}
          .style("fill","none")
          .style("opacity",0.9)


      const g = prl.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class","dimension")
        .attr("transform",function(d){return "translate(" + px(d) + ")"});

      g.append("g")
        .attr("class","axis")
        .each(function(d){
          var renderAxis = d == "FDR"
          ? axis.scale(py[d]) // custom 
          : axis.scale(py[d]);  // default 
          d3.select(this).call(renderAxis)
        })
        .append("text")
        .style("text-anchor","middle")
        .attr("y",-9)
        .text(function(d) {return d;});
      
      // un brush per ogni axis (4).
      g.append("g")
        .attr("class","brush")
        .each(function(d){
          d3.select(this).call(py[d].brush = d3.brushY()
            .extent([[-10,0], [10,props.heightParallel]])
            .on("brush",brush)
            .on("end",brush)
            )
        })
        .selectAll("rect")
          .attr("x",-8)
          .attr("width",16)

      // funzione path per i geni.
      function path(d) {
            return d3.line()(dimensions.map(function(p) { return [px(p), py[p](d[p])]; }));
      }




      // brush per i parallel coordinates , per ogni axis   
      function brush (){
        parallelBrushList=[]
        var actives = [];
        prl.selectAll(".brush")
          .filter(function(d){
            py[d].brushSelectionValue = d3.brushSelection(this);
            return d3.brushSelection(this);
          })
          .each(function(d){
            actives.push({
              dimension: d,
              extent : d3.brushSelection(this).map(py[d].invert)
            });
          });
        var selected = [];

        // Update foreground per fare display  dei soli valori selezionati
        foreground.style("display", function(d){
          let isActive = actives.every(function(active){
            let result = active.extent[1] <= d[active.dimension] && d[active.dimension] <= active.extent[0];
          return result;
          });
          if(actives.length != 0)
          extentP = actives[0].extent
          // else if(actives.length == 0)
          // extentP = -1;
          else
          extentP = 0;
      
          // When no selectors are active, tutti i dati sono visibili.
          isActive = (actives.length == 0 )? true:isActive;

          // Only render rows that are active across all selectors      
          if(isActive) {selected.push(d)
            parallelBrushList.push(d.GeneEnsembl)}; 
            parallelData = selected; 
            
          return (isActive) ? null : "none";
        });
        //call intersection functions
        intersectionOfBrush(extent,extentP, ScatterplotBrushList, parallelBrushList)
      }



      
      ///////////////////////////////////////////////////////////////
      ///////////////////////  DCE  SECTION  ////////////////////////
      ////////////////////////////////////////////////////////////////

      if (resizing == false){
        drawDCE(data)
      }
      else {
        drawHisto(hdata)
      }

      function drawDCE(data){
        if(JSON.stringify(data) !== JSON.stringify(globaldata_control)){
          console.log("cambio?")
          dce_request(data)
        }
        else{
          console.log("non cambio")
          drawHisto(hdata)
        }
      }

      d3.select("#dcebutton").on("click", dcebutton);
      var myLink = document.getElementById('dcenetwork');
      var myGenes= document.getElementById('dcegene');

      myLink.onclick = function(){  
          console.log(network)
          alert(network)
      }

      myGenes.onclick = function(){  
        if (hdata != "empty"){
          const mygenes = hdata.map(({ gene }) => gene);
          alert(mygenes)
        }
        else{
          console.log("empty")
        }
    }


      function dcebutton(){
        if(globaldata !== globaldata_control){
          dce_request(globaldata)
        }
        else{
          console.log("nothing changed")
        }
      }


      // DRAW BARPLOT

      function drawHisto(hdata){
        d3.selectAll("#dce svg").remove();
        var dce = cont3
          .append("svg")
          .attr("width", props.widthDce + props.margin.left + props.margin.right)
          .attr("height", props.heightDce + props.margin.top + props.margin.bottom + 30)
          .append("g")
            .attr("transform",
                  "translate(" + props.margin.left + "," + props.margin.top + ")");

        var xdce = d3.scaleBand()
          .range([ 0, props.widthDce ])
          .domain(hdata.map(function(d) { return d.gene; }))
          .padding(0.2);

        dce.append("g")
          .attr("class", "axisColor")
          .attr("transform", "translate(0," + props.heightDce + ")")
          .call(d3.axisBottom(xdce))
          .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("font-size","8px")
            .style("text-anchor", "end");


        var ydce = d3.scaleLinear()
          .domain([0, d3.max(hdata, function (d) { return d.y })])
          .range([ props.heightDce, 0]);

        dce.append("g")
          .attr("class", "axisColor")
          .call(d3.axisLeft(ydce))
          .append("text")
          .attr("fill", "black")
          .attr("transform","translate("+ props.margin.right/2 + "," + (-props.margin.top/2) +")")
          .style("text-transform","initial")
          .text("Degree");

        const yAxisGrid = d3.axisLeft(ydce).tickSize(-props.widthDce).tickFormat('').ticks();

        dce.append('g')
          .attr('class', 'y axis-grid')
          .call(yAxisGrid)
          .attr('opacity','0.1');


          var dceTTip = d3.select("#dce")
            .append("span")
            .style("opacity", 0)
            .attr("class", "tooltipDce")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        var mouseoverbar = function(d) {
          dceTTip.style("opacity", 1)
          d3.select(this)
            .transition()
            .duration(1)
            .attr("opacity", 1)
            .attr("filter","brightness(85%)")
        }

        var mousemovebar = function(d) {
          var dlist = d3.entries(d);
          var gid = dlist[0]["value"];
          var objid = Odata.filter(function(f,i){ return f.GeneEnsembl == gid })
          dlist = d3.entries(objid);
          gid = dlist[0]["value"]["geneId"]
          var html  = "<span style='font-size:15px; color:" + prlcolor(d.regulation) + ";'>" + "ID : " +gid + "<br/>" +
          "<span style='color:" + prlcolor(d.regulation) + ";'>"+"Degree : " + d.y + "</span><br/>";
          dceTTip.html(html)
              .style("left", (d3.event.pageX + 15) + "px")
              .style("top", (d3.event.pageY - 28) + "px")
          .transition()
              .duration(50) 
              .style("opacity", .9)
        }

      var mouseleavebar = function(d) {
        dceTTip
            .transition()
            .duration(50)
            .style("opacity", 0)

        d3.select(this)
            .transition()
            .duration(1)
            .attr("filter","brightness(100%)")
        }

        var dcebincolor = d3.scaleOrdinal()
        .domain(["up","ns","down"])
        .range(["#F8766D","#808080","#59b5c9"]);

        // Bars
        dce.selectAll("mybar")
          .data(hdata)
          .enter()
          .append("rect")
            .attr("x", function(d) { return xdce(d.gene); })
            .attr("y", function(d) { return ydce(d.y); })
            .attr("width", xdce.bandwidth())
            .attr("height", function(d) { return props.heightDce - ydce(d.y); })
            .attr("fill", function(d) {return dcebincolor(d.regulation)})
            .attr("opacity", 1)
            .style("margin", "10px")
          .on("mouseover", mouseoverbar )
          .on("mousemove", mousemovebar )
          .on("mouseleave", mouseleavebar );
          
              
        }
        
      // END DRAW BARPLOT



      function dce_request(data){
        globaldata_control = data;
        function request(method, url) {
          return new Promise(function (resolve, reject) {
              var xhr = new XMLHttpRequest();
              sender = JSON.stringify(data)
              //console.log(sender)
              xhr.open(method, url);
              xhr.onload = resolve;
              xhr.onerror = reject;
              xhr.send(sender);
              d3.selectAll("#dce svg").remove();
              drawEmpty('loading');

          });
        }
        request('POST', 'http://127.0.0.1:5000/postdce')
          .then(function (e) {
              hdata = e.target.response;
              hdata = hdata.replace(/'/g, '"') //replacing all ' with 
              if (hdata == "empty"){
                network = '';
                drawEmpty('empty')} 
              else {
                d3.selectAll("#dce span").remove();
                fulldata = JSON.parse(hdata)
                hdata = fulldata.slice(0, -1)
                network = fulldata.slice(-1)[0] 
                keep_me_alive = hdata;
                drawHisto(hdata)}
              }, function (e) {
                // handle errors
            });
        }

        function drawEmpty(control){
          d3.selectAll("#dce svg").remove();   
          d3.selectAll("#dce span").remove();   
          if(control === 'empty'){
            textdata =['The result is empty : please select more genes.']
          }
          else{
            textdata =['Computing DCE . . . ']
          }
          d3.select('#dce')
            .style('display','flex')
            .style('align-items','center')
            .style('justify-content','center')
            .selectAll('span')
            .data(textdata)
            .enter()
            .append('span')
            .text(function(d){
              return d;
            })
            .append('br');
        }



    

  }

}// chiudi redraw
    //BUTTONS
    var tops = ["500","400","300", "200", "100"];

    var select = d3.select('#top-genes')
      .append('select')
        .attr('class','select')
        .on('change',rerender)
        .style('padding','3px')
        .style('margin-left','10px')

    var options = select
      .selectAll('option')
      .data(tops).enter()
      .append('option')
        .property("selected", "100" )
        .text(function (d) { return d; });

    function rerender() {
      selectValue = d3.select('select').property('value')
      d3.selectAll('#pca svg').remove();
      d3.selectAll('#genescatter svg').remove();
      d3.selectAll('#parallel svg').remove();
      d3.selectAll('#dce svg').remove();

      redraw(selectValue);
    };

  })



})// chiudi filter
})// chiudi filter




/*
function drawHisto(hdata){
        d3.selectAll("#dce svg").remove();
        var dce = cont3
          .append("svg")
          .attr("width", props.widthDce + props.margin.left + props.margin.right)
          .attr("height", props.heightDce + props.margin.top + props.margin.bottom + 30)
          .append("g")
            .attr("transform",
                  "translate(" + props.margin.left + "," + props.margin.top + ")");

        var xdce = d3.scaleBand()
          .range([ 0, props.widthDce ])
          .domain(hdata.map(function(d) { return d.gene; }))
          .padding(0.2);

        dce.append("g")
          .attr("class", "axisColor")
          .attr("transform", "translate(0," + props.heightDce + ")")
          .call(d3.axisBottom(xdce))
          .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("font-size","8px")
            .style("text-anchor", "end");


        var ydce = d3.scaleLinear()
          .domain([0, d3.max(hdata, function (d) { return d.y })])
          .range([ props.heightDce, 0]);

        dce.append("g")
          .attr("class", "axisColor")
          .call(d3.axisLeft(ydce))
          .append("text")
          .attr("fill", "black")
          .attr("transform","translate("+ props.margin.right/2 + "," + (-props.margin.top/2) +")")
          .style("text-transform","initial")
          .text("Degree");

        const yAxisGrid = d3.axisLeft(ydce).tickSize(-props.widthDce).tickFormat('').ticks();

        dce.append('g')
          .attr('class', 'y axis-grid')
          .call(yAxisGrid)
          .attr('opacity','0.1');


          var dceTTip = d3.select("#dce")
            .append("span")
            .style("opacity", 0)
            .attr("class", "tooltipDce")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        var mouseoverbar = function(d) {
          dceTTip.style("opacity", 1)
          d3.select(this)
            .transition()
            .duration(1)
            .attr("opacity", 1)
            .attr("filter","brightness(85%)")
        }

        var mousemovebar = function(d) {
          var dlist = d3.entries(d);
          var gid = dlist[0]["value"];
          var objid = Odata.filter(function(f,i){ return f.GeneEnsembl == gid })
          dlist = d3.entries(objid);
          gid = dlist[0]["value"]["geneId"]
          var html  = "<span style='font-size:15px; color:" + prlcolor(d.regulation) + ";'>" + "ID : " +gid + "<br/>" +
          "<span style='color:" + prlcolor(d.regulation) + ";'>"+"Degree : " + d.y + "</span><br/>";
          dceTTip.html(html)
              .style("left", (d3.event.pageX + 15) + "px")
              .style("top", (d3.event.pageY - 28) + "px")
          .transition()
              .duration(50) 
              .style("opacity", .9)
        }

      var mouseleavebar = function(d) {
        dceTTip
            .transition()
            .duration(50)
            .style("opacity", 0)

        d3.select(this)
            .transition()
            .duration(1)
            .attr("filter","brightness(100%)")
        }

        var dcebincolor = d3.scaleOrdinal()
        .domain(["up","ns","down"])
        .range(["#F8766D","#808080","#59b5c9"]);

        // Bars
        dce.selectAll("mybar")
          .data(hdata)
          .enter()
          .append("rect")
            .attr("x", function(d) { return xdce(d.gene); })
            .attr("y", function(d) { return ydce(d.y); })
            .attr("width", xdce.bandwidth())
            .attr("height", function(d) { return props.heightDce - ydce(d.y); })
            .attr("fill", function(d) {return dcebincolor(d.regulation)})
            .attr("opacity", 1)
            .style("margin", "10px")
          .on("mouseover", mouseoverbar )
          .on("mousemove", mousemovebar )
          .on("mouseleave", mouseleavebar );
          
              
        }
        
      // END DRAW BARPLOT
*/

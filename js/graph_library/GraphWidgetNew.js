// @author  Koh Zi Chun
// Graph Widget. currently in a mess
// add keyboard shortcut for animation

// Ivan: Most (if not all) functions will be changed to accomodate new library (D3.js)
//       Only the algorithm & high-level design will be retained

var vertexSvg = mainSvg.append("g")
                      .attr("id", "vertex");

var edgeSvg = mainSvg.append("g")
                    .attr("id", "edge");

var vertexTextSvg = mainSvg.append("g")
                          .attr("id", "vertexText");



var GraphWidget = function(){
  var self = this;

  var vertexList = {};
  var edgeList = {};

  var vertexUpdateList = {};
  var edgeUpdateList = {};

  var currentIteration = NO_ITERATION;
  var animationStateList = NO_STATELIST;
  var animationStatus = ANIMATION_STOP;

  var animationDuration = 500;

  // Show: true means the element will immediately appear on the html page
  //       false means the element will remain hidden until told to appear
  // Duration: duration of the show animation, only used when show is true

  this.addVertex = function(cx, cy, vertexText, vertexClassNumber, show){
    if(show != false) show = true;

    var newVertex = new GraphVertexWidget(cx,cy,vertexText,vertexClassNumber);

    vertexList[vertexClassNumber] = newVertex;
    vertexUpdateList[vertexClassNumber] = false;

    if(show == true){
      vertexList[vertexClassNumber].showVertex();
      vertexList[vertexClassNumber].redraw();
    }
  }

  // Default for weight is 1 and for type is EDGE_TYPE_UDE
  this.addEdge = function(vertexClassA, vertexClassB, edgeIdNumber, type, weight, show){
    if(show != false) show = true;
    if(type == null || isNaN(type)) type = EDGE_TYPE_UDE;
    if(weight == null || isNaN(weight)) weight = 1;

    var vertexA = vertexList[vertexClassA];
    var vertexB = vertexList[vertexClassB];

    var newEdge = new GraphEdgeWidget(vertexA, vertexB, edgeIdNumber, type, weight);

    edgeList[edgeIdNumber] = newEdge;
    edgeUpdateList[edgeIdNumber] = false;

    vertexList[vertexClassA].addEdge(newEdge);
    vertexList[vertexClassB].addEdge(newEdge);

    if(show == true){
      edgeList[edgeIdNumber].showEdge();
      edgeList[edgeIdNumber].redraw();
    }
  }

  this.removeEdge = function(edgeIdNumber){
    if(edgeList[edgeIdNumber] == null || edgeList[edgeIdNumber] == undefined) return;

    edgeList[edgeIdNumber].removeEdge();
    delete edgeList[edgeIdNumber];
    delete edgeUpdateList[edgeIdNumber];
  }

  // Edges are assumed to have been removed
  this.removeVertex = function(vertexClassNumber){
    vertexList[vertexClassNumber].removeVertex();
    delete vertexList[vertexClassNumber];
    delete vertexUpdateList[vertexClassNumber];
  }

  /* 
   * stateList: List of JS object containing the states of the objects in the graph
   * Structure of stateList: List of JS object with the following keys and values:
   *                            - vl: JS object with vertex texts as key and corresponding state positions and constants as value
   *                            - el: JS object with edge IDs as keys and corresponding state connections constants as value
   *
   * Objects not present in the i-th iteration stateList will be hidden until the animation stops, where it will be removed
   * New objects present in the i-th iteration stateList will be automatically created
   *
   * State 0 should be the initial state, last state should be the end state
   */

  /*
   * Contents of "vl":
   * - cx
   * - cy
   * - text
   * - state
   */

  /*
   * Contents of "el":
   * - vertexA: id of vertex A
   * - vertexB: id of vertex B
   * - type
   * - weight
   * - state  : Display state
   * - animateHighlighted : Determines whether highlighted animation should be played. True or false
   */

  this.startAnimation = function(stateList){
    if(stateList != null) animationStateList = stateList;
    if(currentIteration == NO_ITERATION) currentIteration = 0;

    var key;

    self.play();
  }

  this.animate = function(){
    if(currentIteration >= animationStateList.length && animationStatus != ANIMATION_STOP) animationStatus = ANIMATION_PAUSE;
    if(animationStatus == ANIMATION_PAUSE || animationStatus == ANIMATION_STOP) return;

    self.next(animationDuration);

    setTimeout(function(){
      self.animate();
    }, animationDuration);
  }

  this.play = function(){
    if(currentIteration < 0) currentIteration = 0;

    if(animationStatus == ANIMATION_STOP){
      animationStatus = ANIMATION_PLAY;
      updateDisplay(animationDuration, UPDATE_FORWARD);
      setTimeout(function(){
        self.animate();
      }, animationDuration);
    }

    else{
      animationStatus = ANIMATION_PLAY;
      self.animate();
    }
  }

  this.pause = function(){
    animationStatus = ANIMATION_PAUSE;
  }

  this.stop = function(){
    // while(currentIteration < animationStateList.length - 1){
    //   self.forceNext(0);
    // }

    self.jumpToIteration(animationStateList.length - 1, 0);

    currentIteration = animationStateList.length - 1;
    animationStatus = ANIMATION_STOP;

    var currentVertexState = animationStateList[currentIteration]["vl"];
    var currentEdgeState = animationStateList[currentIteration]["el"];

    var key;

    for(key in currentEdgeState){
      edgeUpdateList[key] = true;
    }

    for(key in edgeUpdateList){
      if(edgeUpdateList[key] == false){
        self.removeEdge(key);
      }
    }

    for(key in currentVertexState){
      vertexUpdateList[key] = true;
    }

    for(key in vertexUpdateList){
      if(vertexUpdateList[key] == false){
        self.removeVertex(key);
      }
    }

    for(key in edgeUpdateList){
      edgeUpdateList[key] = false;
    }

    for(key in vertexUpdateList){
      vertexUpdateList[key] = false;
    }

    animationStateList = NO_STATELIST;
    currentIteration = NO_ITERATION;
  }

  this.next = function(duration){
    if(currentIteration < 0) currentIteration = 0;
    currentIteration++;
    if(currentIteration >= animationStateList.length) {
		currentIteration = animationStateList.length-1;
		return;
	}
    updateDisplay(duration);
  }

  this.previous = function(duration){
    if(currentIteration >= animationStateList.length) currentIteration = animationStateList.length - 1;
    currentIteration--;
    if(currentIteration < 0) return;
    updateDisplay(duration);
  }

  this.forceNext = function(duration){
    self.pause();
    self.next(duration);
  }

  this.forcePrevious = function(duration){
    self.pause();
    self.previous(duration);
  }

  this.jumpToIteration = function(iteration, duration){
    self.pause();
    currentIteration = iteration;
    if(currentIteration >= animationStateList.length) currentIteration = animationStateList.length - 1;
    if(currentIteration < 0) currentIteration = 0;
    updateDisplay(duration);
  }

  this.replay = function(){
    self.jumpToIteration(0, 0);
    setTimeout(function(){self.play()}, 500);
  }

  this.getCurrentIteration = function(){
    return currentIteration;
  }

  this.getTotalIteration = function(){
    return Object.keys(animationStateList).length;
  }

  this.getAnimationDuration = function(){
    return animationDuration;
  }

  this.setAnimationDuration = function(duration){
    animationDuration = duration;
  }

  function updateDisplay(duration){
    // Add boolean flag for vertexes and edges that exists in the current visualization
    // Check the boolean flags each time this function is called
    // If there are objects that are not updated, it means that the object is removed
    // If there are new objects that currently not in the flags, it means the object is created this turn

    console.log("iteration " + currentIteration);
	var lastIteration = Object.keys(animationStateList).length-1;
    try{
	  $('#progress-bar').slider("value", currentIteration);
      $('#status p').html(/*"iteration " + currentIteration + ": " + */animationStateList[currentIteration]["status"]);
	  highlightLine(animationStateList[currentIteration]["lineNo"]);
	  if(currentIteration == lastIteration) {
		  pause(); //in html file
		  $('#play img').attr('src','img/replay.png').attr('alt','replay').attr('title','replay');
	  } else {
		  $('#play img').attr('src','img/play.png').attr('alt','play').attr('title','play');
	  }
    } catch(error){
      // Status has not been integrated in most of my animation, so leave it like this
    }

    var currentVertexState = animationStateList[currentIteration]["vl"];
    var currentEdgeState = animationStateList[currentIteration]["el"];

    var key;

    for(key in currentVertexState){
      if(vertexList[key] == null || vertexList[key] == undefined){
        self.addVertex(currentVertexState[key]["cx"],currentVertexState[key]["cy"],currentVertexState[key]["text"],key,false);
      }

      var currentVertex = vertexList[key];

      currentVertex.showVertex();

      switch(currentVertexState[key]["state"]){
        case OBJ_HIDDEN:
          currentVertex.hideVertex();
          break;
        case VERTEX_DEFAULT:
          currentVertex.defaultVertex();
          break;
        case VERTEX_HIGHLIGHTED:
          currentVertex.highlightVertex();
          break;
        case VERTEX_TRAVERSED:
          currentVertex.traversedVertex();
          break;
        default:
          break;
      }

      currentVertex.moveVertex(currentVertexState[key]["cx"], currentVertexState[key]["cy"]);
      currentVertex.changeText(currentVertexState[key]["text"]);
      currentVertex.redraw(duration);

      vertexUpdateList[key] = true;
    }

    for(key in vertexUpdateList){
      if(vertexUpdateList[key] == false){
        vertexList[key].hideVertex();
        vertexList[key].redraw(duration);
        vertexUpdateList[key] = true;
      }
    }

    for(key in currentEdgeState){
      if(edgeList[key] == null || edgeList[key] == undefined){
        self.addEdge(currentEdgeState[key]["vertexA"],currentEdgeState[key]["vertexB"],key,currentEdgeState[key]["type"],currentEdgeState[key]["weight"],false);
      }

      var currentEdge = edgeList[key];

      currentEdge.showEdge();

      switch(currentEdgeState[key]["state"]){
        case OBJ_HIDDEN:
          currentEdge.hideEdge();
          break;
        case EDGE_DEFAULT:
          currentEdge.defaultEdge();
          break;
        case EDGE_HIGHLIGHTED:
          currentEdge.highlightEdge();
          break;
        case EDGE_TRAVERSED:
          currentEdge.traversedEdge();
          break;
        default:
          break;
      }

      currentEdge.changeVertexA(vertexList[currentEdgeState[key]["vertexA"]]);
      currentEdge.changeVertexB(vertexList[currentEdgeState[key]["vertexB"]]);
      currentEdge.changeType(currentEdgeState[key]["type"]);
      currentEdge.changeWeight(currentEdgeState[key]["weight"]);

      currentEdge.refreshPath();
      if(!currentEdgeState[key]["animateHighlighted"]) currentEdge.redraw(duration);
      else{
        currentEdge.animateHighlighted(duration*0.9);
      }

      edgeUpdateList[key] = true;
    }

    for(key in edgeUpdateList){
      if(edgeUpdateList[key] == false){
        edgeList[key].hideEdge();
        edgeList[key].redraw(duration);
        edgeUpdateList[key] = true;
      }
    }

    for(key in vertexUpdateList){
      vertexUpdateList[key] = false;
    }

    for(key in edgeUpdateList){
      edgeUpdateList[key] = false;
    }
  }

  function updatePseudocode(duration, forwardOrBackward){

  }
}
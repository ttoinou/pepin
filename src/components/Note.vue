<script>
/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/components/Note.vue
 *     - A note is a shape with text or free hand
 *     - Shapes are point, circle, square...
 *     - User can drag and drop notes, re-scale them
 *     - Shapes dimensions are relative to the image,
 *         points size, textarea dimensions and shape thickness are absolute
 *     - Freehand drawing is made of bezier curves, computed after mouseup
 *
 *   todo:
 *     - Resize handle should rotate
 */
import Util from '../Util.js'
import Pellicule from '../Pellicule.js'
import Media from '../Media.js'

var Vue = require('vue')

var Point2D = Util.Point2D;
var Vue2D = Util.Vue2D;
var Vue2D_Statiques = Util.Vue2D_Statiques;
var Point2D_Statiques = Util.Point2D_Statiques;

export default {
  
  props: ['noteFromVue'],

  data: function (){
    return {
      name: 'note',
      pepinAdd: false,
      pepified: false,
      pepinAutoBroadcast: [
      ],
      lookForKeys: false,

      precision: 10,
      distanceAjout: 20,
      derivationCoeff: 0.75,
      essentialData: {
        'MediaID' : 'copy',
        'Frame' : 'copy',
        'text' : 'copy',
        'type' : 'copy',
        'color' : 'copy',
        'centerPi' : 'point',
        'figureVi' : 'point',
        'textDi' : 'point',
        'textWidth' : 'copy',
        'textHeight' : 'copy',
        'polylineX' : 'array',
        'polylineY' : 'array'
      },

      /* Essential data exported concerned by export() and import() */
      MediaID: -1,
      text: '',
      type: '',
      color: 'white',
      // intern point of the center, in percentages
      centerPi: new Point2D([0,0]),
      // intern vector for direction and dimensions of the figure (circle, rect, freehand..) of the note, in percentages
      figureVi: new Point2D([0,0]),
      // intern vector-direction in order to know where to put the textbox, in percentages
      textDi: new Point2D([0,0]),
      // gives the dimensions of the textarea
      textWidth: 0,
      textHeight: 0,
      polylineX: [],
      polylineY: [],
      Frame: -1,
      /* End of essential data */

      PelliculeFrame: -1,
      viewportW: 1,
      viewportH: 1,
      imageW: 1,
      imageH: 1,

      noteEditing: true,
      strokeColor : 'black',
      pointsClass: [
        'pepin-note-point-centerP',
        'pepin-note-point-figureP',
        'pepin-note-point-textP',
        'pepin-note-point-vectext',
      ],



      // min dimensions of the textarea
      textWidth_min: 48,
      textHeight_min: 38,
      // distance of the text to a point
      textDistance: 32,


      dragging: false,
      draggingIndex: 0,
      draggingX: 0,
      draggingY: 0,
      beforeDragData: {},
      draggingEntireNote: false,
      creation: true,

      IsEllipse : false,
      hide: false,

      // freehand drawing
      freehand: false,
      freehandMinX : Infinity,
      freehandMinY : Infinity,
      freehandMaxX : -Infinity,
      freehandMaxY : -Infinity,

      CurrentFrame : -2,


      bezier: false
    }
  },

  ready: function(){
    this.pepin = this.noteFromVue.pepin;

    if( this.noteFromVue.import )
    {
      //console.log(JSON.stringify(this.noteFromVue.importData));
      this.import(this.noteFromVue.importData);
      this.creation = false;
    }
    else
    {
      this.type = this.noteFromVue.type;

      this.centerPi.x = this.noteFromVue.x;
      this.centerPi.y = this.noteFromVue.y;

      this.color = this.noteFromVue.color;

      this.figureVi.x = -32;
      this.figureVi.y = -32;
      this.textDi.x = 32;
      this.textDi.y = 32;

      this.textWidth = 160;
      this.textHeight = 48;

      this.MediaID = this.noteFromVue.MediaID;
      this.Frame = this.noteFromVue.Frame;
    }


    this.creationX = this.centerPi.x;
    this.creationY = this.centerPi.y;

    if( this.color == 'black' )
    {
      this.strokeColor = 'white';
    }

    if( this.type == 'circle' || this.type == 'ellipse' || this.type == 'point' )
    {
      this.IsEllipse = true;
    }

    if( this.type == 'freehand' )
    {
      this.freehand = true;
    }

    this.ID = this.noteFromVue.ID;

    if( this.noteFromVue.import )
    {
      this.importProcessData();
    }

    //console.log(this.noteFromVue.PelliculeFrame);
    if( !Util.IsUndefOrNan(this.noteFromVue.PelliculeFrame) ){
      this.PelliculeFrame = this.noteFromVue.PelliculeFrame;
    }

    this.pepin.pepinPepify(this.pepin,this);
    this.pepinEvt('noteMode');
  },

  computed: {
      /* todo */
      showIfFrame: function(){
        //console.log(this.PelliculeFrame,this.Frame,this.CurrentFrame);
        return Util.IsUndefOrNan(this.PelliculeFrame) // note always visible
            || this.PelliculeFrame < 0
            || this.PelliculeFrame == this.CurrentFrame; // video note
      },

      hasText: function(){
        return this.type != 'freehand';
      },

      W: function(){
        return this.textWidth / this.zoom;
      },
      H: function(){
        return this.textHeight / this.zoom;
      },

      // same zoom on x axis and y axis
      zoom: function(){
        return this.viewportW / this.imageW;
      },

      textIntersectionRect: function(){
        //var Angle = Math.PI + Math.atan2(this.figureVi.y*this.viewportH,this.figureVi.x*this.viewportW);
        //var Angle = Math.PI + Math.atan2(this.textDi.y*this.viewportH,this.textDi.x*this.viewportW);
        var Angle = Math.PI + Math.atan2(this.textDi.y,this.textDi.x);
        Angle = (Angle-Math.PI/4.0)*2.0/Math.PI;
        //Angle = ipart(Angle) + fpart(Angle);
        Angle = Util.ipart(Angle) + Util.smooth(Util.smooth(Util.smooth(Util.fpart(Angle))));
        Angle = Angle*Math.PI/2.0 + Math.PI/4.0;


        var AngleX = Math.cos(Angle);
        var AngleY = Math.sin(Angle);
        var k = 1.0 / Math.max(
          Math.abs( AngleX ),
          Math.abs( AngleY )
        );

        //console.log(this.figureVi.y*this.viewportH,this.figureVi.x*this.viewportW);

        return new Point2D({
          x: AngleX * k,
          y: AngleY * k
        });
      },

      textIntersection: function(){
        return new Point2D({
          x: (this.textIntersectionRect.x + 1) * this.W / 2.0,
          y: (this.textIntersectionRect.y + 1) * this.H / 2.0
        });
      },

      textTopleft: function(){
        return new Point2D({
          x: this.centerPi.x + this.textVi.x - this.textIntersection.x,
          y: this.centerPi.y + this.textVi.y - this.textIntersection.y
        });

      //return this.points[1];
      },

      textVec: function(){
        return new Point2D({
          x: (-this.textIntersectionRect.x + 1) * this.W /2.0,
          y: (-this.textIntersectionRect.y + 1) * this.H /2.0
        });
      },

      textVi: function(){
        if( this.IsEllipse )
        {
          // only for circle
          //return new Point2D(this.textDi).Unit().SetRayonOf(this.figureVi);
          //console.log(this.rayonX,this.rayonY);
          var R = new Point2D(this.textDi).Unit();
          R.x *= this.trueRayonX;
          R.y *= this.trueRayonY;
          return R;
        }
        else
        {
          var Angle = this.textDi.Angle();
          var AngleX = Math.cos(Angle);
          var AngleY = Math.sin(Angle);
          var k = 1.0 / Math.max(
            Math.abs( AngleX ),
            Math.abs( AngleY )
          );

          //console.log(this.figureVi.y*this.viewportH,this.figureVi.x*this.viewportW);

          return new Point2D({
            x: AngleX * k * this.trueRayonX,
            y: AngleY * k * this.trueRayonY
          });
        }
      },

      showPoints: function(){
        var R = {
 /* centerP */  '0': true,
 /* figureP */  '1': true,
 /* textP */    '2': true,
 /* textboxP */ '3': true,
        };


        R['0'] = R['0'] && this.noteEditing;
        R['1'] = R['1'] && this.noteEditing;
        R['2'] = R['2'] && this.noteEditing && this.hasText;
        R['3'] = R['3'] && this.noteEditing && this.hasText;

        if( this.type == 'point' )
        {
          // show center for dragging and drawing
          R[0] = true;
          // don't show useless point (fixed dimensions)
          R[1] = false;
        }
        else if( this.freehand )
        {
          // don't show center, moving object by dragging drawing
          //R[0] = false;
          // don't show useless point (dimensions of the drawing)
          R[1] = false;
        }
        else
        {
          // don't show center, moving object by dragging drawing
          R[0] = false;
        }

        //console.log(R);

        return R;
      },

      points: function(){
        var P2 = Point2D_Statiques.add( this.centerPi , this.figureVi );

        return [
 /* centerP */  //this.freehand ? new Point2D( this.freehandMiddleX + this.centerPi.x - this.creationX , this.freehandMiddleY + this.centerPi.y - this.creationY ) : this.centerPi,
 /* centerP */  //this.freehand ? new Point2D( this.freehandMiddleX , this.freehandMiddleY ) : this.centerPi,
 /* centerP */  //this.freehand ? new Point2D( this.centerPi.x - this.creationX , this.centerPi.y - this.creationY ) : this.centerPi,
 /* centerP */  this.centerPi,
 /* figureP */  P2,
 /* textP */    Point2D_Statiques.add( this.centerPi , this.textVi ),
 /* textboxP */ Point2D_Statiques.add( this.textTopleft , this.textVec ),
        ];
      },

      min: function(){
        var minX = this.points[0].x;
        var minY = this.points[0].y;

        for( var i = 1 ; i < this.points.length ; i++ )
        {
          minX = Math.min(minX,this.points[i].x);
          minY = Math.min(minY,this.points[i].y);
        }

        //console.log(this.points[0].IsNothing());

        return {
          x: minX,
          y: minY
        };
      },

      max: function(){
        var maxX = this.points[0].x;
        var maxY = this.points[0].y;

        for( var i = 1 ; i < this.points.length ; i++ )
        {
          maxX = Math.max(maxX,this.points[i].x);
          maxY = Math.max(maxY,this.points[i].y);
        }

        return {
          x: maxX,
          y: maxY
        };
      },

      // width of a note
      width: function(){
        return this.max.x - this.min.x;
      },

      // height of a note
      height: function(){
        return this.max.y - this.min.y;
      },

      rayon: function(){
        if( this.type == 'circle' )
        {
          //console.log('ahah',this.axesDeformed);
          return Math.sqrt(new Point2D({
            x:  this.figureVi.x,
            y:  this.figureVi.y
          }).DistanceSquared());
        }
        else
        {
          return Math.max(this.rayonX,this.rayonY);
        }
      },

      rayonX: function(){
        return Math.abs(this.figureVi.x);
      },

      rayonY: function(){
        return Math.abs(this.figureVi.y);
      },

      trueRayonX: function(){
        return this.axesDeformed ? this.rayonX: this.rayon;
      },

      trueRayonY: function(){
        return this.axesDeformed ? this.rayonY: this.rayon;
      },

      angle: function(){
        return Math.atan2(this.textDi.y,this.textDi.x) / Math.PI * 180.0;
      },

      displayRayonX: function(){
        return this.trueRayonX * this.zoom;
      },

      displayRayonY: function(){
        return this.trueRayonY * this.zoom;
      },


      hasSVG: function(){
        return !this.freehand && this.type != 'point';
      },

      axesDeformed: function(){
        return this.type == 'rect' || this.type == 'ellipse';
      },






      /* Freehand drawing */

      polylinePoints: function(){
        var R = [];

        //console.log(this.min.x)

        for( var i = 0 ; i < this.polylineX.length ; i++ )
        {
          R.push([
            (this.polylineX[i]-this.freehandMinX)*this.zoom,
            (this.polylineY[i]-this.freehandMinY)*this.zoom
          ]);
        }

        //R += '0,0 100,0 100,100 0,100 0,0';

        return R;
      },

      polylinePointsPath: function(){
        var R = '';

        //console.log(this.min.x)

        for( var i = 0 ; i < this.polylineX.length ; i++ )
        {
          R += this.polylinePoints[i][0] + ',' + this.polylinePoints[i][1] + ' ';
        }

        //R += '0,0 100,0 100,100 0,100 0,0';

        return R;
      },


      freehandMinX_zoom : function(){
        return this.freehandMinX * this.zoom;
      },
      freehandMinY_zoom : function(){
        return this.freehandMinY * this.zoom;
      },

      freehandMaxX_zoom : function(){
        return this.freehandMaxX * this.zoom;
      },
      freehandMaxY_zoom : function(){
        return this.freehandMaxY * this.zoom;
      },

      freehandW_zoom : function(){
        if( this.polylineX.length < 1 ){ return 0; }
        return (this.freehandMaxX - this.freehandMinX) * this.zoom;
      },
      freehandH_zoom : function(){
        if( this.polylineX.length < 1 ){ return 0; }
        return (this.freehandMaxY - this.freehandMinY) * this.zoom;
      },

      freehandMiddleX : function(){
        return ( (this.freehandMaxX - this.freehandMinX)/2.0 + this.freehandMinX);
      },
      freehandMiddleY : function(){
        return ( (this.freehandMaxY - this.freehandMinY)/2.0 + this.freehandMinY);
      },

      freehandMiddleX_zoom : function(){
        return this.freehandMiddleX * this.zoom;
      },
      freehandMiddleY_zoom : function(){
        return this.freehandMiddleY * this.zoom;
      },

      polylineCount : function(){
        return this.polylineX.length;
      },

      bezierMiddle: function(){
        if( !this.bezier ){ return []; }

        var R = [];

        R.push([
          (this.polylineX[1] - this.polylineX[0])/3.0*this.derivationCoeff,
          (this.polylineY[1] - this.polylineY[0])/3.0*this.derivationCoeff
        ]);

        if( this.polylineCount > 1 )
        {
          for( var i = 1 ; i < this.polylineCount - 1 ; i++ )
          {
            R.push([
              (this.polylineX[i+1] - this.polylineX[i-1])/3.0*this.derivationCoeff,
              (this.polylineY[i+1] - this.polylineY[i-1])/3.0*this.derivationCoeff
            ]);
          }

          R.push([
            (this.polylineX[this.polylineCount-1] - this.polylineX[this.polylineCount-2])/3.0*this.derivationCoeff,
            (this.polylineY[this.polylineCount-1] - this.polylineY[this.polylineCount-2])/3.0*this.derivationCoeff
          ]);
        }

        //console.log(this.polylineCount,R,this.polylineX);

        return R;
      },

      bezierMiddle_2 : function(){
        var R = [];

        for( var i = 0 ; i < this.bezierMiddle.length ; i++ )
        {
          R.push([
            (-this.bezierMiddle[i][0] + this.polylineX[i] - this.freehandMinX)*this.zoom,
            (-this.bezierMiddle[i][1] + this.polylineY[i] - this.freehandMinY)*this.zoom
          ]); 
        }

        return R;
      },

      bezierPath: function(){
        if( !this.bezier ){ return ''; }

        // first point
        var R = 'M' + this.polylinePoints[0][0]+ ' ' + this.polylinePoints[0][1];

        if( this.polylineCount > 1 )
        {
          R += ' C ' + this.bezierMiddle_2[0][0] + ' ' + this.bezierMiddle_2[0][1]
          + ',' + this.bezierMiddle_2[1][0] + ' ' + this.bezierMiddle_2[1][1]
          + ',' + this.polylinePoints[1][0] + ' ' + this.polylinePoints[1][1];

          for( var i = 2 ; i < this.polylineCount; i++ )
          {
            R += ' S ' + this.bezierMiddle_2[i][0] + ' ' + this.bezierMiddle_2[i][1]
            + ',' + this.polylinePoints[i][0] + ' ' + this.polylinePoints[i][1];
          }
        }

        //console.log(R);

        return R;
      },
  },

  methods: {

    pepinReady: function(){
      this.pepinEvt('noteMode');
    },

    //alert:function(x){console.log(x)},

    update: function(){
      this.pepinEvt('updateNotes');
    },

    import: function(data){

      for( var i in this.essentialData ) // in this.noteFromVue.importData )
      {
        if( !Util.IsUndef(data[i]) )
        {
          switch( this.essentialData[i] )
          {
            case 'copy':
              this[i] = data[i];
              break;
            case 'point':
              if( data[i].length >= 2 )
              {
                this[i] = new Point2D([data[i][0],data[i][1]]);
              }
              break;
            case 'array':
              this[i] = data[i].slice(0);
              break;
          }
        }
      }

    },

    importProcessData: function(){

      if( this.freehand )
      {
        this.computeFreehandMinMax();
        this.bezier = true;
      }

    },

    export: function(){
      var R = {};

      for( var i in this.essentialData ) // in this.noteFromVue.importData )
      {

        switch( this.essentialData[i] )
        {
          case 'copy':
            R[i] = this[i];
            break;
          case 'point':
            R[i] = [
              Util.toPrecision(this[i].x,this.precision),
              Util.toPrecision(this[i].y,this.precision),
            ];
            break;
          case 'array':
            R[i] = [];
            for( var j = 0 ; j < this[i].length ; j++ )
            {
              R[i][j] = Util.toPrecision(this[i][j],this.precision);
            }
            break;
        }
      }

      //console.log(this.text);

      return R;
    },

  computeFreehandMinMax: function(){
    this.freehandMinX = Infinity;
    this.freehandMinY = Infinity;
    this.freehandMaxX = -Infinity;
    this.freehandMaxY = -Infinity;

    for( var i = 0 ; i < this.polylineX.length ; i++ )
    {
      this.freehandMinX = Math.min(this.freehandMinX,this.polylineX[i]);
      this.freehandMaxX = Math.max(this.freehandMaxX,this.polylineX[i]);

      this.freehandMinY = Math.min(this.freehandMinY,this.polylineY[i]);
      this.freehandMaxY = Math.max(this.freehandMaxY,this.polylineY[i]);
    }

    //console.log(this.freehandMinY,this.freehandMaxY);
  },
        

    // Simplify the curve
    computeBezier: function(){
      var bezierX = [];
      var bezierY = [];
      var NbPointsOrigine = this.polylineX.length;
      var distanceAjout = this.distanceAjout / this.zoom;

      // i++ will be zero after first iteration
      var i = -1;
      var distance = 0;
      var totalDistance = 0;
      var next = 0;

      while(i < NbPointsOrigine-1)
      {
        // next should never be zero
        while( ( distance > next + totalDistance || next < 1e-5 ) && i < NbPointsOrigine-1 )
        {
          totalDistance += next;
          i += 1;
          next = Util.Point2D_Statiques.Distance(
            new Point2D(this.polylineX[i],this.polylineY[i]),
            new Point2D(this.polylineX[i+1],this.polylineY[i+1])
          );
        }

        // don't add another point if the precedent loop went too far
        if( i >= NbPointsOrigine-1 )
        {
          break;
        }

        var t = (distance - totalDistance)/next;
        this.bezierAdd(
          bezierX,
          bezierY,
          (1-t)*this.polylineX[i] + t*this.polylineX[i+1],
          (1-t)*this.polylineY[i] + t*this.polylineY[i+1]
        );

        distance += distanceAjout;

      }

      // end point
      this.bezierAdd(
        bezierX,
        bezierY,
        this.polylineX[NbPointsOrigine-1],
        this.polylineY[NbPointsOrigine-1]
      );

      //console.log('bezier',bezierX,bezierY);

      //console.log(NbPointsOrigine/this.bezierX.length);
      this.polylineX = bezierX;
      this.polylineY = bezierY;

      this.computeFreehandMinMax();
    },

    bezierAdd: function(bezierX,bezierY,x,y){
      bezierX.push( Util.toPrecision(x,this.precision) );
      bezierY.push( Util.toPrecision(y,this.precision) );
    },

    pointMouseDown: function(event,index){
      if(this.pepin.noteEditing){
        this.dragging = true;
        this.draggingIndex = index;
        this.draggingX = event.clientX;
        this.draggingY = event.clientY;

        this.beforeDragData = {
          centerPi: { x: this.centerPi.x , y: this.centerPi.y },
          figureVi: { x: this.figureVi.x , y: this.figureVi.y },
          textDi: { x: this.textDi.x , y: this.textDi.y },
          textWidth: this.textWidth,
          textHeight: this.textHeight,
        };
      }
    },

    /* event on main div */
    mouseDown: function(event){
      if( this.pepin.noteDeleting )
      {
        this.pepinEvt('noteDeleting',this.ID);
      }
      else if( !this.pepin.checkTargetNote(event) )
      {
        this.draggingEntireNote = true;
        this.pointMouseDown(event,0);
      }
    },

    /* event on main div */
    mouseUp: function(event){
      if(this.pepin.noteEditing){
        this.$emit('mouseUp',event);
      }

    },


    /* Freehand drawing */

    addPolylinePoint: function(x,y){
      if( Util.IsUndefOrNan(x) || Util.IsUndefOrNan(y) ){ return; }

      var i = this.polylineX.length;
      var X = (x - this.creationClientX)/this.zoom + this.centerPi.x;
      var Y = (y - this.creationClientY)/this.zoom + this.centerPi.y;

      this.polylineX.push(X);
      this.freehandMinX = Math.min(this.freehandMinX,X);
      this.freehandMaxX = Math.max(this.freehandMaxX,X);

      this.polylineY.push(Y);
      this.freehandMinY = Math.min(this.freehandMinY,Y);
      this.freehandMaxY = Math.max(this.freehandMaxY,Y);

      //console.log('add point',this.polylineCount);
    },

  },

  events: {
    zoomVue: function(Vue_Origine,Vue_Zoom,Vue_Overview,Vue_Origine_Espace){
      this.viewportW = Vue_Origine_Espace.Largeur;
      this.viewportH = Vue_Origine_Espace.Hauteur;
      this.imageW = Vue_Origine.Largeur;
      this.imageH = Vue_Origine.Hauteur;

      Vue.nextTick(function(){
        if( this.type == 'point' )
        {
          this.figureVi.x = this.textDistance / this.zoom;
          this.figureVi.y = this.textDistance / this.zoom;
        }
      }.bind(this));
    },

    noteDelete: function(ID){
      if( ID == this.ID )
      {
        this.hide = true;
      }

      this.update();
    },

    noteMode: function(){
      if( this.pepin ){
        this.noteEditing = this.pepin.noteEditing;
      }
    },

    creationMouseDown: function(event,index){
      if( index == this.ID && this.creation )
      {
        this.creationClientX = event.clientX;
        this.creationClientY = event.clientY;

        if( this.freehand )
        {
          this.addPolylinePoint(event.clientX,event.clientY);
        }
      }
    },

    creationMouseMove: function(event,index){
      //console.log(event.clientX);
      if( index == this.ID && this.creation )
      {
        var dx = event.clientX - this.creationClientX;
        var dy = event.clientY - this.creationClientY;

        // text is always beside a point
        if( Math.abs(dx+dy) > 6 && !this.freehand && this.type != 'point' )
        {
          this.figureVi.x = dx / this.zoom;
          this.figureVi.y = dy / this.zoom;

          this.textDi.x = -dx / this.zoom;
          this.textDi.y = -dy / this.zoom;
        }

        /* Freehand drawing */
        //console.log(event.layerX);
        if( this.freehand )
        {
          this.addPolylinePoint(event.clientX,event.clientY);
        }
      }
    },

    mouseMove: function(event){
      var dx = event.clientX - this.draggingX;
      var dy = event.clientY - this.draggingY;

      // centerPi
      if( this.draggingEntireNote || (this.dragging && this.draggingIndex == 0) )
      {
        this.centerPi.x = this.beforeDragData.centerPi.x + dx / this.zoom;
        this.centerPi.y = this.beforeDragData.centerPi.y + dy / this.zoom;
      }
      else if( this.dragging )
      {

        //console.log(this.beforeDragData.textWidth);

        // figureVi
        if( this.draggingIndex == 1 )
        {
          this.figureVi.x = this.beforeDragData.figureVi.x + dx / this.zoom;
          this.figureVi.y = this.beforeDragData.figureVi.y + dy / this.zoom;
        }
        // textDi
        else if( this.draggingIndex == 2 )
        {
          this.textDi.x = this.beforeDragData.textDi.x + dx / this.zoom;
          this.textDi.y = this.beforeDragData.textDi.y + dy / this.zoom;
        }
        // textvec
        else if( this.draggingIndex == 3 )
        {
          this.textWidth = Math.max(this.textWidth_min,this.beforeDragData.textWidth + dx*Util.Sign(this.beforeDragData.textDi.x) );
          this.textHeight = Math.max(this.textHeight_min,this.beforeDragData.textHeight + dy*Util.Sign(this.beforeDragData.textDi.y) );
        }
      }
    },

    mouseUp: function(event){
      if( this.creation && this.freehand && !this.bezier )
      {
        this.computeBezier();
        this.bezier = true;

        // don't create a freehand drawing if only one point, not enough data
        if( this.polylineX.length <= 1 )
        {
          this.hide = true;
        }
      }


      this.dragging = false;
      this.creation = false;

      this.draggingEntireNote = false;
      this.update();
    },

    frameUpdated: function(frame){
      // bug : multiple call of frameUpdated
      // pepinEvt in projection calls automatically this function but not the function in Overlay
      //console.log('updateframe',frame);
      this.CurrentFrame = frame;
    }
  }

}
</script>

<template>
<div class="pepin-note-container"
   :style="{
      'left': (min.x*zoom)+'px',
      'top': (min.y*zoom)+'px',
      'width': (width*zoom)+'px',
      'height': (height*zoom)+'px',
    }"
    v-on:mousedown="mouseDown"
    v-on:mouseup="mouseUp"
    v-if="!hide && $root.noteViewing"
   :class="[ $root.noteEditing ? 'pepin-note-container-editable': 'pepin-note-container-noteditable' ]"
    v-show="showIfFrame"
>
  <!-- points -->
  <div v-for="($index,point) in points" class="pepin-note-point pepin-note-target"
   :style="{
      'left': ((point.x - min.x)*zoom)+'px',
      'top': ((point.y - min.y)*zoom)+'px',
      'background-color': (type == 'point' && $index == 0) ? color: ''
    }"
    v-bind:class="[pointsClass[$index], (type == 'point' && $index == 0) ? 'pepin-note-point-element': '']"
    v-on:mousedown="pointMouseDown($event,$index)"
    v-on:mouseup="mouseUp"
    v-if="showPoints[$index]"
  ></div>

  <!-- textbox -->
  <textarea
    class="pepin-note-target pepin-note-editable"
    type="text"
    v-if="hasText"
    v-model="text"
    placeholder="..."
   :disabled="!$root.noteEditing"
   :style="{
      'left': (( textTopleft.x - min.x)*zoom)+'px',
      'top': (( textTopleft.y - min.y)*zoom)+'px',
      'width': textWidth+'px',
      'height': textHeight+'px',
      'display': (!$root.noteEditing && text == '') ? 'none': 'block'
    }"
    v-on:keyup="update"
  ></textarea>

  <!-- black or white border -->
   <svg v-if="hasSVG"
   :width="2*displayRayonX + 'px'"
   :height="2*displayRayonY + 'px'"
    class="outside"
   :style="{
        left: (- displayRayonX + (centerPi.x - min.x)*zoom) + 'px',
        top: (- displayRayonY + (centerPi.y - min.y)*zoom) + 'px',
        fill: 'transparent',
        stroke: strokeColor
     }"
   >
     <rect v-if="type == 'rect' || type == 'square'" width="100%" height="100%" x="0%" y="0%" rx="10" ry="10"  />
     <circle v-if="type == 'circle'" r="50%" cx="50%" cy="50%"  />
     <ellipse v-if="type == 'ellipse'" rx="50%" ry="50%" cx="50%" cy="50%"  />
   </svg>

  <!-- same as above but thinner with color -->
   <svg v-if="hasSVG"
    :width="2*displayRayonX + 'px'"
    :height="2*displayRayonY + 'px'"
     class="inside hover"
    :style="{
        left: (- displayRayonX + (centerPi.x - min.x)*zoom) + 'px',
        top: (- displayRayonY + (centerPi.y - min.y)*zoom) + 'px',
        fill: 'transparent',
        stroke: color
     }"
   >
     <rect v-if="type == 'rect' || type == 'square'" width="100%" height="100%" x="0%" y="0%" rx="10" ry="10"  />
     <circle v-if="type == 'circle'" r="50%" cx="50%" cy="50%"  />
     <ellipse v-if="type == 'ellipse'" rx="50%" ry="50%" cx="50%" cy="50%"  />
   </svg>

   <span>

   </span>

   <svg v-if="freehand"
    :width="freehandW_zoom"
    :height="freehandH_zoom"
    :style="{
      left: ( freehandMinX_zoom + (-min.x + points[0].x - creationX)*zoom ) + 'px',
      top: ( freehandMinY_zoom + (-min.y + points[0].y - creationY)*zoom ) + 'px'
    }"
    class="hover"
    >
    <polyline :points="polylinePoints" style="" :style="{ stroke : strokeColor }" class="outside" v-if="!bezier" />
    <polyline :points="polylinePoints" style="" :style="{ stroke : color }" class="inside" v-if="!bezier" />

    <path :d="bezierPath" style="" :style="{ stroke : strokeColor }" class="outside" v-if="bezier" />
    <path :d="bezierPath" style="" :style="{ stroke : color }" class="inside" v-if="bezier" />
   </svg>

</div>
</template>

<style lang="scss">
@import '../Colors.scss';

.pepin-note-container
{
  position: absolute;
  padding: 0;
  margin: 0;
  cursor: grab;
  font-size: 16px;
}

.pepin-note-target
{
}

.pepin-note-container textarea
{
  position: absolute;
  display: block;
  padding: 8px;
  background-color: rgba($blue,0.6);
  border: 2px solid $darkblue;
  border-radius: 0 8px 0 8px;
  margin: 0;
  color: $white;
  outline: 0;
  cursor: text;
  font-size: 16px;
  font-family: "Arial";
  resize: none;
  overflow-x: none;
  overflow-y: auto;

  margin: 0;
  width: 100%;
  height: 100%;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  z-index: 7000;
}

.pepin-note-container-editable textarea
{
}

.pepin-note-container textarea.pepin-note-editable
{
}

.pepin-note-container textarea.pepin-note-editable:focus
{
  background-color: rgba($blue,0.8);
}

.pepin-note-container textarea::-webkit-scrollbar-track
{
  background-color: rgba($darkblue,1.0);
  border: 2px solid #001;
  border-right: none;
}

.pepin-note-container textarea::-webkit-scrollbar
{
  width: 8px;
  background-color: rgba($darkblue,0.5);
  border: none;
}

.pepin-note-container textarea::-webkit-scrollbar-thumb
{
  background-color: $light;
  border: 2px solid $darkblue;
  border-right: none;
}

.pepin-note-point
{
  position: absolute;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  margin: -12px 0 0 -12px;
  cursor: pointer;
  opacity: 0.75;
  z-index: 3000;
}

.pepin-note-container-editable .pepin-note-point
{
  z-index: 8000; /* above textarea */
}

.pepin-note-point-element
{
  width: 16px;
  height: 16px;
  border-radius: 16px;
  margin: -10px 0 0 -10px;
  border: 2px solid $darkblue
}

.pepin-note-point-centerP
{
}

.pepin-note-point-figureP
{
  background: url(images/notes/resize.png);
}

.pepin-note-point-textP
{
  background: url(images/notes/selectmove.png);
}

.pepin-note-point-vectext
{
  background: url(images/notes/resize.png);
}

.pepin-note-container img
{
  position: absolute;
  top: 0;
  left: 0;
}

.pepin-note-container svg
{
  position: absolute;
  overflow:visible;
  z-index: 1000;
}

.pepin-note-container-editable svg
{
  z-index: 4000;
}

/* http://www.debray-jerome.fr/outils/Generateur-de-box-shadow-css3.html */

.pepin-note-container svg.hover:hover
{
  -moz-box-shadow: 0px 0px 16px 4px #131326;
  -webkit-box-shadow: 0px 0px 16px 4px #131326;
  -o-box-shadow: 0px 0px 16px 4px #131326;
  box-shadow: 0px 0px 16px 4px #131326;
  filter:progid:DXImageTransform.Microsoft.Shadow(color=#131326, Direction=NaN, Strength=16);
  -moz-border-radius: 8px;
  -webkit-border-radius: 8px;
  border-radius: 8px;
}

.pepin-note-container .inside *,.pepin-note-container .inside
{
  position: absolute;
  fill: transparent;
  stroke-width: 6px;
  stroke-location: inside;
}

.pepin-note-container .outside *,.pepin-note-container .outside
{
  position: absolute;
  fill: transparent;
  stroke-width: 8px;
  stroke-location: inside;
}

</style>

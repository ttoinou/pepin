<script>
import Util from '../Util.js'
import Pellicule from '../Pellicule.js'
import Media from '../Media.js'

var Vue = require('vue')

var Point2D = Util.Point2D;

export default {
  
  data: function(){

    return {
      name: 'collection',
      pepinAdd: true,
      pepified: false,
      pepinAutoBroadcast: [
      ],
      lookForKeys: true,

      Medias: [],
      MediasType: 0,
      // 0: normal 
      // 1: AB comparison
      // 2: video editing

      Scrollbar: 0,
      VisibleWidth: 0,
      SideWidth: 42*2,
      GroupOfMedias: -1,
      Animating: false,
      Opened: false,
      DureeAnimation: 500,
      HauteurMax: 144,

      ShowVideos: true,
      ShowImages: true,
      MakingSpecialCommand: false,
      SelectionModeCommand: 0, // second col

      // todo: delete AB & video editing modes ? in order to simplify
      // 0: nothing special
      // 1: add (ctrl key)
      // 2: add group of medias (shift key)
      // 3: making comparison AB
      // 4: making video editing
      SpecialCommandOrder: 0,


      ovShow: false,
      ovZoomW: 0,
      ovZoomH: 0,
      ovZoomT: 0,
      ovZoomL: 0,

      ShellCount: 0,
      MediasLeft: [],
      MediasWidth: [],
      MediasTotalWidth: 0,
      MediasShellAnimation: false,
      ShellsWrapperWidth: [],
      ShellsEnable: [],
      ShellsAnimating: [],
      ShellsLeftWidth: 18,

      scrollThumbDragging: false,
      scrollThumbX: 0,
      scrollThumbV: 0
    };

  },

  ready: function(){

    this.ScrollbarDV = new Util.DynamicValue([{
        Name: "Wheel",
        IncrementDuration: 300,
        TransitionDuration: 100,
        SwitchDuration: 100,
        Min: [0.0],
        Max: [1.0],
        IncrementValue: 0.1,
      }],{
        DefaultValue: [0.0],
        Log: false,
        Dimensions: 1,
        Min: [0.0],
        Max: [1.0],
    });

    // id to GoyaveID
    this.MediasIDs = [];

    this.AjouterMedias = function(GoyaveObjects){
        var ReturnIDs = [];

        //console.log('goyave objects: ',GoyaveObjects);

        // unique medias

        for( var i = 0 ; i < GoyaveObjects.length ; i++ )
        {

            //console.log(GoyaveObjects[i]);
            var newId = this.pepin.AddMedia(GoyaveObjects[i]);
            var Continue = true;
            var j = 0;

            //console.log('medias: '+this.Medias);

            while( j < this.MediasIDs.length && Continue )
            {
              Continue = Continue && this.MediasIDs[j] != newId;
              j++;
            }

            //console.log(j,Continue,this.MediasIDs[j],newId,GoyaveObjects[i].URL)

            if( Continue )
            {
              this.MediasIDs.push(newId);
            }

            ReturnIDs.push(newId);
        }
        /*
        for( var i = 0 ; i < this.MediasIDs.length ; i++ ){
            console.log( this.GetMedia(this.MediasIDs[i]) );
        }
        */

        //console.log(ReturnIDs);

        this.pepinEvt('mediasChanged');
        //this.Ask_MediasChanged();

        return ReturnIDs;
    };

    this.GetMedia = function(id){
        //console.log(this.Medias[id]);
        return this.pepin.GetMedia(this.MediasIDs[id]);
    };

    this.LireMedias = function(ids,GroupOfMedias){
        this.GroupOfMedias = Util.IsUndefOrNan(GroupOfMedias) ? -1: GroupOfMedias;

        if( this.GroupOfMedias > -1 )
        {
          for( var i = 0 ; i < this.ShellsEnable2.length ; i++ )
          {
            //console.log(i == this.GroupOfMedias);
            //this.ShellsEnable.$set(i,i == this.GroupOfMedias ? true: false);
            if( Util.XOR(i == this.GroupOfMedias,this.ShellsEnable2[i]) )
            {
              this.ShellToggle(i);
            }
          }
        }

        //this.MediasWidthLeftShellUpdate();

        var Medias = [];
        //this.Selections = [];

        //console.log(ids,this.IDsToSelectionIDs,this.Medias);


        for( var i = 0 ; i < this.Medias.length ; i++ )
        {
          this.Medias[i].IsSelected = ids.indexOf(i) == 0 ? true: false;
          this.Medias[i].InSelection = ids.indexOf(i) == -1 ? false: true;
          this.Medias[i].SelectionOrder = 0;
        }

        for(var i in ids )
        {
          Medias.push(this.GetMedia(ids[i]));
          //this.Medias[ids[i]].SelectionOrder = this.Selections.length;
          //this.Selections[ i ] = [this.IDsToSelectionIDs[ids[i]]];
        }

        this.pepin.LireMedias([Medias]);
        this.UpdateFromPepin();
    };

    this.LireMediasFromVue = function(ids_array){
        var Medias_array = [];

        //console.log(ids);

        for(var i in ids_array )
        {
          var M = [];

          for(var j in ids_array[i] )
          {
            M.push(this.GetMedia(ids_array[i][j]));
          }

          Medias_array.push(M);
        }

        //console.log(ids_array);
        this.pepin.LireMedias(Medias_array);
    };
  },

  computed: {

    ShellsEnable2: function(){
      var R = [];

      for( var i = 0 ; i < this.ShellCount ; i++ ){
        if( !Util.IsUndef(this.ShellsEnable[i]) )
        {
          R.push(this.ShellsEnable[i]);
        }
        else
        {
          R.push(true);
        }
      }

      //console.log(R);

      return R;
    },

    Shells: function(){
      var R = {};

      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        var j = this.Medias[i].Group < 0 ? 0 : this.Medias[i].Group;

        if( Util.IsUndef(R[j]))
        {
          R[j] = {
            Id: j,
            Content: [],
            Length: 0
          };
        }

        R[j].Content.push( i );
        R[j].Length++;

        this.ShellCount = Math.max(this.ShellCount,j+1);
      }

      //console.log('shellcount',this.ShellCount);
      //console.log('Shells',R);

      return R;
    },

    comparisonChar: function(){
      var R = [];

      for( var i = 0 ; i < this.SpecialCommandOrder ; i++ )
      {
        R.push(String.fromCharCode(65 + i));
      }

      return R;
    },

    SelectionMode: function(){

      if( this.SelectionModeCommand > 0 )
      {
        return this.SelectionModeCommand;
      }

      if( this.$parent.ctrlKeyPressed )
      {
        return 1;
      }

      if( this.$parent.shiftKeyPressed )
      {
        return 2;
      }

      return 0;
    },

    AreVideo: function(){
      var R = new Array(this.Medias.length);

      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        R[i] = this.Medias[i].IsVideo;
      }

      return R;
    },


    // used to animate video thumbnails
    BackgroundPos: function(){
      var R = [];

      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        if( this.Medias[i].IsVideo )
        {
          R[i] = -this.Medias[i].CurrentFrame * this.Medias[i].VideoThumbHeight;//Math.random() * 200;
        }
        else
        {
          R[i] = 0;
        }
      }

      return R;
    },
    
    Hidden: function(){
      var R = [];

      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        // R[i] === show Medias #i
        R[i] = ( this.ShowVideos &&  this.Medias[i].IsVideo ) || ( this.ShowImages && !this.Medias[i].IsVideo );

        // todo: delete GroupOfMedias
        // GroupOfMedias could be used to hide automatically shells at start..
/*
        if( this.GroupOfMedias > -1 && this.Medias[i].Group != this.GroupOfMedias )
        {
          R[i] = false;
        } */

        // remove medias from shells hidden
        if( this.Medias[i].Group < this.ShellsEnable2.length && this.Medias[i].Group > -1 && this.ShellsEnable2[this.Medias[i].Group] == false )
        {
          R[i] = false;
        }

        // R[i] === hide Medias #1
        R[i] = !R[i];
      }

      //console.log('Hidden',R);
      //console.log('this.ShellsEnable2',this.ShellsEnable2);

      return R;
    },

    // Total width for scrollbar
    TotalWidth: function(){
      var R = Math.max(this.VisibleWidth,this.MediasTotalWidth );
      //console.log(R);
      return R;
    },

    HorizontalScrollPercentCoeff: function(){
      return ( this.TotalWidth - this.VisibleWidth) / this.TotalWidth;
    },

    HorizontalScrollPercent: function(){
      //console.log(this.Scrollbar);
      return this.Scrollbar * this.HorizontalScrollPercentCoeff * 100.0;
    },

    ScrollMin: function(){
      return this.Scrollbar * (this.TotalWidth - this.VisibleWidth);
    },

    ScrollVisibleRange: function(){
      return new Point2D({
        x: this.ScrollMin,
        y: this.ScrollMin + this.VisibleWidth
      });
    },

    // MediasShowed

    MediasShowed: function(){
      var R = [];

      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        if( !this.Hidden[i] )
        {
          R.push(i);
        }
      }

      //console.log('MediasShowed:',R);

      return R;
    },

    // MediasSelection

    MediasSelection: function(){
      var R = new Array();

      for( var i = 0 ; i < this.MediasShowed.length ; i++ )
      {
        if( this.Medias[this.MediasShowed[i]].InSelection )
        {
          R.push([this.MediasShowed[i]]);
        }
      }

      //console.log('MediasSelection:',R);

      return R;
    },

    MediasSelectionHull: function(){
      if( this.MediasSelection.length <= 0 )
      {
        return -1;
      }

      var min = this.MediasSelection[0][0];
      var max = this.MediasSelection[0][0];
      var s;

      for( var i = 0 ; i < this.MediasSelection.length ; i++ )
      {
        s = this.MediasSelection[i];
        for( var j = 0 ; j < s.length ; j++ )
        {
          min = Math.min(min,s[j]);
          max = Math.max(max,s[j]);
        }
      }

      return [min,max];
    },

    // MediasSelected

    MediasSelected: function(){
      var R = new Array();
      var s;

      //console.log('MediasSelection:',this.MediasSelection);

      
      // for example MediasSelection = [ [0] , [2] , [6] ]
      for( var i = 0 ; i < this.MediasSelection.length ; i++ )
      {
        s = this.MediasSelection[i];

        // for example s = [6]
        for( var j = 0 ; j < s.length ; j++ )
        {
          //console.log(this.Medias[s[j]].IsSelected);

          if( this.Medias[s[j]].IsSelected )
          {
            R.push(s[j]);
          }
        }
      }

      //console.log('MediasSelected:',R);

      return R;
    },

    MediasSelectedHull: function(){
      if( this.MediasSelected.length <= 0 )
      {
        return -1;
      }
      
      var min = this.MediasSelected[0];
      var max = this.MediasSelected[0];
      var s;

      for( var i = 0 ; i < this.MediasSelected.length ; i++ )
      {
        min = Math.min(min,this.MediasSelected[i]);
        max = Math.max(max,this.MediasSelected[i]);
      }

      return [min,max];
    },

    MediaUniqueSelected: function(){
      return this.MediasSelectedHull[0];
    },


  },
  
  methods: {

    // ready after jQuery dependency
    pepinReady: function(){
      this.$Holder = this.$(this.$el);
      this.$Holder.mousewheel(this.scrollbarWheel.bind(this));
    },

    ShellToggle: function(id){
      this.MediasShellAnimation = true;
      this.ShellsAnimating[id] = true;

      var MediaWrapper =
        this.$('.shell',this.$Holder)
        .filter(function(i,el){
          //console.log(this.$(el).attr('ID'));
          return Util.toInt(this.$(el).attr('shellId')) == id;
        }.bind(this)).find('.mediaWrapper');

      if( this.ShellsEnable2[id] )
      {
        MediaWrapper.animate({
          width: 0,
          opacity: 0
        },500,function(){
          this.MediasShellAnimation = false;
          this.ShellsAnimating[id] = false;
          this.ShellsEnable.$set(id,false);
          this.MediasWidthLeftShellUpdate();
        }.bind(this));
      }
      else
      {
        //console.log('ShellsWrapperWidth',this.ShellsWrapperWidth);

        this.ShellsEnable.$set(id,true);
        MediaWrapper.animate({
          width: this.ShellsWrapperWidth[id]+'px',
          opacity: 1
        },500,function(){
          this.MediasShellAnimation = false;
          this.ShellsAnimating[id] = false;
          this.MediasWidthLeftShellUpdate();
        }.bind(this));
      }


    },

    ToggleShowVideos: function(){
      this.ShowVideos = !this.ShowVideos;
      this.MediasWidthLeftShellUpdate();
    },

    ToggleShowImages: function(){
      this.ShowImages = !this.ShowImages;
      this.MediasWidthLeftShellUpdate();
    },

    MouseMove: function(media,event){
      var dx = event.clientX-this.$(event.target).offset().left;
      dx = dx / media.Width * (media.NbFrames-1);
      dx = Math.max(0,Math.min(media.NbFrames-1,dx));
      media.CurrentFrame = Math.floor(dx);
    },

    //todo: scrollbar centered and not defined by the left
    scrollbarWheel: function(event){
      //console.log(this.pepin.altKeyPressed);
      //this.ScrollbarDV.Modes['Wheel'].Increment( (event.deltaY/100.0) * this.VisibleWidth / this.TotalWidth  * 10.0 );
      this.ScrollbarDV.Modes['Wheel'].Increment( (event.deltaY) * this.VisibleWidth / this.TotalWidth * ( this.pepin.altKeyPressed ? 12.0 : 3.0 ) );
      // hack, todo: better model for calculating medias width and left...
      //this.MediasWidthLeftShellUpdate();
    },

    ScrollDX: function(dx){
      return (dx/this.VisibleWidth - this.VisibleWidth/(2.0*this.TotalWidth)) / this.HorizontalScrollPercentCoeff;
    },

    ScrollClick: function(event){
      if( !this.scrollThumbDragging ){
        this.ScrollbarDV.ModeGotoValue('Wheel',[this.ScrollDX(event.clientX - this.$(event.currentTarget).offset().left)]);
      }
    },
/*
    ScrollThumbMousedown: function(event){
      this.scrollThumbDragging = true;
      this.scrollThumbX = event.clientX;
      //this.scrollThumbV = this.ScrollDX( this.ScrollbarDV.GetValue()[0]*this.VisibleWidth );
      this.scrollThumbV = (parseInt(this.$(event.currentTarget).css('left').replace('px',''),10))/ this.HorizontalScrollPercentCoeff;
      //console.log(this.scrollThumbV);
    },

    ScrollThumbMousemove: function(event){
      if( this.scrollThumbDragging ){
        var dx = this.scrollThumbV + (event.clientX - this.scrollThumbX)/(this.VisibleWidth*this.HorizontalScrollPercentCoeff);
        console.log(dx);
        this.ScrollbarDV.ModeGotoValue('Wheel',[dx]);
      }
    },

    ScrollThumbMouseup: function(event){
      this.scrollThumbDragging = false;
    },

    ScrollThumbMouseleave: function(event){
      this.scrollThumbDragging = false;
    },
*/
    AddMedia: function(media){
      var Index = this.Medias.length;

      this.Medias.push({
        ID   : Index,
        Name  : media.Name,
        Media  : media,
        Ordre  : Index,
        IsVideo: media.Type == Media.prototype.MEDIA_TYPE.MEDIA_VIDEO,
        IsLoaded: media.Loaded,
        NbFrames: media.ThumbnailFramesCount || 139,
        CurrentFrame: 0,
        Width  : 195,
        Height : 110,
        VideoThumbHeight: 0,
        ThumbWidth: media.LoadingLargeur,
        ThumbHeight: media.LoadingHauteur,
        URL  : media.ThumbnailURL,
        Title  : "Loading " + media.FileName + " ...",
        Group  : ( Util.IsUndefOrNan(media.Group) || media.Group < 0 ) ? 0 : media.Group,
        Loaded : false,
        Loading: true,
        IsAnnoted: !Util.IsUndef(media.Notes) && media.Notes.length > 0,

        InSelection: this.Medias.length == 0,
        IsSelected: this.Medias.length == 0,
        SpecialOrder: 0

      });

      media.CallbackStates.push(this.MediaLoaded_fn(this,Index));
    },

    // media #Index is Loaded
    // This <=> this
    MediaLoaded_fn: function(This,Index){ return function(){
      var media = This.Medias[Index];

      media.Loaded = true;
      media.Loading = false;
      media.Width = media.Height * (media.Media.Ratio);

      media.ThumbWidth = media.Width;
      media.ThumbHeight = media.Height;
      //media.VideoThumbHeight = media.ThumbHeight / media.NbFrames;
      media.VideoThumbHeight = media.ThumbHeight;

      if( media.IsVideo )
      {
        media.ThumbHeight *= media.NbFrames;
        //console.log(media.VideoThumbHeight);
      }

      media.Title = media.Media.FileName + '(' + media.Media.Largeur + '×' + media.Media.Hauteur + ')';

    }},

    AddMedias: function(Medias){
      for( var i = 0 ; i < Medias.length ; i++ )
      {
        this.AddMedia(Medias[i]);
      }
    },

    UpdatePepin: function(){
      //this.PepinSelection.LireMedias(this.SelectedIDs);
      //this.PepinSelection.DaddyPepinInstance.LireMedias(this.SelectedIDs);
      //console.log('update',this.MediasSelected);

      if( this.MediasType == 0 )
      {
        //console.log(this.MediasSelected);
        this.LireMediasFromVue([this.MediasSelected]);
      }
      else if( this.MediasType == 1 )
      {
        //console.log('COMPARAISON AB');
        this.LireMediasFromVue(this.MediasSelection);
      }
      else if( this.MediasType == 2 )
      {
        var R = [];

        for( var i = 0 ; i < this.MediasSelection.length ; i++ )
        {
          R[this.Medias[this.MediasSelection[i][0]].SpecialOrder] = this.MediasSelection[i][0];
        }

        //console.log('BOUT A BOUT',R,this.MediasSelection);
        if( R.length > 0 )
        {
          this.LireMediasFromVue([R]);
        }
      }
      
    },

    // used when we use LireMedias from Pepin and not from Selection
    UpdateFromPepin: function(){
      this.ScrollbarGoto();
    },

    ScrollbarGoto: function(){
      if( this.Medias.length <= 0 || this.MediasSelected.length <= 0 ) { return; }
      // check if we can see the media on the timeline
      var i = this.MediasSelectedHull[0];

      //console.log(i,this.MediasLeft[i]);

      var P = new Point2D({
        x: this.MediasLeft[i]-16,
        y: this.MediasLeft[i] + this.MediasWidth[i] + 16
      });

      //console.log(P,this.ScrollVisibleRange);

      // do we see the media ?
      if( !P.IsIncludedIn(this.ScrollVisibleRange) )
      {
        var dx = this.MediasLeft[i] + this.MediasWidth[i]/2.0 - this.VisibleWidth / 2.0;
        //dx = dx / (this.TotalWidth - this.VisibleWidth);
        //console.log('go',dx,this.TotalWidth,this.VisibleWidth);
        dx = dx / (this.TotalWidth - this.VisibleWidth);
        dx = Math.max(0,Math.min(1,dx));
        this.ScrollbarDV.ModeGotoValue('Wheel',[dx]);
      }
    },

    // todo: remove shift and ctrl from selection command
    // => able to CTRL and SHIFT with AB and editing

    SelectionAddingToggle: function(){
      this.SelectionModeCommand = this.SelectionModeCommand == 1 ? 0: 1;
      this.StopSpecialCommand(true);
    },
    
    SelectionShiftToggle: function(){
      this.SelectionModeCommand = this.SelectionModeCommand == 2 ? 0: 2;
      this.StopSpecialCommand(true);
    },

    ToggleMakingComparison: function(){
      this.SelectionModeCommand = this.SelectionModeCommand == 3 ? 0: 3;
      this.ToggleSpecialCommand();
    },

    ToggleMakingEditing: function(){
      this.SelectionModeCommand = this.SelectionModeCommand == 4 ? 0: 4;
      this.ToggleSpecialCommand();
    },

    ToggleSpecialCommand: function(){
      if( this.MakingSpecialCommand )
      {
        this.StopSpecialCommand();
      }
      else
      {
        this.BeginSpecialCommand();
      }
    },

    BeginSpecialCommand: function(){
      this.MediasType = this.SelectionMode == 4 ? 2: (this.SelectionMode == 3 ? 1: 0);
      this.MakingSpecialCommand = true;

      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        this.Medias[i].InSelection = false;
        this.Medias[i].IsSelected = false;
        this.Medias[i].SpecialOrder = -1;
      }
    },

    StopSpecialCommand: function(FromAddingToggle){

      this.MediasType = 0;
      this.MakingSpecialCommand = false;
      this.SpecialCommandOrder = 0;

      if( Util.IsUndef(FromAddingToggle) || FromAddingToggle == false )
      {
        this.SelectionModeCommand = 0;
      }

      this.UpdatePepin();
    },

    // MediasShowed
    MediasUniqueSelect: function(CID){
      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        this.Medias[i].IsSelected = (i == CID);
        this.Medias[i].InSelection = (i == CID);
      }
    },


    // MediasSelection
    MediasSelectionIndexOf: function(CID){
      var s;

      for( var i = 0 ; i < this.MediasSelection.length ; i++ )
      {
        s = this.MediasSelection[i];

        for( var j = 0 ; j < s.length ; j++ )
        {
          if( s[j] == CID )
          {
            return i;
          }
        }
      }

      return -1;
    },

    MediasSelectionAddCID: function(CID){
      this.Medias[CID].InSelection = true;
    },

    MediasSelectionRemoveCID: function(CID){
      this.Medias[CID].InSelection = false;

      if( this.Medias[CID].IsSelected )
      {
        //this.MediasSelectedScrub(1);

        //var x = this.MediasSelection.indexOf(CID);
        var x = this.MediasSelectionIndexOf(CID);
        x = Util.Modulo(x+1,this.MediasSelection.length);

        this.Medias[this.MediasSelection[x]].IsSelected = true;

        this.Medias[CID].IsSelected = false;
      }
    },

    MediasSelect: function(CID){
      for( var i = 0 ; i < this.Medias.length ; i++ )
      {
        this.Medias[i].IsSelected = (this.Medias[i].ID == CID);
      }
    },

    MediaClick: function(media,$event){
      //console.log($event.which);
      //console.log('selectionmode',this.SelectionMode);

      // clic milieu
      if( $event.which == 2 )
      {
        window.open(media.Media.URL);
      }
      // clic gauche
      else if( $event.which == 1 )
      {
          // normal mode
          if( this.SelectionMode == 0 )
          {
            // if media is already in selection: play it
            if( media.InSelection )
            {
              this.MediasSelect(media.ID);
              //console.log('select',media.ID);
            }
            // else cancel all selection and make the media the only selection
            else
            {
              this.MediasUniqueSelect(media.ID);
              //console.log('only select',media.ID);
            }

          }
          // add/remove mode
          else if( this.SelectionMode == 1 )
          {
            // remove if selection not unique
            if( media.InSelection )
            {
              if( this.MediasSelection.length > 1 )
              {
                this.MediasSelectionRemoveCID(media.ID);
              }
            }
            // add
            else
            {
              this.MediasSelectionAddCID(media.ID);
            }
          }
          // group add
          else if( this.SelectionMode == 2 || this.pepin.shiftKeyPressed )
          {
            //console.log('group add',this.MediasSelection);

            if( this.MediasSelection.length > 0 )
            {

              //console.log('MediasSelectionHull',this.MediasSelectionHull);
              var min = this.MediasShowed.indexOf(this.MediasSelectionHull[0]);
              var max = this.MediasShowed.indexOf(this.MediasSelectionHull[1]);
              var index = this.MediasShowed.indexOf(media.ID);

              // todo: adapt if indexes are reordered

              // add right to left
              if( index < min )
              {
                //console.log('right to left',index,min);
                for( var i = index; i < min ; i++ )
                {
                  this.SelectionAddMedia(this.MediasShowed[i]);
                }
              }
              // add from left to right
              else if( index > max )
              {
                //console.log('eft to righ',max,index);
                for( var i = max+1; i <= index ; i++ )
                {
                  this.SelectionAddMedia(this.MediasShowed[i]);
                }
              }
            }

          }
          else
          {
            this.SelectionAddMedia(media.ID);
          }

        this.ScrollbarGoto();
        this.UpdatePepin();
      }
    },

    SelectionAddMedia: function(CID){
      var media = this.Medias[CID];

      // AB comparison
      if( this.SelectionMode == 3 )
      {

        if( this.MediasSelection.length == 0 )
        {
          this.MediasUniqueSelect(CID);
          media.SpecialOrder = this.SpecialCommandOrder++;
        }
        // max 26
        else if( media.SpecialOrder == -1 && media.IsVideo == this.Medias[this.MediasSelection[0][0]].IsVideo && this.SpecialCommandOrder < 26 )
        {
          this.MediasSelectionAddCIDSpecial(CID);
        }

      } 
      // video editing
      else if( this.SelectionMode == 4 )
      {

        if( media.IsVideo && media.SpecialOrder == -1 )
        {
          if( this.MediasSelection.length == 0 )
          {
            this.MediasUniqueSelect(CID);
            media.SpecialOrder = this.SpecialCommandOrder++;
          }
          else
          {
            this.MediasSelectionAddCIDSpecial(media.ID);
          }

        }
      }
      else
      {
        this.MediasSelectionAddCID(CID);
      }
    },

    MediasSelectionAddCIDSpecial: function(CID){
      this.MediasSelectionAddCID(CID);
      this.Medias[CID].SpecialOrder = this.SpecialCommandOrder++;
    },

    MediaScrub: function(scrub){
      if( this.Medias.length == 0 )
      {
        return;
      }

      var Order = 0;

      // scrub unique media selected
      if( this.MediasSelection.length == 1 )
      {
        var x = this.MediasShowed.indexOf(this.MediasSelection[0][0]);
        //console.log('indexOf showed',x);
        this.MediasUniqueSelect(this.MediasShowed[Util.Modulo(x+scrub,this.MediasShowed.length)]);
          //console.log(x,this.VisibleMedias,this.Selections[0][0]);
          //console.log(this.Selections[0][0],x+scrub,Modulo( this.VisibleMedias[x+scrub] , this.VisibleMedias.length ));
      }
      else
      {
        // select a media in selection
        // todo: hull
        //var x = this.MediasSelection.indexOf(this.MediasSelected[0]);
        var x = this.MediasSelectionIndexOf(this.MediasSelected[0]);
        console.log('indexOf selection',x,this.MediasSelected,this.MediasSelection);
        this.MediasSelect(this.MediasSelection[Util.Modulo(x+scrub,this.MediasSelection.length)]);
      }

      this.ScrollbarGoto();
      this.UpdatePepin();
    },

    MediasWidthLeftShellUpdate: function(){
      Vue.nextTick(function(){

        // todo: shell width change if hiding images for example
        // need to compute width of every image....
        //console.log("shell",this.$('.shell',this.$Holder).width());

        var ShellsWidth = [];
        for( var i = 0 ; i < this.ShellsEnable2.length ; i++ )
        {
          ShellsWidth[i] = 0;
        }

        // MediasLeft update
        this.$('.media',this.$Holder).each(function(i,el){
          var $el = this.$(el);
          var ID = Util.toInt($el.attr('mediaId'));
          var $par = $el.parent();

          //var left = $el.offset().left;// - this.SideWidth;
          // + this.ShellsLeftWidth
          var left = $el.position().left + this.ShellsLeftWidth + $par.parent().position().left;
          //console.log($par.parent().position().left);

          var W = this.Hidden[ID] ? 0: $el.outerWidth(true);
          //console.log(ID,left);
          this.MediasLeft.$set(ID,left);
          this.MediasWidth.$set(ID,W);
          ShellsWidth[this.Medias[ID].Group] += W;

        }.bind(this));

        for( var i = 0 ; i < ShellsWidth.length ; i++ )
        {
          if( this.ShellsEnable2[i] )
          {
            this.ShellsWrapperWidth.$set(i,ShellsWidth[i]);
          }
        }

        //console.log(ShellsWidth,this.ShellsWrapperWidth);

        //console.log('Shells Wrapper Width: ');
        this.$('.shell',this.$Holder).each(function(i,el){
          var $el = this.$(el);
          var ID = Util.toInt(this.$(el).attr('shellId'));

          if( !this.ShellsAnimating[ID] && this.ShellsEnable2[ID] )
          {
            //console.log(ID,this.ShellsWrapperWidth[ID]);
            $el.find('.mediaWrapper').css('width',this.ShellsWrapperWidth[ID]);
            //console.log(ID,this.ShellsWrapperWidth[ID]);
            //this.ShellsFullWidth.$set(ID,mediaWrapperW);
          }


        }.bind(this));


        Vue.nextTick(function(){

          this.MediasTotalWidth = 0;

          this.$('.shell',this.$Holder).each(function(i,el){
            var $el = this.$(el);
            var shellW = $el.outerWidth(true);

            this.MediasTotalWidth += shellW;

          }.bind(this));

          //console.log(this.MediasTotalWidth);

        }.bind(this));


      }.bind(this));
    },

  },

  events: {

    raf: function(){
      //console.log('collection raf');
      this.$emit('update');
      return true;
    },

    update: function(){
      this.ScrollbarDV.UpdateValue();
      //console.log(This.ScrollbarDV.GetValue()[0]);
      if( this.ScrollbarDV.GetValue()[0] != this.Scrollbar )
      {
          this.Scrollbar = this.ScrollbarDV.GetValue()[0];
      }

      if( this.MediasShellAnimation )
      {
        this.MediasWidthLeftShellUpdate();
      }
    },


    zoomVue: function(Vue_Origine,Vue_Zoom,Vue_Overview){
      if( this.pepin )
      {
        this.ovShow = (this.pepin.zoomLockState <= 1 && Vue_Overview.Largeur <= 1.0 && Vue_Overview.Hauteur <= 1.0)
        && !(this.pepin.zoomLockState == 0 && Vue_Overview.Largeur >= 1.0 && Vue_Overview.Hauteur >= 1.0);
      }
      this.ovShow = this.ovShow && Vue_Overview.IsValid();

      this.ovZoomW = Vue_Overview.Largeur;
      this.ovZoomH = Vue_Overview.Hauteur;
      this.ovZoomT = Vue_Overview.Min.y;
      this.ovZoomL = Vue_Overview.Min.x;
      //owVue
    },

    mediaPrev: function(){
      this.MediaScrub(-1);
    },

    mediaNext: function(){
      this.MediaScrub(1);
    },

    dimensions: function(Dim){
      this.VisibleWidth = Dim.DocumentL - this.SideWidth;
      // todo: reduce call to this function
      this.MediasWidthLeftShellUpdate();
      this.ScrollbarGoto();
    },

    mediasChanged: function(){
      //console.log('medias changed collection !',this.MediasIDs);

      for( var i = 0 ; i < this.MediasIDs.length ; i++ )
      {
          var M = this.GetMedia(i);

          this.AddMedia(M);
          M.load();
          //console.log(i,M);

      }

      this.MediasWidthLeftShellUpdate();

      this.UpdatePepin();
    },


    open: function(){
      if( !this.Animating && !this.Opened )
      {
        this.Animating = true;
        this.$Holder
          .animate({
            bottom: 0
          },{
            duration: this.DureeAnimation,
            step: this.pepinResize,
            specialEasing: "easein",
            complete: function(){
                this.Opened = true;
                this.Animating = false;
            }.bind(this)
         });
      }
    },

    close: function(){
      if( !this.Animating && this.Opened )
      {
        this.Animating = true;
        this.$Holder
          .animate({
            bottom: -this.HauteurMax
          },{
            duration: this.DureeAnimation,
            step: this.pepinResize,
            specialEasing: "easein",
            complete: function(){
                this.Opened = false;
                this.Animating = false;
            }.bind(this)
        });
      }
    },
  }
}
</script>

<template>

<div class="component">

  <img id="PepinVignette" :src="$parent['media-loading-miniature-url']" style="display: none" />

  <div class="side">

      <div class="side-button side-button-videosonly"
        :class="{'side-button-enabled': ShowVideos}"
        v-on:click="ToggleShowVideos"
        v-help="'$co_showVideos£'"
        v-key="'V'"
      >
      </div>


      <div class="side-button side-button-imagesonly"
        :class="{'side-button-enabled': ShowImages}"
        v-on:click="ToggleShowImages"
        v-help="'$co_showImages£'"
        v-key="'I'"
      >
      </div>

      <br />

      <div class="side-button side-button-add"
        v-bind:class="{'side-button-enabled': SelectionMode == 1}"
        v-on:click="SelectionAddingToggle"
        v-help="{ message : '$co_ctrl£' , keys : ['$ctrl£'] }"
      >
      </div>

      <div class="side-button side-button-shift"
        v-bind:class="{'side-button-enabled': SelectionMode == 2}"
        v-on:click="SelectionShiftToggle"
        v-help="{ message : '$co_shift£' , keys : ['$shift£'] }"
      >
      </div>

      <br />


      <div class="side-button side-button-ab"
        :class="{'side-button-enabled': SelectionMode == 3}"
        v-on:click="ToggleMakingComparison"
        v-help="'$co_ab£'"
        v-key="'A'"
      >
      </div>


      <div class="side-button side-button-editing"
        :class="{'side-button-enabled': SelectionMode == 4}"
        v-on:click="ToggleMakingEditing"
        v-help="'$co_edit£'"
        v-key="'W'"
      >
      </div>

  </div>
  <div class="medias"
      :style="{
        'left': (-this.ScrollMin + this.SideWidth) + 'px'
      }"
    >
      <div class="shell"
        v-for="shell in Shells"
        v-bind:shellId="shell.Id"
       :class="[ShellsEnable2[shell.Id] && shell.Length > 0 ? '': 'reduced']"
      >

      <div class="shell-before" 
        v-on:click="ShellToggle(shell.Id)"
        v-help="'$co_shellBefore£'"
      ></div>

      <div class="mediaWrapper">

        <div
            class="media"
            v-help="Medias[mediaId].Loading ? '$co_mediaLoading('+Medias[mediaId].URL+')£' : '$co_mediaLoaded('+Medias[mediaId].URL+')£'"
            v-for="mediaId in shell.Content"
            v-bind:mediaId="mediaId"
            v-show="!Hidden[mediaId] && ShellsEnable2[shell.Id]"
            v-bind:style="{
              width                : Medias[mediaId].Width + 'px',
              height               : Medias[mediaId].Height + 'px'
            }"
            v-on:mousemove="MouseMove(Medias[mediaId],$event)"
            v-on:mouseup="MediaClick(Medias[mediaId],$event)"
           :class="{
              'media-inselection': Medias[mediaId].InSelection,
              'media-selected'   : Medias[mediaId].IsSelected,
              'media-notloaded'  : !Medias[mediaId].Loaded,
              'media-special'    : MediasType != 0
            }"
           :v-help="Medias[mediaId].Title"
        >
            <div class="media-background-transparent" v-if="!Medias[mediaId].IsVideo"></div>
            <div class="media-background"
              v-bind:style="{
                'background-image'   : 'url(\'' + Medias[mediaId].URL + '\')',
                'background-size'    : Medias[mediaId].ThumbWidth + 'px ' + Medias[mediaId].ThumbHeight + 'px',
                'background-position': '0px ' + BackgroundPos[Medias[mediaId].ID] + 'px'
              }"
            ></div>
            <div class="media-loading"
              v-show="Medias[mediaId].Loading"
             :style="{
                left: (Medias[mediaId].Width - 64)/2.0+'px'
              }"
            ></div>
            <div class="media-text">
              {{ Medias[mediaId].Name }}
            </div>
            <div class="media-icon-video" v-show="Medias[mediaId].IsVideo"></div>
            <div class="media-icon-isannoted" v-show="Medias[mediaId].IsAnnoted"></div>
            <div class="media-icon-playing" v-show="Medias[mediaId].IsSelected || (MediasType > 0 && Medias[mediaId].InSelection)"></div>
            <div class="media-editing" v-if="MediasType == 2 && Medias[mediaId].SpecialOrder > -1">
              <small>#</small>
              {{ Medias[mediaId].SpecialOrder + 1 }}
            </div>
            <div class="media-comparison"
              v-if="MediasType == 1 && Medias[mediaId].SpecialOrder > -1">
              {{ comparisonChar[Medias[mediaId].SpecialOrder] }}
            </div>

            <div class="media-overview"
              v-if="Medias[mediaId].IsSelected && ovShow"
             :style="{
                width: ovZoomW*100+'%',
                height: ovZoomH*100+'%',
                left: ovZoomL*100+'%',
                top: ovZoomT*100+'%',
              }"
            >
            </div>
        </div>
      </div>

      <div class="shell-after"
        v-on:click="ShellToggle(shell.Id)"
        v-show="ShellsEnable2[shell.Id]"
        v-help="'$co_shellAfter£'"
        >
        
      </div>

      </div>

  </div>
  <div class="scrollbar"
   :style="{
      'width': VisibleWidth + 'px'
    }"
    v-help="'$co_scrollbar£'"
    v-on:click="ScrollClick($event)"
  >
    <div class="scrollbar-thumb"
     :style="{
        'width': VisibleWidth/TotalWidth*100 + '%',
        'left': HorizontalScrollPercent + '%'
      }">
    </div>
  </div>


</div>
</template>
<!--
     v-on:mousedown="ScrollThumbMousedown($event)"
     v-on:mousemove="ScrollThumbMousemove($event)"
     v-on:mouseup="ScrollThumbMouseup($event)"
     v-on:mouseleave="ScrollThumbMouseup($event)"
-->
<style scoped lang="scss">
@import '../Colors.scss';

/*
 * Component
 */

.component
{
    width: 100%;
    left: 0;
    position: absolute;
    padding: 0;
    height: 144px;
    bottom: -144px;
    z-index: 750;
    position: fixed;
    border-top-width: 0;
    padding: 0 0;
    border-top: 2px solid $darkblue;
    background-color: rgba($darkblue,0.5);
}

/*
 * Side
 */

.side
{
    width: 84px;
    height: 100%;
    position: relative;
    float: left;
    margin: 0;
    background-color: rgba($blue,0.5);
    border-right: 2px solid $darkblue;
    z-index: 600;
}


.side-button
{
    margin: 0;
    padding: 4px 0 0 0;
    width: 42px;
    height: 46px;
    float: left;
    background-repeat: no-repeat;
    background-position: 5px 7px;
    background-size: 32px 32px;
    background-color: rgba($blue,0.5);
}


.side-button:hover
{
    filter: brightness(80%);
    -webkit-filter: brightness(80%);
    -moz-filter: brightness(80%);
    -o-filter: brightness(80%);
    -ms-filter: brightness(80%);
    background-color: rgba($blue,1.0);
    cursor: pointer;
}

.side-button:active
{
    background-color: rgba($blue,1.0);
    background-position: 6px 6px;
}

.side-button-enabled
{
    filter: invert(100%);
    -webkit-filter: invert(100%);
    -moz-filter: invert(100%);
    -o-filter: invert(100%);
    -ms-filter: invert(100%);
    background-color: invert($gold);
}

.side-button-enabled:hover
{
    filter: invert(100%);
    -webkit-filter: invert(100%);
    -moz-filter: invert(100%);
    -o-filter: invert(100%);
    -ms-filter: invert(100%);
    background-color: rgba(invert($gold),0.8);
}

/*
 * Scrollbar
 */

.scrollbar
{
    position: absolute;
    left: 84px;
    bottom: 0;
    margin: 0;
    padding: 0;
    width: 100%;
    width: calc(100%-42px);
    border-top: 2px solid $darkblue;
    height: 12px;
    background-color: rgba($blue,0.5);
    cursor: pointer;
}


.scrollbar-thumb
{
    position: absolute;
    height: 10px;
    border-left: 2px solid $darkblue;
    border-right: 2px solid $darkblue;
    border-bottom: 1px solid $darkblue;
    bottom: 0;
    background-color: rgba($light,1.0);
}


/*
 * Component medias
 */

.medias
{
    position: absolute;
    top: 0;
    left: 0;
    padding: 0;
    height: 130px;
    overflow-y: hidden;
    overflow-x: hidden;
    white-space: nowrap;
    z-index: 500;
}


/*
 * Shells
 */

.shell
{
  background-color: rgba($light,1.0);
  background-color: rgba($blue,0.5);
  height: 126px;
  padding: 0 0 0 0;
  margin: 0 8px;
  display: inline-block;
  border-radius: 8px 4px 8px 4px; 
  bottom: 0;
  vertical-align: top;
  border: 2px solid $light;
}

.mediaWrapper
{
  position: relative;
  display: inline-block;
  margin: 0;
  padding: 0;
}

.shell-before, .shell-after
{
  position: relative;
  display: inline-block;
  margin: 0;
  padding: 0;
  width: 16px;
  height: 118px;
  background-repeat: no-repeat;
  cursor: pointer;
  filter: invert(100%);
}


.shell-before:hover, .shell-after:hover
{
  filter: brightness(200%);
  -webkit-filter: brightness(200%);
  -moz-filter: brightness(200%);
  -o-filter: brightness(200%);
  -ms-filter: brightness(200%);
}


.shell-before
{
  border-radius: 0 8px 8px 0;
  background-position: 1px center;
}

.shell-after
{
  border-radius: 8px 0 0 8px;
  background-position: 1px center;
}


/*
 * Expand
 */

.shell .shell-before, .shell .shell-after
{
  background-image: url(images/collection/shellreduce.png);
}

.shell.reduced .shell-before:active
{
  background-position: 2px center;
}

.shell.reduced .shell-after:active
{
  background-position: 2px center;
}

/*
 * Reduce
 */

.shell-before:active
{
  background-position: 0 center;
}

.shell-after:active
{
  background-position: 0 center;
}

.shell.reduced .shell-before, .shell.reduced .shell-after
{
  background-image: url(images/collection/shellexpand.png);
}


/*
 * Medias
 */


.media
{
    width: 160px;
    height: 116px;
    border: 3px solid $darkblue;
    border-radius: 5px;
    margin: 4px;
    padding: 0;
    color: #eef;
    display: inline-block;
    position: relative;
    background-clip: content-box;
}

.media:hover
{
    border-color: transparent;
    border-color: rgba($blue,0.8);
    cursor: pointer;

    filter: brightness(90%);
    -webkit-filter: brightness(90%);
    -moz-filter: brightness(90%);
    -o-filter: brightness(90%);
    -ms-filter: brightness(90%);
}

.media:active
{
    border-color: $gold;
    background-color: rgba($light,0.8);
    color: $darkblue;
}

.media > .media-text
{
    position: absolute;
    bottom: 4px;
    width: 100%;
    height: 16px;
    text-align: center;
    cursor: default;
    font-weight: bold;
    letter-spacing: 0;
    word-wrap: break-word;
    overflow: hidden;
    font-size: 14px;
}

.media > .media-text,.media-editing,.media-comparison
{
  font-weight: bold;
  letter-spacing: 0;
  text-shadow:
   -1px -1px 0 $darkblue,  
    1px -1px 0 $darkblue,
   -1px  1px 0 $darkblue,
    1px  1px 0 $darkblue;
  color: #fff;
}
/*
.medias > .PepinSelectionMedia > .PepinSelectionMiniature
{
    position: relative;
    height: 90px;
    background-repeat: no-repeat;
    background-position: center center;
    cursor: pointer;

}*/

.media-inselection, .media-selected, .media-inselection:hover, .media-selected:hover
{
  border-color: $gold;
}

/* orange */
.media-inselection.media-special
{
  border-color: $darkgold;
}

.media-notloaded
{/*
  filter: brightness(200%);
  -webkit-filter: brightness(200%);
  -moz-filter: brightness(200%);
  -o-filter: brightness(200%);
  -ms-filter: brightness(200%);*/
  opacity: 0.5;
}

.media-icon-video
{
  width: 20px;
  height: 20px;
  position: absolute;
  top: 2px;
  right: 2px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 20px 20px;
}

.media-icon-playing
{
  width: 20px;
  height: 20px;
  position: absolute;
  bottom: 2px;
  left: 2px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 20px 20px;
}

.media-icon-isannoted
{
  width: 20px;
  height: 20px;
  position: absolute;
  bottom: 2px;
  right: 2px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 20px 20px;
}

.media-loading
{
  width: 64px;
  height: 64px;
  position: absolute;
  top: 8px;
}

.media-comparison
{
  position: absolute;
  top: 2px;
  left: 4px;
  font-weight: bold;
  font-size: 150%;
}


.media-editing
{
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 150%;
}

.media *
{
  z-index: 20;
}

.media-background-transparent
{
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-repeat: repeat;
  background-image: url(images/transparent.png);
  z-index: 0;
}

.media-background
{
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-repeat: no-repeat;
  z-index: 10;
}

.media-overview
{
  background-color: rgba($gold,0.4);
  position: absolute;
}


/*
 * Images
 */

.side-button-add {background-image: url(images/collection/add.png);}
.side-button-shift {background-image: url(images/collection/shift.png);}

.side-button-editing {background-image: url(images/collection/editing.png);}
.side-button-ab {background-image: url(images/collection/ab.png);}

.side-button-videosonly {background-image: url(images/collection/selectmovie.png);}
.side-button-imagesonly {background-image: url(images/collection/selectimage.png);}

/*
.side-button-add.side-button-enabled {background-image: url(images/collection/add_enabled.png);}
.side-button-shift.side-button-enabled {background-image: url(images/collection/shift_enabled.png);}
.side-button-ab.side-button-enabled {background-image: url(images/collection/ab_enabled.png);}
.side-button-editing.side-button-enabled {background-image: url(images/collection/editing_enabled.png);}

.side-button-videosonly.side-button-enabled {background-image: url(images/collection/selectmovie_enabled.png);}
.side-button-imagesonly.side-button-enabled {background-image: url(images/collection/selectimage_enabled.png);}
*/
.media-icon-video { background-image: url(images/collection/mediavideo.png); }
.media-icon-playing { background-image: url(images/collection/isplaying.png); }
.media-icon-isannoted { background-image: url(images/collection/is_annoted.png); }

.media-loading { background-image: url(images/collection/loading.gif); }

</style>

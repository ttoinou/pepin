/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/Pellicule.js
 *     - One image or a playlist of video
 *     - Handle loading of every medias in it
 *
 */

import Util from './Util.js'


var Pellicule = function(Options){
    
    this.init = false;
    this.Type = Pellicule.prototype.PELLICULE_TYPE.PELLICULE_VIDEOS;
    this.Options = Options;
    this.PepinTimeOptions = {
        FramesPerSeconds : this.Options.FPS || 25.0
      , ShowHours        : true
    };
    this.FramesPerSeconds = this.PepinTimeOptions.FramesPerSeconds;
    this.TCS = new Util.PepinTime(this.PepinTimeOptions);
    this.Loaded = false;
    this.Medias = [];
    this.Videos = [];
    this.DisplayName = "[Asset]";
    this.setupDone = false;
    
    this.start = function(){
      this.Videos = [];
      this.MediaIDToIndexes = {};
      this.MediaIndexesToID = {};

      this.init = true;
      this.FrameCount = 0;
      this.VideoCount = 0;
      this.MediaCount = 0;
      
      return this;
    };

    this.setDimensions = function(OriginalWidth,OriginalHeight){
      this.OriginalHeight = OriginalHeight;
      this.OriginalWidth = OriginalWidth;
      this.Ratio = this.OriginalHeight / this.OriginalWidth;

      //console.log(this.OriginalHeight,this.OriginalWidth,this);
    };
    

    this.NewTime = function(){
      return new PepinTime(this.PepinTimeOptions);
    };

    this.addVideo = function(Video){
      this.Videos.push(Video);
      this.MediaIDToIndexes[Video.Media.ID] = this.VideoCount;
      this.MediaIndexesToID[this.VideoCount] = Video.Media.ID;
      this.VideoCount++;

      this.Medias.push(Video);
      this.MediaCount++;
      this.VideoMode = true;
        
      this.DisplayName = this.Medias[0].Media.Name;

      //console.log(this.MediaIDToIndexes);
        
      return this;
    };

    this.setImage = function(Image){
        this.Image = Image;
        this.Medias.push({Media : Image});
        this.MediaCount++;
        this.VideoMode = false;

        this.DisplayName = this.Medias[0].Media.Name;
        //console.log(Image);
    };
    
    this.setup = function(){
        if( this.Medias.length > 1 )
        {
          this.DisplayName += ' […]';
        }

        this.Cuts = [0];
        this.CutsDuration = [];
        
        var j = 0;
        this.FrameCount = 0;
        var d;
        for( var i = 0 ; i < this.VideoCount ; i++ )
        {
          var d = this.Videos[i].FrameOut - this.Videos[i].FrameIn + 1;
          this.Videos[i].PelliculeDuration = d;

          j += d-1;
          this.Cuts.push( j );
          this.CutsDuration.push( d );
          this.FrameCount += d;
        }

        //console.log(this.FrameCount,this.Cuts);
        
        this.setupDone = true;
        return this;
    };

    this.checkSetup = function(){
      if( !this.setupDone || Util.IsUndef(this.Cuts) )
      {
        console.log('Pepin Pellicule setup wasn\'t done',this);
        this.setup();
        return false;
      }
      return true;
    }

    this.GetPelliculeFrameWithID = function(Frame,ID){
      if( !(ID in this.MediaIDToIndexes)){
        console.log('unknown media ',ID,this.MediaIDToIndexes);
      }

      return this.GetPelliculeFrame(Frame,this.MediaIDToIndexes[ID]);
    };
    
    this.GetPelliculeFrame = function(Frame,Index){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE ){
            return -2;
        }

        if( !this.checkSetup() ){
            return -3;
        }

        if( Index >= this.VideoCount || Util.IsUndef(Index) ){
          console.log("can't get video index",Index,this);
          return -4;
        }

        //return Frame + this.Cuts[Index] + 1 - this.Videos[Index].FrameIn;
        // TODO
        //console.log(Index,this);
        return Frame + this.Cuts[Index] - this.Videos[Index].FrameIn;
    };
    
    this.GetVideoFrameIndex = function(FrameFromPellicule,Index){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        //console.log('asked ' + FrameFromPellicule);
        //console.log('returned ' + (FrameFromPellicule - this.Cuts[Index] - 1  + this.Videos[Index].FrameIn));
        // TODO
        //return FrameFromPellicule - this.Cuts[Index] + 1  + this.Videos[Index].FrameIn;

        return FrameFromPellicule - this.Cuts[Index]  + this.Videos[Index].FrameIn;
    };
    
    this.GetVideoIndex = function(FrameFromPellicule){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
          return -2;
        }

        if( !this.checkSetup() )
        {
          return -3;
        }

        var j = 0;
        
        if( FrameFromPellicule == 0 || Util.IsUndefOrNan(FrameFromPellicule) )
        {
            return 0;
        }

        // TODO
        while( this.Cuts[j] <= FrameFromPellicule )
        {
            j++;
        }
        
        if( j == 0 )
        {
            console.log('j nul !' + FrameFromPellicule);
        }

        if( j > this.GetLastVideoIndex() + 1 )
        {
            j = this.GetLastVideoIndex() + 1;
            //console.log('et merde ' + FrameFromPellicule);
        }
        
        return j-1;
    };

    this.GetVideoID = function(FrameFromPellicule){
      var j = this.GetVideoIndex(FrameFromPellicule);

      if( j < 0 ){
        return -1;
      } else {
        return this.MediaIndexesToID[j];
      }

    },
    
    this.GetVideoFrame = function(FrameFromPellicule){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        
        //console.log(this.GetVideoIndex( FrameFromPellicule ));
        var Frame = this.CropFrame(FrameFromPellicule);
        /*
        var VideoIndex = this.GetVideoIndex( FrameFromPellicule );

        if( VideoIndex > this.GetLastVideoIndex() )
        {
            VideoIndex = this.GetLastVideoIndex();
        }
*/
        return this.GetVideoFrameIndex( Frame , this.GetVideoIndex( Frame ) );
    };
    
    this.GetNextCut = function(FrameFromPellicule){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        
        return this.Cuts[ this.GetVideoIndex( this.CropFrame(FrameFromPellicule) ) + 1 ];
    };
    
    this.GetCurrentDuration = function(FrameFromPellicule){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        
        var j = this.GetVideoIndex( this.CropFrame(FrameFromPellicule) );
        return this.Cuts[ j + 1 ] - this.Cuts[ j ];
    };

    this.GetVideoIn = function(VideoIndex){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        
        return this.TCS.FramesToSeconds( this.Videos[VideoIndex].FrameIn );
    };

    this.GetVideoLastFrame = function(VideoIndex){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        
        return this.Videos[VideoIndex].Duration - 1;
    };

    this.GetLastVideoIndex = function(){
        if( this.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
        {
            return -2;
        }
        
        return this.Videos.length - 1;
    };

    this.CropFrame = function(Frame){        
        if( Frame < 0 )
        {
            return 0;
        }
        else if( Frame > this.FrameCount - 1 )
        {
            return this.FrameCount - 1;
        }
        else
        {
            return Frame;
        }
    };

    this.Do_Load = function(Callback_Load){
        this.Callback_Load = Callback_Load;

        // Charges tous les medias et appelle callback_load une fois cela fait

        this.Callbacks = [];
        this.MediasLoaded = new Array(this.MediaCount);
        for( var i = 0 ; i < this.MediaCount ; i++ )
        {
          this.MediasLoaded[i] = false;
        }

        for( var i = 0 ; i < this.MediaCount ; i++ )
        {
          this.Medias[i].Media.load(this.Callback_Load_FinalCallback.bind(this,i));
        }
    };

    this.AllLoaded = function(){
      var Continue = true;

      for( var i = 0 ; i < this.MediaCount && Continue ; i++ )
      {
        Continue = Continue && this.MediasLoaded[i];
      }

      //console.log(Continue);

      return Continue;
    };

    this.Callback_Load_FinalCallback = function(i){
        this.MediasLoaded[ i ] = true;
        if( this.AllLoaded() )
        {
          //console.log('Tous les médias de la pellicule sont chargés !');

          if( this.Options.SetDurationAuto )
          {
              for( var i = 0 ; i < this.VideoCount ; i++ )
              {
                  this.Videos[i].Duration = Math.floor( this.TCS.SecondsToFrames( this.Videos[i].Media.Element[0].duration ) - 1 );
                  this.Videos[i].FrameOut = this.Videos[i].Duration - 1;
              }

          }

          //console.log(this.Medias,this.Medias[0].Largeur,this.Medias[0].Hauteur);
          this.setDimensions(this.Medias[0].Media.Largeur,this.Medias[0].Media.Hauteur);
          this.setup();
          this.Loaded = true;
          this.Callback_Load();
        }

    };

    return this;
};

Pellicule.prototype.PELLICULE_TYPE = {
    PELLICULE_IMAGE : 0,
    PELLICULE_VIDEOS : 1
};

export default Pellicule;
/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/Util.js
 *     - Misc functions
 *     - PepinTime
 *     - DynamicValue (used for exponential zoom for example)
 *     - Geometry functions (Vue2D,Point2D)
 *
 */

function toInt(a) {
  return parseInt(a, 10) || 0;
};

function Modulo(x,m){
  return ( x % m + m ) % m;
};

function IsUndefOrNan (a){
  return typeof a == 'undefined' || isNaN(a);
};

function IsUndefOrNull (a){
  return typeof a == 'undefined' || a === null;
};

function IntToString0(x){
  if( x < 10 )
  {
    return '0' + x;
  }
  else
  {
    return '' + x;
  }
};

var ComputeValue = function(FnComputeValue,FnComputeValueThis){

    this.FnComputeValue = FnComputeValue;
    this.FnComputeValueThis = FnComputeValueThis;
    this.Computed = false;

    this.Compute = function(){
      if( !this.Computed ){
        this.FnComputeValue.apply(this.FnComputeValueThis);
        this.Computed = true;
      }
    };

    this.Changed = function(){
      this.Computed = false;
    };

    return this;
};















var PepinTime = function(Options){

    this.Options = Options;
    this.FramesF_CV = new ComputeValue(this.FramesF_Compute,this);
    this.Frames_CV = new ComputeValue(this.Frames_Compute,this);
    this.TimeCode_CV = new ComputeValue(this.TimeCode_Compute,this);


    // todo simplify

    this.ComputeEverything = function(){
      this.TimeCode_CV.Compute();
    };

    this.ChangedEverything = function(){
      this.FramesF_CV.Changed();
      this.Frames_CV.Changed();
      this.TimeCode_CV.Changed();
    };

    this.FramesF_Compute = function(){
      this.FramesF = this.Seconds * this.Options.FramesPerSeconds;
    };

    this.Frames_Compute = function(){
      this.FramesF_CV.Compute();
      this.Frames = this.FramesRound( this.FramesF );
    };

    this.TimeCode_Compute = function(){
      this.Frames_CV.Compute();
      this.TimeCode = this.FramesToTC(this.Frames);
    };

    this.SetFramesF = function(FramesF){
      this.Seconds = FramesF/this.Options.FramesPerSeconds;
      this.ChangedEverything();
    };

    this.SetFrames = function(Frames){
      this.SetFramesF(Frames);
      this.ChangedEverything();
    };

    this.SetTimeCode = function(TimeCode){
      this.SetFrames(this.TCToFrames(TimeCode));
      this.ChangedEverything();
    };

    this.Copy = function(){
      return new PepinTime(this.Options);
    };

    this.FramesToSeconds = function(x){
        //return ( x + 1.0 ) / this.Options.FramesPerSeconds;
        return x / this.Options.FramesPerSeconds;
    };

    this.SecondsToFrames = function(x){
        //return x * this.Options.FramesPerSeconds - 1.0;
        //return Math.floor( x * this.Options.FramesPerSeconds );
        //return Math.floor( x * this.Options.FramesPerSeconds - 1.0 );
        return this.FramesRound(x * this.Options.FramesPerSeconds);
    };

    this.FramesRound = function(x){
        var t = Math.floor( x );
        var fpart = x - t;

        if( fpart > 0.9 )
        {
            t += 1.0;
        }

        return t;
    };

    this.TCToString = function(R){
      return ( this.Options.ShowHours ? (IntToString0(R.H)+':' ) : '' ) + IntToString0(R.M) + ':' + IntToString0(R.S) + ':' + IntToString0(R.F);
    };

    this.FramesToTC = function(frames){
        var R = {};

        R.F = frames % this.Options.FramesPerSeconds;
        frames = (frames - R.F)/this.Options.FramesPerSeconds;

        R.S = frames % 60;
        frames = (frames - R.S)/60;

        R.M = frames % 60;
        frames = (frames - R.M)/60;

        R.H = frames % 60;

        if( !this.Options.ShowHours )
        {
            R.M += 60*R.H;
            R.H = 0;
        }

        R.String = this.TCToString(R);

        return R;
    };

    this.TCToFrames = function(R){
        return ( ( R.H * 60 + R.M ) * 60 + R.S ) * this.Options.FramesPerSeconds + R.F;
    };

    this.StringToTC = function(String){
      var TC = {};

      var parts = String.split(':').reverse();
      var len = Math.min(4,parts.length);
      var p;
       
      for( var i = 0 ; i < len ; i++ )
      {
        p = parts[i];

        switch(i)
        {
          case 0:
            TC.F = toInt(p);
            break;

          case 1:
            TC.S = toInt(p);
            break;

          case 2:
            TC.M = toInt(p);
            break;

          case 3:
            TC.H = toInt(p);
            break;
            
        }
      }

      TC.String = this.TCToString(TC);

      return TC;
    };

};

// static
PepinTime.prototype.Now = function(){
    var R = new PepinTime({});
    R.Seconds = Date.now()/1000.0;
    return R;
};





var SourceValue = function(){
  this.Value = undefined;
  this.Changed = false;

  this.SetValue = function(Value){
    //if( Value != this.Value ){
    //  this.Value = thi
    //}
    this.Value = Value;
    this.Changed = true;
  };

  this.Changed = function(){
    return this.Changed;
  };

  this.GetValue = function(){
    this.Changed = false;
    return this.Value;
  };

  return this;
};


var StaticValue = function(Params,SourceValues){
  this.DefaultParams = {
    Values : [0],
    ValueIndex : 0,
    Looping : false,
    FromValues : true,
  };

  this.Params = Params || {};

  for( var i in this.DefaultParams )
  {
    this[i] = this.Params[i] || this.DefaultParams[i];
  }

  this.ValuesCount = this.Values.length;

  this.Sources = SourceValues;
  //this.SourcesCount = SourcesValues.length;

  this.ComputeValueIndex = function(){
    var i = 0;

    while( i < this.ValuesCount && this.Value > this.Values[i] )
    {
      i++;
    }

    this.ValueIndex = Math.max(0,i-1);
  };

  this.Offset = function(Offset){
    if( !this.FromValues )
    {
      this.ComputeValueIndex();
    }

    this.ValueIndex = this.ValueIndex + Offset;
    if( this.Looping )
    {
      this.ValueIndex = Modulo(this.ValueIndex,this.ValuesCount);
    }
    else
    {
      this.ValueIndex = Math.max(0,Math.min(this.ValuesCount-1,this.ValueIndex));
    }
    this.UpdateSources();
  };

  this.UpdateSources = function(){
    if( this.FromValues )
    {

    }
    else
    {
      this.Value = this.Values[this.ValueIndex];
    }

    for( i in this.Sources )
    {
      this.Sources[i].SetValue(this.Value);
    }
  };

  this.SetValue = function(NewValue){
    this.FromValues = false;
    this.Value = NewValue;
  };

};







var DynamicValue = function(Modes,Params){

    this.DefaultParams = {
        Mode : '',
        ModeIndex : 0,
        ModesCount : 0,
        Switching : false,
        SwitchingPreviousIndex : -1,
        DefaultValue : [1.0]
    };


    this.Params = Params || {};

    for( var i in this.DefaultParams )
    {
        this[i] = this.Params[i] || this.DefaultParams[i];
    }

    this.Value = this.Params.DefaultValue;

    this.ModesCount = Modes.length;
    this.Modes = {};
    this.NameToIndex = {};

    for( var i = 0 ; i < this.ModesCount ; i++ )
    {
        this.Modes[i] = new DynamicValueMode( Params , Modes[i] );
        this.Modes[Modes[i].Name] = this.Modes[i];
        this.NameToIndex[Modes[i].Name] = i;
        this.Modes[i].SetValue( this.Value );
        this.Modes[i].On = false;
    }

    this.Mode = this.Modes[0].Name;
    this.Modes[0].On = true;

    this.SwitchMode = new DynamicValueMode( Params , {Name : 'Switch'} );
    this.SwitchMode.On = false;

    this.Switch = function(NewMode){
        var NewIndex = this.NameToIndex[NewMode];

        if( typeof NewIndex != 'undefined' && NewIndex != this.ModeIndex)
        {
            //console.log('new index : ' + NewIndex);
            //this.UpdateValue();

            this.Modes[NewIndex].UpdateValue();
            this.ModeGotoValue(this.Modes[NewIndex].Value,NewIndex,false,true);

            this.SwitchingPreviousIndex = this.ModeIndex;
            this.Modes[this.ModeIndex].On = false;
            this.Modes[NewIndex].On = true;
            this.Mode = NewMode;
            this.ModeIndex = NewIndex;
            this.Switching = true;
            this.SwitchMode.On = true;
            this.SwitchMode.StartAnimation(this.Modes[this.SwitchingPreviousIndex].SwitchDuration);
            //    console.log('beginning ',this.SwitchMode.AnimationCoeff(this.SwitchMode.Now()));
            this.UpdateValue();
        }
    };

    // To Do : ModeGotoValueIfActivated

    this.ModeGotoValue = function(Mode,NewValue,Duration){
        var Index = this.NameToIndex[Mode];

        if( typeof Index != 'undefined' )
        {
            //console.log(this.Modes[Index].Name);
            this.Modes[Index].UpdateValue();
            this.Modes[Index].GotoValue(NewValue,Duration);
            
        }
    };

    this.ModeGotoValueFromMode = function(Mode,ModeFrom,Duration){
        var Index = this.NameToIndex[Mode];
        var Index2 = this.NameToIndex[ModeFrom];

        if( typeof Index != 'undefined' && typeof Index2 != 'undefined' )
        {
            //console.log(this.Modes[Index].Name);
            //console.log('gotoooo',this.Modes[Index2].GetValue());
            this.Modes[Index].UpdateValue();
            this.Modes[Index].GotoValue(this.Modes[Index2].GetValue(),Duration);
            //console.log('goto',NewValue,Mode);
            
        }
    };



    this.UpdateValue = function(){
        if( this.Switching )
        {
            if( this.SwitchMode.AnimationOver() )
            {
                this.Switching = false;
                this.SwitchMode.On = false;
                //console.log('Switching ended');
                this.Modes[this.ModeIndex].UpdateValue();
            }
            else
            {
                //console.log('switching ',this.SwitchMode.AnimationCoeff(this.SwitchMode.Now()));
                // set beginning and end of switch

                this.Modes[this.SwitchingPreviousIndex].UpdateValue();
                this.Modes[this.ModeIndex].UpdateValue();

                this.SwitchMode.SetBeginningEnd(this.Modes[this.SwitchingPreviousIndex].GetValue(),this.Modes[this.ModeIndex].GetValue());

                this.SwitchMode.UpdateValue();
            }
        }
        else
        {
            //console.log('updating',this.Mode,this.Modes[this.ModeIndex].Name);
            this.Modes[this.ModeIndex].UpdateValue();
        }
    };

    this.GetValue = function(){
        if( this.Switching )
        {
            //console.log(this.SwitchMode.AnimationCoeff(this.SwitchMode.Now()));
            //return [0.5];
            return this.SwitchMode.GetValue();
        }
        else
        {
            //console.log('getting',this.Modes[this.ModeIndex].Name,this.Modes[this.ModeIndex].GetValue());
            //console.log(this.Mode,this.Modes[this.ModeIndex].Name,this.Modes[this.ModeIndex].GetValue());
            return this.Modes[this.ModeIndex].GetValue();
        }
      //console.log('current mode ' + this.Mode);
      //console.log(this.Modes[this.ModeIndex]);
      //return this.Value;
      //return this.Modes[this.ModeIndex].GetValue();
    };
};



/*
 *
 */

var DynamicValueMode = function(DynamicValueParams,Params){

    this.DefaultParams = {

        Value : [-1],
        ValueBeginning : [-1],
        ValueEnd : [-1],
        ValueMiddle : [-1],
        AnimationDuration : -1,
        AnimationBeginning : -1,

        IncrementDuration : 400,
        TransitionDuration : 400,
        SwitchDuration : 400,
        Min : false,
        Max : false,
        Log : false,
        IncrementLogValue : false,
        IncrementValue : 0.5,
        Dimensions : 1
    };

    this.Name = Params.Name;

    for( var i in this.DefaultParams )
    {
        this[i] = this.DefaultParams[i];
    }

    for( var i in DynamicValueParams )
    {
        this[i] = DynamicValueParams[i];
    }
    
    for( var i in Params )
    {
        this[i] = Params[i];
    }


    this.Now = function(){
        return (new Date()).getTime();
    };

    this.SetBeginningEnd = function(Beginning,End){
        //console.log('sed',this.Name,this.On,Beginning,End);

        this.ValueBeginning = [];
        this.ValueEnd = [];

        for( var i = 0 ; i < this.Dimensions ; i++ )
        {
            this.ValueBeginning[i] = Beginning[i];
            this.ValueEnd[i] = End[i];
        }
    };

    this.Increment = function(Coeff){
        //console.log(Coeff * this.Modes[this.ModeIndex].Increment + this.Modes[this.ModeIndex].ValueEnd);
        //console.log(this.Modes[this.ModeIndex].LogIncrement);

        if( this.IncrementLogValue === false )
        {
            //console.log(this.IncrementValue,Coeff,this.IncrementDuration);
            this.GotoValue([Coeff * this.IncrementValue + this.ValueEnd[0]],this.IncrementDuration);
        }
        else
        {
            this.GotoValue( [Math.pow( this.IncrementLogValue , Coeff ) * this.ValueEnd[0]],this.IncrementDuration);
        }
    };

    this.GotoValue = function(NewValue,Duration){
        var NewValue2 = [];

        for( var i = 0 ; i < this.Dimensions ; i++ )
        {
            NewValue2[i] = this.MinOrNot(this.MaxOrNot(NewValue[i],this.Min[i]),this.Max[i]);
        }

        if( Math.abs(this.Value[0] - NewValue2[0]) > 1e-6 )
        {
            //console.log('goooooooooooooooooooooooooooooooooooooooooooooooooooooto',this.Name,NewValue,Math.abs(this.Value[0] - NewValue[0]));
            this.SetBeginningEnd(this.GetValue(),NewValue2);
            this.StartAnimation(typeof Duration == 'undefined' ? this.TransitionDuration : Duration );
        }

        //console.log(this.GetValue(),NewValue);

        //console.log(this.Name,this.Value,this.ValueBeginning,this.ValueEnd,this.AnimationDuration);
    };

    this.MinOrNot = function(Value,Min){
      return Math.min(Min === false ? Value : Min,Value);
    };

    this.MaxOrNot = function(Value,Max){
      return Math.max(Max === false ? Value : Max,Value);
    };

    this.StartAnimation = function(Duration){
        this.AnimationDuration = Duration;
        this.AnimationBeginning = this.Now();
    };

    this.SetValue = function(Value){

        this.Value = [];

        for( var i = 0 ; i < this.Dimensions ; i++ )
        {
            this.Value[i] = Value[i];
        }

        this.SetBeginningEnd(Value,Value);
    };

    this.GetValue = function(){
        return this.Value;
    };

    this.AnimationCoeff = function(NowMS){
        return (NowMS - this.AnimationBeginning)/(1.0+this.AnimationDuration);
    };

    this.AnimationOver = function(){
        return this.AnimationCoeff(this.Now()) >= 1.0;
    };

    this.UpdateValue = function(){
        if( this.AnimationBeginning > 0 )
        {
            var NowMS = this.Now();
            var t = Math.min(1.0,this.AnimationCoeff(NowMS));

            // easing
            t = (1.0 - Math.cos(Math.PI * t))/2.0;

            if( this.Log )
            {
                for( var i = 0 ; i < this.Dimensions ; i++ )
                {
                    this.Value[i] = Math.exp( (1.0-t)*Math.log(this.ValueBeginning[i]) + t*Math.log(this.ValueEnd[i]) );
                }
                ///console.log(this.Value,this.Name);
                //this.Value = Math.exp( (1.0-t)*Math.log(this.ValueBeginning) + t*Math.log(this.ValueEnd) );
            }
            else
            {
                for( var i = 0 ; i < this.Dimensions ; i++ )
                {
                    this.Value[i] = (1.0-t)*this.ValueBeginning[i] + t*this.ValueEnd[i];
                }

                //this.Value = (1.0-t)*this.ValueBeginning + t*this.ValueEnd;
            }
        }
    };
};
















/*
 *
 * Fonctions et objets géométriques
 *
 */

function Bary(a,b,t){
  return a*(1-t) + b*t;
}

function Vue2D(O)
{
  // Quatres vues sont partagées dans le même objet
  
  
  // Vue à deux coins
  this.Min = new Point2D();
  this.Max = new Point2D();

  // Vue avec Min et Largeur et Hauteur
  this.Largeur = 0;
  this.Hauteur = 0;

  // Vue avec Centre et Rayon (Horizontale) et Aspect
  this.Centre = new Point2D();
  this.Rayon = 0;
  this.Aspect = 1.0; // Convention Largeur / Hauteur
  
  // Vue avec Centre, Rayon Intérieur et Aspect
  //this.Centre = new Point2D();
  this.RayonInterieur = 0;


  for( var i in O )
  {
    this[i] = O[i];
  }


  this.IsNothing = function(){
    return IsUndefOrNan(this.Min.x)
      ||   IsUndefOrNan(this.Min.y)
      ||   IsUndefOrNan(this.Max.x)
      ||   IsUndefOrNan(this.Max.y)
      ||   IsUndefOrNan(this.Largeur)
      ||   IsUndefOrNan(this.Hauteur)
      ||   IsUndefOrNan(this.Centre.x)
      ||   IsUndefOrNan(this.Centre.y)
      ||   IsUndefOrNan(this.Rayon)
      ||   IsUndefOrNan(this.RayonInterieur)
      ||   IsUndefOrNan(this.Aspect)
    ;
  };

  this.IsValid = function(){
    return !this.IsNothing() && this.Largeur > 0 && this.Hauteur > 0;
  };

  // from Min & Max
  this.VueDC_MaJ = function(){
    this.Largeur = this.Max.x - this.Min.x;
    this.Hauteur = this.Max.y - this.Min.y;
    this.MaJVueCRA_DepuisLesAutres();
  };

  // from Min Largeur Hauteur
  this.VueMLH_MaJ = function(){
    this.Max.x = this.Min.x + this.Largeur;
    this.Max.y = this.Min.y + this.Hauteur;

    this.MaJVueCRA_DepuisLesAutres();
  };


  this.MaJVueCRA_DepuisLesAutres = function(){
    this.Centre.x = (this.Min.x + this.Max.x)/2.0;
    this.Centre.y = (this.Min.y + this.Max.y)/2.0;

    this.Rayon = this.Max.x - this.Centre.x;
    this.Aspect = this.Largeur / this.Hauteur;

    if( this.Aspect > 1.0 )
    {
        this.RayonInterieur = this.Rayon / this.Aspect;
    }
    else
    {
        //this.RayonInterieur = this.Max.y - this.Centre.y;
        this.RayonInterieur = this.Rayon;
    }
  };

  this.VueCRA_MaJ = function(DefinirRayonInterieur){
    this.Largeur = this.Rayon * 2.0;
    this.Hauteur = this.Largeur / this.Aspect;

    this.Min.x = this.Centre.x - this.Largeur / 2.0;
    this.Min.y = this.Centre.y - this.Hauteur / 2.0;

    this.Max.x = this.Centre.x + this.Largeur / 2.0;
    this.Max.y = this.Centre.y + this.Hauteur / 2.0;

    if( !!DefinirRayonInterieur )
    {
        if( this.Aspect > 1.0 )
        {
            this.RayonInterieur = this.Rayon / this.Aspect;
        }
        else
        {
            this.RayonInterieur = this.Rayon;
        }
    }
  };

  this.VueCRIA_MaJ = function(){
    if( this.Aspect > 1.0 )
    {
        // Largeur > Hauteur donc Rayon == Rayon Verticale
        // donc il faut convertir en Rayon Horizontale
        this.Rayon = this.RayonInterieur * this.Aspect;
    }
    else
    {
        this.Rayon = this.RayonInterieur;
    }

    this.VueCRA_MaJ(false);
  };


  this.GetSegmentX = function(){
    return new Segment(
        this.Min.x
      , this.Max.x
    );
  };

  this.GetSegmentY = function(){
    return new Segment(
        this.Min.y
      , this.Max.y
    );
  };
  
  this.RepereValide = function(){
    return this.Largeur > 0 && this.Hauteur > 0;
  };

  // this est defini dans le repère A
  // après cette fonction V sera this défini dans le repère B
  this.ChangerRepere = function(V,A,B){
    V.Min = Vue2D_Statiques.ChangerReperePoint2D(this.Min,A,B);
    V.Max = Vue2D_Statiques.ChangerReperePoint2D(this.Max,A,B);
    
    V.VueDC_MaJ();
  };

  this.Point2DRogner = function(A){
    return Point2D_Statiques.max(Point2D_Statiques.min(A,this.Max),this.Min);
  };

  this.Point2DDistanceTaxiAlgebrique = function(A){
    var R = Math.max(Math.abs(A.x - this.Max.x),Math.abs(A.y - this.Max.y));
    return Math.min(R, Math.max(Math.abs(A.x - this.Min.x),Math.abs(A.y - this.Min.y)) );
  };
  
  this.CopierDans = function(P){
    this.Min.CopierDans( P.Min );
    this.Max.CopierDans( P.Max );
    P.VueDC_MaJ();
  };
}



Vue2D.prototype.ChangerReperePoint2D = function(P,A,B){
  var AX = A.GetSegmentX();
  var AY = A.GetSegmentY();

  var BX = B.GetSegmentX();
  var BY = B.GetSegmentY();

  return new Point2D({
     x : Segment_Statiques.ChangerSegment( P.x , AX , BX )
   , y : Segment_Statiques.ChangerSegment( P.y , AY , BY )
  });
};

// résultat dans V
Vue2D.prototype.IntersectionVues = function(V,A,B){
  V.Min = Point2D_Statiques.max(A.Min,B.Min);
  V.Max = Point2D_Statiques.min(A.Max,B.Max);

  V.VueDC_MaJ();
};

var Vue2D_Statiques = new Vue2D();

function Segment(min,max)
{
  this.min = min;
  this.max = max;
  this.delta = max - min;
}

Segment.prototype.ChangerSegment = function(x,A,B){
    return (x - A.min) / A.delta * B.delta + B.min;
}

var Segment_Statiques = new Segment();

function Point2D(O,y)
{
  if( !IsUndefOrNan(y) )
  {
    this.x = O;
    this.y = y;
  }
  else
  {
    if( typeof O != 'undefined' && O.length == 2 )
    {
      this.x = O[0];
      this.y = O[1];
    }
    else
    {
      for( var i in O )
      {
        this[i] = O[i];
      }
    }
  }

  
  this.CopierDans = function(P){
    P.x = this.x;
    P.y = this.y;
  };
  
  this.IsNothing = function(P){
    return IsUndefOrNan(this.x)
      ||   IsUndefOrNan(this.y);
  };


  this.IsIncludedIn = function(P){
    return this.x >= P.x && this.y <= P.y;
  };
  
  this.SetBary = function(t,A,B){
    this.x = (1-t)*A.x + B.x * t;
    this.y = (1-t)*A.y + B.y * t;
  };
  
  this.DistanceSquared = function(){
    return this.x*this.x + this.y*this.y;
  };
  
  this.DistanceSquaredTo = function(A){
    return (A.x - this.x)*(A.x - this.x) + (A.y - this.y)*(A.y - this.y);
  };

  this.Unit = function(){
    var R = Math.sqrt( this.DistanceSquared() );
    this.x /= R;
    this.y /= R;

    return this;
  };

  this.Multiply = function(R){
    this.x *= R;
    this.y *= R;

    return this;
  };

  this.SetRayonOf = function(P){
    var R = Math.sqrt( P.DistanceSquared()/this.DistanceSquared() );
    this.x *= R;
    this.y *= R;

    return this;
  };

  this.Angle = function(){
    return Math.atan2(this.y,this.x);
  };
}

Point2D.prototype.max = function( A , B ){
  return new Point2D({
      x : Math.max( A.x , B.x )
    , y : Math.max( A.y , B.y )
  });
};

Point2D.prototype.min = function( A , B ){
  return new Point2D({
      x : Math.min( A.x , B.x )
    , y : Math.min( A.y , B.y )
  });
};

Point2D.prototype.add = function( A , B ){
  return new Point2D({
      x : A.x + B.x
    , y : A.y + B.y
  });
};

Point2D.prototype.sub = function( A , B ){
  return new Point2D({
      x : A.x - B.x
    , y : A.y - B.y
  });
};

Point2D.prototype.DistanceSquaredTo = function( A , B ){
  return A.DistanceSquaredTo(B);
};

Point2D.prototype.Distance = function( A , B ){
  return Math.sqrt(A.DistanceSquaredTo(B));
};


var Point2D_Statiques = new Point2D();


export default {

  ComputeValue : ComputeValue,
  PepinTime : PepinTime,
  SourceValue : SourceValue,
  StaticValue : StaticValue,
  DynamicValue : DynamicValue,
  DynamicValueMode : DynamicValueMode,
  Bary : Bary,
  Vue2D : Vue2D,
  Vue2D_Statiques : Vue2D_Statiques,
  Point2D : Point2D,
  Point2D_Statiques : Point2D_Statiques,
  Segment : Segment,
  Segment_Statiques : Segment_Statiques,

  toInt : toInt,

  toFloat : function (a) {
      return parseFloat(a) || 0;
  },

  fpart : function(x){
    return x - Math.floor(x);
  },

  ipart : function(x){
    return Math.floor(x);
  },

  toPrecision : function(x,p){
    //return Math.floor(x*p)/p;
    return Math.round(x*p)/p;
  },

  toStep : function(x,p){
    return Math.round(x/p)*p;
  },

  smooth : function(x){
    return (1-Math.cos(x*Math.PI))/2.0;
  },

  /**
   * Convert an Array-like object to a real Array.
   *
   * @param {Array-like} list
   * @param {Number} [start] - start index
   * @return {Array}
   */

  toArray : function(list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret;
  },


  formaterVitesse : function (a) {
      if( a >= 10 ){
        return toInt(a);
      } else {
        return a.toFixed(1);
      }
  },

  formaterFPS : function (a) {
      if( a >= 100 ){
        return toInt(a);
      } else {
        return a.toFixed(1);
      }
  },

  IsUndef : function(a){
    return typeof a == 'undefined';
  },

  IsUndefOrNan : IsUndefOrNan,

  IsUndefOrNull : IsUndefOrNull,

  Modulo : Modulo,

  XOR : function(a,b) {
    return ( a || b ) && !( a && b );
  },


  IntToString0 : IntToString0,

  Positive : function( x )
  {
    if( x < 0 )
    {
      return 0;
    }
    else
    {
      return x;
    }
  },


  CloneObject : function(obj)
  {
      if( null == obj || "object" != typeof obj )
      {
        return obj;
      }

      var copy = obj.constructor();

      for( var attr in obj )
      {
          if( obj.hasOwnProperty(attr) )
          {
            copy[attr] = obj[attr];
          }
      }

      return copy;
  },

  Sign : function(x){
    return x / Math.abs(x);
  },

  StripTags: function(html)
  {
     var tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || html;
  }


};
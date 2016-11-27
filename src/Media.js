/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/Media.js
 *     - One image or one video
 *     - Handle loading and properties
 *
 */

import Util from './Util.js'

var Media = function(MediaObject,$){

    this.type = Media.TYPE;
    this.init = false;
    this.IsMedia = true;
    this.$ = $; // jQuery dependency

    for( var i in MediaObject )
    {
      this[i] = MediaObject[i];
    }

    if( this.Type == 'image' )
    {
      this.Type = this.MEDIA_TYPE.MEDIA_IMAGE;
    }
    else if( this.Type == 'video' )
    {
      this.Type = this.MEDIA_TYPE.MEDIA_VIDEO;
    }

    this.LoadingLargeur = 160;
    this.LoadingHauteur = 90;

    this.CallbacksLoad = [];
    this.CallbackStates = [];
    this.Loaded = false;
    this.Loading = false;

    this.start = function(options){
      this.init = true;
    };

    this.load = function(callback){
        callback = callback || function(){};

        if( this.Loaded ) {
            callback(this);
        } else {
            this.CallbacksLoad.push(callback);

            //console.log('essai de chargement ...' + this.Loading + ' , ' + this.Loaded );
            //console.log('essai de chargement : ' + this.URL );


            if( !this.Loading ) {
                this.Loading = true;

                if( this.Type == this.MEDIA_TYPE.MEDIA_VIDEO )
                {
                    //this.Element = this.$('<video src="' + this.URL + '"></video>');
                    this.Element = this.$('<video></video>').attr('src',this.URL);

                    this.Element.on('canplay',this.CallbackCall_This(this));
                    this.Element[0].load();

                        //console.log('essai de chargement ...' + this.Loading + ' , ' + this.Element[0].readyState );

                    if( this.Element[0].readyState > 3 )
                    {
                        console.log('déjà chargé!');
                        this.CallbackCall_This(this)();
                    }

                    //window.setTimeout(this.CallbackCall_This(this),100);
                }
                else if( this.Type == this.MEDIA_TYPE.MEDIA_IMAGE )
                {
                    this.Element = this.$('<img src="' + this.URL + '"></video>');
                    this.$(this.Element).load(this.CallbackCall_This(this));
                }


            } else {
                if( this.Loaded ){
                    this.CallbackCall_This(this)();
                }
            }
        }
    };

    this.CallbackCall_This =  function(This){ return function(){
        if( !This.Loaded )
        {
            This.Loaded = true;
            This.Loading = false;

            if( This.Type == This.MEDIA_TYPE.MEDIA_VIDEO )
            {
                This.Largeur = This.Element[0].videoWidth;
                This.Hauteur = This.Element[0].videoHeight;
            }
            else
            {
                This.Largeur = This.Element[0].width;
                This.Hauteur = This.Element[0].height;
            }

            This.Ratio = This.Largeur / This.Hauteur;
            This.Surface = This.Largeur * This.Hauteur;
            This.ImgCanvas = false;

            //console.log(This.Nom,This.Largeur,This.Hauteur,This.Element);

            //console.log(This.URL + ' a fini de charger ! appel de tous les callback dans l\'ordre ');

            if(This.Surface > 4000 * 4000)
            {
                //console.log("trop grande",This.URL);
                This.ImgCanvas = true;
/*
                var c = document.createElement("canvas");
                c.width = This.Largeur;
                c.height = This.Hauteur;

                var ctx=c.getContext("2d");

                ctx.drawImage(This.Element[0],0,0,This.Largeur,This.Hauteur);
                ctx.fillStyle="red";
                ctx.fillRect(10,10,50,50);

                This.ImgData = ctx.getImageData(10,10,50,50);
                ctx.putImageData(This.ImgData,10,70);*/
            }



            for( var i = 0 ; i < This.CallbacksLoad.length ; i++ ){
                //console.log('appel fonction n°' + i);
                This.CallbacksLoad[i](This);
            }

            This.CallbacksLoad = [];

            //console.log('calling callback states ',This.CallbackStates);

            for( var i = 0 ; i < This.CallbackStates.length ; i++ )
            {
                This.CallbackStates[i](This);
            }

            if( This.Type == This.MEDIA_TYPE.MEDIA_VIDEO )
            {
                This.Element.off('canplay');
            }

        } else {
            //console.log(This.URL + ' a déjà été chargé...');
        }
    }};

    return this;
};
/*
Object.defineProperty(Media,"MEDIA_TYPE",{
    MEDIA_IMAGE : 0,
    MEDIA_VIDEO : 1
});*/

Media.prototype.MEDIA_TYPE = {
    MEDIA_IMAGE : 0,
    MEDIA_VIDEO : 1
};
/*
Media.MEDIA_TYPE = {
    MEDIA_IMAGE : 0,
    MEDIA_VIDEO : 1
};*/

export default Media;
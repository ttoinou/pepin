import PepinLang_fr from './lang/Lang.fr.js'
import PepinLang_en from './lang/Lang.en.js'

var Languages = {
  'fr' : PepinLang_fr,
  'en' : PepinLang_en,
};

function TranslateWord(WordID,Language){
    return Languages[Language][WordID];
};

function TranslateExpression(Expression,Language){
  //return Expression + '....';

  return Expression
    .replace( /\$(.*?)\((.*?)\)\£/g,function(x,y,z){          // this grabs replacement tags
      //console.log(y,z);
      var Translation = TranslateWord(y,Language);
      if( Translation ){
        return Translation.call(this,z);
      } else {
        return x;
      }
    })
    .replace( /\$(.*?)\£/g,function(x,y,z){          // this grabs replacement tags
      //console.log(y);

      var Translation = TranslateWord(y,Language);
      if( Translation ){
        return Translation;
      } else {
        return x;
      }

    })
  ;
};

export default {
  TranslateWord : TranslateWord,
  TranslateExpression : TranslateExpression,
  Languages : Languages,
  HasLanguage: function(Lang){
    //console.log(this.Languages);
    return this.Languages.hasOwnProperty(Lang);
  }
}